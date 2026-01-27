import React from 'react';

type LayoutProps = {
  children: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        :root {
          --primary: 16 185 129;
          --primary-foreground: 255 255 255;
          --secondary: 14 165 233;
          --accent: 245 158 11;
        }

        * {
          transition: all 0.3s ease;
        }

        *:hover {
          transition: all 0.2s ease;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.3); }
          50% { box-shadow: 0 0 40px rgba(16, 185, 129, 0.6); }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        /* RTL Support */
        [dir="rtl"] {
          font-family: 'Segoe UI', 'Tahoma', 'Arial', sans-serif;
        }

        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.3);
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.5);
        }

        /* Fix leaflet map z-index issues */
        .leaflet-container {
          z-index: 1;
        }

        /* Slightly bolder default borders across the app (do not override border-2/4 utilities) */
        [class~="border"]:not([class*="border-2"]):not([class*="border-4"]):not([class*="border-8"]) {
          border-width: 1.5px;
        }

        .planetia-overlay {
          mix-blend-mode: multiply;
          filter: saturate(1.35) contrast(1.15);
        }

        .planetia-overlay-ndvi {
          mix-blend-mode: color;
          filter: saturate(1.6) contrast(1.25);
        }

        .planetia-overlay-lst {
          mix-blend-mode: screen;
          filter: saturate(1.3) contrast(1.15);
        }

        .planetia-overlay-radar {
          mix-blend-mode: normal;
          filter: saturate(1.4) contrast(1.2);
        }

        .planetia-overlay-soil {
          mix-blend-mode: color;
          filter: saturate(1.35) contrast(1.15);
        }

        .planetia-overlay-wind {
          mix-blend-mode: screen;
          filter: saturate(1.35) contrast(1.15);
        }

        .planetia-overlay-precip {
          mix-blend-mode: multiply;
          filter: saturate(1.35) contrast(1.15);
        }
      `}</style>
      {children}
    </div>
  );
}
