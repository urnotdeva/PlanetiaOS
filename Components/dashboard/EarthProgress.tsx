import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';

export default function EarthProgress({ totalProgress = 45, userProgress = 12, remainingTrash = 2500 }) {
  const { language, isRTL } = useApp();
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const clamped = Math.max(0, Math.min(100, Number(totalProgress || 0)));
    const timer = setTimeout(() => setAnimatedProgress(clamped), 250);
    return () => clearTimeout(timer);
  }, [totalProgress]);

  const emotion = (() => {
    if (animatedProgress < 50) return { eyes: '• •', mouth: '︵', cheek: 'sad' };
    if (animatedProgress < 60) return { eyes: '• •', mouth: '—', cheek: 'neutral' };
    if (animatedProgress < 75) return { eyes: '• •', mouth: 'ᴗ', cheek: 'happy' };
    return { eyes: '• •', mouth: 'ᴖ', cheek: 'very-happy' };
  })();

  const stats = {
    title: language === 'ar' ? 'تقدم الإمارات' : 'UAE Progress',
    individual: language === 'ar' ? 'فردي' : 'individual',
    community: language === 'ar' ? 'مجتمعي' : 'community',
    remaining: language === 'ar' ? 'المتبقي' : 'remaining'
  };

  const formatCompact = (n: number) => {
    const v = Number(n || 0);
    if (v >= 1000000) return `${Math.round(v / 100000) / 10}M`;
    if (v >= 1000) return `${Math.round(v / 100) / 10}K`;
    return `${Math.round(v)}`;
  };

  return (
    <div className="relative overflow-hidden rounded-3xl shadow-2xl border border-indigo-200 bg-gradient-to-br from-indigo-700 via-blue-700 to-indigo-600">
      <div className="absolute inset-0 opacity-70">
        {[...Array(26)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-[3px] h-[3px] rounded-full bg-white"
            style={{
              top: `${(i * 37) % 100}%`,
              left: `${(i * 61) % 100}%`
            }}
            animate={{ opacity: [0.15, 0.9, 0.15] }}
            transition={{ duration: 1.6 + (i % 5) * 0.35, repeat: Infinity, delay: (i % 7) * 0.2 }}
          />
        ))}
      </div>

      <div className={`relative z-10 flex items-stretch ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className="w-[140px] sm:w-[160px] flex items-center justify-center p-4">
          <motion.div
            className="relative"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <div className="relative w-[110px] h-[110px] sm:w-[120px] sm:h-[120px] rounded-full bg-gradient-to-br from-sky-300 via-emerald-300 to-green-400 shadow-[0_0_30px_rgba(0,255,200,0.35)] overflow-hidden">
              <div className="absolute top-[18%] left-[10%] w-[44%] h-[28%] rounded-full bg-emerald-600/60" />
              <div className="absolute top-[48%] left-[48%] w-[42%] h-[32%] rounded-full bg-emerald-700/55" />
              <div className="absolute top-[26%] left-[56%] w-[12%] h-[9%] rounded bg-red-500/85 rotate-[-10deg]" />
              <div className="absolute top-[32%] left-[54%] w-[10%] h-[7%] rounded bg-amber-400/85 rotate-[-10deg]" />

              <div className="absolute top-[36%] left-[26%] text-[14px] font-black text-black/80 whitespace-pre">
                {emotion.eyes}
              </div>
              <div className="absolute top-[56%] left-[44%] -translate-x-1/2 text-[18px] font-black text-black/75">
                {emotion.mouth}
              </div>
              <div className="absolute top-[51%] left-[22%] w-2 h-2 rounded-full bg-pink-300/70" />
              <div className="absolute top-[51%] left-[62%] w-2 h-2 rounded-full bg-pink-300/70" />

              <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/35 blur-sm" />
            </div>
          </motion.div>
        </div>

        <div className="flex-1 px-4 sm:px-6 py-5">
          <div className={`text-white font-bold text-lg ${isRTL ? 'text-right' : ''}`}>{stats.title}</div>

          <div className={`mt-3 grid grid-cols-3 gap-3 text-white/90 ${isRTL ? 'text-right' : ''}`}>
            <div>
              <div className="text-[11px] uppercase tracking-wide opacity-90">{stats.individual}</div>
              <div className="text-sm font-extrabold">{formatCompact(Number(userProgress))}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide opacity-90">{stats.community}</div>
              <div className="text-sm font-extrabold">{formatCompact(Math.round(Number(userProgress) + Number(totalProgress) * 10))}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide opacity-90">{stats.remaining}</div>
              <div className="text-sm font-extrabold">{formatCompact(Number(remainingTrash))}{language === 'ar' ? 'كجم' : 'kg'}</div>
            </div>
          </div>

          <div className="mt-4">
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="text-white/90 text-sm font-semibold">{language === 'ar' ? 'التقدم' : 'progress'}</div>
              <div className="flex-1">
                <div className="h-3 rounded-full bg-white/25 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-white"
                    initial={{ width: '0%' }}
                    animate={{ width: `${animatedProgress}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                  />
                </div>
              </div>
              <div className="text-white/90 text-sm font-bold">{animatedProgress}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}