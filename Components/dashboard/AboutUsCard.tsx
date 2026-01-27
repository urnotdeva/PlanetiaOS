import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Info, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useApp } from '../context/AppContext';

export default function AboutUsCard() {
  const { t, isRTL } = useApp();
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setShake(true);
      setTimeout(() => setShake(false), 650);
    }, 8000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Link to={createPageUrl('AboutUs')}>
      <motion.div
        animate={shake ? { 
          x: [0, -10, 10, -10, 10, -6, 6, 0],
          rotate: [0, -3.5, 3.5, -3.5, 3.5, -2, 2, 0]
        } : {}}
        transition={{ duration: 0.65 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 shadow-lg"
      >
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-100">
              <Info className="w-6 h-6 text-indigo-600" />
            </div>
            <div className={isRTL ? 'text-right' : ''}>
              <h3 className="font-bold text-lg text-slate-800">
                {t('aboutUs')}
              </h3>
              <p className="text-sm text-indigo-600">
                {t('clickMe')}
              </p>
            </div>
          </div>

          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <ChevronRight className={`w-6 h-6 text-indigo-500 ${isRTL ? 'rotate-180' : ''}`} />
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-xl" />
        <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-gradient-to-tr from-purple-500/20 to-pink-500/20 blur-xl" />
      </motion.div>
    </Link>
  );
}