import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext<any>(null);

const translations = {
  en: {
    // General
    appName: "planetiaOS",
    chooseCategory: "Choose a category",
    farmers: "Farmers",
    citizens: "Citizens",
    welcomeTitle: "Welcome to planetiaOS",
    welcomeSubtitle: "Your sustainability companion for a greener UAE",
    watchVideo: "Watch our introduction",
    skipVideo: "Skip",
    closePopup: "Close",
    createdBy: "App done by Tejesh Arumugam, Nithish Balakrishnan, and Davansh Rajesh for sustainability solutions.",
    
    // Dashboard
    myCity: "My City",
    floodMap: "Flood Map",
    myReward: "My Reward",
    totalProgress: "Total UAE Progress",
    yourProgress: "Your Progress",
    remainingTrash: "Remaining Trash",
    points: "Points",
    vouchers: "Vouchers",
    
    // My City
    uploadTrash: "Upload Trash Photo",
    takePhoto: "Take Photo",
    chooseGallery: "Choose from Gallery",
    communityProgress: "Community Progress",
    yourContribution: "Your Contribution",
    itemsRecycled: "Items Recycled",
    uploadInstructions: "Take a photo of properly disposed trash or recyclables to earn points!",
    locationRequired: "Location access is required to credit your community",
    pointsEarned: "Points Earned",
    analysisResult: "Analysis Result",
    
    // Flood Map
    floodMapDesc: "Report flooded streets and underpasses. Help authorities prioritize drainage improvements.",
    reportFlood: "Report Flood",
    viewHistory: "View History",
    severity: "Severity",
    low: "Low",
    medium: "Medium",
    high: "High",
    critical: "Critical",
    recentReports: "Recent Reports",
    
    // Rewards
    rewardDesc: "Track your environmental impact and earn rewards for your contributions.",
    individual: "Individual",
    community: "Community",
    organization: "Organization",
    restaurant: "Restaurant",
    rank: "Rank",
    score: "Score",
    
    // Farmers
    farmDashboard: "Farm Dashboard",
    uploadFieldPhoto: "Upload Field Photo",
    satelliteInsights: "Satellite Insights",
    cropStress: "Crop Stress",
    waterEfficiency: "Water Efficiency",
    sandstormRisk: "Sandstorm Risk",
    recommendations: "Recommendations",
    ndviMap: "NDVI Map",
    viewFarmHistory: "View History",
    
    // About Us
    aboutUs: "About Us",
    clickMe: "Click Me",
    aboutDesc: "planetiaOS is dedicated to making UAE more sustainable through technology and community action.",
    ourMission: "Our Mission",
    sdgAlignment: "SDG Alignment",
    impactAreas: "Impact Areas",
    
    // Settings
    settings: "Settings",
    account: "Account",
    changeName: "Change Name",
    changeEmail: "Change Email",
    changePassword: "Change Password",
    deleteAccount: "Delete Account",
    farmerMode: "Farmer Mode",
    language: "Language",
    theme: "Theme",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    privacy: "Privacy",
    hideRanking: "Hide from Rankings",
    logout: "Logout",
    
    // Common
    save: "Save",
    cancel: "Cancel",
    submit: "Submit",
    loading: "Loading...",
    success: "Success!",
    error: "Error",
    noData: "No data available",
    tons: "tons",
    aed: "AED",
  },
  ar: {
    // General
    appName: "بلانيتيا أو إس",
    chooseCategory: "اختر فئة",
    farmers: "المزارعين",
    citizens: "المواطنين",
    welcomeTitle: "مرحباً بكم في بلانيتيا",
    welcomeSubtitle: "رفيقك في الاستدامة من أجل إمارات أكثر خضرة",
    watchVideo: "شاهد مقدمتنا",
    skipVideo: "تخطي",
    closePopup: "إغلاق",
    createdBy: "التطبيق من تطوير تيجيش أروموغام، نيثيش بالاكريشنان، وداڤانش راجيش لحلول الاستدامة.",
    
    // Dashboard
    myCity: "مدينتي",
    floodMap: "خريطة الفيضانات",
    myReward: "مكافآتي",
    totalProgress: "تقدم الإمارات الكلي",
    yourProgress: "تقدمك",
    remainingTrash: "النفايات المتبقية",
    points: "النقاط",
    vouchers: "القسائم",
    
    // My City
    uploadTrash: "ارفع صورة النفايات",
    takePhoto: "التقط صورة",
    chooseGallery: "اختر من المعرض",
    communityProgress: "تقدم المجتمع",
    yourContribution: "مساهمتك",
    itemsRecycled: "العناصر المعاد تدويرها",
    uploadInstructions: "التقط صورة للنفايات المُتخلص منها بشكل صحيح أو المواد القابلة للتدوير لكسب النقاط!",
    locationRequired: "مطلوب الوصول إلى الموقع لإضافة الرصيد لمجتمعك",
    pointsEarned: "النقاط المكتسبة",
    analysisResult: "نتيجة التحليل",
    
    // Flood Map
    floodMapDesc: "أبلغ عن الشوارع والأنفاق المغمورة بالمياه. ساعد السلطات في تحديد أولويات تحسين الصرف.",
    reportFlood: "أبلغ عن فيضان",
    viewHistory: "عرض السجل",
    severity: "الشدة",
    low: "منخفض",
    medium: "متوسط",
    high: "مرتفع",
    critical: "حرج",
    recentReports: "التقارير الأخيرة",
    
    // Rewards
    rewardDesc: "تتبع تأثيرك البيئي واكسب مكافآت على مساهماتك.",
    individual: "فردي",
    community: "مجتمع",
    organization: "منظمة",
    restaurant: "مطعم",
    rank: "الترتيب",
    score: "النتيجة",
    
    // Farmers
    farmDashboard: "لوحة المزرعة",
    uploadFieldPhoto: "ارفع صورة الحقل",
    satelliteInsights: "رؤى الأقمار الصناعية",
    cropStress: "إجهاد المحاصيل",
    waterEfficiency: "كفاءة المياه",
    sandstormRisk: "خطر العواصف الرملية",
    recommendations: "التوصيات",
    ndviMap: "خريطة NDVI",
    viewFarmHistory: "عرض السجل",
    
    // About Us
    aboutUs: "من نحن",
    clickMe: "اضغط هنا",
    aboutDesc: "بلانيتيا مكرسة لجعل الإمارات أكثر استدامة من خلال التكنولوجيا والعمل المجتمعي.",
    ourMission: "مهمتنا",
    sdgAlignment: "التوافق مع أهداف التنمية المستدامة",
    impactAreas: "مجالات التأثير",
    
    // Settings
    settings: "الإعدادات",
    account: "الحساب",
    changeName: "تغيير الاسم",
    changeEmail: "تغيير البريد الإلكتروني",
    changePassword: "تغيير كلمة المرور",
    deleteAccount: "حذف الحساب",
    farmerMode: "وضع المزارع",
    language: "اللغة",
    theme: "المظهر",
    darkMode: "الوضع الداكن",
    lightMode: "الوضع الفاتح",
    privacy: "الخصوصية",
    hideRanking: "إخفاء من التصنيفات",
    logout: "تسجيل الخروج",
    
    // Common
    save: "حفظ",
    cancel: "إلغاء",
    submit: "إرسال",
    loading: "جاري التحميل...",
    success: "نجاح!",
    error: "خطأ",
    noData: "لا توجد بيانات",
    tons: "طن",
    aed: "درهم",
  }
};

export function AppProvider({ children }) {
  const initialPrefs = (() => {
    try {
      const raw = localStorage.getItem('planetiaOS_prefs');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const [language, setLanguage] = useState(initialPrefs?.language || 'en');
  const [category, setCategory] = useState(initialPrefs?.category || null); // 'citizen' or 'farmer'
  const [hasSeenVideo, setHasSeenVideo] = useState(!!initialPrefs?.hasSeenVideo);
  const [showWelcome, setShowWelcome] = useState(() => {
    const seen = !!initialPrefs?.hasSeenVideo;
    if (seen) return false;
    return initialPrefs?.showWelcome !== false;
  });
  const [theme] = useState<'light'>('light');

  useEffect(() => {
    const saved = localStorage.getItem('planetiaOS_prefs');
    if (saved) {
      const prefs = JSON.parse(saved);
      setLanguage(prefs.language || 'en');
      setCategory(prefs.category || null);
      setHasSeenVideo(!!prefs.hasSeenVideo);
      setShowWelcome(!!prefs.hasSeenVideo ? false : prefs.showWelcome !== false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('planetiaOS_prefs', JSON.stringify({
      language, category, showWelcome, hasSeenVideo
    }));

    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language, category, showWelcome, hasSeenVideo]);

  const t = (key) => translations[language]?.[key] || translations.en[key] || key;

  const toggleLanguage = () => setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  const toggleTheme = () => {};

  return (
    <AppContext.Provider value={{
      language, setLanguage, toggleLanguage,
      category, setCategory,
      showWelcome, setShowWelcome,
      hasSeenVideo, setHasSeenVideo,
      theme, toggleTheme,
      t, isRTL: language === 'ar'
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext<any>(AppContext);