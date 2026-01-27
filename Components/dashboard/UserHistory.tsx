import React from 'react';
import { motion } from 'framer-motion';
import { History, Image as ImageIcon, MapPin, Award, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApp } from '../context/AppContext';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/api';

export default function UserHistory() {
  const { t, isRTL, language } = useApp();

  const { data: reports } = useQuery({
    queryKey: ['allUserReports'],
    queryFn: async () => {
      try {
        const user = await base44.auth.me();
        if (!user?.email) return { trash: [], flood: [] };
        
        const trash = await base44.entities.TrashReport.filter({ user_email: user.email }, '-created_date', 20);
        const flood = await base44.entities.FloodReport.filter({ user_email: user.email }, '-created_date', 20);
        
        return { trash: trash || [], flood: flood || [] };
      } catch {
        return { trash: [], flood: [] };
      }
    },
    initialData: { trash: [], flood: [] }
  });

  const allReports = [
    ...reports.trash.map(r => ({ ...r, type: 'trash', icon: '♻️' })),
    ...reports.flood.map(r => ({ ...r, type: 'flood', icon: '🌊' }))
  ].sort((a, b) => new Date(b.created_date as any).getTime() - new Date(a.created_date as any).getTime());

  if (allReports.length === 0) {
    return (
      <Card className="bg-white/70 border-slate-100">
        <CardContent className="p-6 text-center">
          <History className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600">
            {language === 'ar' ? 'لم يتم تقديم تقارير بعد' : 'No reports submitted yet'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/70 border-slate-100">
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <History className="w-5 h-5 text-emerald-600" />
          {language === 'ar' ? 'سجل التقارير' : 'Report History'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-96 overflow-y-auto">
        {allReports.map((report, index) => (
          <motion.div
            key={`${report.type}-${report.id}`}
            initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-3 rounded-xl bg-slate-50 hover:bg-green-50 transition-colors"
          >
            <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="text-2xl">{report.icon}</div>
              <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                <div className={`flex items-center gap-2 mb-1 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                  <span className="font-semibold text-slate-800">
                    {report.type === 'trash' 
                      ? (language === 'ar' ? 'تقرير النفايات' : 'Trash Report')
                      : (language === 'ar' ? 'تقرير الفيضان' : 'Flood Report')
                    }
                  </span>
                  {report.points_earned && (
                    <Badge className="bg-emerald-100 text-emerald-700">
                      +{report.points_earned} {language === 'ar' ? 'نقطة' : 'pts'}
                    </Badge>
                  )}
                </div>
                
                {report.image_url && (
                  <div className={`flex items-center gap-1 text-xs text-slate-500 mb-1 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                    <ImageIcon className="w-3 h-3" />
                    <span>{language === 'ar' ? 'صورة مرفقة' : 'Photo attached'}</span>
                  </div>
                )}
                
                {report.location && (
                  <div className={`flex items-center gap-1 text-xs text-slate-500 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                    <MapPin className="w-3 h-3" />
                    <span>{report.location.city || report.location.address || (language === 'ar' ? 'موقع' : 'Location')}</span>
                  </div>
                )}
                
                <div className={`flex items-center gap-1 text-xs text-slate-400 mt-1 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(report.created_date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}