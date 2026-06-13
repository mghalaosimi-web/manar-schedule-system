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
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/tenants`);
        if (response.data.success) {
          setUniversities(response.data.data);
          // Auto-select first university if only one
          if (response.data.data.length === 1) {
            setSelectedUniversity(response.data.data[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch tenants:', error);
        toast.error(isAr ? 'فشل تحميل البيانات' : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchTenants();
  }, [isAr]);

  const handleCollegeSelect = (college) => {
    if (!selectedUniversity) return;
    
    // Store selected tenant data in localStorage
    localStorage.setItem('selectedCollegeId', college.id);
    localStorage.setItem('selectedCollegeName', college.name);
    localStorage.setItem('selectedUniversityId', selectedUniversity.id);
    localStorage.setItem('selectedUniversityName', selectedUniversity.name);
    if (selectedUniversity.logoUrl) {
      localStorage.setItem('selectedUniversityLogo', selectedUniversity.logoUrl);
    }
    
    // Proceed to login
    navigate('/login');
  };

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="min-h-screen bg-[#050505] text-[var(--text-primary)] flex flex-col items-center justify-center relative overflow-hidden font-urbanist selection:bg-[var(--accent)] selection:text-white">
      
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-[var(--accent)] opacity-10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-purple-600 opacity-10 rounded-full blur-[150px] mix-blend-screen pointer-events-none" />
      
      {/* Header Utilities */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-4">
        <ThemeSwitcher />
        <button
          onClick={() => i18n.changeLanguage(isAr ? 'en' : 'ar')}
          className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs tracking-widest uppercase hover:bg-white/10 transition-all font-bold"
        >
          {isAr ? 'EN' : 'عربي'}
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-xl px-6 py-12 flex flex-col items-center"
      >
        <div className="mb-10 relative">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
            className="flex items-center justify-center"
          >
             <Logo size="xl" glow={true} />
          </motion.div>
          <motion.div 
            className="absolute -bottom-2 -right-2 bg-[var(--accent)] text-white text-[9px] font-black tracking-widest px-2 py-0.5 rounded-sm uppercase"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            GATEWAY
          </motion.div>
        </div>

        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-black tracking-tight mb-4"
          >
            {isAr ? 'اختر بوابتك الأكاديمية' : 'Select Your Academic Gateway'}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-[var(--text-secondary)] text-sm md:text-base max-w-md mx-auto"
          >
            {isAr 
              ? 'يرجى اختيار الكلية التي تنتمي إليها للمتابعة إلى بوابة الدخول الخاصة بك.' 
              : 'Please select your affiliated college to proceed to your dedicated portal.'}
          </motion.p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 opacity-50">
             <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin mb-4" />
             <p className="text-xs tracking-widest uppercase font-bold">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
          </div>
        ) : (
          <div className="w-full space-y-8">
            {universities.map((uni, index) => (
              <motion.div 
                key={uni.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="w-full flex flex-col gap-4"
              >
                <div className="flex items-center gap-3 px-2">
                  <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-1" />
                  <h2 className="text-lg font-bold tracking-wide text-white/80">{uni.name}</h2>
                  <div className="h-px bg-gradient-to-r from-white/20 via-white/20 to-transparent flex-1" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {uni.colleges.map((college, colIndex) => (
                    <motion.button
                      key={college.id}
                      onClick={() => {
                        setSelectedUniversity(uni);
                        handleCollegeSelect(college);
                      }}
                      whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
                      whileTap={{ scale: 0.98 }}
                      className="group relative overflow-hidden bg-white/5 border border-white/10 rounded-2xl p-5 text-left flex flex-col gap-2 transition-all"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative z-10 flex items-center justify-between">
                        <span className="font-bold text-[15px] leading-tight text-white/90 group-hover:text-white transition-colors">{college.name}</span>
                        <span className="text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                          {isAr ? '←' : '→'}
                        </span>
                      </div>
                      {college.location && (
                        <span className="relative z-10 text-[11px] font-medium text-[var(--text-muted)] tracking-wider uppercase">
                          📍 {college.location}
                        </span>
                      )}
                    </motion.button>
                  ))}
                  
                  {uni.colleges.length === 0 && (
                    <div className="col-span-1 md:col-span-2 text-center py-4 text-sm text-[var(--text-muted)] border border-dashed border-white/10 rounded-xl">
                      {isAr ? 'لا توجد كليات متاحة حالياً.' : 'No colleges available currently.'}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
