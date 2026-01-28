import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Image, Upload, MapPin, CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Progress } from '@/Components/ui/progress';
import { AppProvider, useApp } from '@/Components/context/AppContext';
import TopBar from '@/Components/dashboard/TopBar';
import BottomNav from '@/Components/dashboard/BottomNav';
import { base44 } from '@/api/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

function MyCityContent() {
  const { t, isRTL } = useApp();
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [location, setLocation] = useState(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  // Fetch user reports
  const { data: userReports } = useQuery({
    queryKey: ['trashReports'],
    queryFn: async () => {
      try {
        const user = await base44.auth.me();
        if (!user?.email) return [];
        return base44.entities.TrashReport.filter({ user_email: user.email }, '-created_date', 10);
      } catch {
        return [];
      }
    },
    initialData: []
  });

  // Get location
  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log('Location error:', err)
      );
    }
  };

  React.useEffect(() => {
    getLocation();
  }, []);

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImage(URL.createObjectURL(file));
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Analyze with AI
      const raw = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this image for trash/recycling disposal. Check if items are:
1. Properly disposed (in correct bins, recycled correctly)
2. Count visible items (estimate)
3. Identify types (plastic, paper, organic, etc.)

Respond with JSON.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            properly_disposed: { type: "boolean" },
            items_count: { type: "number" },
            item_types: { type: "array", items: { type: "string" } },
            feedback: { type: "string" },
            points_awarded: { type: "number" }
          }
        }
      });

      const unwrapped: any = (raw && typeof raw === 'object' && 'result' in (raw as any)) ? (raw as any).result : raw;
      const result: any = (unwrapped && typeof unwrapped === 'object') ? unwrapped : { feedback: String(unwrapped ?? '') };

      // Calculate points (max 5)
      let points = 0;
      if (result?.properly_disposed) {
        const count = Number(result?.items_count || 1);
        const safeCount = Number.isFinite(count) ? Math.max(1, Math.floor(count)) : 1;
        points = Math.min(5, safeCount);
      }

      // Show result immediately (even if saving fails)
      setAnalysisResult({ ...(result || {}), points_awarded: points });

      // Save report (non-blocking for UI)
      try {
        const user = await base44.auth.me();
        if (user?.email) {
          await base44.entities.TrashReport.create({
            user_email: user.email,
            image_url: file_url,
            location: location || {},
            items_count: result?.items_count,
            points_earned: points,
            status: result?.properly_disposed ? 'approved' : 'rejected',
            ai_analysis: result?.feedback
          });

          // Update user progress
          const progress = await base44.entities.UserProgress.filter({ user_email: user.email });
          if (progress.length > 0) {
            await base44.entities.UserProgress.update(progress[0].id, {
              total_points: (progress[0].total_points || 0) + points,
              trash_reports_count: (progress[0].trash_reports_count || 0) + 1
            });
          } else {
            await base44.entities.UserProgress.create({
              user_email: user.email,
              total_points: points,
              trash_reports_count: 1
            });
          }

          queryClient.invalidateQueries({ queryKey: ['trashReports'] });
          queryClient.invalidateQueries({ queryKey: ['userProgress'] });
        }
      } catch (persistErr) {
        console.error('Persist error (TrashReport/UserProgress):', persistErr);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setAnalysisResult({ 
        properly_disposed: false, 
        feedback: 'Analysis failed. Please try again.',
        points_awarded: 0 
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const totalPoints = userReports.reduce((sum, r) => sum + (r.points_earned || 0), 0);
  const communityProgress = 67; // Mock community progress

  return (
    <div className="min-h-screen pb-24 pt-20 bg-gradient-to-br from-emerald-50 via-sky-50 to-amber-50">
      <TopBar />
      
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Back Button & Title */}
        <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-green-100">
              <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">
            {t('myCity')}
          </h1>
        </div>

        {/* Instructions */}
        <Card className="bg-white/70 border-emerald-100">
          <CardContent className="p-4">
            <p className={`text-sm text-slate-600 ${isRTL ? 'text-right' : ''}`}>
              {t('uploadInstructions')}
            </p>
            {!location && (
              <div className={`flex items-center gap-2 mt-3 text-amber-500 text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                <MapPin className="w-4 h-4" />
                <span>{t('locationRequired')}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Section */}
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleImageSelect}
          />

          <div className="grid grid-cols-2 gap-4">
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: 'rgb(220 252 231)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fileInputRef.current?.click()}
              className="p-6 rounded-2xl flex flex-col items-center gap-3 bg-emerald-50 border-2 border-emerald-200 shadow-md transition-all"
            >
              <Camera className="w-10 h-10 text-emerald-600" />
              <span className="font-medium text-emerald-700">
                {t('takePhoto')}
              </span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: 'rgb(220 252 231)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fileInputRef.current?.click()}
              className="p-6 rounded-2xl flex flex-col items-center gap-3 bg-sky-50 border-2 border-sky-200 shadow-md transition-all"
            >
              <Image className="w-10 h-10 text-sky-600" />
              <span className="font-medium text-sky-700">
                {t('chooseGallery')}
              </span>
            </motion.button>
          </div>

          {/* Analysis Result */}
          <AnimatePresence>
            {(selectedImage || isAnalyzing) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="rounded-2xl overflow-hidden bg-white shadow-xl"
              >
                {selectedImage && (
                  <img src={selectedImage} alt="Uploaded" className="w-full h-48 object-cover" />
                )}
                
                <div className="p-4">
                  {isAnalyzing ? (
                    <div className="flex items-center justify-center gap-3 py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                      <span className="text-slate-600">
                        {t('loading')}
                      </span>
                    </div>
                  ) : analysisResult && (
                    <div className="space-y-4">
                      <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {analysisResult.properly_disposed ? (
                          <CheckCircle className="w-8 h-8 text-emerald-500" />
                        ) : (
                          <AlertCircle className="w-8 h-8 text-amber-500" />
                        )}
                        <div className={isRTL ? 'text-right' : ''}>
                          <p className="font-bold text-lg text-slate-800">
                            {t('analysisResult')}
                          </p>
                          <p className="text-slate-600">
                            {analysisResult.feedback}
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-xl bg-emerald-50">
                        <p className="text-sm text-emerald-600">
                          {t('pointsEarned')}
                        </p>
                        <p className="text-3xl font-bold text-emerald-600">
                          +{analysisResult.points_awarded} {t('points')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Community Progress */}
        <Card className="bg-white/70 border-emerald-100">
          <CardContent className="p-4 space-y-4">
            <h3 className={`font-bold text-slate-800 ${isRTL ? 'text-right' : ''}`}>
              {t('communityProgress')}
            </h3>
            <Progress value={communityProgress} className="h-3" />
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-3 rounded-xl bg-slate-50 hover:bg-green-100 transition-all ${isRTL ? 'text-right' : ''}`}>
                <p className="text-xs text-slate-500">
                  {t('yourContribution')}
                </p>
                <p className="text-xl font-bold text-emerald-600">
                  {totalPoints} {t('points')}
                </p>
              </div>
              <div className={`p-3 rounded-xl bg-slate-50 hover:bg-green-100 transition-all ${isRTL ? 'text-right' : ''}`}>
                <p className="text-xs text-slate-500">
                  {t('itemsRecycled')}
                </p>
                <p className="text-xl font-bold text-sky-600">
                  {userReports.reduce((sum, r) => sum + (r.items_count || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History */}
        <Card className="bg-white/70 border-emerald-100">
          <CardContent className="p-4 space-y-3">
            <h3 className={`font-bold text-slate-800 ${isRTL ? 'text-right' : ''}`}>
              {isRTL ? 'السجل' : 'History'}
            </h3>

            {userReports.length === 0 ? (
              <p className={`text-sm text-slate-600 ${isRTL ? 'text-right' : ''}`}>
                {isRTL ? 'لا توجد تقارير بعد' : 'No reports yet'}
              </p>
            ) : (
              <div className="space-y-2">
                {userReports.map((r, idx) => (
                  <div
                    key={r.id || r.image_url || idx}
                    className={`p-3 rounded-2xl border border-slate-100 bg-white hover:bg-green-50 transition-colors ${isRTL ? 'text-right' : ''}`}
                  >
                    <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div>
                        <p className="font-bold text-slate-800">
                          {isRTL ? 'تقرير' : 'Report'} #{idx + 1}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {isRTL ? 'العناصر' : 'Items'}: {Number(r.items_count || 0)}
                          {r.status ? ` • ${String(r.status)}` : ''}
                        </p>
                      </div>
                      <span className="text-sm font-black text-emerald-600">+{Number(r.points_earned || 0)} {t('points')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BottomNav activePage="city" />
    </div>
  );
}

export default function MyCity() {
  return (
    <AppProvider>
      <MyCityContent />
    </AppProvider>
  );
}