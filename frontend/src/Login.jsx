import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from './config';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import ThemeSwitcher from './ThemeSwitcher';
import Logo from './Logo';
import DevSignature from './DevSignature';

/* ── Animation variants ───────────────────────────────────────── */
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};
const item = {
  hidden: { opacity: 0, y: 36 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

export default function Login() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [identifier, setIdentifier] = useState('');
  const [password,   setPassword]   = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const navigate = useNavigate();

  const selectedCollegeId = localStorage.getItem('selectedCollegeId');
  const selectedCollegeName = localStorage.getItem('selectedCollegeName');
  const selectedUniversityName = localStorage.getItem('selectedUniversityName');
  const selectedUniversityLogo = localStorage.getItem('selectedUniversityLogo');

  const [activeTab, setActiveTab] = useState('STUDENT'); // 'STUDENT' or 'FACULTY'

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIdentifier('');
    setPassword('');
    setError(null);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { 
        identifier, 
        password, 
        collegeId: selectedCollegeId || undefined 
      });
      if (res.data?.success) {
        const { token, user } = res.data;
        localStorage.setItem('manar_token', token);
        localStorage.setItem('manar_user', JSON.stringify(user));
        toast.success(isAr ? 'تم تسجيل الدخول بنجاح' : 'Welcome back');
        if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
          navigate('/admin/overview');
        } else if (user.role === 'LECTURER') {
          navigate('/lecturer/home');
        } else {
          localStorage.setItem('student_profile', JSON.stringify({
            name: user.name, email: user.email,
            department: '', level: '', groupId: user.groupId || 1,
          }));
          navigate('/student/home');
        }
      }
    } catch (err) {
      const msg = err.response?.data?.error
        || (isAr ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="relative min-h-screen bg-[#000] text-[var(--text-primary)] flex flex-col overflow-hidden"
    >
      {/* ── Ambient orbs ───────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-0">
        <div className="ambient-orb absolute top-[-15%] left-[10%] w-[520px] h-[520px] rounded-full"
             style={{ background: 'radial-gradient(circle, var(--accent-dim) 0%, transparent 70%)' }} />
        <div className="ambient-orb absolute bottom-[-10%] right-[5%] w-[400px] h-[400px] rounded-full"
             style={{ background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)', animationDelay: '6s' }} />
      </div>

      {/* ── Top bar ──────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-8 pt-7 pb-0">
        <motion.div
          initial={{ opacity: 0, x: isAr ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate('/')}
          title={isAr ? 'العودة للبوابة' : 'Back to Gateway'}
        >
          {/* University wordmark */}
          <span
            className="text-sm font-black tracking-[0.22em] uppercase"
            style={{ color: 'var(--accent)' }}
          >
            {selectedUniversityName ? selectedUniversityName.toUpperCase() : 'MANAR'}
          </span>
          <span className="text-[var(--text-muted)] text-xs font-medium tracking-wide">
            {selectedCollegeName ? selectedCollegeName : (isAr ? 'كلية المنار الجامعية' : 'Al-Manar University')}
          </span>
        </motion.div>

        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <button
            onClick={() => i18n.changeLanguage(isAr ? 'en' : 'ar')}
            className="btn-ghost px-4 py-1.5 text-xs tracking-widest uppercase"
          >
            {isAr ? 'EN' : 'عربي'}
          </button>
        </div>
      </header>

      {/* ── Main cinematic center ─────────────────────────────────── */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-16">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="w-full max-w-lg"
        >

          {/* Headline */}
          <motion.div variants={item} className="mb-12 text-center flex flex-col items-center">
            <div className="mb-5 flex justify-center">
              {selectedUniversityLogo ? (
                <img src={selectedUniversityLogo} alt="Logo" className="w-20 h-20 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
              ) : (
                <Logo size="lg" />
              )}
            </div>
            <p className="text-[11px] font-black tracking-[0.30em] uppercase mb-4"
               style={{ color: 'var(--accent)' }}>
              {activeTab === 'STUDENT' ? (isAr ? 'بوابة الطلاب' : 'Student Portal') : (isAr ? 'بوابة أعضاء هيئة التدريس والموظفين' : 'Faculty & Staff Portal')}
            </p>
            <h1
              className="font-black leading-none tracking-tighter whitespace-pre-line"
              style={{ fontSize: 'clamp(52px, 9vw, 88px)', color: '#fff' }}
            >
              {isAr ? 'مرحباً بك' : 'Sign In'}
            </h1>
          </motion.div>

          {/* Role Selector Tabs */}
          <motion.div variants={item} className="mb-8 flex p-1 rounded-xl bg-white/2 border border-white/5 max-w-sm mx-auto">
            <button
              type="button"
              onClick={() => handleTabChange('STUDENT')}
              className={`flex-1 py-2 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all ${
                activeTab === 'STUDENT'
                  ? 'bg-white text-black shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/2'
              }`}
            >
              {isAr ? 'بوابة الطلاب' : 'Student Portal'}
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('FACULTY')}
              className={`flex-1 py-2 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all ${
                activeTab === 'FACULTY'
                  ? 'bg-white text-black shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/2'
              }`}
            >
              {isAr ? 'الكادر والمحاضرين' : 'Faculty & Lecturers'}
            </button>
          </motion.div>

          {/* Error banner */}
          {error && (
            <motion.div
              variants={item}
              className="mb-6 px-5 py-3 rounded-xl border text-sm font-semibold"
              style={{
                background: 'rgba(220,38,38,0.06)',
                borderColor: 'rgba(220,38,38,0.25)',
                color: '#f87171',
              }}
            >
              ⚠ {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Identifier */}
            <motion.div variants={item} className="space-y-2">
              <label
                className="block text-[11px] font-black tracking-widest uppercase"
                style={{ color: 'var(--text-secondary)' }}
              >
                {activeTab === 'STUDENT' 
                  ? (isAr ? 'الاسم · البريد الإلكتروني · الرقم الدراسي' : 'Name · Email · Student ID') 
                  : (isAr ? 'البريد الإلكتروني · اسم المستخدم' : 'Email · Username')}
              </label>
              <input
                type="text"
                required
                autoComplete="username"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder={activeTab === 'STUDENT' 
                  ? (isAr ? 'أدخل معرّف حسابك' : 'Enter your identifier') 
                  : (isAr ? 'أدخل البريد الإلكتروني أو اسم المستخدم' : 'Enter email or username')}
                className="cmd-input w-full px-5"
                style={{ height: '58px', fontSize: '1.05rem' }}
              />
            </motion.div>

            {/* Password */}
            <motion.div variants={item} className="space-y-2">
              <label
                className="block text-[11px] font-black tracking-widest uppercase"
                style={{ color: 'var(--text-secondary)' }}
              >
                {isAr ? 'كلمة المرور' : 'Password'}
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="cmd-input w-full px-5 font-mono"
                style={{ height: '58px', fontSize: '1.1rem', letterSpacing: '0.15em' }}
              />
            </motion.div>

            {/* Submit */}
            <motion.div variants={item} className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-neon w-full flex items-center justify-center gap-3"
                style={{ height: '58px', fontSize: '0.95rem', letterSpacing: '0.06em' }}
              >
                {loading ? (
                  <span className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isAr ? 'دخول' : 'Continue'}</span>
                    <span style={{ fontSize: '1.1rem' }}>{isAr ? '←' : '→'}</span>
                  </>
                )}
              </button>
            </motion.div>
          </form>

          {/* Register link / notice */}
          <motion.div variants={item} className="mt-8 text-center flex flex-col items-center gap-4">
            {activeTab === 'STUDENT' ? (
              <div>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {isAr ? 'لا تملك حساباً؟ ' : "Don't have an account? "}
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="text-xs font-black underline underline-offset-4 transition-opacity hover:opacity-70"
                  style={{ color: 'var(--accent)' }}
                >
                  {isAr ? 'سجّل الآن' : 'Register now'}
                </button>
              </div>
            ) : (
              <span className="text-xs italic" style={{ color: 'var(--text-secondary)' }}>
                {isAr ? '💡 حسابات الكادر يتم إنشاؤها من قبل إدارة الكلية.' : '💡 Faculty accounts are created by the college administration.'}
              </span>
            )}

            {/* Back to Gateway Button */}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-[11px] font-bold text-[var(--text-secondary)] hover:text-white transition-colors flex items-center gap-1.5 opacity-80 hover:opacity-100 mt-2"
            >
              <span>{isAr ? '←' : '→'}</span>
              <span>{isAr ? 'العودة لاختيار الجامعة' : 'Back to Gateway'}</span>
            </button>
          </motion.div>

        </motion.div>
      </main>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="relative z-10 text-center pb-7">
        <DevSignature centered={true} />
      </footer>
    </div>
  );
}
