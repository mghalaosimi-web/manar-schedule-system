import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { API_URL } from './config';

export default function Verification() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve student contact coordinates passed from registration state
  const email = location.state?.email || '';
  const phone = location.state?.phone || '';

  // Redirect to login if accessed directly without registration context
  useEffect(() => {
    if (!email && !phone) {
      toast.error('Session context missing. Please register again.');
      navigate('/login');
    }
  }, [email, phone, navigate]);

  // Code state
  const [emailCode, setEmailCode] = useState('');
  const [phoneCode, setPhoneCode] = useState('');

  // Status flags
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  // Loading indicators
  const [emailLoading, setEmailLoading] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);

  const handleVerify = async (e, code, type, identifier, setLoading, setVerifiedFlag) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/verify`, {
        identifier,
        code,
        type // 'EMAIL' or 'PHONE'
      });

      if (res.data && res.data.success) {
        setVerifiedFlag(true);
        toast.success(`${type} verified successfully!`);

        // If the registration is fully activated
        if (res.data.verified) {
          const { token, user } = res.data;
          
          localStorage.setItem('manar_token', token);
          localStorage.setItem('manar_user', JSON.stringify(user));

          // Set default student profile metadata
          localStorage.setItem('student_profile', JSON.stringify({
            name: user.name,
            email: user.email,
            department: 'Software Engineering',
            level: 'Level 3',
            groupId: user.groupId || 1
          }));

          toast.success('Registration fully verified! Redirecting to home...');
          navigate('/student/home');
        }
      }
    } catch (err) {
      console.error('Verification error:', err);
      const errMsg = err.response?.data?.error || 'Verification failed. Double check the code.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-center justify-center p-6 relative pt-24 pb-20 overflow-x-hidden transition-colors duration-300">
      
      {/* Background ambient glowing circles */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 bg-lime-500/10 rounded-full blur-[80px] -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 bg-emerald-500/10 rounded-full blur-[80px] -z-10 animate-pulse" />

      {/* Global Institution Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[var(--bg-card)] backdrop-blur-lg border-b border-[var(--border-color)] shadow-sm z-40 flex items-center justify-between px-6 transition-all duration-300">
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
        className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-8 shadow-2xl space-y-6 transition-all duration-300"
      >
        
        {/* Header Title */}
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 bg-gradient-to-tr from-lime-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-lime-500/10">
            <span className="text-2xl font-black text-black">M</span>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">{t('verify.title')}</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">{t('verify.subtitle')}</p>
          </div>
        </div>

        {/* Developer Sandbox Notice (only in development) */}
        {(import.meta.env.DEV || window.location.hostname === 'localhost') && (
          <div className="bg-black/20 border border-[var(--border-color)] p-3 rounded-lg text-[10px] text-[var(--text-secondary)] leading-relaxed transition-all duration-300">
            <span className="font-bold text-lime-400 uppercase block mb-1">{t('verify.devHelper')}</span>
            {t('verify.logNotice')} 
            <code className="block mt-1 p-1 bg-black/45 border border-[var(--border-color)] rounded text-[var(--text-primary)] font-mono truncate transition-all">
              verification_codes.log
            </code>
          </div>
        )}

        <div className="space-y-6 text-xs">
          {/* Step 1: Email Verification Form */}
          <div className="bg-black/10 p-4 rounded-xl border border-[var(--border-color)] space-y-3 transition-all">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-bold text-[var(--text-primary)] block">{t('verify.emailVerify')}</span>
                <span className="text-[10px] text-[var(--text-secondary)] font-mono">{email}</span>
              </div>
              {isEmailVerified ? (
                <span className="px-2 py-0.5 bg-lime-500/20 text-lime-400 border border-lime-500/30 rounded text-[10px] font-bold">{t('verify.verified')}</span>
              ) : (
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded text-[10px] font-bold">{t('verify.pending')}</span>
              )}
            </div>

            {!isEmailVerified && (
              <form 
                onSubmit={(e) => handleVerify(e, emailCode, 'EMAIL', email, setEmailLoading, setIsEmailVerified)}
                className="flex gap-2"
              >
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value)}
                  placeholder="6-digit Email OTP"
                  className="flex-1 bg-black/10 border border-[var(--border-color)] rounded px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-lime-500 font-bold tracking-widest text-center transition-all"
                />
                <button
                  type="submit"
                  disabled={emailLoading}
                  className="px-4 py-2 bg-lime-500 text-black font-extrabold rounded shadow-md shadow-lime-500/10 hover:bg-lime-400 transition flex items-center justify-center min-w-[70px]"
                >
                  {emailLoading ? (
                    <span className="h-3.5 w-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>{t('verify.verifyBtn')}</span>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Step 2: Phone Verification Form */}
          <div className="bg-black/10 p-4 rounded-xl border border-[var(--border-color)] space-y-3 transition-all">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-bold text-[var(--text-primary)] block">{t('verify.phoneVerify')}</span>
                <span className="text-[10px] text-[var(--text-secondary)] font-mono">{phone}</span>
              </div>
              {isPhoneVerified ? (
                <span className="px-2 py-0.5 bg-lime-500/20 text-lime-400 border border-lime-500/30 rounded text-[10px] font-bold">{t('verify.verified')}</span>
              ) : (
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded text-[10px] font-bold">{t('verify.pending')}</span>
              )}
            </div>

            {!isPhoneVerified && (
              <form 
                onSubmit={(e) => handleVerify(e, phoneCode, 'PHONE', phone, setPhoneLoading, setIsPhoneVerified)}
                className="flex gap-2"
              >
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={phoneCode}
                  onChange={(e) => setPhoneCode(e.target.value)}
                  placeholder="6-digit Phone OTP"
                  className="flex-1 bg-black/10 border border-[var(--border-color)] rounded px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-lime-500 font-bold tracking-widest text-center transition-all"
                />
                <button
                  type="submit"
                  disabled={phoneLoading}
                  className="px-4 py-2 bg-lime-500 text-black font-extrabold rounded shadow-md shadow-lime-500/10 hover:bg-lime-400 transition flex items-center justify-center min-w-[70px]"
                >
                  {phoneLoading ? (
                    <span className="h-3.5 w-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>{t('verify.verifyBtn')}</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition font-medium text-xs"
          >
            {t('verify.backToSignIn')}
          </button>
        </div>

      </motion.div>
      
      {/* Developer Footer */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 text-[var(--text-secondary)] text-[10px] font-semibold tracking-wider uppercase transition-colors">
        Developed by <a href="https://github.com/mghalaosimi-web" target="_blank" rel="noopener noreferrer" className="bg-gradient-to-r from-lime-400 to-emerald-500 bg-clip-text text-transparent font-extrabold tracking-widest hover:scale-105 transition duration-300 inline-block">M.GH.AL</a>
      </div>
    </div>
  );
}
