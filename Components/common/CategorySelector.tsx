import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Users, Tractor, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function CategorySelector() {
  const { t, setCategory, isRTL } = useApp();

  const categories = [
    {
      id: 'citizen',
      label: t('citizens'),
      icon: Users,
      gradient: 'from-sky-400 to-blue-500',
      shadowColor: 'shadow-sky-500/30',
      description: 'Track waste, report floods, earn rewards'
    },
    {
      id: 'farmer',
      label: t('farmers'),
      icon: Tractor,
      gradient: 'from-amber-400 to-orange-500',
      shadowColor: 'shadow-amber-500/30',
      description: 'Monitor crops, get AI insights'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-emerald-50 via-sky-50 to-amber-50">
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-emerald-400/30"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight,
              scale: Math.random() * 0.5 + 0.5
            }}
            animate={{ 
              y: [null, Math.random() * -100 - 50],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: Math.random() * 3 + 2, 
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>

      {/* Logo */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", duration: 1 }}
        className="mb-8"
      >
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-amber-400 flex items-center justify-center shadow-xl"
          >
            <div className="w-20 h-20 rounded-full flex items-center justify-center bg-white">
              <Leaf className="w-10 h-10 text-emerald-500" />
            </div>
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-1 -right-1"
          >
            <Sparkles className="w-6 h-6 text-amber-400" />
          </motion.div>
        </div>
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold mb-2 text-slate-800">
          planetiaOS
        </h1>
        <p className="text-xl text-slate-600">
          {t('chooseCategory')}
        </p>
      </motion.div>

      {/* Category Buttons */}
      <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-8 md:gap-16`}>
        {categories.map((cat, index) => (
          <motion.button
            key={cat.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.2 }}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCategory(cat.id)}
            className="flex flex-col items-center group"
          >
            <div className={`relative mb-4`}>
              {/* Glow effect */}
              <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${cat.gradient} blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300`} />
              
              {/* Main button */}
              <div className={`relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-r ${cat.gradient} ${cat.shadowColor} shadow-xl flex items-center justify-center transition-all duration-300`}>
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-full flex items-center justify-center bg-white">
                  <cat.icon className={`w-14 h-14 md:w-18 md:h-18 bg-gradient-to-r ${cat.gradient} bg-clip-text`} 
                    style={{ 
                      color: cat.id === 'citizen' ? '#0EA5E9' : '#F59E0B'
                    }} 
                  />
                </div>
              </div>
              
              {/* Ring animation */}
              <motion.div
                className={`absolute inset-0 rounded-full border-4 border-transparent bg-gradient-to-r ${cat.gradient} opacity-20`}
                style={{ backgroundClip: 'border-box' }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0, 0.2] }}
                transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
              />
            </div>
            
            <span className="text-xl md:text-2xl font-bold text-slate-800">
              {cat.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}