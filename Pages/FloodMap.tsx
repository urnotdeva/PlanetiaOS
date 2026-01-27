import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import EnvironmentalDataTabs from '@/components/flood/EnvironmentalDataTabs';

type FloodReport = {
  id?: string;
  user_email?: string;
  image_url?: string;
  location?: { lat?: number; lng?: number; address?: string; city?: string };
  severity?: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  date_reported?: string;
  verified?: boolean;
  source?: string;
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

function markerForSeverity(sev?: FloodReport['severity']) {
  if (sev === 'critical') return makeMarker('#ef4444');
  if (sev === 'high') return makeMarker('#f97316');
  if (sev === 'medium') return makeMarker('#eab308');
  if (sev === 'low') return makeMarker('#22c55e');
  return makeMarker('#64748b');
}

function severityBadge(sev?: FloodReport['severity']) {
  switch (sev) {
    case 'critical':
      return 'bg-red-100 text-red-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
}

function MapClickSetter({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => onPick(e.latlng.lat, e.latlng.lng)
  });
  return null;
}

// Mock farm data (5 sample entries)
const mockFarmReports = [
  {
    id: 1,
    date: '2024-04-18',
    location: { farm_name: 'Al Dhaid Farm', emirate: 'Sharjah' },
    crop_type: 'Date Palms',
    ndvi_score: 0.72,
    water_efficiency: 85,
    sandstorm_risk: 'low',
    risks_detected: ['Minor irrigation leak in Section B'],
    recommendations: ['Schedule maintenance for drip system', 'Optimal harvest window in 2 weeks']
  },
  {
    id: 2,
    date: '2024-04-17',
    location: { farm_name: 'Liwa Oasis Farm', emirate: 'Abu Dhabi' },
    crop_type: 'Vegetables (Tomatoes)',
    ndvi_score: 0.58,
    water_efficiency: 72,
    sandstorm_risk: 'high',
    risks_detected: ['Crop stress detected in greenhouse 3', 'Sandstorm approaching in 48 hours'],
    recommendations: ['High sandstorm risk in 48 hours: add windbreaks', 'Check irrigation/salinity in Section B']
  },
  {
    id: 3,
    date: '2024-04-16',
    location: { farm_name: 'RAK Agricultural Zone', emirate: 'Ras Al Khaimah' },
    crop_type: 'Citrus (Oranges)',
    ndvi_score: 0.81,
    water_efficiency: 91,
    sandstorm_risk: 'none',
    risks_detected: [],
    recommendations: ['Excellent crop health', 'Consider expanding irrigation to adjacent plot']
  },
  {
    id: 4,
    date: '2024-04-15',
    location: { farm_name: 'Fujairah Coastal Farm', emirate: 'Fujairah' },
    crop_type: 'Vegetables (Cucumbers)',
    ndvi_score: 0.45,
    water_efficiency: 63,
    sandstorm_risk: 'medium',
    risks_detected: ['High salinity detected', 'Possible pest activity in rows 5-8'],
    recommendations: ['Flush irrigation lines', 'Apply organic pest control', 'Test soil samples']
  },
  {
    id: 5,
    date: '2024-04-14',
    location: { farm_name: 'Al Ain Organic Farm', emirate: 'Abu Dhabi' },
    crop_type: 'Herbs (Basil, Mint)',
    ndvi_score: 0.68,
    water_efficiency: 78,
    sandstorm_risk: 'low',
    risks_detected: ['Slight water stress in morning hours'],
    recommendations: ['Adjust irrigation schedule to early morning', 'Add mulch to retain moisture']
  }
];

function FloodMapContent() {
  const { t, language, isRTL } = useApp();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [active, setActive] = useState<'map' | 'history' | 'environment'>('map');
  const [reportOpen, setReportOpen] = useState(false);
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null);
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [severity, setSeverity] = useState<FloodReport['severity']>('medium');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setPicked({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  const { data: reports } = useQuery({
    queryKey: ['floodReports'],
    queryFn: async () => {
      try {
        const list = await base44.entities.FloodReport.list();
        return (Array.isArray(list) ? list : []) as FloodReport[];
      } catch {
        return [] as FloodReport[];
      }
    },
    initialData: [] as FloodReport[]
  });

  const createReportMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      const userEmail = user?.email ?? 'demo@planetiaos.local';

      let image_url: string | undefined;
      if (selectedFile) {
        const uploaded = await base44.integrations.Core.UploadFile({ file: selectedFile });
        image_url = uploaded.file_url;
      }

      const payload: FloodReport = {
        user_email: userEmail,
        image_url,
        location: {
          lat: picked?.lat,
          lng: picked?.lng,
          city,
          address
        },
        severity,
        description,
        date_reported: new Date().toISOString().slice(0, 10),
        verified: false,
        source: 'user'
      };

      await base44.entities.FloodReport.create(payload as any);
    },
    onSuccess: () => {
      setReportOpen(false);
      setSelectedFile(null);
      setDescription('');
      setCity('');
      setAddress('');
      setSeverity('medium');
      queryClient.invalidateQueries({ queryKey: ['floodReports'] });
    }
  });

  const center = useMemo(() => {
    if (picked) return [picked.lat, picked.lng] as [number, number];
    return [25.2048, 55.2708] as [number, number];
  }, [picked]);

  return (
    <div className="min-h-screen pb-24 pt-20 bg-gradient-to-br from-sky-50 via-emerald-50 to-amber-50">
      <TopBar />

      <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={isRTL ? 'text-right' : ''}>
            <h1 className="text-2xl font-bold text-slate-800">{t('floodMap')}</h1>
            <p className="text-sm text-slate-600">
              {language === 'ar' ? 'بلّغ عن الفيضانات وتابع البلاغات' : 'Report floods and track reports'}
            </p>
          </div>
          <Button
            onClick={() => setReportOpen(true)}
            className="rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-emerald-600 hover:to-sky-600"
          >
            {language === 'ar' ? 'إبلاغ' : 'Report'}
          </Button>
        </div>

        <Tabs value={active} onValueChange={(v) => setActive(v as any)}>
          <TabsList className="w-full grid grid-cols-3 bg-white">
            <TabsTrigger value="map">{language === 'ar' ? 'الخريطة' : 'Map'}</TabsTrigger>
            <TabsTrigger value="history">{language === 'ar' ? 'البلاغات' : 'Reports'}</TabsTrigger>
            <TabsTrigger value="environment">{language === 'ar' ? 'البيئة' : 'Environment'}</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="mt-4 space-y-3">
            <div className="rounded-2xl overflow-hidden shadow-2xl h-[420px] ring-2 ring-emerald-200 bg-white">
              <MapContainer center={center} zoom={7} className="h-full w-full">
                <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapClickSetter onPick={(lat, lng) => setPicked({ lat, lng })} />
                {picked && (
                  <Marker position={[picked.lat, picked.lng]} icon={makeMarker('#10b981')}>
                    <Popup>
                      <div className="p-2">
                        <p className="font-bold">{language === 'ar' ? 'الموقع المختار' : 'Selected location'}</p>
                        <p className="text-xs text-slate-600">{picked.lat.toFixed(4)}, {picked.lng.toFixed(4)}</p>
                      </div>
                    </Popup>
                  </Marker>
                )}
                {reports
                  .filter((r) => {
                    const lat = Number((r as any)?.location?.lat);
                    const lng = Number((r as any)?.location?.lng);
                    return Number.isFinite(lat) && Number.isFinite(lng);
                  })
                  .map((r: any, idx: number) => (
                    <Marker
                      key={r.id ?? `${idx}`}
                      position={[Number(r.location.lat), Number(r.location.lng)]}
                      icon={markerForSeverity(r.severity)}
                    >
                      <Popup>
                        <div className="p-2 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-bold text-slate-800">
                              {r.location?.city || (language === 'ar' ? 'بلاغ فيضان' : 'Flood Report')}
                            </p>
                            <Badge className={severityBadge(r.severity)}>
                              {String(r.severity || 'unknown').toUpperCase()}
                            </Badge>
                          </div>
                          {r.description && <p className="text-sm text-slate-700">{r.description}</p>}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
              </MapContainer>
            </div>

            <Card className="bg-white/70 border-emerald-100">
              <CardContent className="p-4">
                <p className={`text-sm font-bold text-slate-800 mb-3 ${isRTL ? 'text-right' : ''}`}>
                  {language === 'ar' ? 'معاني الألوان' : 'Color Legend'}
                </p>
                <div className={`grid grid-cols-2 gap-2 ${isRTL ? 'text-right' : ''}`}>
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-xs text-slate-700">{language === 'ar' ? 'منخفض' : 'Low'}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="inline-block w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="text-xs text-slate-700">{language === 'ar' ? 'متوسط' : 'Medium'}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="inline-block w-3 h-3 rounded-full bg-orange-500" />
                    <span className="text-xs text-slate-700">{language === 'ar' ? 'مرتفع' : 'High'}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="inline-block w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-xs text-slate-700">{language === 'ar' ? 'حرج' : 'Critical'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-4 space-y-3">
            <Card className="bg-white/70 border-emerald-100">
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <AlertTriangle className="w-5 h-5 text-sky-600" />
                  {language === 'ar' ? 'آخر البلاغات' : 'Recent Reports'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {reports.length === 0 ? (
                  <p className="text-sm text-slate-600">{language === 'ar' ? 'لا توجد بلاغات بعد' : 'No reports yet'}</p>
                ) : (
                  [...reports]
                    .slice(0, 20)
                    .map((r: any) => (
                      <div
                        key={r.id}
                        className={`p-3 rounded-xl bg-white border border-slate-100 ${isRTL ? 'text-right' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-slate-800">
                            {r.location?.city || (language === 'ar' ? 'بلاغ فيضان' : 'Flood report')}
                          </p>
                          <Badge className={severityBadge(r.severity)}>
                            {String(r.severity || 'unknown').toUpperCase()}
                          </Badge>
                        </div>
                        {r.description && <p className="text-sm text-slate-600 mt-1">{r.description}</p>}
                      </div>
                    ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="environment" className="mt-4">
            <EnvironmentalDataTabs />
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav activePage="flood" />

      <AnimatePresence>
        {reportOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="w-full max-w-lg rounded-3xl overflow-hidden bg-white shadow-2xl"
            >
              <div className="p-5 border-b border-slate-100">
                <p className={`text-lg font-bold text-slate-800 ${isRTL ? 'text-right' : ''}`}>
                  {language === 'ar' ? 'إبلاغ عن فيضان' : 'Report a flood'}
                </p>
              </div>

              <div className="p-5 space-y-3">
                <div>
                  <p className="text-xs text-slate-500 mb-1">{language === 'ar' ? 'المدينة' : 'City'}</p>
                  <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">{language === 'ar' ? 'العنوان' : 'Address'}</p>
                  <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">{language === 'ar' ? 'الخطورة' : 'Severity'}</p>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  >
                    <option value="low">{language === 'ar' ? 'منخفض' : 'Low'}</option>
                    <option value="medium">{language === 'ar' ? 'متوسط' : 'Medium'}</option>
                    <option value="high">{language === 'ar' ? 'مرتفع' : 'High'}</option>
                    <option value="critical">{language === 'ar' ? 'حرج' : 'Critical'}</option>
                  </select>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">{language === 'ar' ? 'الوصف' : 'Description'}</p>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                />
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="rounded-xl">
                    <Camera className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'إضافة صورة' : 'Add photo'}
                  </Button>
                  {selectedFile && <p className="text-xs text-slate-600 truncate">{selectedFile.name}</p>}
                </div>
              </div>

              <div className={`p-5 border-t border-slate-100 flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setReportOpen(false)}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  className="flex-1 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-emerald-600 hover:to-sky-600"
                  onClick={() => createReportMutation.mutate()}
                  disabled={createReportMutation.isPending}
                >
                  {createReportMutation.isPending ? (language === 'ar' ? '...' : '...') : (language === 'ar' ? 'إرسال' : 'Submit')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FloodMap() {
  return (
    <AppProvider>
      <FloodMapContent />
    </AppProvider>
  );
}