# planetiaOS — Critical Code Snippets (Onboarding + Judge Notes)
 
This file documents the **non-obvious engineering logic** that drives the app.
 
---
 
## 1) App Bootstrap & Navigation
 
### File: `main.tsx`
**Purpose:** App entry point; sets up routing, React Query caching, Leaflet CSS, and service worker behavior.
 
```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import 'leaflet/dist/leaflet.css';
 
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if ((import.meta as any).env?.PROD) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
      return;
    }
 
    // Dev: avoid SW interfering with Vite HMR
    navigator.serviceWorker.getRegistrations()
      .then((regs) => regs.forEach((r) => r.unregister().catch(() => {})))
      .catch(() => {});
  });
}
 
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } }
});
 
function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/Dashboard" replace />} />
          <Route path="/Dashboard" element={<Dashboard />} />
          <Route path="/MyCity" element={<MyCity />} />
          <Route path="/FloodMap" element={<FloodMap />} />
          <Route path="/MyReward" element={<MyReward />} />
          <Route path="/FarmerDashboard" element={<FarmerDashboard />} />
          <Route path="/Tickets" element={<Tickets />} />
          <Route path="/DiscountTickets" element={<DiscountTickets />} />
          <Route path="/AboutUs" element={<AboutUs />} />
          <Route path="*" element={<Navigate to="/Dashboard" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
 
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
```
 
**Explanation:**
- **Route handling:** React Router maps each “page” to a URL.
- **Caching/optimization:** React Query is configured to avoid constant refetching on tab focus.
- **Map readiness:** Leaflet CSS is imported at bootstrap.
- **Production SW:** Registers `/sw.js` only in production to provide an offline shell.
 
---
 
### File: `utils.ts`
**Purpose:** Single source of truth for building page URLs.
 
```ts
export function createPageUrl(page: string): string {
  return `/${String(page).trim()}`;
}
```
 
**Explanation:** Prevents hard-coded slashes and inconsistent paths when building links.
 
---
 
## 2) Global State, Language, RTL
 
### File: `Components/context/AppContext.tsx`
**Purpose:** Global state for language (EN/AR), RTL direction, user category (Citizen/Farmer), and the welcome-video gating.
 
```tsx
const [language, setLanguage] = useState(initialPrefs?.language || 'en');
const [category, setCategory] = useState(initialPrefs?.category || null); // 'citizen' or 'farmer'
const [hasSeenVideo, setHasSeenVideo] = useState(!!initialPrefs?.hasSeenVideo);
 
useEffect(() => {
  localStorage.setItem('planetiaOS_prefs', JSON.stringify({
    language, category, showWelcome, hasSeenVideo
  }));
 
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
}, [language, category, showWelcome, hasSeenVideo]);
 
const t = (key) => translations[language]?.[key] || translations.en[key] || key;
```
 
**Explanation:**
- Saves UI prefs in `localStorage` so refresh keeps language + category.
- Sets `document.documentElement.dir` for RTL layout to cascade into the entire UI.
- `t(key)` is a lightweight i18n layer used across pages/components.
 
---
 
## 3) Authentication System (Project-Actual Implementation)
 
### File: `api/base44Client.ts`
**Purpose:** Provides the app’s “auth/session” abstraction and the CRUD API used across all features.
 
```ts
const auth = {
  async me() {
    const stored = safeJsonParse<{ email?: string }>(localStorage.getItem('planetiaOS_user'));
    return stored?.email ? { email: stored.email } : { email: 'demo@planetiaos.local' };
  },
  logout() {
    localStorage.removeItem('planetiaOS_user');
  }
};
```
 
**Explanation:**
- This app uses a **local-session model** stored in `localStorage` (key: `planetiaOS_user`).
- `auth.me()` is used in queries/mutations to link data to a user email.
- `logout()` clears the local session.
 
> Note: This repo does **not** contain Firebase/Supabase code. `base44.auth` is the authoritative auth layer in this project.
 
---
 
## 4) Data Fetching + Caching + Error Handling
 
### File: `api/base44Client.ts`
**Purpose:** Unified fetch helper with timeout, retry, and local cache (stale-on-error).
 
```ts
async function fetchWithRetry<T>(url: string, cfg: Base44Config, opts: FetchWithRetryOptions = {}): Promise<T> {
  const timeoutMs = opts.timeoutMs ?? cfg.requestTimeoutMs ?? 15000;
  const retries = opts.retries ?? cfg.maxRetries ?? 2;
 
  const cached = opts.cacheKey ? getCache<T>(opts.cacheKey) : null;
  const cacheIsFresh = cached ? nowMs() - cached.storedAt <= (opts.cacheTtlMs ?? 5 * 60 * 1000) : false;
  if (cached && cacheIsFresh) return cached.value;
 
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
 
    try {
      const res = await fetch(url, {
        method: opts.method ?? 'GET',
        headers: { api_key: cfg.apiKey, 'Content-Type': 'application/json', ...(opts.headers ?? {}) },
        body: opts.body ? JSON.stringify(opts.body) : undefined,
        signal: controller.signal
      });
 
      if (!res.ok) throw new Error(`Base44 HTTP ${res.status}: ${await res.text()}`);
      const data = (await res.json()) as T;
      if (opts.cacheKey) setCache(opts.cacheKey, data);
      return data;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await sleep((opts.retryDelayMs ?? 600) * (attempt + 1));
    } finally {
      clearTimeout(timer);
    }
  }
 
  if (cached && (opts.allowStaleCacheOnError ?? true)) return cached.value;
  throw lastErr;
}
```
 
**Explanation:**
- Prevents UX hangs via `AbortController` timeout.
- Retries transient failures.
- Uses `localStorage` caching for entity lists/filters.
- Can return stale cached data during outages (better UX).
 
---
 
## 5) Navigation UI + Role Switching (Citizen/Farmer)
 
### File: `Components/dashboard/TopBar.tsx`
**Purpose:** Top navigation with language toggle, category switch, logout, and a “reset app” tool for judges.
 
```tsx
const handleReset = async () => {
  const ok = window.confirm(language === 'ar' ? 'هل تريد إعادة ضبط التطبيق؟' : 'Reset the app and start over?');
  if (!ok) return;
 
  try { localStorage.clear(); } catch {}
  try { sessionStorage.clear(); } catch {}
 
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {}
 
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch {}
 
  window.location.reload();
};
 
const handleLogout = () => {
  base44.auth.logout();
};
```
 
**Explanation:**
- `handleReset()` clears all persisted state + SW caches so demos can start fresh.
- `handleLogout()` uses the project auth abstraction.
 
---
 
### File: `Components/dashboard/BottomNav.tsx`
**Purpose:** Bottom nav that changes based on user category.
 
```tsx
const items = category === 'farmer' ? farmerItems : citizenItems;
 
{items.map((item) => (
  <Link key={item.id} to={createPageUrl(item.page)}>
    ...
  </Link>
))}
```
 
**Explanation:**
- The app is a single build with two “modes”.
- Category selection is stored in `AppContext` + `localStorage`.
 
---
 
## 6) Welcome Video Gate (First-run UX)
 
### File: `Components/common/WelcomePopup.tsx`
**Purpose:** Enforces onboarding video and supports mobile-safe playback.
 
```tsx
const introVideoUrl = useMemo(() => {
  const configured = (import.meta as any)?.env?.VITE_INTRO_VIDEO_URL;
  if (typeof configured === 'string' && configured.trim()) return configured.trim();
  return 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
}, []);
 
useEffect(() => {
  if (!isPlaying) {
    videoRef.current?.pause();
    if (videoRef.current) videoRef.current.currentTime = 0;
    return;
  }
  videoRef.current?.play().catch(() => {});
}, [isPlaying]);
 
<video
  ref={videoRef}
  src={introVideoUrl}
  controls
  playsInline
  muted
  autoPlay
  onEnded={handleVideoEnd}
/>
```
 
**Explanation:**
- Uses `playsInline` + `muted` to avoid mobile autoplay restrictions.
- Pulls video URL from env if present.
- Resets video on close for predictable demo behavior.
 
---
 
## 7) Map Engine (OpenStreetMap / Leaflet)
 
### File: `Pages/FloodMap.tsx`
**Purpose:** Flood reporting map + markers from stored flood reports.
 
```tsx
<MapContainer center={center} zoom={7} className="h-full w-full">
  <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
  <MapClickSetter onPick={(lat, lng) => setPicked({ lat, lng })} />
 
  {reports
    .filter((r) => Number.isFinite(Number(r?.location?.lat)) && Number.isFinite(Number(r?.location?.lng)))
    .map((r, idx) => (
      <Marker
        key={r.id ?? `${idx}`}
        position={[Number(r.location.lat), Number(r.location.lng)]}
        icon={markerForSeverity(r.severity)}
      >
        <Popup>...</Popup>
      </Marker>
    ))}
</MapContainer>
```
 
**Explanation:**
- OpenStreetMap base tiles.
- Click-to-pick for report location.
- Stored reports render as markers with severity-based icons.
 
---
 
### File: `Pages/FarmerDashboard.tsx`
**Purpose:** Farmer map with selectable layers + environmental overlays.
 
```tsx
const baseTiles = useMemo(() => {
  if (mapLayer === 'streets') {
    return { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' };
  }
  return {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
  };
}, [mapLayer]);
 
const mapOverlay = useMemo(() => {
  if (mapLayer === 'ndvi') {
    return {
      url: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI_8Day/default/${gibsNdvi8DayDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png`,
      opacity: 0.88,
      className: 'planetia-overlay planetia-overlay-ndvi'
    };
  }
  return null;
}, [gibsNdvi8DayDate, mapLayer]);
```
 
**Explanation:**
- Lets farmers toggle between street/satellite and NDVI/LST overlays.
- Uses NASA GIBS WMTS tiles for satellite-derived products.
 
---
 
## 8) Flood Report Ingestion (Citizen Flow)
 
### File: `Pages/FloodMap.tsx`
**Purpose:** Submit a flood report with severity + optional photo.
 
```tsx
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
      location: { lat: picked?.lat, lng: picked?.lng, city, address },
      severity,
      description,
      date_reported: new Date().toISOString().slice(0, 10),
      verified: false,
      source: 'user'
    };
 
    await base44.entities.FloodReport.create(payload as any);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['floodReports'] });
  }
});
```
 
**Explanation:**
- Uploads photo first, then stores the report (atomic-ish user flow).
- React Query invalidation refreshes the map markers.
- `verified` is stored for future cross-validation.
 
---
 
## 9) Clean City Contribution Logic (AI + Points)
 
### File: `Pages/MyCity.tsx`
**Purpose:** Image-based citizen contribution with AI analysis + point allocation + persistence.
 
```tsx
const raw = await base44.integrations.Core.InvokeLLM({
  prompt: `Analyze this image for trash/recycling disposal... Respond with JSON.`,
  file_urls: [file_url],
  response_json_schema: {
    type: "object",
    properties: {
      properly_disposed: { type: "boolean" },
      items_count: { type: "number" },
      item_types: { type: "array", items: { type: "string" } },
      feedback: { type: "string" },
      points_awarded: { type: "number" }
    }
  }
});
 
const unwrapped: any = (raw && typeof raw === 'object' && 'result' in (raw as any)) ? (raw as any).result : raw;
const result: any = (unwrapped && typeof unwrapped === 'object') ? unwrapped : { feedback: String(unwrapped ?? '') };
 
let points = 0;
if (result?.properly_disposed) {
  const count = Number(result?.items_count || 1);
  const safeCount = Number.isFinite(count) ? Math.max(1, Math.floor(count)) : 1;
  points = Math.min(5, safeCount);
}
 
await base44.entities.TrashReport.create({
  user_email: user.email,
  image_url: file_url,
  location: location || {},
  items_count: result?.items_count,
  points_earned: points,
  status: result?.properly_disposed ? 'approved' : 'rejected',
  ai_analysis: result?.feedback
});
```
 
**Explanation:**
- Treats AI output as untrusted: unwraps safely and coerces to an object.
- Converts item count into capped points (0–5) to prevent abuse.
- Persists both the report and the AI reasoning text.
 
---
 
## 10) Farmer Dashboard Logic (Satellite + Risk + Recommendations)
 
### File: `Pages/FarmerDashboard.tsx`
**Purpose:** Generate a farm report from an uploaded field image, then suggest actions.
 
```tsx
const createReportMutation = useMutation({
  mutationFn: async (file: File) => {
    const uploaded = await base44.integrations.Core.UploadFile({ file });
    const image_url = uploaded.file_url;
 
    const ndvi = Number((0.4 + Math.random() * 0.55).toFixed(2));
    const water = Math.floor(55 + Math.random() * 40);
    const sandstorm = ndvi >= 0.75 ? 'none' : ndvi >= 0.6 ? 'low' : ndvi >= 0.5 ? 'medium' : 'high';
 
    const payload: FarmReportRow = {
      user_email: me.email,
      image_url,
      location: { lat: picked?.lat, lng: picked?.lng, farm_name: farmName || 'My Farm', emirate: emirate || 'UAE' },
      crop_type: cropType || 'Mixed crops',
      ndvi_score: ndvi,
      water_efficiency: water,
      sandstorm_risk: sandstorm,
      date_analyzed: new Date().toISOString().slice(0, 10)
    };
 
    await base44.entities.FarmReport.create(payload as any);
    return payload;
  },
  onSuccess: (payload) => {
    setLatestAnalysis(payload ?? null);
    setActiveTab('upload');
  }
});
```
 
**Explanation:**
- This is a **mocked NASA-style pipeline** (deterministic structure, randomized values) suitable for demos.
- Stores farm reports by user email so history can be shown.
 
---
 
### File: `Pages/FarmerDashboard.tsx`
**Purpose:** Rule-based recommendation engine (AI decision layer).
 
```tsx
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
```
 
**Explanation:**
- This is the sustainability decision layer: **simple, explainable rules**.
- Designed for judges: deterministic, auditable, bilingual recommendations.
 
---
 
## 11) Map Intelligence: Reverse Geocoding + Open‑Meteo Overlay
 
### File: `Pages/FarmerDashboard.tsx`
**Purpose:** Convert map clicks into a human-readable farm/emirate and fetch weather signals.
 
```tsx
const handlePick = useCallback(async (lat: number, lng: number) => {
  setPicked({ lat, lng });
 
  if (geocodeAbortRef.current) geocodeAbortRef.current.abort();
  const controller = new AbortController();
  geocodeAbortRef.current = controller;
 
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}&zoom=14&addressdetails=1`;
  const res = await fetch(url, { signal: controller.signal, headers: { 'Accept': 'application/json' } });
  const json: any = await res.json();
 
  const addr = json?.address || {};
  const place = addr?.farm || addr?.building || addr?.neighbourhood || addr?.village || addr?.town || addr?.city || '';
  const region = addr?.state || addr?.region || addr?.city || '';
 
  if (place) setFarmName(String(place));
  if (region) setEmirate(String(region));
}, []);
```
 
**Explanation:**
- Uses `AbortController` to avoid race conditions when users click multiple times.
- Nominatim reverse geocoding fills the farm metadata.
 
---
 
## 12) Charts & Analytics (Before vs After, Responsive)
 
### File: `Pages/AboutUS.tsx`
**Purpose:** Manual (no-chart-library) responsive bar chart that supports RTL.
 
```tsx
<div
  className="absolute inset-0 px-3 sm:px-6 pt-3 sm:pt-4 pb-8 sm:pb-10 grid grid-cols-4 gap-2 sm:gap-6 items-end"
  style={{ direction: isRTL ? 'rtl' : 'ltr' }}
>
  {impactRows.map((row) => {
    const beforeV = Math.max(0, Math.min(100, Number(row.before)));
    const afterV = Math.max(0, Math.min(100, Number(row.after)));
 
    return (
      <div key={row.key} className="min-w-0 flex flex-col items-center justify-end">
        <div className="w-full flex items-end justify-center gap-2">
          <div className="flex-1 flex flex-col items-center">
            <div className="relative w-3/4 sm:w-2/3 mx-auto h-36 sm:h-52 rounded bg-slate-200/40 overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0" style={{ height: `${beforeV}%`, backgroundColor: '#94a3b8' }} />
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <div className="relative w-3/4 sm:w-2/3 mx-auto h-36 sm:h-52 rounded bg-slate-200/40 overflow-hidden">
              <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-r ${row.afterColor}`} style={{ height: `${afterV}%` }} />
            </div>
          </div>
        </div>
      </div>
    );
  })}
</div>
```
 
**Explanation:**
- Uses CSS grid to keep everything inside 420px without horizontal scrolling.
- `direction` controls RTL ordering without flipping numerical meaning.
- Bars are height-percentage-based (data-driven), with responsive container heights.
 
---
 
## 13) Notifications & Alerts (Project-Actual Implementation)
 
### File: `public/sw.js`
**Purpose:** Offline shell caching for installability; not push notifications.
 
```js
const CACHE_NAME = 'planetiaos-shell-v1';
 
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(['/'])).catch(() => {}));
  self.skipWaiting();
});
 
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone)).catch(() => {});
          return res;
        })
        .catch(() => cached || caches.match('/'));
    })
  );
});
```
 
**Explanation:**
- Provides offline-first caching for GET requests.
- This project does **not** include FCM/push notifications.
 
---
 
## 14) Responsive Design Fixes (Mobile-first, 420×856)
 
### File: `Layout.tsx`
**Purpose:** Global overflow prevention + responsive media handling.
 
```tsx
<style>{`
  html, body { max-width: 100vw; overflow-x: hidden; }
  #root { max-width: 100vw; overflow-x: hidden; }
  img, video, canvas, svg { max-width: 100%; height: auto; }
  .leaflet-container { z-index: 1; max-width: 100%; }
`}</style>
```
 
**Explanation:**
- Stops horizontal scrolling caused by nested cards, maps, and charts.
- Ensures media never exceeds container width.
 
---
 
### File: `Pages/FloodMap.tsx` and `Components/flood/EnvironmentalDataTabs.tsx`
**Purpose:** Responsive map heights in viewport units.
 
```tsx
<div className="rounded-2xl overflow-hidden shadow-2xl h-[50vh] max-h-[28rem] min-h-[18rem] ...">
  <MapContainer ... />
</div>
```
 
**Explanation:** Prevents fixed-pixel map heights from breaking on small phones.
 
---
 
## 15) Data Security & Config
 
### File: `.env`
**Purpose:** Local environment configuration for external APIs.
 
```env
VITE_OPENWEATHERMAP_API_KEY=...
```
 
**Explanation:**
- Frontend env vars are embedded at build time via Vite.
 
### File: `vite.config.ts`
**Purpose:** Project-wide import aliases (prevents brittle relative imports).
 
```ts
resolve: {
  alias: [
    { find: '@', replacement: rootPath },
    { find: '@/components', replacement: `${rootPath}/Components` },
    { find: '@/api', replacement: `${rootPath}/api` },
    { find: '@/utils', replacement: `${rootPath}/utils.ts` }
  ]
}
```
 
**Explanation:** Keeps imports stable as the app grows.
 
### File: `api/base44Client.ts` (Security note)
**Purpose:** Config object for Base44.
 
```ts
const defaultConfig: Base44Config = {
  appId: '...',
  apiKey: '...',
  baseUrl: 'https://app.base44.com/api/apps'
};
```
 
**Explanation:**
- This repo currently contains a hardcoded API key. For production, this should be moved to `VITE_BASE44_API_KEY` and rotated.
 
---
 
## 16) Cross-Feature History Aggregation
 
### File: `Components/dashboard/UserHistory.tsx`
**Purpose:** Unified timeline across trash + flood reports.
 
```tsx
const { data: reports } = useQuery({
  queryKey: ['allUserReports'],
  queryFn: async () => {
    const user = await base44.auth.me();
    const trash = await base44.entities.TrashReport.filter({ user_email: user.email }, '-created_date', 20);
    const flood = await base44.entities.FloodReport.filter({ user_email: user.email }, '-created_date', 20);
    return { trash: trash || [], flood: flood || [] };
  },
  initialData: { trash: [], flood: [] }
});
 
const allReports = [
  ...reports.trash.map(r => ({ ...r, type: 'trash', icon: '♻️' })),
  ...reports.flood.map(r => ({ ...r, type: 'flood', icon: '🌊' }))
].sort((a, b) => new Date(b.created_date as any).getTime() - new Date(a.created_date as any).getTime());
```
 
**Explanation:**
- A single timeline makes the demo “feel complete”.
- Sorting uses `created_date` from the backend.
 
---
 
## 17) Reward / Points Redeem (Transactional UX)
 
### File: `Pages/Tickets.tsx`
**Purpose:** Redeem points into vouchers with optimistic UI and persistence.
 
```tsx
const redeemMutation = useMutation({
  mutationFn: async (voucher: any) => {
    const user = await base44.auth.me();
    const progress = await base44.entities.UserProgress.filter({ user_email: user.email });
    const current = progress[0];
 
    const currentPoints = Number(current?.total_points ?? 0);
    if (currentPoints < voucher.points) throw new Error('Not enough points');
 
    const nextPoints = currentPoints - voucher.points;
    const nextVouchers = Number(current?.vouchers_earned ?? 0) + 1;
 
    if (current?.id) {
      await base44.entities.UserProgress.update(current.id, { total_points: nextPoints, vouchers_earned: nextVouchers });
    } else {
      await base44.entities.UserProgress.create({ user_email: user.email, total_points: nextPoints, vouchers_earned: nextVouchers });
    }
 
    const redeemed = { ...voucher, redeemedAt: new Date().toISOString() };
    localStorage.setItem(`planetiaOS_redeemed_vouchers:${user.email}`, JSON.stringify([redeemed]));
    return redeemed;
  },
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userProgress'] })
});
```
 
**Explanation:**
- Validates points before mutation.
- Updates progress entity to reflect redemption.
- Stores redeemed tickets locally for fast UI.
 
---