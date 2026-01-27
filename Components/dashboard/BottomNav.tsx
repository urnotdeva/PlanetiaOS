import React from 'react';
import { motion } from 'framer-motion';
import { Building2, MapPin, Gift, TicketPercent, Tractor } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useApp } from '../context/AppContext';

export default function BottomNav({ activePage = 'dashboard' }) {
  const { t, category, isRTL } = useApp();

  const citizenItems = [
    { id: 'city', icon: Building2, label: t('myCity'), page: 'MyCity' },
    { id: 'flood', icon: MapPin, label: t('floodMap'), page: 'FloodMap' },
    { id: 'ticket', icon: TicketPercent, label: '', page: 'DiscountTickets', isCenter: true },
    { id: 'reward', icon: Gift, label: t('myReward'), page: 'MyReward' },
    { id: 'farmer', icon: Tractor, label: t('farmers'), page: 'FarmerDashboard' },
  ];

  const farmerItems = [
    { id: 'farm', icon: Tractor, label: t('farmDashboard'), page: 'FarmerDashboard' },
    { id: 'flood', icon: MapPin, label: t('floodMap'), page: 'FloodMap' },
    { id: 'ticket', icon: TicketPercent, label: '', page: 'DiscountTickets', isCenter: true },
    { id: 'reward', icon: Gift, label: t('myReward'), page: 'MyReward' },
    { id: 'city', icon: Building2, label: t('myCity'), page: 'MyCity' },
  ];

  const items = category === 'farmer' ? farmerItems : citizenItems;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-slate-200 border-t backdrop-blur-lg">
      <div className="max-w-lg mx-auto">
        <nav className={`flex items-center justify-around py-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {items.map((item) => {
            const isActive = activePage.toLowerCase() === item.page.toLowerCase();
            
            if (item.isCenter) {
              return (
                <Link key={item.id} to={createPageUrl('DiscountTickets')}>
                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.85 }}
                    className="relative -mt-8"
                  >
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 shadow-2xl shadow-purple-500/50 flex items-center justify-center ring-4 ring-white">
                      <TicketPercent className="w-9 h-9 text-white" />
                    </div>
                    <motion.div
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute -inset-2 rounded-full border-4 border-yellow-400"
                      animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                  </motion.div>
                </Link>
              );
            }

            return (
              <Link key={item.id} to={createPageUrl(item.page)}>
                <motion.div
                  whileHover={{ scale: 1.05, backgroundColor: 'rgb(220 252 231)' }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex flex-col items-center py-2 px-3 rounded-xl transition-colors ${
                    isActive ? 'bg-emerald-50' : ''
                  }`}
                >
                  <item.icon className={`w-6 h-6 ${
                    isActive ? 'text-emerald-500' : 'text-slate-500'
                  }`} />
                  <span className={`text-xs mt-1 ${
                    isActive ? 'text-emerald-500 font-medium' : 'text-slate-500'
                  }`}>
                    {item.label}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}