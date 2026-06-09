import React, { useState, useEffect } from 'react';
import UserSettings from './UserSettings';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export default function Settings() {
  const { t, i18n } = useTranslation();
  
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('manar_theme_mode') || 'dark';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      localStorage.setItem('manar_theme_mode', 'light');
    } else {
      document.documentElement.classList.remove('light');
      localStorage.setItem('manar_theme_mode', 'dark');
    }
    window.dispatchEvent(new Event('themeModeChanged'));
  }, [theme]);

  useEffect(() => {
    const handleModeChange = () => {
      const currentMode = localStorage.getItem('manar_theme_mode') || 'dark';
      if (currentMode !== theme) {
        setTheme(currentMode);
      }
    };
    window.addEventListener('themeModeChanged', handleModeChange);
    return () => window.removeEventListener('themeModeChanged', handleModeChange);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'system';
      return 'dark';
    });
  };

  const [toggles, setToggles] = useState(() => {
    const saved = localStorage.getItem('student_alert_toggles');
    return saved ? JSON.parse(saved) : {
      push: true,
      email: false,
      sms: true,
      preAlertTime: '15'
    };
  });

  const [savedStatus, setSavedStatus] = useState(false);

  useEffect(() => {
    localStorage.setItem('student_alert_toggles', JSON.stringify(toggles));
  }, [toggles]);

  const handleSaveToggles = (e) => {
    e.preventDefault();
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex-1 w-full bg-transparent p-4 md:p-8 flex flex-col items-center space-y-6"
    >
      
      {/* Academic Group Configuration */}
      <UserSettings />

      {/* Preferences (Language & Theme Toggle) */}
      <div className="w-full max-w-md frosted-panel rounded-2xl p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">{t('settings.title')}</h2>
          <p className="text-xs text-gray-400 mt-1">Configure language and interface color settings.</p>
        </div>

        <div className="space-y-4 text-xs">
          {/* Language Switcher */}
          <div className="flex items-center justify-between p-3 bg-gray-900/40 rounded-xl border border-white/5">
            <div>
              <span className="font-bold block text-gray-200">{t('settings.language')}</span>
              <span className="text-[10px] text-gray-500 block mt-0.5">App Language / لغة التطبيق</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => i18n.changeLanguage('en')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition duration-300 ${
                  i18n.language === 'en'
                    ? 'bg-lime-500 text-black border-lime-500 shadow-md shadow-lime-500/20'
                    : 'bg-gray-800/50 border-white/5 text-gray-300 hover:bg-gray-700/60'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => i18n.changeLanguage('ar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition duration-300 ${
                  i18n.language === 'ar'
                    ? 'bg-lime-500 text-black border-lime-500 shadow-md shadow-lime-500/20'
                    : 'bg-gray-800/50 border-white/5 text-gray-300 hover:bg-gray-700/60'
                }`}
              >
                العربية
              </button>
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-900/40 rounded-xl border border-white/5">
            <div>
              <span className="font-bold block text-gray-200">{t('settings.theme')}</span>
              <span className="text-[10px] text-gray-500 block mt-0.5">Toggle interface style</span>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/60 border border-white/5 rounded-xl flex items-center gap-2 font-bold text-gray-300 transition duration-300"
            >
              {theme === 'dark' ? (
                <>
                  <span>🌙</span>
                  <span>{i18n.language === 'ar' ? 'الليل (داكن)' : 'Night (Dark)'}</span>
                </>
              ) : theme === 'light' ? (
                <>
                  <span>☀️</span>
                  <span>{i18n.language === 'ar' ? 'النهار (فاتح)' : 'Day (Light)'}</span>
                </>
              ) : (
                <>
                  <span>💻</span>
                  <span>{i18n.language === 'ar' ? 'تلقائي (نظام)' : 'System (Auto)'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Notification Preferences Toggles */}
      <div className="w-full max-w-md frosted-panel rounded-2xl p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Notification Channels</h2>
          <p className="text-xs text-gray-400 mt-1">Configure alert dispatch destinations for schedule exceptions.</p>
        </div>

        {savedStatus && (
          <div className="p-3 bg-green-950/40 border border-green-600/50 text-green-200 text-xs font-semibold rounded-xl">
            ✓ Alert channel preferences saved!
          </div>
        )}

        <form onSubmit={handleSaveToggles} className="space-y-4 text-xs">
          
          <div className="flex items-center justify-between p-3 bg-gray-900/40 rounded-xl border border-white/5">
            <div>
              <span className="font-bold block text-gray-200">Push Notifications</span>
              <span className="text-[10px] text-gray-500 block mt-0.5">Instant browser FCM push alarms</span>
            </div>
            <input
              type="checkbox"
              checked={toggles.push}
              onChange={(e) => setToggles({ ...toggles, push: e.target.checked })}
              className="h-4 w-4 rounded border-gray-750 text-lime-500 focus:ring-lime-500 focus:ring-offset-gray-900 bg-gray-900 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-900/40 rounded-xl border border-white/5">
            <div>
              <span className="font-bold block text-gray-200">SMS Text Alerts</span>
              <span className="text-[10px] text-gray-500 block mt-0.5">Emergency mobile reschedule text warnings</span>
            </div>
            <input
              type="checkbox"
              checked={toggles.sms}
              onChange={(e) => setToggles({ ...toggles, sms: e.target.checked })}
              className="h-4 w-4 rounded border-gray-750 text-lime-500 focus:ring-lime-500 focus:ring-offset-gray-900 bg-gray-900 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-900/40 rounded-xl border border-white/5">
            <div>
              <span className="font-bold block text-gray-200">Email Notifications</span>
              <span className="text-[10px] text-gray-500 block mt-0.5">Weekly schedules digests & summary reports</span>
            </div>
            <input
              type="checkbox"
              checked={toggles.email}
              onChange={(e) => setToggles({ ...toggles, email: e.target.checked })}
              className="h-4 w-4 rounded border-gray-750 text-lime-500 focus:ring-lime-500 focus:ring-offset-gray-900 bg-gray-900 cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <label className="text-gray-400 block font-medium">Pre-Lecture Warning Offset</label>
            <select
              value={toggles.preAlertTime}
              onChange={(e) => setToggles({ ...toggles, preAlertTime: e.target.value })}
              className="w-full bg-gray-950 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-lime-500 font-bold"
            >
              <option value="5">5 minutes before start</option>
              <option value="15">15 minutes before start</option>
              <option value="30">30 minutes before start</option>
              <option value="60">1 hour before start</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 bg-lime-500 hover:bg-lime-400 text-black font-extrabold rounded-lg shadow-md shadow-lime-500/10 transition duration-300"
            >
              Save Channel Preferences
            </button>
          </div>
        </form>
      </div>

    </motion.div>
  );
}
