import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from './config';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Logo from './Logo';
import ThemeSwitcher from './ThemeSwitcher';

export default function Register() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // Fields state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneSuffix, setPhoneSuffix] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [idPhotoUrl, setIdPhotoUrl] = useState('');

  // Dropdowns lists
  const [departments, setDepartments] = useState([]);
  const [majors, setMajors] = useState([]);
  const [levels, setLevels] = useState([]);
  const [groups, setGroups] = useState([]);

  // Selections
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedMajorId, setSelectedMajorId] = useState('');
  const [selectedLevelId, setSelectedLevelId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');

  // CAPTCHA
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaChallengeId, setCaptchaChallengeId] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCaptcha = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/captcha`);
      if (res.data && res.data.success) {
        setCaptchaQuestion(res.data.query || res.data.question);
        setCaptchaChallengeId(res.data.challengeId);
      }
    } catch (e) {
      console.error('CAPTCHA load error:', e);
    }
  };

  // Fetch initial dropdown data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptRes, lvlRes, grpRes] = await Promise.all([
          axios.get(`${API_URL}/api/departments`),
          axios.get(`${API_URL}/api/levels`),
          axios.get(`${API_URL}/api/groups`),
        ]);

        if (deptRes.data.success) setDepartments(deptRes.data.data);
        if (lvlRes.data.success) setLevels(lvlRes.data.data);
        if (grpRes.data.success) setGroups(grpRes.data.data);
      } catch (err) {
        console.error('Failed to load form metadata:', err);
        toast.error('فشل في تحميل بيانات التسجيل الأساسية.');
      }
    };
    fetchData();
    fetchCaptcha();
  }, []);

  // Fetch majors when department changes
  useEffect(() => {
    const fetchMajors = async () => {
      if (!selectedDeptId) {
        setMajors([]);
        setSelectedMajorId('');
        return;
      }
      try {
        const res = await axios.get(`${API_URL}/api/majors?departmentId=${selectedDeptId}`);
        if (res.data.success) {
          setMajors(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch majors:', err);
      }
    };
    fetchMajors();
  }, [selectedDeptId]);

  const handlePhoneChange = (e) => {
    const clean = e.target.value.replace(/\D/g, '');
    if (clean.length <= 9) {
      setPhoneSuffix(clean);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fullPhone = `+967${phoneSuffix}`;

    const payload = {
      fullName,
      email,
      password,
      phone: fullPhone,
      idNumber,
      idPhotoUrl: idPhotoUrl || undefined,
      majorId: selectedMajorId,
      levelId: selectedLevelId,
      groupId: selectedGroupId,
      captchaAnswer,
      captchaChallengeId,
    };

    try {
      const res = await axios.post(`${API_URL}/api/auth/register`, payload);
      if (res.data && res.data.success) {
        const { token, user } = res.data;
        localStorage.setItem('manar_token', token);
        localStorage.setItem('manar_user', JSON.stringify(user));
        
        localStorage.setItem('student_profile', JSON.stringify({
          name: user.name,
          email: user.email,
          phone: fullPhone,
          idPhotoUrl: idPhotoUrl || '',
          department: departments.find(d => d.id === parseInt(selectedDeptId))?.name || 'Software Engineering',
          level: levels.find(l => l.id === parseInt(selectedLevelId))?.name || 'Level 3',
          groupId: user.groupId
        }));

        toast.success(i18n.language === 'ar' ? 'تم إنشاء الحساب بنجاح!' : 'Account registered successfully!');
        navigate('/student/home');
      }
    } catch (err) {
      console.error('Registration error:', err);
      const msg = err.response?.data?.error || 'فشل الاتصال بالخادم أثناء التسجيل.';
      setError(msg);
      toast.error(msg);
      fetchCaptcha(); // Refresh CAPTCHA on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-center justify-center p-6 relative pt-24 pb-20 overflow-x-hidden transition-colors duration-300">
      
      {/* Background ambient glowing circles */}
      <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] bg-lime-500/10 rounded-full blur-[90px] -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] bg-emerald-500/10 rounded-full blur-[90px] -z-10 animate-pulse" />

      {/* Global Institution Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[var(--bg-card)] backdrop-blur-lg border-b border-[var(--border-color)] shadow-sm z-40 flex items-center justify-between px-6 transition-all duration-300">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <span className="text-lg md:text-xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-emerald-400">
            كلية المنار الجامعية
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <button
            onClick={() => i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-gray-300 transition-all duration-200"
          >
            {i18n.language === 'ar' ? 'English' : 'العربية'}
          </button>
        </div>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-8 shadow-2xl space-y-6 transition-all duration-300"
      >
        
        {/* Header title */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">{t('register.title')}</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">{t('register.subtitle')}</p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-200 text-xs font-semibold rounded-lg text-center leading-relaxed">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Section 1: Basic Information */}
          <div className="border-b border-[var(--border-color)] pb-4 space-y-4 transition-all">
            <h3 className="text-[10px] font-extrabold tracking-widest text-lime-400 uppercase">{t('register.secAccount')}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[var(--text-secondary)] block font-medium">{t('register.fullName')}</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-black/10 border border-[var(--border-color)] rounded p-2.5 text-[var(--text-primary)] focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500/30 font-medium transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[var(--text-secondary)] block font-medium">{t('register.email')}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. name@student.com"
                  className="w-full bg-black/10 border border-[var(--border-color)] rounded p-2.5 text-[var(--text-primary)] focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500/30 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[var(--text-secondary)] block font-medium">{t('register.password')}</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/10 border border-[var(--border-color)] rounded p-2.5 text-[var(--text-primary)] focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500/30 font-mono transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[var(--text-secondary)] block font-medium">{t('register.phone')}</label>
                <div className="flex rounded border border-[var(--border-color)] bg-black/10 overflow-hidden focus-within:border-lime-500 focus-within:ring-1 focus-within:ring-lime-500/30 transition-all">
                  <span className="bg-white/5 px-3 py-2.5 text-[var(--text-secondary)] font-bold border-r border-[var(--border-color)] flex items-center select-none" dir="ltr">
                    +967
                  </span>
                  <input
                    type="tel"
                    required
                    value={phoneSuffix}
                    onChange={handlePhoneChange}
                    placeholder={t('register.phonePlaceholder')}
                    className="w-full bg-transparent p-2.5 text-[var(--text-primary)] focus:outline-none font-medium"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[var(--text-secondary)] block font-medium">{t('register.idNumber')}</label>
                <input
                  type="text"
                  required
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="e.g. 2026-98765"
                  className="w-full bg-black/10 border border-[var(--border-color)] rounded p-2.5 text-[var(--text-primary)] focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500/30 font-bold transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[var(--text-secondary)] block font-medium">{t('register.idPhoto')}</label>
                <input
                  type="url"
                  value={idPhotoUrl}
                  onChange={(e) => setIdPhotoUrl(e.target.value)}
                  placeholder="https://domain.com/photo.jpg"
                  className="w-full bg-black/10 border border-[var(--border-color)] rounded p-2.5 text-[var(--text-primary)] focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500/30 font-mono transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Academic Program Information */}
          <div className="border-b border-[var(--border-color)] pb-4 space-y-4 transition-all">
            <h3 className="text-[10px] font-extrabold tracking-widest text-emerald-400 uppercase">{t('register.secProgram')}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Department Dropdown */}
              <div className="space-y-1">
                <label className="text-[var(--text-secondary)] block font-medium">{t('register.department')}</label>
                <select
                  required
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="w-full bg-black/10 border border-[var(--border-color)] rounded p-2.5 text-[var(--text-primary)] focus:outline-none focus:border-lime-500 transition-all font-semibold"
                >
                  <option className="bg-[var(--bg-card)]" value="">{t('register.selectDept')}</option>
                  {departments.map(d => (
                    <option className="bg-[var(--bg-card)] text-[var(--text-primary)]" key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Major (Cascaded from Department) */}
              <div className="space-y-1">
                <label className="text-[var(--text-secondary)] block font-medium">{t('register.major')}</label>
                <select
                  required
                  disabled={!selectedDeptId}
                  value={selectedMajorId}
                  onChange={(e) => setSelectedMajorId(e.target.value)}
                  className="w-full bg-black/10 border border-[var(--border-color)] rounded p-2.5 text-[var(--text-primary)] focus:outline-none focus:border-lime-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                >
                  <option className="bg-[var(--bg-card)]" value="">{t('register.selectMajor')}</option>
                  {majors.map(m => (
                    <option className="bg-[var(--bg-card)] text-[var(--text-primary)]" key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Level Dropdown */}
              <div className="space-y-1">
                <label className="text-[var(--text-secondary)] block font-medium">{t('register.level')}</label>
                <select
                  required
                  value={selectedLevelId}
                  onChange={(e) => setSelectedLevelId(e.target.value)}
                  className="w-full bg-black/10 border border-[var(--border-color)] rounded p-2.5 text-[var(--text-primary)] focus:outline-none focus:border-lime-500 transition-all font-semibold"
                >
                  <option className="bg-[var(--bg-card)]" value="">{t('register.selectLevel')}</option>
                  {levels.map(l => (
                    <option className="bg-[var(--bg-card)] text-[var(--text-primary)]" key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              {/* Group Dropdown */}
              <div className="space-y-1">
                <label className="text-[var(--text-secondary)] block font-medium">{t('register.group')}</label>
                <select
                  required
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full bg-black/10 border border-[var(--border-color)] rounded p-2.5 text-[var(--text-primary)] focus:outline-none focus:border-lime-500 transition-all font-semibold"
                >
                  <option className="bg-[var(--bg-card)]" value="">{t('register.selectGroup')}</option>
                  {groups.map(g => (
                    <option className="bg-[var(--bg-card)] text-[var(--text-primary)]" key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Human Verification */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-extrabold tracking-widest text-sky-400 uppercase">{t('register.secVerification')}</h3>
            
            <div className="bg-black/20 border border-[var(--border-color)] rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 transition-all">
              <div className="flex items-center gap-3">
                <span className="text-xl">🤖</span>
                <div>
                  <span className="font-semibold text-[var(--text-primary)] text-xs block">{t('register.captcha')}</span>
                  <span className="text-lime-400 font-extrabold text-sm tracking-wide mt-0.5 block">{captchaQuestion || 'Loading...'}</span>
                </div>
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                <input
                  type="number"
                  required
                  placeholder="Answer"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  className="w-full md:w-24 bg-black/10 border border-[var(--border-color)] rounded px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-sky-500 text-center font-bold text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={fetchCaptcha}
                  className="px-3 bg-white/5 hover:bg-white/10 rounded border border-[var(--border-color)] text-xs font-semibold text-[var(--text-primary)] transition"
                  title="Reload Captcha"
                >
                  🔄
                </button>
              </div>
            </div>
          </div>

          {/* Submit and Login Link */}
          <div className="pt-6 space-y-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-400 hover:to-emerald-400 text-black font-extrabold rounded-lg shadow-lg shadow-lime-500/10 transition duration-300 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>{t('register.submit')}</span>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition font-medium"
              >
                {t('register.haveAccount')} <span className="text-lime-400 font-bold underline hover:text-lime-300">{t('register.signIn')}</span>
              </button>
            </div>
          </div>

        </form>
      </motion.div>
      
      {/* Developer footer */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 text-[var(--text-secondary)] text-[10px] font-semibold tracking-wider uppercase transition-colors">
        Developed by <a href="https://github.com/mghalaosimi-web" target="_blank" rel="noopener noreferrer" className="bg-gradient-to-r from-lime-400 to-emerald-500 bg-clip-text text-transparent font-extrabold tracking-widest hover:scale-105 transition duration-300 inline-block">M.GH.AL</a>
      </div>
    </div>
  );
}
