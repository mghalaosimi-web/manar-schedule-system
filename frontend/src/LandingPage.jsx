import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from './config';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Logo from './Logo';
import ThemeSwitcher from './ThemeSwitcher';

export default function LandingPage() {
  const [universities, setUniversities] = useState([]);
  const [activeUniId, setActiveUniId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  useEffect(() => {
    const fetchTenants = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_URL}/api/tenants`);
        if (response.data && response.data.success) {
          setUniversities(response.data.data || []);
        } else {
          setError(isAr ? 'فشل استجابة الخادم' : 'Server response failure');
        }
      } catch (err) {
        console.error('Failed to fetch tenants:', err);
        setError(isAr ? 'فشل الاتصال بالخادم. يرجى التأكد من اتصال الشبكة' : 'Connection error. Please check the network connection.');
        toast.error(isAr ? 'فشل تحميل البيانات' : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchTenants();
  }, [isAr]);

  const handleUniClick = (uni) => {
    if (!uni) return;
    // Dynamically apply theme color
    if (uni.themeColor) {
      document.documentElement.style.setProperty('--accent', uni.themeColor);
      document.documentElement.style.setProperty('--accent-glow', `${uni.themeColor}33`);
      document.documentElement.style.setProperty('--accent-dim', `${uni.themeColor}1a`);
    } else {
      document.documentElement.style.setProperty('--accent', '#3b82f6');
      document.documentElement.style.setProperty('--accent-glow', 'rgba(59,130,246,0.2)');
      document.documentElement.style.setProperty('--accent-dim', 'rgba(59,130,246,0.1)');
    }

    if (!uni.colleges || uni.colleges.length === 0) {
      handleCollegeSelect(uni, null);
    } else if (uni.colleges.length === 1) {
      handleCollegeSelect(uni, uni.colleges[0]);
    } else {
      setActiveUniId(activeUniId === uni.id ? null : uni.id);
    }
  };

  const handleCollegeSelect = (uni, college) => {
    if (!uni) return;
    localStorage.setItem('selectedUniversityId', uni.id);
    localStorage.setItem('selectedUniversityName', uni.name || '');
    
    if (uni.logoUrl) {
      localStorage.setItem('selectedUniversityLogo', uni.logoUrl);
    } else {
      localStorage.removeItem('selectedUniversityLogo');
    }
    
    if (college) {
      localStorage.setItem('selectedCollegeId', college.id);
      localStorage.setItem('selectedCollegeName', college.name || '');
    } else {
      localStorage.removeItem('selectedCollegeId');
      localStorage.setItem('selectedCollegeName', uni.name || '');
    }
    
    navigate('/login');
  };

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="min-h-screen bg-[#050505] text-[var(--text-primary)] flex flex-col items-center justify-center relative overflow-hidden font-urbanist selection:bg-[var(--accent)] selection:text-white transition-colors duration-700">
      
      {/* Background Ambient Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] mix-blend-screen pointer-events-none transition-colors duration-700 opacity-20" style={{ backgroundColor: 'var(--accent)' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[150px] mix-blend-screen pointer-events-none transition-colors duration-700 opacity-10" style={{ backgroundColor: 'var(--accent)' }} />
      
      {/* Top Utilities */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-4">
        <ThemeSwitcher />
        <button
          onClick={() => i18n.changeLanguage(isAr ? 'en' : 'ar')}
          className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs tracking-widest uppercase hover:bg-white/10 transition-all font-bold"
        >
          {isAr ? 'EN' : 'عربي'}
        </button>
      </div>

      <div className="relative z-10 w-full max-w-4xl px-6 py-12 flex flex-col items-center">
        
        {/* Main Title */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3">
            {isAr ? 'اختر بوابتك' : 'Select Your Portal'}
          </h1>
          <p className="text-[var(--text-secondary)] text-sm md:text-base">
            {isAr ? 'مرحباً بك في النظام المركزي الأكاديمي.' : 'Welcome to the Central Academic System.'}
          </p>
        </motion.div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 frosted-panel rounded-3xl border border-white/5 bg-white/2 max-w-md w-full text-center">
             <div className="w-12 h-12 rounded-full border-4 border-[var(--accent)] border-t-transparent animate-spin mb-6 mx-auto" />
             <p className="text-sm font-bold tracking-wide text-[var(--text-secondary)]">
               {isAr ? 'جاري الاتصال بالخادم الأكاديمي...' : 'Connecting to the central academic server...'}
             </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 frosted-panel rounded-3xl border border-red-500/20 bg-red-950/10 max-w-md w-full text-center">
             <div className="text-4xl mb-4">⚠️</div>
             <h3 className="text-lg font-black text-red-400 mb-2">
               {isAr ? 'فشل الاتصال' : 'Connection Failed'}
             </h3>
             <p className="text-sm text-red-300/85 mb-6 leading-relaxed">
               {error}
             </p>
             <button
               onClick={() => window.location.reload()}
               className="btn-ghost px-5 py-2.5 text-xs font-bold uppercase border border-red-500/30 text-red-300 hover:bg-red-500/20 rounded-full transition-all"
             >
               {isAr ? 'إعادة المحاولة' : 'Retry'}
             </button>
          </div>
        ) : universities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 frosted-panel rounded-3xl border border-white/5 bg-white/2 max-w-md w-full text-center">
             <div className="text-4xl mb-4">🗂️</div>
             <p className="text-sm font-bold text-[var(--text-secondary)] leading-relaxed">
               {isAr ? 'لا توجد جامعات مسجلة حالياً. يرجى إضافتها من لوحة الإدارة.' : 'No institutions registered currently. Please add them from the admin panel.'}
             </p>
          </div>
        ) : (
          <motion.div 
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { transition: { staggerChildren: 0.1 } }
            }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full"
          >
            {(universities || []).map((uni) => (
              <motion.div 
                key={uni.id}
                variants={{
                  hidden: { opacity: 0, scale: 0.9 },
                  show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 20 } }
                }}
                className="flex flex-col gap-3"
              >
                {/* Institution Card */}
                <button
                  onClick={() => handleUniClick(uni)}
                  className={`relative overflow-hidden flex flex-col items-center justify-center p-8 rounded-3xl border transition-all duration-300 group
                    ${activeUniId === uni.id 
                      ? 'bg-white/10 border-white/20 shadow-[0_0_40px_var(--accent-glow)] scale-[1.02]' 
                      : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_30px_var(--accent-glow)] hover:-translate-y-1'
                    }`}
                  style={{ minHeight: '220px' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--accent-dim)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10 w-24 h-24 mb-4 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                    {uni.logoUrl ? (
                      <img src={uni.logoUrl} alt={uni.name} className="max-w-full max-h-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]" />
                    ) : (
                      <Logo size="lg" />
                    )}
                  </div>
                  
                  <h2 className="relative z-10 text-lg font-black text-white/90 text-center tracking-wide group-hover:text-white">
                    {uni.name}
                  </h2>
                </button>

                {/* Sub-menu (Colleges) */}
                <AnimatePresence>
                  {activeUniId === uni.id && uni.colleges?.length > 1 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col gap-2 overflow-hidden"
                    >
                      {uni.colleges.map((college, idx) => (
                        <motion.button
                          key={college.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => handleCollegeSelect(uni, college)}
                          className="w-full text-left bg-black/40 border border-white/5 hover:border-[var(--accent)] hover:bg-[var(--accent-dim)] rounded-xl px-4 py-3 text-[13px] font-bold text-white/80 hover:text-white transition-all flex items-center justify-between group/item"
                        >
                          <span className="truncate pr-4">{college.name}</span>
                          <span className="text-[var(--accent)] opacity-0 -translate-x-2 transition-all duration-300 group-hover/item:opacity-100 group-hover/item:translate-x-0">
                            {isAr ? '←' : '→'}
                          </span>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
