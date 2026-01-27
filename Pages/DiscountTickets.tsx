import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TicketPercent, Scissors, Fuel, ShoppingCart, Coffee, Store, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppProvider, useApp } from '@/components/context/AppContext';
import TopBar from '@/components/dashboard/TopBar';
import BottomNav from '@/components/dashboard/BottomNav';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const availableTickets = [
  { id: 1, name: 'ENOC Fuel', icon: Fuel, points: 100, value: '0.5 AED', color: 'from-red-500 to-orange-500' },
  { id: 2, name: 'Carrefour', icon: ShoppingCart, points: 200, value: '1 AED', color: 'from-blue-500 to-cyan-500' },
  { id: 3, name: 'Starbucks', icon: Coffee, points: 300, value: '1.5 AED', color: 'from-green-600 to-emerald-600' },
  { id: 4, name: 'Lulu Hypermarket', icon: Store, points: 400, value: '2 AED', color: 'from-purple-500 to-pink-500' },
  { id: 5, name: 'Union Coop', icon: Gift, points: 600, value: '3 AED', color: 'from-teal-500 to-cyan-500' }
];

type RedeemedTicket = {
  id: number;
  name: string;
  points: number;
  value: string;
  redeemedAt: string;
};

function TicketCard({
  ticket,
  canRedeem,
  onRedeem,
  isRTL
}: {
  ticket: (typeof availableTickets)[number];
  canRedeem: boolean;
  onRedeem: () => void;
  isRTL: boolean;
}) {
  const Icon = ticket.icon;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div
        className={
          'relative overflow-hidden rounded-3xl border shadow-lg bg-white ' +
          (canRedeem ? 'border-emerald-200 hover:shadow-xl' : 'border-slate-200 opacity-60')
        }
      >
        <div className={`absolute inset-0 bg-gradient-to-r ${ticket.color} opacity-10`} />

        <div className="relative p-5">
          <div className={`flex items-start justify-between gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`p-3 rounded-2xl bg-gradient-to-r ${ticket.color} shadow-lg`}>
                <Icon className="w-7 h-7 text-white" />
              </div>
              <div className={isRTL ? 'text-right' : ''}>
                <p className="font-black text-lg text-slate-800">{ticket.name}</p>
                <div className={`flex items-center gap-2 mt-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Badge className="bg-yellow-100 text-yellow-800">{ticket.points} pts</Badge>
                  <span className="text-sm font-bold text-emerald-700">{ticket.value}</span>
                </div>
              </div>
            </div>

            <Button
              onClick={onRedeem}
              disabled={!canRedeem}
              className={
                'rounded-2xl font-bold ' +
                (canRedeem
                  ? `bg-gradient-to-r ${ticket.color} hover:opacity-95`
                  : 'bg-gray-400')
              }
            >
              {canRedeem ? 'Redeem' : 'Locked'}
            </Button>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>SCAN FOR ENTRY</span>
              <span>planetiaOS</span>
            </div>
            <div className="mt-2 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500">Discount Ticket</span>
              </div>
              <TicketPercent className="w-5 h-5 text-slate-600" />
            </div>
          </div>
        </div>

        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-50 border border-slate-200" />
        <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-50 border border-slate-200" />
        <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 border-t border-dashed border-slate-200" />
      </div>
    </motion.div>
  );
}

function DiscountTicketsContent() {
  const { language, isRTL } = useApp();
  const queryClient = useQueryClient();
  const [redeemed, setRedeemed] = useState<RedeemedTicket[]>([]);

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: async () => base44.auth.me(),
    initialData: { email: 'demo@planetiaos.local' }
  });

  const { data: userProgress } = useQuery({
    queryKey: ['userProgress'],
    queryFn: async () => {
      try {
        const progress = await base44.entities.UserProgress.filter({ user_email: me.email });
        return progress[0] || { user_email: me.email, total_points: 0, vouchers_earned: 0 };
      } catch {
        return { user_email: me.email, total_points: 0, vouchers_earned: 0 };
      }
    },
    initialData: { total_points: 0, vouchers_earned: 0 }
  });

  useEffect(() => {
    try {
      const key = `planetiaOS_redeemed_vouchers:${me.email}`;
      const stored = JSON.parse(localStorage.getItem(key) || '[]');
      if (Array.isArray(stored)) setRedeemed(stored);
    } catch {
      setRedeemed([]);
    }
  }, [me.email]);

  const points = Number(userProgress.total_points ?? 0);
  const totalValue = useMemo(() => Math.floor(points / 100) * 0.5, [points]);

  const redeemMutation = useMutation({
    mutationFn: async (ticket: (typeof availableTickets)[number]) => {
      const progress = await base44.entities.UserProgress.filter({ user_email: me.email });
      const current = progress[0];
      const currentPoints = Number(current?.total_points ?? 0);
      if (currentPoints < ticket.points) throw new Error('Not enough points');

      const nextPoints = currentPoints - ticket.points;
      const nextVouchers = Number(current?.vouchers_earned ?? 0) + 1;

      if (current?.id) {
        await base44.entities.UserProgress.update(current.id, {
          total_points: nextPoints,
          vouchers_earned: nextVouchers
        });
      } else {
        await base44.entities.UserProgress.create({
          user_email: me.email,
          total_points: nextPoints,
          vouchers_earned: nextVouchers
        });
      }

      const redeemedTicket: RedeemedTicket = {
        id: ticket.id,
        name: ticket.name,
        points: ticket.points,
        value: ticket.value,
        redeemedAt: new Date().toISOString()
      };

      const key = `planetiaOS_redeemed_vouchers:${me.email}`;
      const prev = JSON.parse(localStorage.getItem(key) || '[]');
      const next = Array.isArray(prev) ? [redeemedTicket, ...prev] : [redeemedTicket];
      localStorage.setItem(key, JSON.stringify(next));
      return redeemedTicket;
    },
    onSuccess: (row) => {
      setRedeemed((prev) => [row, ...prev]);
      queryClient.invalidateQueries({ queryKey: ['userProgress'] });
    }
  });

  return (
    <div className="min-h-screen pb-24 pt-20 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <TopBar />

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={isRTL ? 'text-right' : ''}>
            <h1 className="text-3xl font-black text-slate-800">
              {language === 'ar' ? '🎫 تذاكر الخصم' : '🎫 Discount Tickets'}
            </h1>
            <p className="text-sm text-slate-600">
              {language === 'ar' ? 'استبدل نقاطك بتذاكر خصم' : 'Redeem points for discount tickets'}
            </p>
          </div>
          <motion.div
            animate={{ rotate: [0, -8, 8, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-2xl"
          >
            <TicketPercent className="w-8 h-8 text-white" />
          </motion.div>
        </div>

        <Card className="bg-white/80 border-emerald-100">
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <TicketPercent className="w-5 h-5 text-purple-600" />
              {language === 'ar' ? 'ملخص النقاط' : 'Points Summary'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`flex items-end justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={isRTL ? 'text-right' : ''}>
                <p className="text-xs text-slate-500">{language === 'ar' ? 'النقاط المتاحة' : 'Available points'}</p>
                <p className="text-5xl font-black text-emerald-600">{points}</p>
              </div>
              <div className={isRTL ? 'text-left' : 'text-right'}>
                <p className="text-xs text-slate-500">{language === 'ar' ? 'القيمة' : 'Value'}</p>
                <p className="text-2xl font-black text-purple-700">{totalValue.toFixed(1)} {language === 'ar' ? 'درهم' : 'AED'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {availableTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              canRedeem={points >= ticket.points && !redeemMutation.isPending}
              onRedeem={() => redeemMutation.mutate(ticket)}
              isRTL={isRTL}
            />
          ))}
        </div>

        {redeemed.length > 0 && (
          <Card className="bg-white/80 border-emerald-100">
            <CardHeader>
              <CardTitle className={isRTL ? 'text-right' : ''}>
                {language === 'ar' ? '✅ تم الاستبدال' : '✅ Redeemed'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {redeemed.slice(0, 5).map((r, idx) => (
                <div
                  key={`${r.redeemedAt}-${idx}`}
                  className={`p-3 rounded-2xl border border-slate-100 bg-white ${isRTL ? 'text-right' : ''}`}
                >
                  <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <p className="font-bold text-slate-800">{r.name}</p>
                    <Badge className="bg-emerald-100 text-emerald-800">-{r.points} pts</Badge>
                  </div>
                  <p className="text-xs text-slate-500">{r.value}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <BottomNav activePage="ticket" />
    </div>
  );
}

export default function DiscountTickets() {
  return (
    <AppProvider>
      <DiscountTicketsContent />
    </AppProvider>
  );
}
