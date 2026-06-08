import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { API_URL } from './config';

export default function Register() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // Form Fields State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneSuffix, setPhoneSuffix] = useState(''); // Just the 9-digit remainder
  const [password, setPassword] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [idPhotoUrl, setIdPhotoUrl] = useState('');

  // CAPTCHA State
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaChallengeId, setCaptchaChallengeId] = useState('');

  // Dropdown Selections & Options
  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  
  const [majors, setMajors] = useState([]);
  const [selectedMajorId, setSelectedMajorId] = useState('');
  
  const [levels, setLevels] = useState([]);
  const [selectedLevelId, setSelectedLevelId] = useState('');
  
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');

  // Loading & Error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch Captcha challenge
  const fetchCaptcha = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/captcha`);
      if (res.data && res.data.success) {
        setCaptchaQuestion(res.data.question);
        setCaptchaChallengeId(res.data.challengeId);
        setCaptchaAnswer('');
      }
    } catch (err) {
      console.error('Error fetching CAPTCHA challenge:', err);
    }
  };

  // Fetch initial dropdown options: Departments, Levels, Groups and CAPTCHA
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [deptRes, levelRes, groupRes] = await Promise.all([
          axios.get(`${API_URL}/api/departments`),
          axios.get(`${API_URL}/api/levels`),
          axios.get(`${API_URL}/api/groups`)
        ]);

        if (deptRes.data && deptRes.data.success) setDepartments(deptRes.data.data);
        if (levelRes.data && levelRes.data.success) setLevels(levelRes.data.data);
        if (groupRes.data && groupRes.data.success) setGroups(groupRes.data.data);
      } catch (err) {
        console.error('Error fetching initial dropdown data:', err);
        setError('Failed to load portal configuration. Please try again.');
      }
    };
    fetchDropdownData();
    fetchCaptcha();
  }, []);

  // Fetch Majors when Department selection changes
  useEffect(() => {
    const fetchMajors = async () => {
      if (!selectedDeptId) {
        setMajors([]);
        setSelectedMajorId('');
        return;
      }
      try {
        const res = await axios.get(`${API_URL}/api/majors?departmentId=${selectedDeptId}`);
        if (res.data && res.data.success) {
          setMajors(res.data.data);
          setSelectedMajorId('');
        }
      } catch (err) {
        console.error('Error fetching majors:', err);
      }
    };
    fetchMajors();
  }, [selectedDeptId]);

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, ''); // Numeric only
    if (val.length <= 9) {
      setPhoneSuffix(val);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (phoneSuffix.length !== 9) {
      setError(i18n.language === 'ar' ? 'يجب أن يتكون رقم الهاتف من 9 أرقام' : 'Phone number must be exactly 9 digits.');
      setLoading(false);
      return;
    }

    if (!selectedMajorId || !selectedLevelId || !selectedGroupId) {
      setError('Please select your academic major, level, and group.');
      setLoading(false);
      return;
    }

    if (!captchaAnswer) {
      setError('Please solve the human verification CAPTCHA challenge.');
      setLoading(false);
      return;
    }

    const formattedPhone = `+967${phoneSuffix}`;

    try {
      const payload = {
        fullName,
        email,
        phone: formattedPhone,
        password,
        idNumber,
        idPhotoUrl: idPhotoUrl || null,
        majorId: parseInt(selectedMajorId),
        levelId: parseInt(selectedLevelId),
        groupId: parseInt(selectedGroupId),
        captchaAnswer,
        captchaChallengeId
      };

      const res = await axios.post(`${API_URL}/api/auth/register`, payload);

      if (res.data && res.data.success) {
        const { token, user } = res.data;
        
        // Save to localStorage
        localStorage.setItem('manar_token', token);
        localStorage.setItem('manar_user', JSON.stringify(user));
        localStorage.setItem('student_profile', JSON.stringify({
          name: user.name,
          email: user.email,
          department: departments.find(d => d.id === parseInt(selectedDeptId))?.name || 'Software Engineering',
          level: levels.find(l => l.id === parseInt(selectedLevelId))?.name || 'Level 3',
          groupId: user.groupId || 1
        }));

        toast.success(i18n.language === 'ar' ? 'تم إنشاء الحساب وتسجيل الدخول بنجاح!' : 'Account created and logged in successfully!');
        navigate('/student/home');
      }
    } catch (err) {
      console.error('Registration error:', err);
      fetchCaptcha(); // Refresh captcha on failure
      const errorMsg = err.response && err.response.data && err.response.data.error
        ? err.response.data.error
        : (i18n.language === 'ar' ? 'فشل في إنشاء الحساب. يرجى الاتصال بالدعم.' : 'Failed to establish account. Please contact system support.');
      
      setError(errorMsg);
      toast.error(errorMsg);
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
        className="w-full max-w-xl bg-gray-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl space-y-6"
      >
        
        {/* Header title */}
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 bg-gradient-to-tr from-lime-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-lime-500/10">
            <span className="text-2xl font-black text-black">M</span>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">{t('register.title')}</h2>
            <p className="text-xs text-gray-400 mt-1">{t('register.subtitle')}</p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-200 text-xs font-semibold rounded-lg text-center leading-relaxed">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Section 1: Basic Information */}
          <div className="border-b border-white/5 pb-4 space-y-4">
            <h3 className="text-[10px] font-extrabold tracking-widest text-lime-400 uppercase">{t('register.secAccount')}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-gray-400 block font-medium">{t('register.fullName')}</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-gray-950/50 border border-white/10 rounded p-2.5 text-white focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500/30 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 block font-medium">{t('register.email')}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. name@student.com"
                  className="w-full bg-gray-950/50 border border-white/10 rounded p-2.5 text-white focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-gray-400 block font-medium">{t('register.password')}</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-950/50 border border-white/10 rounded p-2.5 text-white focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500/30 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 block font-medium">{t('register.phone')}</label>
                <div className="flex rounded border border-white/10 bg-gray-950/50 overflow-hidden focus-within:border-lime-500 focus-within:ring-1 focus-within:ring-lime-500/30">
                  <span className="bg-white/5 px-3 py-2.5 text-gray-400 font-bold border-r border-white/10 flex items-center select-none" dir="ltr">
                    +967
                  </span>
                  <input
                    type="tel"
                    required
                    value={phoneSuffix}
                    onChange={handlePhoneChange}
                    placeholder={t('register.phonePlaceholder')}
                    className="w-full bg-transparent p-2.5 text-white focus:outline-none font-medium"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-gray-400 block font-medium">{t('register.idNumber')}</label>
                <input
                  type="text"
                  required
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="e.g. 2026-98765"
                  className="w-full bg-gray-950/50 border border-white/10 rounded p-2.5 text-white focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500/30 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 block font-medium">{t('register.idPhoto')}</label>
                <input
                  type="url"
                  value={idPhotoUrl}
                  onChange={(e) => setIdPhotoUrl(e.target.value)}
                  placeholder="https://domain.com/photo.jpg"
                  className="w-full bg-gray-950/50 border border-white/10 rounded p-2.5 text-white focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500/30 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Academic Program Information */}
          <div className="border-b border-white/5 pb-4 space-y-4">
            <h3 className="text-[10px] font-extrabold tracking-widest text-emerald-400 uppercase">{t('register.secProgram')}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Department Dropdown */}
              <div className="space-y-1">
                <label className="text-gray-400 block font-medium">{t('register.department')}</label>
                <select
                  required
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="w-full bg-gray-950 border border-white/10 rounded p-2.5 text-white focus:outline-none focus:border-lime-500"
                >
                  <option value="">{t('register.selectDept')}</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Major (Cascaded from Department) */}
              <div className="space-y-1">
                <label className="text-gray-400 block font-medium">{t('register.major')}</label>
                <select
                  required
                  disabled={!selectedDeptId}
                  value={selectedMajorId}
                  onChange={(e) => setSelectedMajorId(e.target.value)}
                  className="w-full bg-gray-950 border border-white/10 rounded p-2.5 text-white focus:outline-none focus:border-lime-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">{t('register.selectMajor')}</option>
                  {majors.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Level Dropdown */}
              <div className="space-y-1">
                <label className="text-gray-400 block font-medium">{t('register.level')}</label>
                <select
                  required
                  value={selectedLevelId}
                  onChange={(e) => setSelectedLevelId(e.target.value)}
                  className="w-full bg-gray-950 border border-white/10 rounded p-2.5 text-white focus:outline-none focus:border-lime-500"
                >
                  <option value="">{t('register.selectLevel')}</option>
                  {levels.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              {/* Group Dropdown */}
              <div className="space-y-1">
                <label className="text-gray-400 block font-medium">{t('register.group')}</label>
                <select
                  required
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full bg-gray-950 border border-white/10 rounded p-2.5 text-white focus:outline-none focus:border-lime-500"
                >
                  <option value="">{t('register.selectGroup')}</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Human Verification */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-extrabold tracking-widest text-sky-400 uppercase">{t('register.secVerification')}</h3>
            
            <div className="bg-gray-950/65 border border-white/5 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">🤖</span>
                <div>
                  <span className="font-semibold text-white text-xs block">{t('register.captcha')}</span>
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
                  className="w-full md:w-24 bg-gray-900 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-sky-500 text-center font-bold text-sm"
                />
                <button
                  type="button"
                  onClick={fetchCaptcha}
                  className="px-3 bg-gray-800 hover:bg-gray-700 rounded border border-gray-750 text-xs font-semibold text-gray-300 transition"
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
                className="text-gray-400 hover:text-white transition font-medium"
              >
                {t('register.haveAccount')} <span className="text-lime-400 font-bold underline hover:text-lime-300">{t('register.signIn')}</span>
              </button>
            </div>
          </div>

        </form>
      </motion.div>

      {/* Developer footer */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 text-gray-500 text-[10px] font-semibold tracking-wider uppercase">
        Developed by <a href="https://github.com/mghalaosimi-web" target="_blank" rel="noopener noreferrer" className="bg-gradient-to-r from-lime-400 to-emerald-500 bg-clip-text text-transparent font-extrabold tracking-widest hover:scale-105 transition duration-300 inline-block">M.GH.AL</a>
      </div>

    </div>
  );
}
