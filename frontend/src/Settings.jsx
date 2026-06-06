import React, { useState, useEffect } from 'react';
import UserSettings from './UserSettings';
import { useTranslation } from 'react-i18next';

export default function Settings() {
  const { t, i18n } = useTranslation();
  
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('manar_theme') || 'dark';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('manar_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
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
    <div className="flex-1 bg-gray-900 text-white p-5 flex flex-col items-center space-y-6">
      
      {/* 1. Reuse/Integrate UserSettings for Academic Group Configuration */}
      <UserSettings />

      {/* Preferences (Language & Theme Toggle) */}
      <div className="w-full max-w-md bg-gray-850 border border-gray-800 rounded-xl p-6 shadow-xl space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">{t('settings.title')}</h2>
          <p className="text-xs text-gray-400 mt-1">Configure language and interface color settings.</p>
        </div>

        <div className="space-y-4 text-xs">
          {/* Language Switcher */}
          <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-800">
            <div>
              <span className="font-bold block text-gray-250">{t('settings.language')}</span>
              <span className="text-[10px] text-gray-500 block mt-0.5">App Language / لغة التطبيق</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => i18n.changeLanguage('en')}
                className={`px-3 py-1.5 rounded text-xs font-bold border transition ${
                  i18n.language === 'en'
                    ? 'bg-lime-500 text-black border-lime-500 shadow-md shadow-lime-500/20'
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => i18n.changeLanguage('ar')}
                className={`px-3 py-1.5 rounded text-xs font-bold border transition ${
                  i18n.language === 'ar'
                    ? 'bg-lime-500 text-black border-lime-500 shadow-md shadow-lime-500/20'
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750'
                }`}
              >
                العربية
              </button>
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-800">
            <div>
              <span className="font-bold block text-gray-250">{t('settings.theme')}</span>
              <span className="text-[10px] text-gray-500 block mt-0.5">Toggle interface style</span>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg flex items-center gap-2 font-bold text-gray-300 transition"
            >
              {theme === 'dark' ? (
                <>
                  <span>☀️</span>
                  <span>{t('settings.light')}</span>
                </>
              ) : (
                <>
                  <span>🌙</span>
                  <span>{t('settings.dark')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Notification Preferences Toggles */}
      <div className="w-full max-w-md bg-gray-850 border border-gray-800 rounded-xl p-6 shadow-xl space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Notification Channels</h2>
          <p className="text-xs text-gray-400 mt-1">Configure alert dispatch destinations for schedule exceptions.</p>
        </div>

        {savedStatus && (
          <div className="p-3 bg-green-950/40 border border-green-600/50 text-green-200 text-xs font-semibold rounded-lg">
            ✓ Alert channel preferences saved!
          </div>
        )}

        <form onSubmit={handleSaveToggles} className="space-y-4 text-xs">
          
          <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-800">
            <div>
              <span className="font-bold block text-gray-250">Push Notifications</span>
              <span className="text-[10px] text-gray-500 block mt-0.5">Instant browser FCM push alarms</span>
            </div>
            <input
              type="checkbox"
              checked={toggles.push}
              onChange={(e) => setToggles({ ...toggles, push: e.target.checked })}
              className="h-4 w-4 rounded border-gray-750 text-lime-500 focus:ring-lime-500 focus:ring-offset-gray-900 bg-gray-900 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-800">
            <div>
              <span className="font-bold block text-gray-250">SMS Text Alerts</span>
              <span className="text-[10px] text-gray-500 block mt-0.5">Emergency mobile reschedule text warnings</span>
            </div>
            <input
              type="checkbox"
              checked={toggles.sms}
              onChange={(e) => setToggles({ ...toggles, sms: e.target.checked })}
              className="h-4 w-4 rounded border-gray-750 text-lime-500 focus:ring-lime-500 focus:ring-offset-gray-900 bg-gray-900 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-800">
            <div>
              <span className="font-bold block text-gray-250">Email Notifications</span>
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
              className="w-full bg-gray-900 border border-gray-750 rounded p-2.5 text-white focus:outline-none focus:border-lime-500 font-bold"
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
              className="w-full py-2.5 bg-lime-500 hover:bg-lime-400 text-black font-extrabold rounded-md shadow-md shadow-lime-500/10 transition"
            >
              Save Channel Preferences
            </button>
          </div>
        </form>
      </div>

      {/* Developer Branding Signature */}
      <div className="w-full max-w-md text-center pt-4 pb-12 text-gray-500 text-xs font-medium">
        Developed by <a href="https://github.com/mghalaosimi-web" target="_blank" rel="noopener noreferrer" className="bg-gradient-to-r from-lime-400 to-emerald-500 bg-clip-text text-transparent font-extrabold tracking-widest hover:drop-shadow-[0_0_10px_rgba(132,204,22,0.8)] hover:scale-105 hover:text-white transition-all duration-300 cursor-pointer inline-block">M.GH.AL</a>
      </div>
    </div>
  );
}
