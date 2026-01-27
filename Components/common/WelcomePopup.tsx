import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Play, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '../context/AppContext';

export default function WelcomePopup() {
  const { t, language, toggleLanguage, setShowWelcome, setHasSeenVideo, isRTL } = useApp();
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const introVideoUrl = useMemo(() => {
    const configured = (import.meta as any)?.env?.VITE_INTRO_VIDEO_URL;
    if (typeof configured === 'string' && configured.trim()) return configured.trim();
    return 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
  }, []);

  // Auto close after video ends or after skip
  const handleClose = () => {
    setHasSeenVideo(true);
    setShowWelcome(false);
  };

  const handleVideoEnd = () => {
    handleClose();
  };

  useEffect(() => {
    if (!isPlaying) {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
      return;
    }

    const v = videoRef.current;
    if (!v) return;

    const tryPlay = async () => {
      try {
        await v.play();
      } catch {
        // Mobile browsers may block autoplay unless muted/gesture; controls remain available.
      }
    };

    tryPlay();
  }, [isPlaying]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl rounded-[28px] overflow-hidden shadow-2xl bg-gradient-to-br from-emerald-50 via-white to-sky-50 border border-emerald-100"
        >
          {/* Close Bar */}
          <div className={`flex items-center justify-between px-6 py-4 border-b border-emerald-100 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="w-10 h-10 rounded-full bg-white border border-emerald-100 overflow-hidden shadow-sm">
                <img
                  src="/icons/icon-512.png"
                  alt="PlanetiaOS"
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </div>
              <span className="font-bold text-xl text-slate-800">
                PlanetiaOS
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="rounded-full hover:bg-emerald-100"
            >
              <X className="w-5 h-5 text-slate-600" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Title */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-slate-800">
                {t('welcomeTitle')}
              </h1>
              <p className="text-lg text-slate-600">
                {t('welcomeSubtitle')}
              </p>
            </div>

            {/* Language & Theme Toggle */}
            <div className="flex justify-center gap-4">
              <Button
                onClick={toggleLanguage}
                variant="outline"
                className="rounded-full px-6 gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                <Globe className="w-4 h-4" />
                {language === 'en' ? 'العربية' : 'English'}
              </Button>
            </div>

            {/* Video Section */}
            <div className="relative rounded-2xl overflow-hidden shadow-lg aspect-video bg-black">
              {!isPlaying ? (
                <div
                  className="absolute inset-0 flex items-center justify-center cursor-pointer group"
                  onClick={() => setIsPlaying(true)}
                >
                  <img
                    src="https://images.unsplash.com/photo-1569163139599-0f4517e36f51?w=800&q=80"
                    alt="Video thumbnail"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative z-10 w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-xl"
                  >
                    <Play className={`w-8 h-8 text-emerald-600 ${isRTL ? 'mr-1' : 'ml-1'}`} />
                  </motion.div>
                  <span className={`absolute bottom-4 text-white font-medium z-10 ${isRTL ? 'right-4 text-right' : 'left-4'}`}>
                    {t('watchVideo')}
                  </span>
                </div>
              ) : (
                <div className="absolute inset-0">
                  <video
                    ref={videoRef}
                    src={introVideoUrl}
                    className="w-full h-full object-cover"
                    controls
                    playsInline
                    muted
                    autoPlay
                    onEnded={handleVideoEnd}
                  />

                  <div className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'}`}>
                    <Button
                      onClick={handleClose}
                      variant="outline"
                      className="rounded-full border-white/40 text-white hover:bg-green-100/20 bg-black/30"
                    >
                      {t('skipVideo')}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Credits */}
            <p className="text-center text-sm text-slate-500">
              {t('createdBy')}
            </p>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              {isPlaying && (
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="rounded-full px-6 py-6 gap-2 border-slate-300 text-slate-600 hover:bg-green-100"
                >
                  <SkipForward className="w-5 h-5" />
                  {t('skipVideo')}
                </Button>
              )}
              <Button
                onClick={handleClose}
                className="rounded-full px-8 py-6 text-lg font-semibold bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600 text-white shadow-lg"
              >
                {isPlaying ? t('closePopup') : t('skipVideo')}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}