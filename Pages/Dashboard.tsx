import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AppProvider, useApp } from '@/Components/context/AppContext';
import WelcomePopup from '@/Components/common/WelcomePopup';
import CategorySelector from '@/Components/common/CategorySelector';
import TopBar from '@/Components/dashboard/TopBar';
import BottomNav from '@/Components/dashboard/BottomNav';
import EarthProgress from '@/Components/dashboard/EarthProgress';
import QuickActions from '@/Components/dashboard/QuickActions';
import AboutUsCard from '@/Components/dashboard/AboutUsCard';
import UserHistory from '@/Components/dashboard/UserHistory';
import { base44 } from '@/api/api';
import { useQuery } from '@tanstack/react-query';

function DashboardContent() {
  const { t, showWelcome, setShowWelcome, category, hasSeenVideo, isRTL } = useApp();
  const [menuExpanded, setMenuExpanded] = useState(false);
  
  // Check if welcome should be shown based on hasSeenVideo
  const shouldShowWelcome = showWelcome && !hasSeenVideo;

  // Fetch user progress
  const { data: userProgress } = useQuery({
    queryKey: ['userProgress'],
    queryFn: async () => {
      try {
        const user = await base44.auth.me();
        if (!user?.email) return { total_points: 0, trash_reports_count: 0 };
        const progress = await base44.entities.UserProgress.filter({ user_email: user.email });
        return progress[0] || { total_points: 0, trash_reports_count: 0 };
      } catch {
        return { total_points: 0, trash_reports_count: 0 };
      }
    },
    initialData: { total_points: 0, trash_reports_count: 0 }
  });

  // Mock community data
  const communityData = {
    totalProgress: 45,
    userProgress: Math.min(100, (userProgress.total_points / 500) * 100),
    remainingTrash: 2500
  };

  // Show welcome popup first
  if (shouldShowWelcome) {
    return <WelcomePopup />;
  }

  // Then category selection
  if (!category) {
    return <CategorySelector />;
  }

  return (
    <div className="min-h-screen pb-24 pt-20 bg-gradient-to-br from-emerald-50 via-sky-50 to-amber-50">
      <TopBar onMenuToggle={setMenuExpanded} />
      
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Welcome Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={isRTL ? 'text-right' : ''}
        >
          <h1 className="text-2xl font-bold text-slate-800">
            {t('welcomeTitle')} 👋
          </h1>
          <p className="text-slate-600">
            {t('welcomeSubtitle')}
          </p>
        </motion.div>

        {/* Earth Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <EarthProgress 
            totalProgress={communityData.totalProgress}
            userProgress={communityData.userProgress}
            remainingTrash={communityData.remainingTrash}
          />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <QuickActions />
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div className="p-4 rounded-2xl bg-white/70 shadow-lg backdrop-blur-sm hover:shadow-xl hover:bg-green-50 transition-all cursor-pointer">
            <p className="text-sm text-slate-500">
              {t('points')}
            </p>
            <p className="text-3xl font-bold text-emerald-600">
              {userProgress.total_points}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white/70 shadow-lg backdrop-blur-sm hover:shadow-xl hover:bg-green-50 transition-all cursor-pointer">
            <p className="text-sm text-slate-500">
              {t('vouchers')}
            </p>
            <p className="text-3xl font-bold text-amber-600">
              {Math.floor(userProgress.total_points / 100) * 0.5} {t('aed')}
            </p>
          </div>
        </motion.div>

        {/* User History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <UserHistory />
        </motion.div>

        {/* About Us Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <AboutUsCard />
        </motion.div>
      </div>

      {!menuExpanded && <BottomNav activePage="dashboard" />}
    </div>
  );
}

export default function Dashboard() {
  return (
    <AppProvider>
      <DashboardContent />
    </AppProvider>
  );
}