import React, { useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, Globe, Tractor, User, 
  Settings, LogOut, Trash2, Lock, Mail, Home, RotateCcw
} from 'lucide-react';

import { Button } from '@/Components/ui/button';
import { Switch } from '@/Components/ui/switch';
import { useApp } from '../context/AppContext';
import { base44 } from '@/api/api';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TopBar({ onMenuToggle }: { onMenuToggle?: (open: boolean) => void }) {
  const { t, language, toggleLanguage, category, setCategory, isRTL } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleReset = async () => {
    const ok = window.confirm(language === 'ar' ? 'هل تريد إعادة ضبط التطبيق؟' : 'Reset the app and start over?');
    if (!ok) return;

    try { localStorage.clear(); } catch {}
    try { sessionStorage.clear(); } catch {}

    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {}

    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
    } catch {}

    window.location.reload();
  };

  const handleMenuToggle = () => {
    setMenuOpen((prev) => {
      const next = !prev;
      onMenuToggle?.(next);
      return next;
    });
  };

  const closeMenu = () => {
    setMenuOpen(false);
    onMenuToggle?.(false);
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 border-slate-200 border-b backdrop-blur-lg">
        <div className={`flex items-center justify-between px-4 py-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Logo */}
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-slate-50 to-blue-100 flex items-center justify-center"
            >
              <img
                src="/icons/icon-512.png"
                alt="PlanetiaOS"
                className="w-10 h-10 object-contain"
              />
            </motion.div>
            <span className="font-bold text-lg text-slate-800">
              PlanetiaOS
            </span>
          </div>

          {/* Quick Actions */}
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Link to={createPageUrl('Dashboard')}>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-green-100"
                aria-label="Home"
              >
                <Home className="w-5 h-5 text-slate-600" />
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              className="rounded-full hover:bg-red-50"
              aria-label={language === 'ar' ? 'إعادة ضبط' : 'Reset'}
              title={language === 'ar' ? 'إعادة ضبط' : 'Reset'}
            >
              <RotateCcw className="w-5 h-5 text-red-600" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLanguage}
              className="rounded-full hover:bg-green-100"
            >
              <Globe className="w-5 h-5 text-slate-600" />
            </Button>

            {category === 'citizen' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCategory('farmer')}
                className="rounded-full hover:bg-green-100"
              >
                <Tractor className="w-5 h-5 text-amber-600" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={handleMenuToggle}
              className="rounded-full hover:bg-green-100"
            >
              {menuOpen 
                ? <X className="w-5 h-5 text-slate-600" />
                : <Menu className="w-5 h-5 text-slate-600" />
              }
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded Menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30"
              onClick={closeMenu}
            />
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-16 left-0 right-0 z-40 bg-white/98 border-slate-200 border-b backdrop-blur-lg shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 space-y-4 max-w-lg mx-auto">
                {/* Farmer Mode Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-green-50 transition-colors">
                  <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Tractor className="w-5 h-5 text-amber-600" />
                    <span className="text-slate-800">
                      {t('farmerMode')}
                    </span>
                  </div>
                  <Switch 
                    checked={category === 'farmer'}
                    onCheckedChange={(checked) => setCategory(checked ? 'farmer' : 'citizen')}
                  />
                </div>

                {/* Account Settings */}
                <div className="p-3 rounded-xl bg-slate-50">
                  <div className={`flex items-center gap-2 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <User className="w-5 h-5 text-emerald-600" />
                    <span className="font-medium text-slate-800">
                      {t('account')}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { icon: User, label: t('changeName') },
                      { icon: Mail, label: t('changeEmail') },
                      { icon: Lock, label: t('changePassword') },
                      { icon: Trash2, label: t('deleteAccount'), danger: true },
                    ].map((item, index) => (
                      <button
                        key={index}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${isRTL ? 'flex-row-reverse text-right' : ''} ${
                          item.danger 
                            ? 'text-red-500 hover:bg-red-50'
                            : 'text-slate-600 hover:bg-green-100'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logout */}
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full border-slate-200 text-slate-600 hover:bg-green-50"
                >
                  <LogOut className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('logout')}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}