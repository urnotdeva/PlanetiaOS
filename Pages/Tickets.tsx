import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Gift, ShoppingCart, Fuel, Coffee, Store, Sparkles, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppProvider, useApp } from '@/components/context/AppContext';
import TopBar from '@/components/dashboard/TopBar';
import BottomNav from '@/components/dashboard/BottomNav';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Mock available vouchers
const availableVouchers = [
  { id: 1, name: 'ENOC Fuel', icon: Fuel, points: 100, value: '0.5 AED', color: 'from-red-500 to-orange-500', bgDark: 'bg-red-900/20', bgLight: 'bg-red-50' },
  { id: 2, name: 'Carrefour', icon: ShoppingCart, points: 200, value: '1 AED', color: 'from-blue-500 to-cyan-500', bgDark: 'bg-blue-900/20', bgLight: 'bg-blue-50' },
  { id: 3, name: 'Starbucks', icon: Coffee, points: 300, value: '1.5 AED', color: 'from-green-600 to-emerald-600', bgDark: 'bg-green-900/20', bgLight: 'bg-green-50' },
  { id: 4, name: 'Lulu Hypermarket', icon: Store, points: 400, value: '2 AED', color: 'from-purple-500 to-pink-500', bgDark: 'bg-purple-900/20', bgLight: 'bg-purple-50' },
  { id: 5, name: 'EPPCO Fuel', icon: Fuel, points: 500, value: '2.5 AED', color: 'from-amber-500 to-yellow-500', bgDark: 'bg-amber-900/20', bgLight: 'bg-amber-50' },
  { id: 6, name: 'Union Coop', icon: Gift, points: 600, value: '3 AED', color: 'from-teal-500 to-cyan-500', bgDark: 'bg-teal-900/20', bgLight: 'bg-teal-50' },
];

function TicketsContent() {
  const { t, isRTL, language } = useApp();
  const [redeemedVouchers, setRedeemedVouchers] = useState<any[]>([]);
  const queryClient = useQueryClient();

  // Fetch user progress
  const { data: userProgress } = useQuery({
    queryKey: ['userProgress'],
    queryFn: async () => {
      try {
        const user = await base44.auth.me();
        if (!user?.email) return { total_points: 0, vouchers_earned: 0 };
        const progress = await base44.entities.UserProgress.filter({ user_email: user.email });
        return progress[0] || { user_email: user.email, total_points: 0, vouchers_earned: 0 };
      } catch {
        return { total_points: 0, vouchers_earned: 0 };
      }
    },
    initialData: { total_points: 0, vouchers_earned: 0 }
  });

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        const key = `planetiaOS_redeemed_vouchers:${user?.email ?? 'anon'}`;
        const stored = JSON.parse(localStorage.getItem(key) || '[]');
        if (Array.isArray(stored)) setRedeemedVouchers(stored);
      } catch {
        setRedeemedVouchers([]);
      }
    })();
  }, []);

  const totalVouchers = Math.floor(userProgress.total_points / 100) * 0.5;
  const canRedeem = (points) => userProgress.total_points >= points;

  const redeemMutation = useMutation({
    mutationFn: async (voucher: any) => {
      const user = await base44.auth.me();
      if (!user?.email) throw new Error('No user');

      const progress = await base44.entities.UserProgress.filter({ user_email: user.email });
      const current = progress[0];

      const currentPoints = Number(current?.total_points ?? 0);
      if (currentPoints < voucher.points) throw new Error('Not enough points');

      const nextPoints = currentPoints - voucher.points;
      const nextVouchers = Number(current?.vouchers_earned ?? 0) + 1;

      if (current?.id) {
        await base44.entities.UserProgress.update(current.id, {
          total_points: nextPoints,
          vouchers_earned: nextVouchers
        });
      } else {
        await base44.entities.UserProgress.create({
          user_email: user.email,
          total_points: nextPoints,
          vouchers_earned: nextVouchers
        });
      }

      const redeemed = { ...voucher, redeemedAt: new Date().toISOString() };
      const key = `planetiaOS_redeemed_vouchers:${user.email}`;
      const prev = JSON.parse(localStorage.getItem(key) || '[]');
      const next = Array.isArray(prev) ? [redeemed, ...prev] : [redeemed];
      localStorage.setItem(key, JSON.stringify(next));
      return redeemed;
    },
    onSuccess: (redeemed) => {
      setRedeemedVouchers((prev) => [redeemed, ...prev]);
      queryClient.invalidateQueries({ queryKey: ['userProgress'] });
    }
  });

  const handleRedeem = (voucher: any) => {
    if (!canRedeem(voucher.points)) return;
    redeemMutation.mutate(voucher);
  };

  return (
    <div className="min-h-screen pb-24 pt-20 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <TopBar />
      
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Header with floating ticket */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-center ${isRTL ? 'text-right' : ''}`}
        >
          <motion.div
            animate={{ rotate: [0, -5, 5, 0], y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="inline-block mb-4"
          >
            <div className="p-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-2xl">
              <Ticket className="w-12 h-12 text-white" />
            </div>
          </motion.div>
          <h1 className="text-3xl font-black text-slate-800">
            {language === 'ar' ? '🎁 قسائمي' : '🎁 My Vouchers'}
          </h1>
          <p className="text-sm text-purple-600">
            {language === 'ar' ? 'استبدل نقاطك بمكافآت رائعة' : 'Redeem your points for amazing rewards'}
          </p>
        </motion.div>

        {/* Points Summary */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="overflow-hidden bg-gradient-to-br from-emerald-100 to-teal-100 border-emerald-300 hover:shadow-xl hover:scale-105 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-emerald-700">
                    {language === 'ar' ? 'النقاط المتاحة' : 'Available Points'}
                  </p>
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-black text-emerald-700">
                      {userProgress.total_points}
                    </span>
                    <Sparkles className="w-6 h-6 text-yellow-400 mb-2" />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-teal-700">
                    {language === 'ar' ? 'القيمة الكلية' : 'Total Value'}
                  </p>
                  <span className="text-3xl font-black text-teal-700">
                    {totalVouchers.toFixed(1)} {language === 'ar' ? 'درهم' : 'AED'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Available Vouchers */}
        <div>
          <h2 className={`text-xl font-bold mb-4 text-slate-800 ${isRTL ? 'text-right' : ''}`}>
            {language === 'ar' ? 'القسائم المتاحة' : 'Available Vouchers'}
          </h2>
          <div className="grid gap-4">
            {availableVouchers.map((voucher, index) => {
              const Icon = voucher.icon;
              const canBuy = canRedeem(voucher.points);
              
              return (
                <motion.div
                  key={voucher.id}
                  initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={
                    canBuy
                      ? { scale: 1.02, backgroundColor: 'rgb(220 252 231)', borderColor: 'rgb(34 197 94)' }
                      : { scale: 1 }
                  }
                  whileTap={{ scale: canBuy ? 0.98 : 1 }}
                >
                  <Card className={`overflow-hidden ${voucher.bgLight} border-slate-200 ${!canBuy ? 'opacity-50' : 'hover:shadow-lg'} transition-all`}>
                    <CardContent className="p-4">
                      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div className={`p-3 rounded-xl bg-gradient-to-br ${voucher.color} shadow-lg`}>
                            <Icon className="w-8 h-8 text-white" />
                          </div>
                          <div className={isRTL ? 'text-right' : ''}>
                            <p className="font-bold text-lg text-slate-800">
                              {voucher.name}
                            </p>
                            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <Badge className="bg-yellow-100 text-yellow-800">
                                {voucher.points} {language === 'ar' ? 'نقطة' : 'points'}
                              </Badge>
                              <span className="text-sm font-semibold text-emerald-600">
                                {language === 'ar' ? 'بقيمة' : 'Worth'} {voucher.value}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleRedeem(voucher)}
                          disabled={!canBuy || redeemMutation.isPending}
                          className={`${
                            canBuy 
                              ? `bg-gradient-to-r ${voucher.color} hover:from-emerald-500 hover:to-green-500` 
                              : 'bg-gray-400'
                          } text-white font-bold px-6 transition-all`}
                        >
                          {redeemMutation.isPending
                            ? (language === 'ar' ? '...' : '...')
                            : canBuy
                            ? (language === 'ar' ? 'استبدال' : 'Redeem')
                            : (language === 'ar' ? 'مقفل' : 'Locked')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Redeemed Vouchers */}
        {redeemedVouchers.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className={`text-xl font-bold mb-4 text-slate-800 ${isRTL ? 'text-right' : ''}`}>
              {language === 'ar' ? '🎉 تم الاستبدال مؤخراً' : '🎉 Recently Redeemed'}
            </h2>
            <div className="space-y-3">
              {redeemedVouchers.map((voucher, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.02, backgroundColor: 'rgb(220 252 231)' }}
                  className="p-4 rounded-xl bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 transition-all"
                >
                  <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <Gift className="w-6 h-6 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-800">
                        {voucher.name} - {voucher.value}
                      </p>
                      <p className="text-xs text-slate-600">
                        {language === 'ar' ? 'تم الاستبدال للتو ✓' : 'Redeemed just now ✓'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <BottomNav activePage="dashboard" />
    </div>
  );
}

export default function Tickets() {
  return (
    <AppProvider>
      <TicketsContent />
    </AppProvider>
  );
}