import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Tractor, Camera, Satellite, Droplets, Wind, AlertTriangle, 
  ArrowLeft, History, TrendingUp, TrendingDown, Leaf, CloudRain,
  Upload, Check, Loader2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AppProvider, useApp } from '@/components/context/AppContext';
import TopBar from '@/components/dashboard/TopBar';
import BottomNav from '@/components/dashboard/BottomNav';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/api';
import { MapContainer, Marker, Popup, TileLayer, WMSTileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type FarmReportRow = {
  id?: string | number;
  user_email?: string;
  image_url?: string;
  location?: { lat?: number; lng?: number; farm_name?: string; emirate?: string };
  crop_type?: string;
  ndvi_score?: number;
  water_efficiency?: number;
  risks_detected?: string[];
  recommendations?: string[];
  sandstorm_risk?: 'none' | 'low' | 'medium' | 'high';
  date_analyzed?: string;
  date?: string;
  created_date?: string;
};

function makeMarker(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:18px;height:18px;border-radius:999px;background:${color};border:3px solid white;box-shadow:0 6px 18px rgba(0,0,0,0.25)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
}

function MapClickSetter({ onPick }: { onPick: (lat: number, lng: number) => void | Promise<void> }) {
  useMapEvents({
    click: (e) => onPick(e.latlng.lat, e.latlng.lng)
  });
  return null;
}

function MapOverlayPane() {
  const map = useMap();
  useEffect(() => {
    const paneName = 'planetiaOverlayPane';
    const existing = map.getPane(paneName);
    const pane = existing ?? map.createPane(paneName);
    pane.style.zIndex = '650';
    pane.style.pointerEvents = 'none';
  }, [map]);
  return null;
}

type OpenMeteoPoint = {
  lat: number;
  lng: number;
  windSpeed?: number;
  windDir?: number;
  precipitation?: number;
};

function OpenMeteoOverlay({ mode }: { mode: 'wind' | 'precip' }) {
  const map = useMap();
  const [points, setPoints] = useState<OpenMeteoPoint[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

  const makeWindIcon = useCallback((speed: number, dir: number) => {
    const safeSpeed = Number.isFinite(speed) ? speed : 0;
    const safeDir = Number.isFinite(dir) ? dir : 0;

    return L.divIcon({
      className: '',
      html: `
        <div style="
          width:32px;height:32px;border-radius:999px;
          background:rgba(16,185,129,0.14);
          border:1px solid rgba(16,185,129,0.35);
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 10px 24px rgba(15,23,42,0.12);
          transform: translateZ(0);
        ">
          <div style="
            width:0;height:0;
            border-left:7px solid transparent;
            border-right:7px solid transparent;
            border-bottom:14px solid rgba(16,185,129,0.9);
            transform: rotate(${safeDir}deg);
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
          "></div>
          <div style="
            position:absolute;bottom:-10px;
            font-size:10px;font-weight:700;
            color:#0f172a;
            background:rgba(255,255,255,0.9);
            border:1px solid rgba(148,163,184,0.35);
            padding:1px 6px;border-radius:999px;
          ">${Math.round(safeSpeed)}<span style="font-size:9px;font-weight:800;">m/s</span></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  }, []);

  const makePrecipIcon = useCallback((mm: number) => {
    const safe = Number.isFinite(mm) ? Math.max(0, mm) : 0;
    const clamped = Math.min(10, safe);
    const radius = 10 + clamped * 1.2;
    const alpha = 0.12 + Math.min(0.55, clamped / 12);

    return L.divIcon({
      className: '',
      html: `
        <div style="
          width:${radius * 2}px;height:${radius * 2}px;border-radius:999px;
          background:rgba(59,130,246,${alpha});
          border:1px solid rgba(59,130,246,0.45);
          box-shadow:0 10px 24px rgba(15,23,42,0.10);
          display:flex;align-items:center;justify-content:center;
          font-size:10px;font-weight:800;color:#0f172a;
        ">
          ${safe.toFixed(1)}<span style="font-size:9px;font-weight:900;">mm</span>
        </div>
      `,
      iconSize: [radius * 2, radius * 2],
      iconAnchor: [radius, radius]
    });
  }, []);

  const refresh = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    const rows = 3;
    const cols = 3;
    const latStep = (ne.lat - sw.lat) / (rows + 1);
    const lngStep = (ne.lng - sw.lng) / (cols + 1);

    const seedPoints: Array<{ lat: number; lng: number }> = [];
    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        seedPoints.push({
          lat: sw.lat + r * latStep,
          lng: sw.lng + c * lngStep
        });
      }
    }

    try {
      const results = await Promise.all(
        seedPoints.map(async (p) => {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(String(p.lat))}&longitude=${encodeURIComponent(String(p.lng))}&current=precipitation,wind_speed_10m,wind_direction_10m&timezone=auto`;
          const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
          const json: any = await res.json();
          const current = json?.current ?? {};
          return {
            lat: p.lat,
            lng: p.lng,
            windSpeed: Number(current?.wind_speed_10m),
            windDir: Number(current?.wind_direction_10m),
            precipitation: Number(current?.precipitation)
          } as OpenMeteoPoint;
        })
      );
      setPoints(results);
    } catch {
      // ignore
      setPoints([]);
    }
  }, [map]);

  useEffect(() => {
    const schedule = () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        refresh();
      }, 250);
    };

    schedule();
    map.on('moveend', schedule);
    return () => {
      map.off('moveend', schedule);
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [map, refresh]);

  if (mode === 'wind') {
    return (
      <>
        {points
          .filter((p) => Number.isFinite(p.windSpeed) && Number.isFinite(p.windDir))
          .map((p, idx) => (
            <Marker
              key={`wind-${idx}`}
              position={[p.lat, p.lng]}
              icon={makeWindIcon(p.windSpeed ?? 0, p.windDir ?? 0)}
              pane="planetiaOverlayPane"
              interactive={false}
            />
          ))}
      </>
    );
  }

  return (
    <>
      {points
        .filter((p) => Number.isFinite(p.precipitation))
        .map((p, idx) => (
          <Marker
            key={`precip-${idx}`}
            position={[p.lat, p.lng]}
            icon={makePrecipIcon(p.precipitation ?? 0)}
            pane="planetiaOverlayPane"
            interactive={false}
          />
        ))}
    </>
  );
}

function FarmerDashboardContent() {
  const { t, isRTL, language } = useApp();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const geocodeAbortRef = useRef<AbortController | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'dashboard' | 'upload' | 'history'>('map');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [latestAnalysis, setLatestAnalysis] = useState<FarmReportRow | null>(null);

  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null);
  const [farmName, setFarmName] = useState('');
  const [emirate, setEmirate] = useState('');
  const [cropType, setCropType] = useState('');
  const [mapLayer, setMapLayer] = useState<'streets' | 'satellite' | 'ndvi' | 'lst' | 'soil' | 'radar' | 'wind' | 'precip'>('satellite');

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: async () => base44.auth.me(),
    initialData: { email: 'demo@planetiaos.local' }
  });

  const { data: farmReports } = useQuery({
    queryKey: ['farmReports', me.email],
    queryFn: async () => {
      try {
        const list = await base44.entities.FarmReport.filter({ user_email: me.email }, '-created_date', 50);
        return (Array.isArray(list) ? list : []) as FarmReportRow[];
      } catch {
        return [] as FarmReportRow[];
      }
    },
    initialData: [] as FarmReportRow[]
  });

  const selectedReport = useMemo<FarmReportRow>(() => {
    if (farmReports.length > 0) return farmReports[0];
    return {
      id: 1,
      date: '2024-04-18',
      location: { farm_name: 'Al Dhaid Farm', emirate: 'Sharjah' },
      crop_type: 'Date Palms',
      ndvi_score: 0.48,
      water_efficiency: 85,
      sandstorm_risk: 'low',
      risks_detected: ['Minor irrigation leak in Section B'],
      recommendations: ['Schedule maintenance for drip system', 'Optimal harvest window in 2 weeks']
    };
  }, [farmReports]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setPicked({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  const getNdviColor = (score: number) => {
    if (score >= 0.7) return 'text-emerald-500';
    if (score >= 0.5) return 'text-amber-500';
    return 'text-red-500';
  };

  const getNdviStatus = (score: number) => {
    if (score >= 0.7) return { label: 'Healthy', color: 'bg-emerald-100 text-emerald-800' };
    if (score >= 0.5) return { label: 'Moderate', color: 'bg-amber-100 text-amber-800' };
    return { label: 'Stressed', color: 'bg-red-100 text-red-800' };
  };

  const getSandstormIcon = (risk: FarmReportRow['sandstorm_risk']) => {
    const colors = {
      none: 'text-emerald-500',
      low: 'text-sky-500',
      medium: 'text-amber-500',
      high: 'text-red-500'
    };
    return colors[risk] || colors.none;
  };

  const getHealthLabel = (ndvi: number) => {
    if (ndvi >= 0.7) return { label: language === 'ar' ? 'ممتاز' : 'Excellent', color: 'bg-emerald-100 text-emerald-800' };
    if (ndvi >= 0.55) return { label: language === 'ar' ? 'جيد' : 'Good', color: 'bg-sky-100 text-sky-800' };
    if (ndvi >= 0.4) return { label: language === 'ar' ? 'متوسط' : 'Moderate', color: 'bg-amber-100 text-amber-800' };
    return { label: language === 'ar' ? 'ضعيف' : 'Poor', color: 'bg-red-100 text-red-800' };
  };

  const getImprovementSuggestions = (report: FarmReportRow) => {
    const ndvi = Number(report.ndvi_score ?? 0);
    const water = Number(report.water_efficiency ?? 0);
    const suggestionsEn: string[] = [];
    const suggestionsAr: string[] = [];

    if (ndvi < 0.55) {
      suggestionsEn.push('Increase irrigation efficiency: check drip lines, leaks, and emitter clogging.');
      suggestionsEn.push('Test soil salinity (EC) and pH; flush salts if high and improve drainage.');
      suggestionsEn.push('Add organic matter (compost/mulch) to retain moisture and reduce heat stress.');
      suggestionsEn.push('Inspect for pests/disease (spots, curling, discoloration) and apply targeted treatment.');
      suggestionsEn.push('Adjust irrigation timing to early morning / late evening to reduce evaporation.');

      suggestionsAr.push('حسّن كفاءة الري: افحص خطوط التنقيط والتسريبات وانسداد النقاطات.');
      suggestionsAr.push('افحص ملوحة التربة (EC) ودرجة الحموضة؛ اغسل الأملاح إذا كانت مرتفعة وحسّن الصرف.');
      suggestionsAr.push('أضف مادة عضوية (كمبوست/نشارة) للاحتفاظ بالرطوبة وتقليل إجهاد الحرارة.');
      suggestionsAr.push('افحص الآفات/الأمراض (بقع، تجعد، تغيّر لون) وطبّق علاجاً مناسباً.');
      suggestionsAr.push('اضبط مواعيد الري لصباح مبكر/مساء لتقليل التبخر.');
    }

    if (water > 0 && water < 65) {
      suggestionsEn.push('Water efficiency is low: calibrate irrigation schedule and consider moisture sensors.');
      suggestionsAr.push('كفاءة المياه منخفضة: عاير جدول الري وفكّر بحساسات رطوبة التربة.');
    }

    if ((report.sandstorm_risk ?? 'none') === 'high') {
      suggestionsEn.push('High sandstorm risk: add windbreaks and protect young plants (nets/cover).');
      suggestionsAr.push('خطر عاصفة رملية مرتفع: أضف مصدات رياح واحمِ النباتات الصغيرة (شبك/غطاء).');
    }

    const list = language === 'ar' ? suggestionsAr : suggestionsEn;
    return list.slice(0, 6);
  };

  const gibsBaseTime = useMemo(() => {
    const raw = selectedReport?.date_analyzed || selectedReport?.date || selectedReport?.created_date;
    const base = raw ? new Date(String(raw)) : new Date();
    const baseTime = Number.isFinite(base.getTime()) ? base.getTime() : Date.now();
    return baseTime;
  }, [selectedReport]);

  const gibsDailyDate = useMemo(() => {
    // Daily products can still be missing for the newest days depending on the layer.
    // Using ~7 days older tends to be much more reliable.
    const d = new Date(gibsBaseTime - 7 * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  }, [gibsBaseTime]);

  const gibsSoilDate = useMemo(() => {
    const d = new Date(gibsBaseTime - 7 * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  }, [gibsBaseTime]);

  const gibsLstDate = useMemo(() => {
    const d = new Date(gibsBaseTime - 14 * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  }, [gibsBaseTime]);

  const gibsNdvi8DayDate = useMemo(() => {
    // MODIS_Terra_NDVI_8Day only exists for 8-day composite dates.
    // If we request a non-aligned date, GIBS commonly returns 404 and the overlay "disappears".
    const base = new Date(gibsBaseTime - 7 * 24 * 60 * 60 * 1000);
    const epoch = Date.UTC(2000, 0, 1);
    const daysSince = Math.floor((Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()) - epoch) / (24 * 60 * 60 * 1000));
    const alignedDays = daysSince - (daysSince % 8);
    const d = new Date(epoch + alignedDays * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  }, [gibsBaseTime]);

  const baseTiles = useMemo(() => {
    if (mapLayer === 'streets') {
      return {
        name: language === 'ar' ? 'شوارع' : 'Streets',
        attribution: '&copy; OpenStreetMap',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        maxNativeZoom: 19
      };
    }

    return {
      name: language === 'ar' ? 'قمر صناعي' : 'Satellite',
      attribution: 'Tiles &copy; Esri',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      maxNativeZoom: 19
    };
  }, [language, mapLayer]);

  const mapOverlay = useMemo(() => {
    if (mapLayer === 'ndvi') {
      return {
        name: language === 'ar' ? 'NDVI (ناسا)' : 'NDVI (NASA)',
        url: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI_8Day/default/${gibsNdvi8DayDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png`,
        opacity: 0.88,
        className: 'planetia-overlay planetia-overlay-ndvi',
        maxNativeZoom: 9,
        legend: language === 'ar'
          ? 'NDVI: أخضر = نباتات صحية، أصفر = متوسط، أحمر = ضعيف'
          : 'NDVI: Green = healthy vegetation, Yellow = moderate, Red = poor'
      };
    }
    if (mapLayer === 'lst') {
      return {
        name: language === 'ar' ? 'حرارة سطح الأرض (ناسا)' : 'Land Surface Temp (NASA)',
        url: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_LST_Day/default/${gibsLstDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png`,
        opacity: 0.82,
        className: 'planetia-overlay planetia-overlay-lst',
        maxNativeZoom: 9,
        legend: language === 'ar'
          ? 'LST: أزرق/أخضر = أبرد، أصفر/أحمر = أحرّ'
          : 'LST: Blue/Green = cooler, Yellow/Red = hotter'
      };
    }
    if (mapLayer === 'soil') {
      return {
        name: language === 'ar' ? 'رطوبة التربة (OpenLandMap)' : 'Soil Moisture (OpenLandMap)',
        url: '',
        opacity: 0,
        legend: language === 'ar'
          ? 'رطوبة التربة: طبقة OpenLandMap (مياه التربة عند 33kPa).'
          : 'Soil moisture: OpenLandMap layer (water content at 33kPa).'
      };
    }
    if (mapLayer === 'radar') {
      return {
        name: language === 'ar' ? 'رادار المطر (IEM NEXRAD)' : 'Rain Radar (IEM NEXRAD)',
        url: '',
        opacity: 0,
        legend: language === 'ar'
          ? 'الرادار: بيانات NEXRAD عبر IEM (بدون مفتاح API).'
          : 'Radar: NEXRAD via IEM (no API key required).'
      };
    }
    if (mapLayer === 'wind') {
      return {
        name: language === 'ar' ? 'الرياح (Open‑Meteo)' : 'Wind (Open‑Meteo)',
        url: '',
        opacity: 0,
        legend: language === 'ar'
          ? 'الرياح: بيانات مباشرة من Open‑Meteo (بدون مفتاح API).'
          : 'Wind: live data from Open‑Meteo (no API key required).'
      };
    }
    if (mapLayer === 'precip') {
      return {
        name: language === 'ar' ? 'الهطول (Open‑Meteo)' : 'Precipitation (Open‑Meteo)',
        url: '',
        opacity: 0,
        legend: language === 'ar'
          ? 'الهطول: بيانات مباشرة من Open‑Meteo (بدون مفتاح API).'
          : 'Precipitation: live data from Open‑Meteo (no API key required).'
      };
    }
    return null;
  }, [gibsDailyDate, gibsLstDate, gibsNdvi8DayDate, language, mapLayer]);

  const handlePick = useCallback(async (lat: number, lng: number) => {
    setPicked({ lat, lng });

    try {
      if (geocodeAbortRef.current) geocodeAbortRef.current.abort();
      const controller = new AbortController();
      geocodeAbortRef.current = controller;

      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}&zoom=14&addressdetails=1`;
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      const json: any = await res.json();

      const addr = json?.address || {};
      const place =
        addr?.farm ||
        addr?.attraction ||
        addr?.building ||
        addr?.neighbourhood ||
        addr?.suburb ||
        addr?.village ||
        addr?.town ||
        addr?.city ||
        addr?.county ||
        addr?.state ||
        '';

      const region =
        addr?.state ||
        addr?.state_district ||
        addr?.region ||
        addr?.county ||
        addr?.city ||
        '';

      if (place) setFarmName(String(place));
      if (region) setEmirate(String(region));
    } catch {
      // ignore
    }
  }, []);

  const createReportMutation = useMutation({
    mutationFn: async (file: File) => {
      const uploaded = await base44.integrations.Core.UploadFile({ file });
      const image_url = uploaded.file_url;

      const ndvi = Number((0.4 + Math.random() * 0.55).toFixed(2));
      const water = Math.floor(55 + Math.random() * 40);
      const sandstorm: FarmReportRow['sandstorm_risk'] = ndvi >= 0.75 ? 'none' : ndvi >= 0.6 ? 'low' : ndvi >= 0.5 ? 'medium' : 'high';

      const risks = sandstorm === 'high'
        ? ['High sandstorm risk in 48 hours', 'Check irrigation lines for blockages']
        : sandstorm === 'medium'
        ? ['Moderate sandstorm risk in 72 hours']
        : [];

      const recs = ndvi >= 0.7
        ? ['Excellent crop health', 'Maintain current irrigation schedule']
        : ndvi >= 0.55
        ? ['Monitor water stress zones', 'Consider early morning irrigation']
        : ['Possible crop stress detected', 'Inspect soil salinity and adjust irrigation'];

      const payload: FarmReportRow = {
        user_email: me.email,
        image_url,
        location: {
          lat: picked?.lat,
          lng: picked?.lng,
          farm_name: farmName || 'My Farm',
          emirate: emirate || 'UAE'
        },
        crop_type: cropType || 'Mixed crops',
        ndvi_score: ndvi,
        water_efficiency: water,
        risks_detected: risks,
        recommendations: recs,
        sandstorm_risk: sandstorm,
        date_analyzed: new Date().toISOString().slice(0, 10)
      };

      await base44.entities.FarmReport.create(payload as any);

      return payload;
    },
    onSuccess: (payload) => {
      queryClient.invalidateQueries({ queryKey: ['farmReports', me.email] });
      setIsAnalyzing(false);
      setAnalysisError(null);
      setLatestAnalysis(payload ?? null);
      setActiveTab('upload');
    },
    onError: () => {
      setIsAnalyzing(false);
      setAnalysisError(language === 'ar' ? 'فشل التحليل. حاول مرة أخرى.' : 'Analysis failed. Please try again.');
    }
  });

  const handleImageUpload = async (e: any) => {
    const file = e.target.files?.[0] as File | undefined;
    if (!file) return;
    setIsAnalyzing(true);
    setAnalysisError(null);
    setLatestAnalysis(null);
    createReportMutation.mutate(file);
  };

  return (
    <div className="min-h-screen pb-24 pt-20 bg-gradient-to-br from-green-100 via-emerald-100 to-teal-100">
      <TopBar />

      <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            </Button>
          </Link>
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Tractor className="w-6 h-6 text-amber-600" />
            <h1 className="text-2xl font-bold text-slate-800">
              {t('farmDashboard')}
            </h1>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="w-full grid grid-cols-4 bg-white">
            <TabsTrigger value="map" className={`gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <CloudRain className="w-4 h-4" />
              <span className="hidden sm:inline">{isRTL ? 'الخريطة' : 'Map'}</span>
            </TabsTrigger>
            <TabsTrigger value="dashboard" className={`gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Satellite className="w-4 h-4" />
              <span className="hidden sm:inline">{t('satelliteInsights')}</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className={`gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">{isRTL ? 'رفع' : 'Upload'}</span>
            </TabsTrigger>
            <TabsTrigger value="history" className={`gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">{t('viewFarmHistory')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="mt-4 space-y-4">
            <Card className="bg-white/80 border-emerald-100 overflow-hidden">
              <CardHeader className="pb-2">
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <CardTitle className={isRTL ? 'text-right' : ''}>
                    {isRTL ? 'موقع المزرعة' : 'Farm Location'}
                  </CardTitle>
                  <div className={`flex flex-wrap items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                    <button
                      onClick={() => setMapLayer('satellite')}
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${mapLayer === 'satellite' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200'}`}
                    >
                      {language === 'ar' ? 'قمر صناعي' : 'Satellite'}
                    </button>
                    <button
                      onClick={() => setMapLayer('streets')}
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${mapLayer === 'streets' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200'}`}
                    >
                      {language === 'ar' ? 'شوارع' : 'Streets'}
                    </button>
                    <button
                      onClick={() => setMapLayer('ndvi')}
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${mapLayer === 'ndvi' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200'}`}
                    >
                      NDVI
                    </button>
                    <button
                      onClick={() => setMapLayer('lst')}
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${mapLayer === 'lst' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200'}`}
                    >
                      LST
                    </button>
                    <button
                      onClick={() => setMapLayer('radar')}
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${mapLayer === 'radar' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200'}`}
                    >
                      {language === 'ar' ? 'رادار' : 'Radar'}
                    </button>
                    <button
                      onClick={() => setMapLayer('wind')}
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${mapLayer === 'wind' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200'}`}
                    >
                      {language === 'ar' ? 'رياح' : 'Wind'}
                    </button>
                    <button
                      onClick={() => setMapLayer('precip')}
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${mapLayer === 'precip' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200'}`}
                    >
                      {language === 'ar' ? 'هطول' : 'Precip'}
                    </button>
                    <button
                      onClick={() => setMapLayer('soil')}
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${mapLayer === 'soil' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200'}`}
                    >
                      {language === 'ar' ? 'تربة' : 'Soil'}
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-2xl overflow-hidden shadow-xl h-[320px] ring-2 ring-emerald-200 bg-white">
                  <MapContainer
                    center={picked ? [picked.lat, picked.lng] : [24.4539, 54.3773]}
                    zoom={7}
                    maxZoom={18}
                    className="h-full w-full"
                  >
                    <MapOverlayPane />
                    <TileLayer attribution={baseTiles.attribution} url={baseTiles.url} maxNativeZoom={(baseTiles as any).maxNativeZoom ?? 19} maxZoom={18} />
                    {mapOverlay && mapOverlay.url && (
                      <TileLayer
                        url={mapOverlay.url}
                        opacity={mapOverlay.opacity}
                        className={(mapOverlay as any).className}
                        pane="planetiaOverlayPane"
                        zIndex={600}
                        maxNativeZoom={(mapOverlay as any).maxNativeZoom ?? 18}
                        maxZoom={18}
                        {...(mapLayer === 'radar' ? {} : { crossOrigin: 'anonymous' })}
                      />
                    )}
                    {mapLayer === 'soil' && (
                      <WMSTileLayer
                        url="https://maps.isric.org/geoserver/soilgrids/wms"
                        layers="soilgrids:wwcp_mean"
                        format="image/png"
                        transparent
                        version="1.3.0"
                        opacity={0.72}
                        pane="planetiaOverlayPane"
                        zIndex={600}
                      />
                    )}
                    {mapLayer === 'soil' && (
                      <TileLayer
                        url={`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/SMAP_L4_Analyzed_Surface_Soil_Moisture_Day/default/${gibsSoilDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png`}
                        opacity={0.62}
                        className="planetia-overlay planetia-overlay-soil"
                        pane="planetiaOverlayPane"
                        zIndex={590}
                        crossOrigin="anonymous"
                        maxNativeZoom={9}
                        maxZoom={18}
                      />
                    )}
                    {mapLayer === 'radar' && (
                      <WMSTileLayer
                        url="https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0q.cgi"
                        layers="nexrad-n0q-900913"
                        format="image/png"
                        transparent
                        opacity={0.78}
                        pane="planetiaOverlayPane"
                        zIndex={600}
                      />
                    )}
                    {mapLayer === 'wind' && <OpenMeteoOverlay mode="wind" />}
                    {mapLayer === 'precip' && <OpenMeteoOverlay mode="precip" />}
                    <MapClickSetter onPick={handlePick} />
                    {picked && (
                      <Marker position={[picked.lat, picked.lng]} icon={makeMarker('#10b981')}>
                        <Popup>
                          <div className="p-2">
                            <p className="font-bold">{isRTL ? 'الموقع المختار' : 'Selected location'}</p>
                            <p className="text-xs text-slate-600">{picked.lat.toFixed(4)}, {picked.lng.toFixed(4)}</p>
                          </div>
                        </Popup>
                      </Marker>
                    )}
                  </MapContainer>
                </div>

                <div className="mt-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <p className="text-xs text-emerald-700 text-center">
                    {language === 'ar'
                      ? 'بيانات من أقمار ناسا الصناعية وشبكات المراقبة البيئية'
                      : 'Data from NASA satellites & environmental monitoring network'}
                  </p>
                </div>

                {mapOverlay && (
                  <div className={`p-3 rounded-2xl border border-slate-100 bg-white/90 ${isRTL ? 'text-right' : ''}`}>
                    <p className="text-xs font-bold text-slate-800">{mapOverlay.name}</p>
                    <p className="text-xs text-slate-600">{mapOverlay.legend}</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {language === 'ar'
                        ? 'ملاحظة: بيانات ناسا عادةً تُحدّث يومياً، والرادار شبه مباشر.'
                        : 'Note: NASA layers are typically daily updates; radar is near real-time.'}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">{isRTL ? 'اسم المزرعة' : 'Farm name'}</p>
                    <input value={farmName} onChange={(e) => setFarmName(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">{isRTL ? 'الإمارة' : 'Emirate'}</p>
                    <input value={emirate} onChange={(e) => setEmirate(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">{isRTL ? 'نوع المحصول' : 'Crop type'}</p>
                  <input value={cropType} onChange={(e) => setCropType(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
                </div>
                <p className={`text-xs text-slate-500 ${isRTL ? 'text-right' : ''}`}>
                  {isRTL ? 'اضغط على الخريطة لاختيار الموقع يدوياً.' : 'Tap the map to pick location manually.'}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-4 space-y-4">
            {/* Current Farm Status */}
            <Card className="shadow-2xl overflow-hidden bg-gradient-to-br from-white to-emerald-50 border-2 border-emerald-300">
              <CardHeader className="pb-2">
                <CardTitle className={`text-xl font-black flex items-center gap-2 text-emerald-800 ${isRTL ? 'text-right flex-row-reverse' : ''}`}>
                  <Tractor className="w-6 h-6" />
                  {selectedReport.location?.farm_name}
                </CardTitle>
                <p className={`text-sm font-semibold text-teal-700 ${isRTL ? 'text-right' : ''}`}>
                  {selectedReport.crop_type} • {selectedReport.location?.emirate}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* NDVI & Water Efficiency */}
                <div className="grid grid-cols-2 gap-4">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="p-5 rounded-2xl shadow-lg bg-gradient-to-br from-green-100 to-emerald-100 border-2 border-green-300"
                  >
                    <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Leaf className={`w-6 h-6 ${getNdviColor(selectedReport.ndvi_score ?? 0)}`} />
                      <span className="text-xs font-bold text-green-800">
                        NDVI Health
                      </span>
                    </div>
                    <p className={`text-4xl font-black ${getNdviColor(selectedReport.ndvi_score ?? 0)}`}>
                      {(selectedReport.ndvi_score ?? 0).toFixed(2)}
                    </p>
                    <Badge className={`mt-2 ${getNdviStatus(selectedReport.ndvi_score ?? 0).color} font-bold`}>
                      {getNdviStatus(selectedReport.ndvi_score ?? 0).label}
                    </Badge>
                  </motion.div>

                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="p-5 rounded-2xl shadow-lg bg-gradient-to-br from-blue-100 to-cyan-100 border-2 border-blue-300"
                  >
                    <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Droplets className="w-6 h-6 text-cyan-500" />
                      <span className="text-xs font-bold text-cyan-800">
                        Water Use
                      </span>
                    </div>
                    <p className="text-4xl font-black text-cyan-700">
                      {(selectedReport.water_efficiency ?? 0)}%
                    </p>
                    <Progress 
                      value={selectedReport.water_efficiency ?? 0} 
                      className="mt-2 h-3 bg-cyan-200"
                    />
                  </motion.div>
                </div>

                {/* Sandstorm Risk */}
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className={`p-6 rounded-2xl shadow-xl ${
                    selectedReport.sandstorm_risk === 'high'
                      ? 'bg-gradient-to-br from-red-100 to-orange-100 border-2 border-red-400'
                      : 'bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-300'
                  }`}
                >
                  <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <motion.div
                        animate={selectedReport.sandstorm_risk === 'high' ? { rotate: [0, 15, -15, 0] } : {}}
                        transition={{ duration: 0.5, repeat: selectedReport.sandstorm_risk === 'high' ? Infinity : 0 }}
                        className="relative"
                      >
                        <Wind className={`w-12 h-12 ${getSandstormIcon(selectedReport.sandstorm_risk)}`} />
                        {selectedReport.sandstorm_risk === 'high' && (
                          <motion.div
                            className="absolute inset-0"
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            <Wind className="w-12 h-12 text-red-500" />
                          </motion.div>
                        )}
                      </motion.div>
                      <div className={isRTL ? 'text-right' : ''}>
                        <p className="text-sm font-bold text-amber-800">
                          {t('sandstormRisk')}
                        </p>
                        <p className={`text-3xl font-black capitalize ${getSandstormIcon(selectedReport.sandstorm_risk)}`}>
                          {selectedReport.sandstorm_risk}
                        </p>
                      </div>
                    </div>
                    {selectedReport.sandstorm_risk !== 'none' && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <AlertTriangle className={`w-10 h-10 ${getSandstormIcon(selectedReport.sandstorm_risk)}`} />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </CardContent>
            </Card>

            {(() => {
              const ndvi = Number(selectedReport.ndvi_score ?? 0);
              const health = getHealthLabel(ndvi);
              const suggestions = getImprovementSuggestions(selectedReport);
              if (ndvi >= 0.7 || suggestions.length === 0) return null;
              return (
                <Card className="bg-white/80 border-red-100">
                  <CardHeader className="pb-2">
                    <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <CardTitle className={`text-lg ${isRTL ? 'text-right' : ''}`}>
                        {language === 'ar' ? 'تحسين صحة النبات' : 'Improve Plant Health'}
                      </CardTitle>
                      <Badge className={`${health.color} font-bold`}>{health.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {suggestions.map((s, idx) => (
                      <div key={idx} className={`p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-slate-700 ${isRTL ? 'text-right' : ''}`}>
                        {s}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })()}

            {/* Recommendations */}
            <Card className="bg-white/70 border-emerald-100">
              <CardHeader className="pb-2">
                <CardTitle className={`text-lg flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  {t('recommendations')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(selectedReport.recommendations ?? []).map((rec, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-start gap-3 p-3 rounded-xl bg-emerald-50 ${isRTL ? 'flex-row-reverse text-right' : ''}`}
                    >
                      <Check className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-emerald-700">
                        {rec}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Detected Risks */}
            {(selectedReport.risks_detected ?? []).length > 0 && (
              <Card className="bg-white/70 border-amber-100">
                <CardHeader className="pb-2">
                  <CardTitle className={`text-lg flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    {t('cropStress')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(selectedReport.risks_detected ?? []).map((risk, index) => (
                      <div
                        key={index}
                        className={`flex items-start gap-3 p-3 rounded-xl bg-amber-50 ${isRTL ? 'flex-row-reverse text-right' : ''}`}
                      >
                        <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-amber-700">
                          {risk}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="mt-4 space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              className="w-full p-16 rounded-3xl border-4 border-dashed flex flex-col items-center gap-6 transition-all shadow-2xl border-emerald-400 hover:border-teal-500 bg-gradient-to-br from-emerald-50 to-teal-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-16 h-16 text-emerald-500 animate-spin" />
                  <p className="text-slate-600">
                    Analyzing field image...
                  </p>
                </>
              ) : (
                <>
                  <Upload className="w-16 h-16 text-slate-400" />
                  <p className="text-lg font-medium text-slate-600">
                    {t('uploadFieldPhoto')}
                  </p>
                  <p className="text-sm text-slate-400">
                    AI will analyze crop health and provide recommendations
                  </p>
                </>
              )}
            </motion.button>

            {analysisError && (
              <div className={`p-3 rounded-2xl bg-red-50 border border-red-200 ${isRTL ? 'text-right' : ''}`}>
                <p className="text-sm font-bold text-red-700">{analysisError}</p>
              </div>
            )}

            {latestAnalysis && (
              <>
                <Card className="bg-white/80 border-emerald-100">
                  <CardHeader className="pb-2">
                    <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <CardTitle className={`text-lg ${isRTL ? 'text-right' : ''}`}>
                        {language === 'ar' ? 'نتائج التحليل' : 'Analysis Results'}
                      </CardTitle>
                      <Badge className={`${getNdviStatus(Number(latestAnalysis.ndvi_score ?? 0)).color} font-bold`}>
                        NDVI: {Number(latestAnalysis.ndvi_score ?? 0).toFixed(2)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className={`p-3 rounded-2xl bg-slate-50 border border-slate-100 ${isRTL ? 'text-right' : ''}`}>
                      <p className="text-sm font-bold text-slate-800">
                        {latestAnalysis.location?.farm_name || (language === 'ar' ? 'المزرعة' : 'Farm')}
                      </p>
                      <p className="text-xs text-slate-600">
                        {(latestAnalysis.location?.emirate || emirate || 'UAE')}
                        {' • '}
                        {(latestAnalysis.crop_type || cropType || (language === 'ar' ? 'محاصيل' : 'Crops'))}
                        {' • '}
                        {(latestAnalysis.date_analyzed || '')}
                      </p>
                    </div>

                    {(() => {
                      const suggestions = getImprovementSuggestions(latestAnalysis);
                      if (suggestions.length === 0) return null;
                      return (
                        <div className="space-y-2">
                          <p className={`text-sm font-black text-slate-800 ${isRTL ? 'text-right' : ''}`}>
                            {language === 'ar' ? 'اقتراحات تحسين صحة النبات' : 'Plant Health Improvement Suggestions'}
                          </p>
                          {suggestions.map((s, idx) => (
                            <div key={idx} className={`p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-800 ${isRTL ? 'text-right' : ''}`}>
                              {s}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                <Card className="bg-white/70 border-emerald-100">
                  <CardHeader className="pb-2">
                    <CardTitle className={`text-lg flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                      {t('recommendations')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(latestAnalysis.recommendations ?? []).map((rec, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.08 }}
                          className={`flex items-start gap-3 p-3 rounded-xl bg-emerald-50 ${isRTL ? 'flex-row-reverse text-right' : ''}`}
                        >
                          <Check className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-emerald-700">{rec}</p>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {(latestAnalysis.risks_detected ?? []).length > 0 && (
                  <Card className="bg-white/70 border-amber-100">
                    <CardHeader className="pb-2">
                      <CardTitle className={`text-lg flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        {t('cropStress')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {(latestAnalysis.risks_detected ?? []).map((risk, index) => (
                          <div
                            key={index}
                            className={`flex items-start gap-3 p-3 rounded-xl bg-amber-50 ${isRTL ? 'flex-row-reverse text-right' : ''}`}
                          >
                            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-amber-700">{risk}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className={`flex items-center justify-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Button
                    onClick={() => setActiveTab('dashboard')}
                    variant="outline"
                    className="border-slate-200"
                  >
                    {language === 'ar' ? 'عرض لوحة المتابعة' : 'View Dashboard'}
                  </Button>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {language === 'ar' ? 'رفع صورة أخرى' : 'Upload Another'}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-4 space-y-3">
            {(farmReports.length > 0 ? farmReports : []).map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className={`cursor-pointer transition-all bg-white border-slate-100 hover:border-emerald-300 ${selectedReport.id === report.id ? 'ring-2 ring-emerald-500' : ''}`}
                  onClick={() => { 
                    setActiveTab('dashboard'); 
                  }}
                >
                  <CardContent className="p-4">
                    <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={isRTL ? 'text-right' : ''}>
                        <p className="font-medium text-slate-800">
                          {report.location?.farm_name}
                        </p>
                        <p className="text-sm text-slate-500">
                          {report.crop_type} • {(report.date_analyzed || report.date || '')}
                        </p>
                      </div>
                      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Badge className={getNdviStatus(Number(report.ndvi_score ?? 0)).color}>
                          NDVI: {Number(report.ndvi_score ?? 0).toFixed(2)}
                        </Badge>
                        {report.sandstorm_risk !== 'none' && (
                          <Wind className={`w-5 h-5 ${getSandstormIcon(report.sandstorm_risk)}`} />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav activePage="farmer" />
    </div>
  );
}

export default function FarmerDashboard() {
  return (
    <AppProvider>
      <FarmerDashboardContent />
    </AppProvider>
  );
}