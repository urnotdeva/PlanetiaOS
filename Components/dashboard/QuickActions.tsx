import React from 'react';
import { motion } from 'framer-motion';
import { Building2, MapPin, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useApp } from '../context/AppContext';

export default function QuickActions() {
  const { t, isRTL } = useApp();

  const actions = [
    {
      id: 'city',
      label: t('myCity'),
      icon: Building2,
      gradient: 'from-emerald-400 to-teal-500',
      shadowColor: 'shadow-emerald-500/30',
      page: 'MyCity'
    },
    {
      id: 'flood',
      label: t('floodMap'),
      icon: MapPin,
      gradient: 'from-sky-400 to-blue-500',
      shadowColor: 'shadow-sky-500/30',
      page: 'FloodMap'
    },
    {
      id: 'reward',
      label: t('myReward'),
      icon: Gift,
      gradient: 'from-amber-400 to-orange-500',
      shadowColor: 'shadow-amber-500/30',
      page: 'MyReward'
    }
  ];

  return (
    <div className={`flex justify-center gap-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
      {actions.map((action, index) => (
        <Link key={action.id} to={createPageUrl(action.page)}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center"
          >
            <div className={`relative mb-2`}>
              {/* Glow */}
              <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${action.gradient} blur-lg opacity-40`} />
              
              {/* Button */}
              <div className={`relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-r ${action.gradient} ${action.shadowColor} shadow-lg flex items-center justify-center`}>
                <action.icon className="w-7 h-7 md:w-9 md:h-9 text-white" />
              </div>
            </div>
            
            <span className="text-sm font-medium text-slate-700">
              {action.label}
            </span>
          </motion.div>
        </Link>
      ))}
    </div>
  );
}