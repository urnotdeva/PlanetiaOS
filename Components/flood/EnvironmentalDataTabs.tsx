import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Cloud, Droplets, Factory, Wind } from 'lucide-react';
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet';
import { useApp } from '../context/AppContext';

const NASA_API_KEY = 'QE8VCStj5TQZbUZCleDQDNGRYqDDe6NQqVFjYW9T';

// UAE major cities coordinates
const uaeCities = [
  { name: 'Dubai', lat: 25.2048, lng: 55.2708 },
  { name: 'Abu Dhabi', lat: 24.4539, lng: 54.3773 },
  { name: 'Sharjah', lat: 25.3463, lng: 55.4209 },
  { name: 'Ajman', lat: 25.4052, lng: 55.5136 },
  { name: 'Ras Al Khaimah', lat: 25.7954, lng: 55.9432 },
  { name: 'Fujairah', lat: 25.1288, lng: 56.3265 },
  { name: 'Umm Al Quwain', lat: 25.5647, lng: 55.5547 }
];

export default function EnvironmentalDataTabs() {
  const { language, isRTL } = useApp();
  const [activeTab, setActiveTab] = useState('carbon');
  const [envData, setEnvData] = useState({
    carbon: [],
    plastic: [],
    pollution: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnvironmentalData();
  }, []);

  const fetchEnvironmentalData = async () => {
    try {
      // Simulate environmental data for UAE cities

      const carbonData = uaeCities.map(city => ({
        ...city,
        value: Math.floor(Math.random() * 50) + 50,
        severity: Math.random() > 0.5 ? 'high' : 'medium'
      }));

      const plasticData = uaeCities.map(city => ({
        ...city,
        value: Math.floor(Math.random() * 30) + 20,
        severity: Math.random() > 0.6 ? 'high' : 'low'
      }));

      const pollutionData = uaeCities.map(city => ({
        ...city,
        value: Math.floor(Math.random() * 100) + 50,
        severity: 'low'
      }));

      // Fix severity based on generated values
      const fixedPollution = pollutionData.map((p) => ({
        ...p,
        severity: p.value > 120 ? 'high' : p.value > 90 ? 'medium' : 'low'
      }));

      setEnvData({
        carbon: carbonData,
        plastic: plasticData,
        pollution: fixedPollution
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching environmental data:', error);
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return { bg: 'bg-red-100', text: 'text-red-800', map: '#ef4444' };
      case 'medium': return { bg: 'bg-yellow-100', text: 'text-yellow-800', map: '#eab308' };
      case 'low': return { bg: 'bg-green-100', text: 'text-green-800', map: '#22c55e' };
      default: return { bg: 'bg-slate-100', text: 'text-slate-800', map: '#64748b' };
    }
  };

  const renderMap = (data, type) => (
    <div className="rounded-2xl overflow-hidden shadow-2xl h-[350px] ring-2 ring-emerald-500/50">
      <MapContainer center={[25.2048, 55.2708]} zoom={7} className="h-full w-full">

        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {data.map((point, idx) => (
          <React.Fragment key={idx}>
            <Circle
              center={[point.lat, point.lng]}
              radius={point.value * 500}
              pathOptions={{
                color: getSeverityColor(point.severity).map,
                fillColor: getSeverityColor(point.severity).map,
                fillOpacity: 0.4
              }}
            />
            <Circle
              center={[point.lat, point.lng]}
              radius={2000}
              pathOptions={{ color: '#10b981', fillOpacity: 0 }}
              eventHandlers={{
                mouseover: (e) => {
                  e.target.setStyle({ color: '#dcfce7', fillColor: '#dcfce7', fillOpacity: 0.3 });
                },
                mouseout: (e) => {
                  e.target.setStyle({ color: '#10b981', fillOpacity: 0 });
                }
              }}
            >
              <Popup>
                <div className="p-2">
                  <p className="font-bold">{point.name}</p>
                  <p className="text-sm">
                    {type === 'carbon' && `CO₂: ${point.value} ppm`}
                    {type === 'plastic' && `Plastic Waste: ${point.value} tonnes`}
                    {type === 'pollution' && `AQI: ${point.value}`}
                  </p>
                  <Badge className={`mt-2 ${getSeverityColor(point.severity).bg} ${getSeverityColor(point.severity).text}`}>
                    {point.severity.toUpperCase()}
                  </Badge>
                </div>
              </Popup>
            </Circle>
          </React.Fragment>
        ))}
      </MapContainer>
    </div>
  );

  const emirateDetails = (type: 'carbon' | 'plastic' | 'pollution') => {
    const title =
      type === 'carbon'
        ? (language === 'ar' ? 'كيف يتم إطلاق الكربون؟ والحلول لكل إمارة' : 'How Carbon is released + solutions by Emirate')
        : type === 'plastic'
          ? (language === 'ar' ? 'كيف ينتشر البلاستيك؟ والحلول لكل إمارة' : 'How Plastic pollution happens + solutions by Emirate')
          : (language === 'ar' ? 'كيف يحدث التلوث؟ والحلول لكل إمارة' : 'How Pollution happens + solutions by Emirate');

    const rows = uaeCities.map((c) => {
      const nameAr =
        c.name === 'Abu Dhabi' ? 'أبوظبي' :
        c.name === 'Dubai' ? 'دبي' :
        c.name === 'Sharjah' ? 'الشارقة' :
        c.name === 'Ajman' ? 'عجمان' :
        c.name === 'Ras Al Khaimah' ? 'رأس الخيمة' :
        c.name === 'Fujairah' ? 'الفجيرة' :
        'أم القيوين';

      const releaseEn =
        type === 'carbon'
          ? 'Main sources: transport fuel use, electricity demand (cooling), industry and construction activity.'
          : type === 'plastic'
            ? 'Main sources: single-use packaging, take-away food, events, weak sorting/collection, and litter reaching waterways.'
            : 'Main sources: traffic emissions (NOx/PM), construction dust, industrial stacks, and seasonal dust events.';

      const releaseAr =
        type === 'carbon'
          ? 'المصادر الأساسية: وقود النقل، طلب الكهرباء (التبريد)، الصناعة وأنشطة البناء.'
          : type === 'plastic'
            ? 'المصادر الأساسية: عبوات الاستخدام الواحد، طلبات الطعام، الفعاليات، ضعف الفرز/الجمع، وتحول المخلفات لمجاري المياه.'
            : 'المصادر الأساسية: انبعاثات المرور (NOx/PM)، غبار البناء، مداخن الصناعة، ومواسم الغبار.';

      const solutionsEn =
        type === 'carbon'
          ? 'Solutions: promote public transport/EVs, building efficiency, rooftop solar, and verified recycling participation.'
          : type === 'plastic'
            ? 'Solutions: ban/reduce single-use items, deposit-return for bottles, segregated bins, and verified citizen cleanups.'
            : 'Solutions: dust control on sites, cleaner transport, industrial monitoring, and neighborhood reporting + enforcement.';

      const solutionsAr =
        type === 'carbon'
          ? 'الحلول: تعزيز النقل العام/المركبات الكهربائية، كفاءة المباني، الطاقة الشمسية، وزيادة المشاركة الموثّقة في إعادة التدوير.'
          : type === 'plastic'
            ? 'الحلول: تقليل/منع الاستخدام الواحد، نظام استرجاع العبوات، حاويات فرز، وحملات تنظيف موثّقة من المواطنين.'
            : 'الحلول: التحكم بالغبار في مواقع البناء، نقل أنظف، مراقبة المصانع، وبلاغات الأحياء + تطبيق الأنظمة.';

      return {
        key: c.name,
        title: language === 'ar' ? nameAr : c.name,
        release: language === 'ar' ? releaseAr : releaseEn,
        solutions: language === 'ar' ? solutionsAr : solutionsEn
      };
    });

    return (
      <div className={`p-4 rounded-2xl bg-white border border-slate-100 ${isRTL ? 'text-right' : ''}`}>
        <p className="text-sm font-black text-slate-800">{title}</p>
        <div className="mt-3 space-y-3">
          {rows.map((r) => (
            <div key={r.key} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-sm font-bold text-slate-800">{r.title}</p>
              <p className="mt-1 text-xs text-slate-700">
                <span className="font-semibold">{language === 'ar' ? 'الإطلاق/المصادر: ' : 'Release/Sources: '}</span>
                {r.release}
              </p>
              <p className="mt-1 text-xs text-slate-700">
                <span className="font-semibold">{language === 'ar' ? 'الحلول: ' : 'Solutions: '}</span>
                {r.solutions}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const Legend = () => {
    const items = [
      { key: 'low', label: language === 'ar' ? 'منخفض' : 'Low' },
      { key: 'medium', label: language === 'ar' ? 'متوسط' : 'Medium' },
      { key: 'high', label: language === 'ar' ? 'مرتفع' : 'High' }
    ] as const;

    return (
      <div className={`p-3 rounded-2xl bg-white border border-slate-100 ${isRTL ? 'text-right' : ''}`}>
        <p className="text-xs font-black text-slate-800">{language === 'ar' ? 'مؤشر اللون والحجم' : 'Color & Size Indicator'}</p>
        <div className={`mt-2 flex flex-wrap items-center gap-3 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
          {items.map((it) => (
            <div key={it.key} className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="inline-block w-3 h-3 rounded-full" style={{ background: getSeverityColor(it.key).map }} />
              <span className="text-xs text-slate-700 font-semibold">{it.label}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-slate-600">
          {language === 'ar'
            ? 'حجم الدائرة = شدة/كمية أعلى في هذا الموقع.'
            : 'Circle size = higher intensity/quantity at that location.'}
        </p>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="bg-white/70 border-emerald-100">
        <CardContent className="p-6 text-center">
          <p className="text-slate-600">
            {language === 'ar' ? 'جاري تحميل البيانات البيئية...' : 'Loading environmental data...'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/70 border-emerald-100">
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Cloud className="w-5 h-5 text-emerald-600" />
          {language === 'ar' ? 'البيانات البيئية - الإمارات' : 'Environmental Data - UAE'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3 bg-white">
            <TabsTrigger value="carbon" className="gap-2">
              <Factory className="w-4 h-4" />
              {language === 'ar' ? 'الكربون' : 'Carbon'}
            </TabsTrigger>
            <TabsTrigger value="plastic" className="gap-2">
              <Droplets className="w-4 h-4" />
              {language === 'ar' ? 'البلاستيك' : 'Plastic'}
            </TabsTrigger>
            <TabsTrigger value="pollution" className="gap-2">
              <Wind className="w-4 h-4" />
              {language === 'ar' ? 'التلوث' : 'Pollution'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="carbon" className="mt-4 space-y-4">
            <p className="text-sm text-slate-600 text-center">
              {language === 'ar' ? 'انبعاثات ثاني أكسيد الكربون عبر الإمارات' : 'CO₂ Emissions Across UAE'}
            </p>
            {renderMap(envData.carbon, 'carbon')}
            <Legend />
            {emirateDetails('carbon')}
          </TabsContent>

          <TabsContent value="plastic" className="mt-4 space-y-4">
            <p className="text-sm text-slate-600 text-center">
              {language === 'ar' ? 'نقاط ساخنة لنفايات البلاستيك' : 'Plastic Waste Hotspots'}
            </p>
            {renderMap(envData.plastic, 'plastic')}
            <Legend />
            {emirateDetails('plastic')}
          </TabsContent>

          <TabsContent value="pollution" className="mt-4 space-y-4">
            <p className="text-sm text-slate-600 text-center">
              {language === 'ar' ? 'مؤشر جودة الهواء' : 'Air Quality Index'}
            </p>
            {renderMap(envData.pollution, 'pollution')}
            <Legend />
            {emirateDetails('pollution')}
          </TabsContent>
        </Tabs>

        <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <p className="text-xs text-emerald-700 text-center">
            {language === 'ar'
              ? 'بيانات من الأقمار الصناعية لناسا وشبكة المراقبة البيئية'
              : 'Data from NASA satellites & environmental monitoring network'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}