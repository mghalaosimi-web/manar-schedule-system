import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from './config';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import ThemeSwitcher from './ThemeSwitcher';
import DevSignature from './DevSignature';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const SectionLabel = ({ children }) => (
  <p className="text-[10px] font-black tracking-[0.28em] uppercase mb-4"
     style={{ color: 'var(--accent)' }}>
    {children}
  </p>
);

const Field = ({ label, children }) => (
  <div className="space-y-2">
    <label className="block text-[11px] font-bold tracking-widest uppercase"
           style={{ color: 'var(--text-secondary)' }}>
      {label}
    </label>
    {children}
  </div>
);

export default function Register() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const navigate = useNavigate();

  const [fullName,     setFullName]     = useState('');
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [phoneSuffix,  setPhoneSuffix]  = useState('');
  const [idNumber,     setIdNumber]     = useState('');
  const [idPhotoUrl,   setIdPhotoUrl]   = useState('');

  const [departments,      setDepartments]      = useState([]);
  const [majors,           setMajors]           = useState([]);
  const [levels,           setLevels]           = useState([]);
  const [groups,           setGroups]           = useState([]);
  const [selectedDeptId,   setSelectedDeptId]   = useState('');
  const [selectedMajorId,  setSelectedMajorId]  = useState('');
  const [selectedLevelId,  setSelectedLevelId]  = useState('');
  const [selectedGroupId,  setSelectedGroupId]  = useState('');

  const [captchaQuestion,   setCaptchaQuestion]   = useState('');
  const [captchaChallengeId, setCaptchaChallengeId] = useState('');
  const [captchaAnswer,     setCaptchaAnswer]     = useState('');

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const fetchCaptcha = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/captcha`);
      if (res.data?.success) {
        setCaptchaQuestion(res.data.question);
        setCaptchaChallengeId(res.data.challengeId);
        setCaptchaAnswer('');
      }
    } catch { /* silent */ }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [deptRes, lvlRes, grpRes] = await Promise.all([
          axios.get(`${API_URL}/api/departments`),
          axios.get(`${API_URL}/api/levels`),
          axios.get(`${API_URL}/api/groups`),
        ]);
        if (deptRes.data.success) setDepartments(deptRes.data.data);
        if (lvlRes.data.success)  setLevels(lvlRes.data.data);
        if (grpRes.data.success)  setGroups(grpRes.data.data);
      } catch (err) {
        toast.error(isAr ? 'فشل في تحميل البيانات' : 'Failed to load form data');
      }
    };
    load();
    fetchCaptcha();
  }, []);

  useEffect(() => {
    const fetchMajors = async () => {
      if (!selectedDeptId) { setMajors([]); setSelectedMajorId(''); return; }
      try {
        const res = await axios.get(`${API_URL}/api/majors?departmentId=${selectedDeptId}`);
        if (res.data.success) setMajors(res.data.data);
      } catch { /* silent */ }
    };
    fetchMajors();
  }, [selectedDeptId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/api/auth/register`, {
        fullName, email, password,
        phone: `+967${phoneSuffix}`,
        idNumber, idPhotoUrl: idPhotoUrl || undefined,
        majorId: selectedMajorId, levelId: selectedLevelId, groupId: selectedGroupId,
        captchaAnswer, captchaChallengeId,
      });
      if (res.data?.success) {
        const { token, user } = res.data;
        localStorage.setItem('manar_token', token);
        localStorage.setItem('manar_user', JSON.stringify(user));
        localStorage.setItem('student_profile', JSON.stringify({
          name: user.name, email: user.email,
          phone: `+967${phoneSuffix}`, idPhotoUrl: idPhotoUrl || '',
          department: departments.find(d => d.id === parseInt(selectedDeptId))?.name || '',
          level: levels.find(l => l.id === parseInt(selectedLevelId))?.name || '',
          groupId: user.groupId,
        }));
        toast.success(isAr ? 'تم إنشاء الحساب بنجاح!' : 'Account created successfully!');
        navigate('/student/home');
      }
    } catch (err) {
      const msg = err.response?.data?.error
        || (isAr ? 'فشل التسجيل. حاول مجدداً.' : 'Registration failed. Please try again.');
      setError(msg);
      toast.error(msg);
      fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'cmd-input w-full px-5 py-3.5';
  const selectClass = `${inputClass} appearance-none cursor-pointer`;

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="relative min-h-screen bg-[#000] text-[var(--text-primary)] flex flex-col overflow-hidden"
    >
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-0">
        <div className="ambient-orb absolute top-[-10%] right-[5%] w-[500px] h-[500px] rounded-full"
             style={{ background: 'radial-gradient(circle, rgba(222,255,154,0.10) 0%, transparent 70%)' }} />
        <div className="ambient-orb absolute bottom-[-5%] left-[0%] w-[360px] h-[360px] rounded-full"
             style={{ background: 'radial-gradient(circle, rgba(163,255,112,0.06) 0%, transparent 70%)', animationDelay: '8s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 pt-7">
        <div className="flex items-center gap-3">
          <span className="text-sm font-black tracking-[0.22em] uppercase" style={{ color: 'var(--accent)' }}>
            MANAR
          </span>
          <span className="text-[var(--text-muted)] text-xs font-medium tracking-wide">
            {isAr ? 'كلية المنار الجامعية' : 'Al-Manar University'}
          </span>
        </div>
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

      {/* Main */}
      <main className="relative z-10 flex flex-1 justify-center px-6 py-10">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="w-full max-w-2xl"
        >
          {/* Headline */}
          <motion.div variants={item} className="mb-10">
            <p className="text-[11px] font-black tracking-[0.28em] uppercase mb-3"
               style={{ color: 'var(--accent)' }}>
              {isAr ? 'إنشاء حساب جديد' : 'New Account'}
            </p>
            <h1
              className="font-black leading-none tracking-tighter"
              style={{ fontSize: 'clamp(40px, 7vw, 72px)', color: '#fff' }}
            >
              {isAr ? 'التسجيل' : 'Register'}
            </h1>
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div
              variants={item}
              className="mb-6 px-5 py-3 rounded-xl border text-sm font-semibold"
              style={{ background: 'rgba(220,38,38,0.06)', borderColor: 'rgba(220,38,38,0.25)', color: '#f87171' }}
            >
              ⚠ {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-10">

            {/* ─ Section 1: Account ──────────────────────────── */}
            <motion.div variants={item} className="space-y-5">
              <SectionLabel>{isAr ? '01 — معلومات الحساب' : '01 — Account Info'}</SectionLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label={isAr ? 'الاسم الكامل' : 'Full Name'}>
                  <input type="text" required value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder={isAr ? 'الاسم الرباعي' : 'e.g. Ahmed Al-Rashid'}
                    className={inputClass} />
                </Field>
                <Field label={isAr ? 'البريد الإلكتروني' : 'Email'}>
                  <input type="email" required value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@student.com"
                    className={inputClass} />
                </Field>
                <Field label={isAr ? 'كلمة المرور' : 'Password'}>
                  <input type="password" required value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputClass} font-mono tracking-widest`} />
                </Field>
                <Field label={isAr ? 'رقم الهاتف' : 'Phone Number'}>
                  <div className="cmd-input flex overflow-hidden" style={{ padding: 0 }}>
                    <span className="px-4 flex items-center text-xs font-black border-r"
                          style={{ borderColor: 'var(--border-color)', color: 'var(--accent)', background: 'rgba(222,255,154,0.04)', letterSpacing: '0.05em' }}
                          dir="ltr">
                      +967
                    </span>
                    <input type="tel" required value={phoneSuffix}
                      onChange={e => { const v = e.target.value.replace(/\D/g,''); if (v.length <= 9) setPhoneSuffix(v); }}
                      placeholder="7XXXXXXXX"
                      className="flex-1 bg-transparent px-4 py-3.5 focus:outline-none font-mono text-sm"
                      dir="ltr" />
                  </div>
                </Field>
                <Field label={isAr ? 'الرقم الجامعي' : 'Student ID Number'}>
                  <input type="text" required value={idNumber}
                    onChange={e => setIdNumber(e.target.value)}
                    placeholder="2026-XXXXX"
                    className={`${inputClass} font-mono tracking-widest`} />
                </Field>
                <Field label={isAr ? 'رابط صورة الهوية (اختياري)' : 'ID Photo URL (optional)'}>
                  <input type="url" value={idPhotoUrl}
                    onChange={e => setIdPhotoUrl(e.target.value)}
                    placeholder="https://…"
                    className={inputClass} />
                </Field>
              </div>
            </motion.div>

            {/* ─ Section 2: Academic ─────────────────────────── */}
            <motion.div variants={item} className="space-y-5">
              <SectionLabel>{isAr ? '02 — البرنامج الأكاديمي' : '02 — Academic Program'}</SectionLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label={isAr ? 'الكلية / القسم' : 'Department'}>
                  <select required value={selectedDeptId}
                    onChange={e => setSelectedDeptId(e.target.value)}
                    className={selectClass}
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <option value="">{isAr ? 'اختر القسم' : 'Select department'}</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </Field>
                <Field label={isAr ? 'التخصص' : 'Major'}>
                  <select required disabled={!selectedDeptId} value={selectedMajorId}
                    onChange={e => setSelectedMajorId(e.target.value)}
                    className={`${selectClass} disabled:opacity-30 disabled:cursor-not-allowed`}
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <option value="">{isAr ? 'اختر التخصص' : 'Select major'}</option>
                    {majors.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </Field>
                <Field label={isAr ? 'المستوى الدراسي' : 'Level'}>
                  <select required value={selectedLevelId}
                    onChange={e => setSelectedLevelId(e.target.value)}
                    className={selectClass}
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <option value="">{isAr ? 'اختر المستوى' : 'Select level'}</option>
                    {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </Field>
                <Field label={isAr ? 'الشعبة / المجموعة' : 'Group'}>
                  <select required value={selectedGroupId}
                    onChange={e => setSelectedGroupId(e.target.value)}
                    className={selectClass}
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <option value="">{isAr ? 'اختر الشعبة' : 'Select group'}</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </Field>
              </div>
            </motion.div>

            {/* ─ Section 3: CAPTCHA ──────────────────────────── */}
            <motion.div variants={item} className="space-y-4">
              <SectionLabel>{isAr ? '03 — التحقق البشري' : '03 — Human Verification'}</SectionLabel>
              <div className="frosted-panel rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div>
                  <p className="text-xs font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>
                    {isAr ? 'أجب على السؤال:' : 'Solve the challenge:'}
                  </p>
                  <p className="text-2xl font-black" style={{ color: 'var(--accent)' }}>
                    {captchaQuestion || '…'}
                  </p>
                </div>
                <div className="flex gap-3 items-center w-full sm:w-auto">
                  <input
                    type="number"
                    required
                    placeholder="?"
                    value={captchaAnswer}
                    onChange={e => setCaptchaAnswer(e.target.value)}
                    className="cmd-input w-24 px-4 py-3 text-center font-black text-lg"
                  />
                  <button type="button" onClick={fetchCaptcha}
                          className="btn-ghost px-4 py-3 text-xs">
                    ↺
                  </button>
                </div>
              </div>
            </motion.div>

            {/* ─ Submit ──────────────────────────────────────── */}
            <motion.div variants={item} className="pt-2 space-y-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-neon w-full flex items-center justify-center gap-3"
                style={{ height: '58px', fontSize: '0.95rem', letterSpacing: '0.06em' }}
              >
                {loading ? (
                  <span className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>{isAr ? 'إنشاء الحساب' : 'Create Account'} {isAr ? '←' : '→'}</>
                )}
              </button>

              <p className="text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
                {isAr ? 'لديك حساب بالفعل؟ ' : 'Already have an account? '}
                <button type="button" onClick={() => navigate('/login')}
                        className="font-black underline underline-offset-4 hover:opacity-70 transition-opacity"
                        style={{ color: 'var(--accent)' }}>
                  {isAr ? 'تسجيل الدخول' : 'Sign in'}
                </button>
              </p>
            </motion.div>

          </form>
        </motion.div>
      </main>

      <footer className="relative z-10 text-center pb-7">
        <DevSignature centered={true} />
      </footer>
    </div>
  );
}
