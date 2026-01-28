 
 import React from 'react';
 import { motion } from 'framer-motion';
 import { ArrowLeft, BarChart3, Building2, Droplets, Leaf, Recycle, ShieldAlert, Sprout, Users, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { AppProvider, useApp } from '@/Components/context/AppContext';
import TopBar from '@/Components/dashboard/TopBar';
import BottomNav from '@/Components/dashboard/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';

function AboutUsContent() {
  const { language, isRTL } = useApp();

  const copy = React.useMemo(() => {
    return language === 'ar'
      ? {
          back: 'عودة',
          title: 'PlanetiaOS',
          subtitle: 'نظام تشغيل للاستدامة يقوده المواطنون في دولة الإمارات',
          tagline: 'إجراءات صغيرة موثّقة → أثر وطني واسع',
          challengeTitle: 'تحدّي الاستدامة في دولة الإمارات',
          solutionTitle: 'حلّنا: PlanetiaOS',
          impactTitle: 'الأثر المتوقع على نطاق الإمارات',
          impactCaption: 'تنبؤات مبنية على تجارب عالمية مماثلة في التكنولوجيا المدنية وافتراضات تبنٍ محافظة في الإمارات.',
          differentTitle: 'لماذا هذا مختلف',
          alignTitle: 'التوافق مع أهداف التنمية المستدامة ورؤية الإمارات',
          visionTitle: 'الرؤية خلال 5 سنوات',
          ctaLine: 'PlanetiaOS يصبح حلقة التغذية الراجعة للاستدامة في دولة الإمارات.',
          labels: {
            before: 'قبل PlanetiaOS',
            after: 'بعد PlanetiaOS'
          },
          problems: {
            waste: {
              title: 'النفايات الحضرية',
              a: 'تنتج الإمارات ~27 مليون طن من النفايات سنوياً',
              b: 'المشاركة في إعادة التدوير أقل من 35% (تقديراً)'
            },
            flood: {
              title: 'الفيضانات الحضرية',
              a: 'زيادة في الفيضانات المفاجئة بعد 2020 بسبب تقلبات المناخ',
              b: 'لا توجد طبقة ذكاء موحّدة لبلاغات المواطنين عن الفيضانات'
            },
            farms: {
              title: 'إجهاد الزراعة المحلية',
              a: 'فقدان مياه مرتفع، ملوحة، وإجهاد حراري',
              b: 'المزارع الصغيرة لا تستطيع تحمّل البيوت المحمية أو المستشعرات'
            }
          },
          solution: {
            p1: 'PlanetiaOS ليس مجرد تطبيق.',
            p2: 'إنه حلقة تغذية راجعة وطنية تربط المواطنين والمزارعين والبيانات والجهات المعنية.',
            bullets: ['إجراءات مواطنين موثّقة', 'ذكاء اصطناعي + أقمار صناعية', 'حوافز حقيقية — وليس ملصقات توعوية فقط']
          },
          different: {
            traditionalTitle: 'النهج التقليدي',
            traditional: ['توعية فقط', 'لا توجد حلقة تغذية راجعة', 'لا توجد مكافآت'],
            planetiaTitle: 'PlanetiaOS',
            planetia: ['إجراء → تحقق → مكافأة → ذكاء', 'يخدم المواطن والمزارع والحكومة معاً']
          },
          vision: ['ملايين الإجراءات الموثّقة', 'ذكاء نفايات/فيضانات على مستوى المدن', 'تخطيط حضري أذكى', 'ثقافة استدامة قائمة على البيانات'],
          align: ['الاقتصاد الدائري', 'استراتيجية الحياد الصفري', 'الذكاء الاصطناعي للاستدامة']
        }
      : {
          back: 'Back',
          title: 'PlanetiaOS',
          subtitle: 'A citizen-powered sustainability operating system for the UAE',
          tagline: 'Small verified actions → national-scale impact',
          challengeTitle: 'The Sustainability Challenge in the UAE',
          solutionTitle: 'Our Solution: PlanetiaOS',
          impactTitle: 'Projected Impact at UAE Scale',
          impactCaption: 'Predictions based on comparable global civic-tech deployments and conservative UAE adoption assumptions.',
          differentTitle: 'Why This Is Different',
          alignTitle: 'SDG & UAE Alignment',
          visionTitle: '5-Year Vision',
          ctaLine: 'PlanetiaOS becomes the UAE’s sustainability feedback loop.',
          labels: {
            before: 'Before PlanetiaOS',
            after: 'After PlanetiaOS'
          },
          problems: {
            waste: {
              title: 'Urban Waste',
              a: 'UAE generates ~27 million tonnes of waste per year',
              b: 'Recycling participation estimated below 35%'
            },
            flood: {
              title: 'Urban Flooding',
              a: 'Increase in flash floods after 2020 due to climate variability',
              b: 'No unified citizen-reporting flood intelligence layer'
            },
            farms: {
              title: 'Local Agriculture Stress',
              a: 'High water loss, salinity, heat stress',
              b: 'Small farms cannot afford greenhouses or sensors'
            }
          },
          solution: {
            p1: 'PlanetiaOS is not just an app.',
            p2: 'It is a national feedback loop connecting citizens, farmers, data, and authorities.',
            bullets: ['Verified citizen actions', 'AI + satellite intelligence', 'Real incentives, not awareness posters']
          },
          different: {
            traditionalTitle: 'Traditional Approach',
            traditional: ['Awareness only', 'No feedback loop', 'No rewards'],
            planetiaTitle: 'PlanetiaOS',
            planetia: ['Action → verification → reward → intelligence', 'Serves citizens, farmers, and government together']
          },
          vision: ['Millions of verified actions', 'City-level waste & flood intelligence', 'Smarter urban planning', 'Data-driven sustainability culture'],
          align: ['Circular economy', 'Net-zero strategy', 'AI for sustainability'],
          teamTitle: 'Team',
          teamBuiltBy: 'PlanetiaOS built by:',
          teamLine: 'Developed under Sustainability Solution themes with a vision to support the UAE’s future.'
        };
  }, [language]);

  const impactRows = React.useMemo(() => {
    return [
      {
        key: 'recycling',
        label: language === 'ar' ? 'المشاركة في إعادة التدوير' : 'Recycling Participation',
        beforeLabel: language === 'ar' ? '35%' : '35%',
        afterLabel: language === 'ar' ? '60%' : '60%',
        before: 35,
        after: 60,
        afterColor: 'from-emerald-400 to-emerald-600'
      },
      {
        key: 'litter',
        label: language === 'ar' ? 'خفض القمامة في الشوارع' : 'Street Litter Reduction',
        beforeLabel: language === 'ar' ? 'الخط الأساسي' : 'baseline',
        afterLabel: language === 'ar' ? 'خفض 10–12%' : '10–12% reduction',
        before: 100,
        after: 88,
        afterColor: 'from-sky-400 to-cyan-600'
      },
      {
        key: 'flood',
        label: language === 'ar' ? 'سرعة اكتشاف مخاطر الفيضانات' : 'Flood Hazard Detection Speed',
        beforeLabel: language === 'ar' ? 'متأخر/يدوي' : 'delayed/manual',
        afterLabel: language === 'ar' ? 'أسرع 30–40%' : '30–40% faster',
        before: 30,
        after: 70,
        afterColor: 'from-indigo-400 to-violet-600'
      },
      {
        key: 'crop',
        label: language === 'ar' ? 'خسائر المحاصيل (المزارع المحلية)' : 'Crop Loss (Local Farms)',
        beforeLabel: language === 'ar' ? 'الخط الأساسي' : 'baseline',
        afterLabel: language === 'ar' ? 'خفض 15–25%' : '15–25% reduction',
        before: 100,
        after: 80,
        afterColor: 'from-amber-400 to-orange-600'
      }
    ];
  }, [language]);

  const impactDelta = React.useCallback((row: { before: number; after: number }) => {
    const before = Number(row.before);
    const after = Number(row.after);
    if (!Number.isFinite(before) || !Number.isFinite(after)) return null;
    const diff = after - before;
    const abs = Math.abs(diff);
    const sign = diff >= 0 ? '+' : '-';
    return { diff, label: `${sign}${abs}%` };
  }, []);

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen pb-24 pt-20 bg-gradient-to-br from-emerald-50 via-sky-50 to-amber-50">
      <TopBar />

      <div className="px-4 py-5 sm:py-6 max-w-3xl mx-auto space-y-5 sm:space-y-6">
        <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Link to={createPageUrl('Dashboard')}>
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: 'rgb(220 252 231)' }}
              whileTap={{ scale: 0.95 }}
              className="w-11 h-11 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center"
            >
              <ArrowLeft className={`w-5 h-5 text-slate-700 ${isRTL ? 'rotate-180' : ''}`} />
            </motion.button>
          </Link>
          <div className={isRTL ? 'text-right' : ''}>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 leading-tight">{language === 'ar' ? 'حول PlanetiaOS' : 'About PlanetiaOS'}</h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{copy.subtitle}</p>
          </div>
        </div>

        <Card className="relative overflow-hidden rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-700 via-blue-700 to-indigo-600 shadow-2xl">
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

          <CardContent className="relative p-4 sm:p-6">
            <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 sm:gap-6 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="shrink-0 self-center sm:self-auto"
              >
                <div className="relative w-[92px] h-[92px] sm:w-[120px] sm:h-[120px] rounded-full bg-gradient-to-br from-sky-300 via-emerald-300 to-green-400 shadow-[0_0_30px_rgba(0,255,200,0.25)] overflow-hidden">
                  <div className="absolute top-[18%] left-[10%] w-[44%] h-[28%] rounded-full bg-emerald-600/60" />
                  <div className="absolute top-[48%] left-[48%] w-[42%] h-[32%] rounded-full bg-emerald-700/55" />
                  <div className="absolute top-[26%] left-[56%] w-[12%] h-[9%] rounded bg-red-500/85 rotate-[-10deg]" />
                  <div className="absolute top-[32%] left-[54%] w-[10%] h-[7%] rounded bg-amber-400/85 rotate-[-10deg]" />

                  <div className="absolute top-[36%] left-[26%] text-[14px] font-black text-black/80 whitespace-pre">• •</div>
                  <div className="absolute top-[55%] left-[44%] -translate-x-1/2 text-[18px] font-black text-black/80">ᴗ</div>
                  <div className="absolute top-[50%] left-[21%] w-[10px] h-[10px] rounded-full bg-pink-300/75" />
                  <div className="absolute top-[50%] left-[61%] w-[10px] h-[10px] rounded-full bg-pink-300/75" />

                  <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/35 blur-sm" />
                </div>
              </motion.div>

              <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                <p className="text-white/70 text-[11px] sm:text-xs font-semibold tracking-wide">
                  {language === 'ar' ? 'منصة الاستدامة' : 'Sustainability Showcase'}
                </p>
                <h2 className="mt-2 text-2xl sm:text-3xl font-black text-white leading-tight">{copy.title}</h2>
                <p className="mt-2 text-sm sm:text-base text-white/90 font-semibold leading-relaxed">{copy.subtitle}</p>
                <p className="mt-2 text-sm text-white/75 leading-relaxed">{copy.tagline}</p>

                <div className={`mt-4 flex flex-wrap gap-2 ${isRTL ? 'justify-end' : ''}`}>
                  <Badge className="bg-white/10 text-white border border-white/15">{language === 'ar' ? 'تحقق' : 'Verification'}</Badge>
                  <Badge className="bg-white/10 text-white border border-white/15">{language === 'ar' ? 'ذكاء اصطناعي' : 'AI'}</Badge>
                  <Badge className="bg-white/10 text-white border border-white/15">{language === 'ar' ? 'أقمار صناعية' : 'Satellite'}</Badge>
                  <Badge className="bg-white/10 text-white border border-white/15">{language === 'ar' ? 'حوافز' : 'Incentives'}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl bg-white/70 border-emerald-100 shadow-xl">
          <CardHeader>
            <CardTitle className={`text-xl text-slate-800 ${isRTL ? 'text-right' : ''}`}>{copy.challengeTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3">
              <div className={`p-4 rounded-2xl bg-white border border-slate-100 ${isRTL ? 'text-right' : ''}`}>
                <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Recycle className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-black text-slate-900">{copy.problems.waste.title}</p>
                    <p className="mt-2 text-sm text-slate-700">{copy.problems.waste.a}</p>
                    <p className="text-sm text-slate-700">{copy.problems.waste.b}</p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-2xl bg-white border border-slate-100 ${isRTL ? 'text-right' : ''}`}>
                <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <ShieldAlert className="w-5 h-5 text-sky-600 mt-0.5" />
                  <div>
                    <p className="font-black text-slate-900">{copy.problems.flood.title}</p>
                    <p className="mt-2 text-sm text-slate-700">{copy.problems.flood.a}</p>
                    <p className="text-sm text-slate-700">{copy.problems.flood.b}</p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-2xl bg-white border border-slate-100 ${isRTL ? 'text-right' : ''}`}>
                <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Sprout className="w-5 h-5 text-amber-700 mt-0.5" />
                  <div>
                    <p className="font-black text-slate-900">{copy.problems.farms.title}</p>
                    <p className="mt-2 text-sm text-slate-700">{copy.problems.farms.a}</p>
                    <p className="text-sm text-slate-700">{copy.problems.farms.b}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl bg-white/70 border-emerald-100 shadow-xl">
          <CardHeader>
            <CardTitle className={`text-xl text-slate-800 ${isRTL ? 'text-right' : ''}`}>{copy.solutionTitle}</CardTitle>
          </CardHeader>
          <CardContent className={`space-y-4 ${isRTL ? 'text-right' : ''}`}>
            <p className="text-slate-800 font-semibold">{copy.solution.p1}</p>
            <p className="text-slate-700">{copy.solution.p2}</p>

            <div className="grid gap-3">
              <div className={`flex items-start gap-3 p-4 rounded-2xl bg-white border border-slate-100 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Users className="w-5 h-5 text-emerald-600 mt-0.5" />
                <p className="text-sm text-slate-700">{copy.solution.bullets[0]}</p>
              </div>
              <div className={`flex items-start gap-3 p-4 rounded-2xl bg-white border border-slate-100 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Zap className="w-5 h-5 text-sky-600 mt-0.5" />
                <p className="text-sm text-slate-700">{copy.solution.bullets[1]}</p>
              </div>
              <div className={`flex items-start gap-3 p-4 rounded-2xl bg-white border border-slate-100 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Leaf className="w-5 h-5 text-amber-700 mt-0.5" />
                <p className="text-sm text-slate-700">{copy.solution.bullets[2]}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl bg-white/70 border-emerald-100 shadow-xl">
          <CardHeader>
            <CardTitle className={`text-xl text-slate-800 flex items-center gap-2 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              {copy.impactTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <div className={`flex items-center justify-between gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <p className={`text-sm font-black text-slate-800 ${isRTL ? 'text-right' : ''}`}>{copy.impactTitle}</p>
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: '#94a3b8' }} />
                    <span className="text-xs font-bold text-slate-700">{copy.labels.before}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="inline-block w-3 h-3 rounded bg-gradient-to-r from-emerald-400 to-emerald-600" />
                    <span className="text-xs font-bold text-slate-700">{copy.labels.after}</span>
                  </div>
                </div>
              </div>

              <div className={`mt-3 grid gap-2 ${isRTL ? 'text-right' : ''}`}>
                {impactRows.map((row) => {
                  const d = impactDelta(row as any);
                  if (!d) return null;
                  const improving = row.key === 'recycling' || row.key === 'flood' ? d.diff > 0 : d.diff < 0;
                  const chip = improving
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200';

                  return (
                    <div key={row.key} className={`flex items-center justify-between gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{row.label}</p>
                        <p className="text-[11px] text-slate-600">
                          <span className="font-semibold">{copy.labels.before}:</span> {row.beforeLabel}
                          {'  •  '}
                          <span className="font-semibold">{copy.labels.after}:</span> {row.afterLabel}
                        </p>
                      </div>
                      <span className={`shrink-0 text-[11px] font-black px-2 py-1 rounded-full border ${chip}`}>
                        {d.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 grid" style={{ gridTemplateColumns: '40px 1fr' }}>
                {/* Y axis */}
                <div className={`pr-2 ${isRTL ? 'text-right pr-0 pl-2' : ''}`}>
                  <div className="h-[260px] sm:h-[360px] relative">
                    {[100, 80, 60, 40, 20, 0].map((v) => (
                      <div key={v} className="absolute right-0 left-0" style={{ top: `${100 - v}%` }}>
                        <div className={`text-[11px] font-bold text-slate-500 ${isRTL ? 'text-right' : 'text-right'}`}>{v}%</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plot area */}
                <div>
                  <div className="overflow-x-auto">
                    <div className="relative h-[260px] sm:h-[360px] min-w-[540px] rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 overflow-hidden">
                    {/* Gridlines */}
                    {[100, 80, 60, 40, 20, 0].map((v) => (
                      <div
                        key={v}
                        className="absolute left-0 right-0 border-t border-slate-200/80"
                        style={{ top: `${100 - v}%` }}
                      />
                    ))}

                    {/* Bars */}
                    <div className={`absolute inset-0 px-3 sm:px-6 pt-3 sm:pt-4 pb-8 sm:pb-10 flex items-end justify-center gap-3 sm:gap-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      {impactRows.map((row) => {
                        const beforeV = Math.max(0, Math.min(100, Number(row.before)));
                        const afterV = Math.max(0, Math.min(100, Number(row.after)));
                        const beforeH = `${beforeV}%`;
                        const afterH = `${afterV}%`;

                        return (
                          <div key={row.key} className="flex-none w-[78px] sm:w-[110px] flex flex-col items-center justify-end">
                            <div className="w-full flex items-end justify-center gap-2">
                              <div className="flex-1 flex flex-col items-center">
                                <div className="text-[11px] font-bold text-slate-600 mb-1">{beforeV}%</div>
                                <div className="w-full max-w-[44px]">
                                  <div className="relative w-full h-[170px] sm:h-[240px] rounded-[4px] bg-slate-200/40 overflow-hidden">
                                    <div
                                      className="absolute bottom-0 left-0 right-0 rounded-[4px]"
                                      style={{ height: beforeH, backgroundColor: '#94a3b8' }}
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="flex-1 flex flex-col items-center">
                                <div className="text-[11px] font-bold text-slate-700 mb-1">{afterV}%</div>
                                <div className="w-full max-w-[44px]">
                                  <div className="relative w-full h-[170px] sm:h-[240px] rounded-[4px] bg-slate-200/40 overflow-hidden">
                                    <div
                                      className={`absolute bottom-0 left-0 right-0 rounded-[4px] bg-gradient-to-r ${row.afterColor}`}
                                      style={{ height: afterH }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className={`mt-3 text-[11px] font-bold text-slate-700 text-center ${isRTL ? 'text-right' : ''}`}>
                              {row.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Axis label */}
                    <div className={`absolute top-1 ${isRTL ? 'right-3 text-right' : 'left-3 text-center'}`}>
                      <div className={`text-[11px] font-bold text-slate-600`}>
                        {language === 'ar' ? 'الأداء (%)' : 'Performance (%)'}
                      </div>
                    </div>
                    </div>
                  </div>

                  {/* X-axis label */}
                  <div className={`mt-2 text-[11px] font-bold text-slate-500 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {language === 'ar' ? 'الفئات' : 'Categories'}
                  </div>
                </div>
              </div>
            </div>

            <p className={`text-xs text-slate-500 ${isRTL ? 'text-right' : ''}`}>{copy.impactCaption}</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl bg-white/70 border-emerald-100 shadow-xl">
          <CardHeader>
            <CardTitle className={`text-xl text-slate-800 ${isRTL ? 'text-right' : ''}`}>{copy.differentTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <div className={`p-4 rounded-2xl bg-white border border-slate-100 ${isRTL ? 'text-right' : ''}`}>
                <p className="font-black text-slate-800">{copy.different.traditionalTitle}</p>
                <ul className="mt-3 text-sm text-slate-700 space-y-1">
                  {copy.different.traditional.map((v) => (
                    <li key={v}>{v}</li>
                  ))}
                </ul>
              </div>
              <div className={`p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-sky-50 to-amber-50 border border-slate-100 ${isRTL ? 'text-right' : ''}`}>
                <p className="font-black text-slate-800">{copy.different.planetiaTitle}</p>
                <ul className="mt-3 text-sm text-slate-700 space-y-1">
                  {copy.different.planetia.map((v) => (
                    <li key={v}>{v}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl bg-white/70 border-emerald-100 shadow-xl">
          <CardHeader>
            <CardTitle className={`text-xl text-slate-800 ${isRTL ? 'text-right' : ''}`}>{copy.alignTitle}</CardTitle>
          </CardHeader>
          <CardContent className={`space-y-3 ${isRTL ? 'text-right' : ''}`}>
            <div className={`flex flex-wrap gap-2 ${isRTL ? 'justify-end' : ''}`}>
              <Badge className="bg-emerald-100 text-emerald-800">SDG 11 – {language === 'ar' ? 'مدن مستدامة' : 'Sustainable Cities'}</Badge>
              <Badge className="bg-amber-100 text-amber-900">SDG 12 – {language === 'ar' ? 'استهلاك مسؤول' : 'Responsible Consumption'}</Badge>
              <Badge className="bg-sky-100 text-sky-800">SDG 13 – {language === 'ar' ? 'العمل المناخي' : 'Climate Action'}</Badge>
              <Badge className="bg-indigo-100 text-indigo-800">SDG 9 – {language === 'ar' ? 'الابتكار والبنية التحتية' : 'Innovation & Infrastructure'}</Badge>
            </div>
            <div className="grid gap-2">
              <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Building2 className="w-5 h-5 text-slate-500 mt-0.5" />
                <p className="text-sm text-slate-700">{copy.align[0]}</p>
              </div>
              <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Droplets className="w-5 h-5 text-slate-500 mt-0.5" />
                <p className="text-sm text-slate-700">{copy.align[1]}</p>
              </div>
              <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Zap className="w-5 h-5 text-slate-500 mt-0.5" />
                <p className="text-sm text-slate-700">{copy.align[2]}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl bg-white/70 border-emerald-100 shadow-xl">
          <CardHeader>
            <CardTitle className={`text-xl text-slate-800 ${isRTL ? 'text-right' : ''}`}>{copy.visionTitle}</CardTitle>
          </CardHeader>
          <CardContent className={`space-y-3 ${isRTL ? 'text-right' : ''}`}>
            <ul className="text-sm text-slate-700 space-y-1">
              {copy.vision.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
            <div className={`p-4 rounded-2xl bg-gradient-to-r from-sky-50 via-emerald-50 to-amber-50 border border-slate-100 ${isRTL ? 'text-right' : ''}`}>
              <p className="font-black text-slate-800">{copy.ctaLine}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl bg-white/70 border-emerald-100 shadow-xl">
          <CardHeader>
            <CardTitle className={`text-xl text-slate-800 flex items-center gap-2 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
              <Users className="w-5 h-5 text-emerald-600" />
              {language === 'ar' ? 'الفريق' : copy.teamTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className={`space-y-3 ${isRTL ? 'text-right' : ''}`}>
            <p className="text-sm text-slate-700 font-semibold">
              {language === 'ar' ? 'تم بناء PlanetiaOS بواسطة:' : copy.teamBuiltBy}
            </p>
            <div className="grid gap-2">
              {[
                'Tejesh Arumugam',
                'Nithish Balakrishnan',
                'Davansh Rajesh'
              ].map((name) => (
                <div key={name} className={`p-3 rounded-2xl bg-white border border-slate-100 ${isRTL ? 'text-right' : ''}`}>
                  <p className="text-sm font-bold text-slate-800">{name}</p>
                </div>
              ))}
            </div>
            <div className={`p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-sky-50 to-amber-50 border border-slate-100 ${isRTL ? 'text-right' : ''}`}>
              <p className="text-sm text-slate-700">{language === 'ar' ? 'تم تطويره ضمن محاور حلول الاستدامة برؤية لدعم مستقبل دولة الإمارات.' : copy.teamLine}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav activePage="dashboard" />
    </div>
  );
}

export default function AboutUs() {
  return (
    <AppProvider>
      <AboutUsContent />
    </AppProvider>
  );
}

