import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import 'leaflet/dist/leaflet.css';

import Layout from './Layout';

import Dashboard from './Pages/Dashboard';
import MyCity from './Pages/MyCity';
import FloodMap from './Pages/FloodMap';
import MyReward from './Pages/MyReward';
import FarmerDashboard from './Pages/FarmerDashboard';
import Tickets from './Pages/Tickets';
import DiscountTickets from './Pages/DiscountTickets';
import AboutUs from './Pages/AboutUS';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if ((import.meta as any).env?.PROD) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // ignore
      });
      return;
    }

    // Dev: service worker can interfere with Vite HMR; ensure it is not controlling the page
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister().catch(() => {}));
    }).catch(() => {});
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
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
