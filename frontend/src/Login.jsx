import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from './config';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export default function Login() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      if (res.data && res.data.success) {
        const { token, user } = res.data;
        
        // Save to localStorage
        localStorage.setItem('manar_token', token);
        localStorage.setItem('manar_user', JSON.stringify(user));

        // Redirect based on role
        if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
          navigate('/admin/overview');
        } else {
          // Initialize student profile local state too
          localStorage.setItem('student_profile', JSON.stringify({
            name: user.name,
            email: user.email,
            department: 'Software Engineering',
            level: 'Level 3',
            groupId: user.groupId || 1
          }));
          navigate('/student/home');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError(i18n.language === 'ar' ? 'فشل الاتصال بالخادم. يرجى التحقق من تشغيل النظام.' : 'Connection failed. Please verify the backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6 relative pt-24 pb-20 overflow-x-hidden">
      
      {/* Background ambient glowing circles */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 bg-lime-500/10 rounded-full blur-[80px] -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 bg-emerald-500/10 rounded-full blur-[80px] -z-10 animate-pulse" />

      {/* Global Institution Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-gray-900/60 backdrop-blur-lg border-b border-white/10 shadow-sm z-40 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-lime-500/10 rounded border border-lime-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-lime-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
            </svg>
          </div>
          <span className="text-lg md:text-xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-emerald-400">
            كلية المنار الجامعية
          </span>
        </div>
        <button
          onClick={() => i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')}
          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-gray-300 transition-all duration-200"
        >
          {i18n.language === 'ar' ? 'English' : 'العربية'}
        </button>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-gray-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl space-y-6"
      >
        
        {/* Logo and title */}
        <div className="text-center space-y-3">
          <div className="mx-auto h-12 w-12 bg-gradient-to-tr from-lime-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-lime-500/10">
            <span className="text-2xl font-black text-black">M</span>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">{t('login.title')}</h2>
            <p className="text-xs text-gray-400 mt-1">{t('login.subtitle')}</p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-200 text-xs font-semibold rounded-lg text-center leading-relaxed">
            ⚠️ {error}
          </div>
        )}

        {/* Credentials Tip */}
        <div className="bg-gray-950/65 border border-white/5 p-3 rounded-lg text-[10px] text-gray-405 space-y-1">
          <span className="font-bold text-lime-400 uppercase tracking-wide block mb-1">{t('login.sandboxDemo')}</span>
          <div>Admin: <code className="text-gray-250 font-mono">admin@manar.edu</code> / <code className="text-gray-250 font-mono">admin123</code></div>
          <div>Student: <code className="text-gray-250 font-mono">student@manar.edu</code> / <code className="text-gray-250 font-mono">student123</code></div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="text-gray-450 block font-medium">{t('login.emailLabel')}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('login.emailPlaceholder')}
              className="w-full bg-gray-950/50 border border-white/10 rounded p-2.5 text-white focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500/30 font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-gray-450 block font-medium">{t('login.passwordLabel')}</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('login.passwordPlaceholder')}
              className="w-full bg-gray-950/50 border border-white/10 rounded p-2.5 text-white focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500/30 font-mono"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-400 hover:to-emerald-400 text-black font-extrabold rounded-lg shadow-lg shadow-lime-500/10 transition duration-350 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>{t('login.submitButton')}</span>
              )}
            </button>
          </div>
        </form>

        <div className="text-center pt-4 border-t border-white/5">
          <p className="text-gray-400 text-[11px] font-medium">
            {t('login.newStudent')}{' '}
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="text-lime-400 hover:text-lime-300 font-bold transition-all underline decoration-lime-500/30 hover:decoration-lime-400"
            >
              {t('login.createAccount')}
            </button>
          </p>
        </div>

      </motion.div>
      
      {/* Developer Branding */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 text-gray-500 text-[10px] font-semibold tracking-wider uppercase">
        Developed by <a href="https://github.com/mghalaosimi-web" target="_blank" rel="noopener noreferrer" className="bg-gradient-to-r from-lime-400 to-emerald-500 bg-clip-text text-transparent font-extrabold tracking-widest hover:scale-105 transition duration-300 inline-block">M.GH.AL</a>
      </div>
    </div>
  );
}
