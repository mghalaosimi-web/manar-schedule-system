import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export default function Welcome() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  return (
    <div dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6 relative pt-24 pb-20 overflow-x-hidden">
      
      {/* Background ambient glowing circles */}
      <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] bg-lime-500/10 rounded-full blur-[90px] -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] bg-emerald-500/10 rounded-full blur-[90px] -z-10 animate-pulse" />

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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg bg-gray-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-10 shadow-2xl text-center space-y-8"
      >
        
        {/* Logo Icon */}
        <div className="mx-auto h-16 w-16 bg-gradient-to-tr from-lime-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-lime-500/20">
          <span className="text-3xl font-black text-black">M</span>
        </div>

        {/* Branding header */}
        <div className="space-y-3">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
            {t('welcome.title')}
          </h2>
          <p className="text-xs md:text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
            {t('welcome.subtitle')}
          </p>
        </div>

        {/* Action Options */}
        <div className="space-y-4 pt-2">
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-400 hover:to-emerald-400 text-black font-extrabold rounded-xl shadow-lg shadow-lime-500/10 transition duration-300 flex items-center justify-center gap-3 text-xs md:text-sm"
          >
            <span>{t('welcome.studentPortal')}</span>
          </button>

          <button
            onClick={() => navigate('/login')}
            className="w-full py-3.5 px-4 bg-gray-950/60 hover:bg-gray-950 text-lime-400 hover:text-lime-300 font-extrabold rounded-xl border border-white/10 hover:border-lime-500/40 transition duration-300 flex items-center justify-center gap-3 text-xs md:text-sm"
          >
            <span>{t('welcome.adminPortal')}</span>
          </button>
        </div>

        <p className="text-[11px] text-gray-500 max-w-xs mx-auto leading-relaxed">
          {t('welcome.tagline')}
        </p>

        {/* Micro status info */}
        <div className="border-t border-white/5 pt-4 flex justify-between items-center text-[10px] text-gray-650 font-mono">
          <span>v1.2.0 (Phase 8)</span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-lime-500 animate-ping inline-block" />
            {i18n.language === 'ar' ? 'متصل وحي' : 'Live Sync Active'}
          </span>
        </div>

      </motion.div>

      {/* Developer footer signature */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 text-gray-500 text-[10px] font-semibold tracking-wider uppercase">
        Developed by <a href="https://github.com/mghalaosimi-web" target="_blank" rel="noopener noreferrer" className="bg-gradient-to-r from-lime-400 to-emerald-500 bg-clip-text text-transparent font-extrabold tracking-widest hover:scale-105 transition duration-300 inline-block">M.GH.AL</a>
      </div>

    </div>
  );
}
