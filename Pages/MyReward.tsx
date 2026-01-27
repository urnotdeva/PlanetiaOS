import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Gift, Lock, TicketPercent, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { AppProvider, useApp } from '@/components/context/AppContext';
import TopBar from '@/components/dashboard/TopBar';
import BottomNav from '@/components/dashboard/BottomNav';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

type UserProgressRow = {
  id?: string;
  user_email?: string;
  total_points?: number;
  vouchers_earned?: number;
  privacy_enabled?: boolean;
  username?: string;
  city?: string;
  profile_type?: 'individual' | 'community' | 'restaurant' | 'organization';
};

type RedeemedTicket = {
  id: number;
  name: string;
  points: number;
  value: string;
  redeemedAt: string;
};

function maskEmail(email: string) {
  const [name, domain] = email.split('@');
  if (!domain) return email;
  const safe = name.length <= 2 ? `${name[0] ?? ''}*` : `${name.slice(0, 2)}***`;
  return `${safe}@${domain}`;
}

function MyRewardContent() {
  const { language, isRTL } = useApp();
  const queryClient = useQueryClient();
  const [redeemed, setRedeemed] = useState<RedeemedTicket[]>([]);
  const [rankView, setRankView] = useState<'individual' | 'community' | 'restaurant' | 'organization'>('individual');

  const mockLeaderboard = useMemo<UserProgressRow[]>(() => {
    return [
      { id: 'm1', user_email: 'aisha.alnuaimi@example.com', username: language === 'ar' ? 'عائشة النعيمي' : 'Aisha Al Nuaimi', total_points: 860, city: 'Abu Dhabi', profile_type: 'individual', privacy_enabled: false },
      { id: 'm2', user_email: 'omar.alsuwaidi@example.com', username: language === 'ar' ? 'عمر السويدي' : 'Omar Al Suwaidi', total_points: 740, city: 'Dubai', profile_type: 'individual', privacy_enabled: false },
      { id: 'm3', user_email: 'fatima.alzaabi@example.com', username: language === 'ar' ? 'فاطمة الزعابي' : 'Fatima Al Zaabi', total_points: 680, city: 'Sharjah', profile_type: 'individual', privacy_enabled: false },
      { id: 'm4', user_email: 'eco.community@uae.example', username: language === 'ar' ? 'مجتمع دبي الأخضر' : 'Dubai Green Community', total_points: 2200, city: 'Dubai', profile_type: 'community', privacy_enabled: false },
      { id: 'm5', user_email: 'sharjah.volunteers@uae.example', username: language === 'ar' ? 'متطوعو الشارقة' : 'Sharjah Volunteers', total_points: 1750, city: 'Sharjah', profile_type: 'community', privacy_enabled: false },
      { id: 'm6', user_email: 'restaurant@planetia.example', username: language === 'ar' ? 'مطعم الخليج' : 'Gulf Restaurant', total_points: 980, city: 'Dubai', profile_type: 'restaurant', privacy_enabled: false },
      { id: 'm7', user_email: 'org@planetia.example', username: language === 'ar' ? 'مؤسسة الاستدامة' : 'Sustainability Org', total_points: 1320, city: 'Abu Dhabi', profile_type: 'organization', privacy_enabled: false }
    ];
  }, [language]);

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: async () => base44.auth.me(),
    initialData: { email: 'demo@planetiaos.local' }
  });

  const { data: myProgress } = useQuery({
    queryKey: ['userProgress', me.email],
    queryFn: async () => {
      try {
        const list = await base44.entities.UserProgress.filter({ user_email: me.email });
        return (list?.[0] || { user_email: me.email, total_points: 0, vouchers_earned: 0, privacy_enabled: false }) as UserProgressRow;
      } catch {
        return { user_email: me.email, total_points: 0, vouchers_earned: 0, privacy_enabled: false } as UserProgressRow;
      }
    },
    initialData: { user_email: 'demo@planetiaos.local', total_points: 0, vouchers_earned: 0, privacy_enabled: false } as UserProgressRow
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      try {
        const all = await base44.entities.UserProgress.list();
        const rows = (Array.isArray(all) ? all : []) as UserProgressRow[];
        const cleaned = rows
          .filter((r) => (r.total_points ?? 0) > 0)
          .sort((a, b) => (b.total_points ?? 0) - (a.total_points ?? 0));

        // If backend has little/no data, show realistic UAE mock entries
        const combined = cleaned.length >= 5 ? cleaned : [...cleaned, ...mockLeaderboard];
        return combined.slice(0, 20);
      } catch {
        return [...mockLeaderboard] as UserProgressRow[];
      }
    },
    initialData: [] as UserProgressRow[]
  });

  const vouchersValue = useMemo(() => {
    const points = Number(myProgress.total_points ?? 0);
    return Math.floor(points / 100) * 0.5;
  }, [myProgress.total_points]);

  useEffect(() => {
    try {
      const key = `planetiaOS_redeemed_vouchers:${me.email}`;
      const stored = JSON.parse(localStorage.getItem(key) || '[]');
      setRedeemed(Array.isArray(stored) ? stored : []);
    } catch {
      setRedeemed([]);
    }
  }, [me.email]);

  const privacyMutation = useMutation({
    mutationFn: async (nextPrivate: boolean) => {
      const list = await base44.entities.UserProgress.filter({ user_email: me.email });
      const current = list?.[0] as UserProgressRow | undefined;

      if (current?.id) {
        await base44.entities.UserProgress.update(current.id, { privacy_enabled: nextPrivate });
      } else {
        await base44.entities.UserProgress.create({
          user_email: me.email,
          total_points: 0,
          vouchers_earned: 0,
          privacy_enabled: nextPrivate
        });
      }
    },
    onMutate: async (nextPrivate: boolean) => {
      await queryClient.cancelQueries({ queryKey: ['userProgress', me.email] });
      const prev = queryClient.getQueryData<UserProgressRow>(['userProgress', me.email]);
      queryClient.setQueryData(['userProgress', me.email], { ...(prev as any), privacy_enabled: nextPrivate });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['userProgress', me.email], ctx.prev);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProgress', me.email] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    }
  });

  const rankLabels = useMemo(() => {
    return {
      individual: language === 'ar' ? 'فردي' : 'Individual',
      community: language === 'ar' ? 'مجتمعي' : 'Community',
      restaurant: language === 'ar' ? 'مطاعم' : 'Restaurant',
      organization: language === 'ar' ? 'منظمات' : 'Organization'
    };
  }, [language]);

  const visibleLeaderboard = useMemo(() => {
    const rows = (leaderboard || []) as UserProgressRow[];

    // Respect privacy
    const publicRows = rows.filter((row) => !(row.privacy_enabled === true));

    if (rankView === 'individual') {
      return publicRows
        .filter((r) => (r.profile_type ?? 'individual') === 'individual')
        .slice(0, 10);
    }

    if (rankView === 'community') {
      const byCity = new Map<string, number>();
      for (const r of publicRows) {
        const city = (r.city || '').trim();
        if (!city) continue;
        byCity.set(city, (byCity.get(city) || 0) + Number(r.total_points ?? 0));
      }
      return Array.from(byCity.entries())
        .map(([name, points]) => ({ name, points }))
        .sort((a, b) => b.points - a.points)
        .slice(0, 10);
    }

    const filtered = publicRows.filter((r) => (r.profile_type ?? 'individual') === rankView);
    return filtered.slice(0, 10);
  }, [leaderboard, rankView]);

  return (
    <div className="min-h-screen pb-24 pt-20 bg-gradient-to-br from-amber-50 via-emerald-50 to-sky-50">
      <TopBar />

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={isRTL ? 'text-right' : ''}>
            <h1 className="text-3xl font-black text-slate-800">
              {language === 'ar' ? '🏆 مكافآتي' : '🏆 My Rewards'}
            </h1>
            <p className="text-sm text-slate-600">
              {language === 'ar' ? 'رتبتك ونقاطك وقسائمك' : 'Your rank, points and vouchers'}
            </p>
          </div>
          <motion.div
            animate={{ rotate: [0, -8, 8, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="p-3 rounded-2xl bg-gradient-to-br from-amber-400 to-emerald-400 shadow-xl"
          >
            <Award className="w-8 h-8 text-white" />
          </motion.div>
        </div>

        <Card className="bg-white/80 border-emerald-100 overflow-hidden">
          <CardContent className="p-5">
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={isRTL ? 'text-right' : ''}>
                <p className="text-xs text-slate-500">{language === 'ar' ? 'نقاطك' : 'Your points'}</p>
                <p className="text-5xl font-black text-emerald-600">{Number(myProgress.total_points ?? 0)}</p>
              </div>
              <div className={isRTL ? 'text-left' : 'text-right'}>
                <p className="text-xs text-slate-500">{language === 'ar' ? 'القيمة' : 'Value'}</p>
                <p className="text-2xl font-black text-sky-700">{vouchersValue.toFixed(1)} {language === 'ar' ? 'درهم' : 'AED'}</p>
                <Link to={createPageUrl('Tickets')}>
                  <Button className="mt-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-pink-600 hover:to-purple-600">
                    <Gift className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'استبدال القسائم' : 'Redeem vouchers'}
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 border-emerald-100">
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <TicketPercent className="w-5 h-5 text-purple-600" />
              {language === 'ar' ? '🎫 تذاكرك' : '🎫 Your Tickets'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <p className={`text-sm text-slate-600 ${isRTL ? 'text-right' : ''}`}>
                {language === 'ar' ? 'اعرض واستبدل تذاكر الخصم' : 'View and redeem discount tickets'}
              </p>
              <Link to={createPageUrl('DiscountTickets')}>
                <Button className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-pink-600 hover:to-purple-600">
                  <TicketPercent className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'فتح' : 'Open'}
                </Button>
              </Link>
            </div>

            {redeemed.length === 0 ? (
              <p className={`text-sm text-slate-600 ${isRTL ? 'text-right' : ''}`}>
                {language === 'ar' ? 'لا توجد تذاكر مستبدلة بعد' : 'No redeemed tickets yet'}
              </p>
            ) : (
              <div className="space-y-2">
                {redeemed.slice(0, 6).map((r, idx) => (
                  <div
                    key={`${r.redeemedAt}-${idx}`}
                    className={`p-3 rounded-2xl border border-slate-100 bg-white hover:bg-green-50 transition-colors ${isRTL ? 'text-right' : ''}`}
                  >
                    <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <p className="font-bold text-slate-800">{r.name}</p>
                      <span className="text-xs font-bold text-emerald-700">{r.value}</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {language === 'ar' ? 'تم الاستبدال' : 'Redeemed'}: {new Date(r.redeemedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/80 border-emerald-100">
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Lock className="w-5 h-5 text-slate-600" />
              {language === 'ar' ? 'الخصوصية' : 'Privacy'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={isRTL ? 'text-right' : ''}>
                <p className="font-semibold text-slate-800">
                  {language === 'ar' ? 'إخفاء اسمي من لوحة المتصدرين' : 'Hide me from leaderboard'}
                </p>
                <p className="text-xs text-slate-500">
                  {language === 'ar' ? 'يمكنك إظهار/إخفاء اسمك في أي وقت' : 'You can toggle this anytime'}
                </p>
              </div>
              <Switch
                checked={Boolean(myProgress.privacy_enabled)}
                onCheckedChange={(v) => privacyMutation.mutate(v)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 border-emerald-100">
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Trophy className="w-5 h-5 text-amber-600" />
              {language === 'ar' ? 'لوحة المتصدرين' : 'Leaderboard'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className={`flex items-center justify-between gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {(Object.keys(rankLabels) as Array<keyof typeof rankLabels>).map((key) => (
                <button
                  key={key}
                  onClick={() => setRankView(key)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${rankView === key ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-700 border-slate-200'}`}
                >
                  {rankLabels[key]}
                </button>
              ))}
            </div>

            {leaderboard.length === 0 ? (
              <p className="text-sm text-slate-600">{language === 'ar' ? 'لا توجد بيانات بعد' : 'No data yet'}</p>
            ) : (
              (rankView === 'community'
                ? (visibleLeaderboard as Array<{ name: string; points: number }>).map((row, idx) => (
                    <div
                      key={`${row.name}-${idx}`}
                      className={`p-3 rounded-2xl border border-slate-100 bg-white hover:bg-green-50 transition-colors ${isRTL ? 'text-right' : ''}`}
                    >
                      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center font-black text-amber-700">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{row.name}</p>
                            <p className="text-xs text-slate-500">{language === 'ar' ? 'نقاط' : 'Points'}: {Number(row.points ?? 0)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-600">{Number(row.points ?? 0)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                : (visibleLeaderboard as UserProgressRow[]).map((row, idx) => (
                    <div
                      key={row.id || row.user_email || idx}
                      className={`p-3 rounded-2xl border border-slate-100 bg-white hover:bg-green-50 transition-colors ${isRTL ? 'text-right' : ''}`}
                    >
                      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center font-black text-amber-700">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">
                              {row.username || (row.user_email ? maskEmail(row.user_email) : (language === 'ar' ? 'مستخدم' : 'User'))}
                            </p>
                            <p className="text-xs text-slate-500">{language === 'ar' ? 'نقاط' : 'Points'}: {Number(row.total_points ?? 0)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-600">{Number(row.total_points ?? 0)}</p>
                        </div>
                      </div>
                    </div>
                  )))
            )}
          </CardContent>
        </Card>
      </div>

      <BottomNav activePage="reward" />
    </div>
  );
}

export default function MyReward() {
  return (
    <AppProvider>
      <MyRewardContent />
    </AppProvider>
  );
}