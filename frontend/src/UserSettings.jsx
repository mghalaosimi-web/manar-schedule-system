import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from './config';
import { useTranslation } from 'react-i18next';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const DEPARTMENTS = ['Computer Science', 'Information Systems', 'Software Engineering'];
const LEVELS      = ['Level 1', 'Level 2', 'Level 3', 'Level 4'];
const DAYS        = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

// Schedule helpers (needed for ICS export & share)
const getActiveDay = (s) => {
  if (s.overrides && s.overrides.length > 0) {
    const date = new Date(s.overrides[s.overrides.length - 1].date);
    return DAYS[date.getDay()];
  }
  return s.dayOfWeek;
};
const getActiveStartTime = (s) => {
  if (s.overrides && s.overrides.length > 0) {
    const l = s.overrides[s.overrides.length - 1];
    return l.newStartTime || s.startTime;
  }
  return s.startTime;
};
const getActiveEndTime = (s) => {
  if (s.overrides && s.overrides.length > 0) {
    const l = s.overrides[s.overrides.length - 1];
    return l.newEndTime || s.endTime;
  }
  return s.endTime;
};

// ── Framer Motion variants ────────────────────────────────────────────────────
const containerVariants = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.05 }
  }
};
const sectionVariants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } }
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function calcCompletion(profile) {
  const fields = [
    profile.name,
    profile.email,
    profile.phone,
    profile.idPhotoUrl,
    profile.department,
    profile.level,
    profile.groupId,
  ];
  const filled = fields.filter(f => f && String(f).trim() !== '' && f !== 0).length;
  return Math.round((filled / fields.length) * 100);
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ icon, title, subtitle, children }) {
  return (
    <motion.div variants={sectionVariants} className="w-full max-w-md frosted-panel rounded-2xl overflow-hidden">
      {/* Section header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5 bg-white/[0.015]">
        <span className="text-lg leading-none">{icon}</span>
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-white">{title}</h3>
          {subtitle && <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 font-semibold">{subtitle}</p>}
        </div>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </motion.div>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] block">{label}</label>
      {children}
    </div>
  );
}

// ── Toggle row ────────────────────────────────────────────────────────────────
function ToggleRow({ label, desc, checked, onChange }) {
  return (
    <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5 gap-3">
      <div className="min-w-0">
        <span className="font-bold block text-gray-200 text-xs">{label}</span>
        {desc && <span className="text-[10px] text-gray-500 block mt-0.5">{desc}</span>}
      </div>
      {/* Custom toggle switch */}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`shrink-0 relative inline-flex h-6 w-11 items-center rounded-full border transition-all duration-300 ${
          checked
            ? 'bg-[var(--accent)] border-[var(--accent)]'
            : 'bg-white/10 border-white/10'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform duration-300 ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function UserSettings() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  // ── Profile state ──────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({
    name: '', email: '', phone: '', idPhotoUrl: '',
    department: 'Software Engineering', level: 'Level 3', groupId: 1,
  });
  const [groups, setGroups]     = useState([]);
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // ── Theme state ────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => localStorage.getItem('manar_theme_mode') || 'dark');

  // ── Schedule state (for Quick Tools) ──────────────────────────────────────
  const [schedules, setSchedules]                   = useState([]);
  const [originalSchedules, setOriginalSchedules]   = useState([]);
  const [sandboxMode, setSandboxMode]               = useState(false);

  // ── Notification toggles ────────────────────────────────────────────────────
  const [toggles, setToggles] = useState(() => {
    const saved = localStorage.getItem('student_alert_toggles');
    return saved ? JSON.parse(saved) : { push: true, email: false, sms: true, preAlertTime: '15' };
  });

  const completion = calcCompletion(profile);
  const completionGlow = completion === 100
    ? 'shadow-[0_0_20px_var(--accent-glow)] border-[var(--accent-glow)]'
    : '';

  // ── Effects ────────────────────────────────────────────────────────────────
  // Sync theme to DOM
  useEffect(() => {
    const html = document.documentElement;
    localStorage.setItem('manar_theme_mode', theme);
    if (theme === 'light') {
      html.classList.add('light');
    } else {
      html.classList.remove('light');
    }
    window.dispatchEvent(new Event('themeModeChanged'));
  }, [theme]);

  // Listen to external theme changes (ThemeSwitcher)
  useEffect(() => {
    const onExternal = () => {
      const m = localStorage.getItem('manar_theme_mode') || 'dark';
      if (m !== theme) setTheme(m);
    };
    window.addEventListener('themeModeChanged', onExternal);
    return () => window.removeEventListener('themeModeChanged', onExternal);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  // Persist notification toggles
  useEffect(() => {
    localStorage.setItem('student_alert_toggles', JSON.stringify(toggles));
  }, [toggles]);

  // Load profile + groups
  useEffect(() => {
    // 1) Hydrate from localStorage immediately
    const init = { name: '', email: '', phone: '', idPhotoUrl: '', department: 'Software Engineering', level: 'Level 3', groupId: 1 };
    const saved = localStorage.getItem('student_profile');
    if (saved) {
      try { Object.assign(init, JSON.parse(saved)); } catch {}
    } else {
      const userJson = localStorage.getItem('manar_user');
      if (userJson) {
        try {
          const u = JSON.parse(userJson);
          init.name  = u.name  || '';
          init.email = u.email || '';
          init.phone = u.phone || '';
          init.idPhotoUrl = u.idPhotoUrl || '';
          init.groupId    = u.groupId || 1;
        } catch {}
      }
    }
    setProfile(init);

    // 2) Fetch fresh from API
    const token = localStorage.getItem('manar_token');
    Promise.all([
      axios.get(`${API_URL}/api/student/settings`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }).catch(() => null),
      axios.get(`${API_URL}/api/groups`).catch(() => null),
    ]).then(([profileRes, groupsRes]) => {
      if (profileRes?.data?.success) {
        const s = profileRes.data.data;
        const fresh = {
          name:       s.name        || init.name,
          email:      s.email       || init.email,
          phone:      s.phone       || init.phone,
          idPhotoUrl: s.idPhotoUrl  || init.idPhotoUrl,
          department: s.majorName   || s.departmentName || init.department,
          level:      s.levelName   || init.level,
          groupId:    s.groupId     || init.groupId,
        };
        setProfile(fresh);
        localStorage.setItem('student_profile', JSON.stringify(fresh));
      }
      if (groupsRes?.data?.success) setGroups(groupsRes.data.data);
    });

    // Also load schedules for Quick Tools
    const gId = init.groupId || 1;
    axios.get(`${API_URL}/api/schedules?groupId=${gId}`)
      .then(r => {
        if (r.data?.success) {
          setOriginalSchedules(r.data.data);
          const isSandbox = localStorage.getItem('manar_sandbox_mode') === 'true';
          const savedSandbox = localStorage.getItem('manar_sandbox_schedules');
          if (isSandbox && savedSandbox) {
            try {
              setSchedules(JSON.parse(savedSandbox));
            } catch {
              setSchedules(r.data.data);
            }
          } else {
            setSchedules(r.data.data);
          }
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleSandboxUpdate = () => {
      const isSandbox = localStorage.getItem('manar_sandbox_mode') === 'true';
      setSandboxMode(isSandbox);
      if (isSandbox) {
        const savedSandbox = localStorage.getItem('manar_sandbox_schedules');
        if (savedSandbox) {
          try {
            setSchedules(JSON.parse(savedSandbox));
          } catch {}
        }
      } else {
        setSchedules(originalSchedules);
      }
    };
    window.addEventListener('MANAR_SANDBOX_UPDATE', handleSandboxUpdate);
    return () => window.removeEventListener('MANAR_SANDBOX_UPDATE', handleSandboxUpdate);
  }, [originalSchedules]);

  // ── Save profile ───────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const token = localStorage.getItem('manar_token');
    try {
      const res = await axios.put(`${API_URL}/api/student/settings`, {
        name:           profile.name,
        email:          profile.email,
        phone:          profile.phone,
        idPhotoUrl:     profile.idPhotoUrl,
        groupId:        profile.groupId,
        departmentName: profile.department,
        levelName:      profile.level,
        password:       password || undefined,
      }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

      if (res.data?.success) {
        const d = res.data.data;
        const updated = {
          name:       d.name,
          email:      d.email,
          phone:      d.phone       || '',
          idPhotoUrl: d.idPhotoUrl  || '',
          department: d.majorName   || profile.department,
          level:      d.levelName   || profile.level,
          groupId:    d.groupId,
        };
        localStorage.setItem('student_profile', JSON.stringify(updated));
        const uJson = localStorage.getItem('manar_user');
        if (uJson) {
          try {
            const u = JSON.parse(uJson);
            Object.assign(u, { name: d.name, email: d.email, phone: d.phone, idPhotoUrl: d.idPhotoUrl, groupId: d.groupId });
            localStorage.setItem('manar_user', JSON.stringify(u));
          } catch {}
        }
        setProfile(updated);
        setPassword('');
        toast.success(t('userSettings.savedSuccess'));
      } else throw new Error('API failed');
    } catch (err) {
      const msg = err.response?.data?.error || (isAr ? 'فشل في الحفظ.' : 'Save failed.');
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const toggleTheme = () => setTheme(p => p === 'dark' ? 'light' : p === 'light' ? 'system' : 'dark');

  const themeLabel = () => {
    if (theme === 'light')  return isAr ? '☀️ النهار' : '☀️ Day';
    if (theme === 'system') return isAr ? '💻 تلقائي' : '💻 System';
    return isAr ? '🌙 الليل' : '🌙 Night';
  };

  const deptLabel = (d) => {
    const map = { 'Computer Science': isAr ? 'علوم الحاسوب' : 'Computer Science', 'Information Systems': isAr ? 'نظم المعلومات' : 'Information Systems', 'Software Engineering': isAr ? 'هندسة البرمجيات' : 'Software Engineering' };
    return map[d] || d;
  };

  // ── Quick Tools actions ───────────────────────────────────────────────
  const handleExportICS = () => {
    if (schedules.length === 0) {
      toast.error(isAr ? 'لا توجد محاضرات لتصديرها' : 'No lectures to export');
      return;
    }
    const groupName = profile.groupId ? (groups.find(g => g.id === profile.groupId)?.name || 'Student') : 'Student';
    const dayOffsets = { SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6 };
    let lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Manar//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH'];
    schedules.forEach(item => {
      const today = new Date();
      const diff = (dayOffsets[item.dayOfWeek] ?? 0) - today.getDay();
      const d = new Date(); d.setDate(today.getDate() + diff);
      const ds = d.toISOString().slice(0, 10).replace(/-/g, '');
      lines.push('BEGIN:VEVENT', `UID:lecture-${item.id}@manar.edu`, `DTSTAMP:${ds}T000000Z`,
        `DTSTART;TZID=Asia/Aden:${ds}T${item.startTime.replace(/:/g, '')}00`,
        `DTEND;TZID=Asia/Aden:${ds}T${item.endTime.replace(/:/g, '')}00`,
        `SUMMARY:${item.subject.name} (${item.subject.code})`,
        `LOCATION:${item.room?.name || 'Classroom'}`,
        `DESCRIPTION:Lecturer: ${item.lecturerName}`,
        'RRULE:FREQ=WEEKLY;BYDAY=' + item.dayOfWeek.slice(0, 2), 'END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `Manar_Schedule_${groupName}.ics`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(isAr ? 'تم تصدير ملف التقويم بنجاح!' : 'Calendar exported!');
  };

  const buildScheduleText = () => {
    const dayLabels = isAr
      ? { SUNDAY: 'الأحد', MONDAY: 'الاثنين', TUESDAY: 'الثلاثاء', WEDNESDAY: 'الأربعاء', THURSDAY: 'الخميس', FRIDAY: 'الجمعة', SATURDAY: 'السبت' }
      : { SUNDAY: 'Sunday', MONDAY: 'Monday', TUESDAY: 'Tuesday', WEDNESDAY: 'Wednesday', THURSDAY: 'Thursday', FRIDAY: 'Friday', SATURDAY: 'Saturday' };
    let text = isAr ? `📅 الجدول الدراسي — كلية المنار الجامعية\n` : `📅 Class Schedule — Al-Manar University\n`;
    DAYS.forEach(day => {
      const ds = schedules.filter(s => getActiveDay(s) === day);
      if (ds.length > 0) {
        text += `\n🔹 ${dayLabels[day]}:\n`;
        ds.forEach(s => {
          text += `   [${getActiveStartTime(s)}-${getActiveEndTime(s)}] ${s.subject.name} | ${s.room?.name || 'N/A'} | ${s.lecturerName}\n`;
        });
      }
    });
    text += `\n— ${isAr ? 'بوابة المنار الذكية' : 'Manar Smart Portal'} 💡`;
    return text;
  };

  const handleShareSchedule = async () => {
    if (schedules.length === 0) {
      toast.error(isAr ? 'الجدول فارغ' : 'Schedule is empty');
      return;
    }
    const text = buildScheduleText();
    if (navigator.share) {
      try {
        await navigator.share({ title: isAr ? 'جدولي الدراسي — كلية المنار' : 'My Schedule — Al-Manar', text });
        toast.success(isAr ? 'تمت المشاركة!' : 'Shared!');
      } catch (e) { if (e.name !== 'AbortError') toast.error(isAr ? 'فشلت المشاركة' : 'Share failed'); }
    } else {
      navigator.clipboard.writeText(text)
        .then(() => toast.success(isAr ? 'تم نسخ الجدول!' : 'Copied to clipboard!'))
        .catch(() => toast.error(isAr ? 'فشل النسخ' : 'Copy failed'));
    }
  };

  const handleTestNotification = async () => {
    if (!('Notification' in window)) {
      toast.error(isAr ? 'التنبيهات غير مدعومة في هذا المتصفح' : 'Notifications not supported in this browser');
      return;
    }

    const sendNative = () => {
      new Notification(
        isAr ? 'كلية المنارة الجامعية' : 'Al-Manar University College',
        {
          body: isAr ? 'هذا تنبيه تجريبي، النظام يعمل بنجاح!' : 'This is a test notification, the system is working successfully!',
          icon: '/pwa-192x192.png',
          vibrate: [200, 100, 200]
        }
      );
      toast.success(isAr ? 'تم إرسال التنبيه التجريبي!' : 'Test notification sent!');
    };

    if (Notification.permission === 'granted') {
      sendNative();
    } else if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          sendNative();
        } else {
          toast.error(isAr ? 'لم يتم منح إذن التنبيهات' : 'Notification permission denied');
        }
      } catch (err) {
        console.error('Permission request failed', err);
      }
    } else {
      toast.error(isAr ? 'التنبيهات محظورة في إعدادات المتصفح' : 'Notifications blocked in browser settings');
    }
  };

  const toggleSandbox = () => {
    if (sandboxMode) {
      localStorage.removeItem('manar_sandbox_mode');
      localStorage.removeItem('manar_sandbox_schedules');
      setSchedules(originalSchedules);
      setSandboxMode(false);
      window.dispatchEvent(new Event('MANAR_SANDBOX_UPDATE'));
      toast.success(isAr ? 'تم استعادة الجدول الرسمي!' : 'Official timetable restored!');
    } else {
      localStorage.setItem('manar_sandbox_mode', 'true');
      localStorage.setItem('manar_sandbox_schedules', JSON.stringify(schedules));
      setSandboxMode(true);
      window.dispatchEvent(new Event('MANAR_SANDBOX_UPDATE'));
      toast.success(isAr ? 'محاكي نشط! انتقل للصفحة الرئيسية لتجربة تعديل الحصص.' : 'Simulator active! Go to Home screen to reschedule.', { icon: '🧪' });
    }
  };

  const CMD_BUTTONS = [
    {
      icon: '📅',
      label: isAr ? 'تصدير التقويم' : 'Export Calendar',
      sub: isAr ? 'مزامنة مع Google / iOS' : 'Sync to Google / iOS',
      onClick: handleExportICS,
      glow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.22)] hover:border-blue-500/40',
    },
    {
      icon: navigator.share ? '📤' : '🔗',
      label: isAr ? 'مشاركة الجدول' : 'Share Schedule',
      sub: isAr ? (navigator.share ? 'مشاركة فورية' : 'نسخ للحافظة') : (navigator.share ? 'Native share' : 'Copy to clipboard'),
      onClick: handleShareSchedule,
      glow: 'hover:shadow-[0_0_20px_rgba(139,92,246,0.22)] hover:border-violet-500/40',
    },
    {
      icon: sandboxMode ? '🔄' : '🧪',
      label: sandboxMode ? (isAr ? 'إنهاء المحاكاة' : 'Exit Simulator') : (isAr ? 'محاكي التعديل' : 'Reschedule Sim'),
      sub: sandboxMode ? (isAr ? 'استعادة الجدول' : 'Restore timetable') : (isAr ? 'تجربة تعديل محلية' : 'Local simulation'),
      onClick: toggleSandbox,
      glow: sandboxMode
        ? 'border-amber-500/50 bg-amber-500/8 shadow-[0_0_16px_rgba(245,158,11,0.2)]'
        : 'hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:border-amber-500/40',
    },
    {
      icon: '🔔',
      label: isAr ? 'اختبار التنبيه' : 'Test Notification',
      sub: isAr ? 'إرسال تنبيه تجريبي' : 'Send mock push alert',
      onClick: handleTestNotification,
      glow: 'hover:shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:border-yellow-500/40',
    },
  ];

  const avatarUrl = profile.idPhotoUrl
    ? profile.idPhotoUrl
    : `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(profile.name || 'student')}`;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      dir={isAr ? 'rtl' : 'ltr'}
      className="flex-1 w-full bg-transparent p-4 md:p-6 flex flex-col items-center space-y-4 text-[var(--text-primary)]"
    >

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          Profile Completion Progress
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <motion.div
        variants={sectionVariants}
        className={`w-full max-w-md frosted-panel rounded-2xl p-5 border ${completionGlow} transition-all duration-500`}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
              {isAr ? 'اكتمال الملف الشخصي' : 'Profile Completion'}
            </p>
            <p className="text-xs font-bold text-white mt-0.5">
              {completion === 100
                ? (isAr ? '✅ ملفك مكتمل 100%' : '✅ Profile 100% complete')
                : (isAr ? `${completion}% مكتمل — أكمل بياناتك أدناه` : `${completion}% — Fill in remaining fields below`)}
            </p>
          </div>
          <span
            className={`text-2xl font-black tabular-nums ${
              completion === 100 ? 'text-[var(--accent)]' : 'text-gray-400'
            }`}
          >
            {completion}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-white/8 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completion}%` }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
            className={`h-full rounded-full transition-all ${
              completion === 100
                ? 'bg-[var(--accent)] shadow-[0_0_10px_var(--accent-glow)]'
                : 'bg-gradient-to-r from-[var(--accent)] to-emerald-400'
            }`}
          />
        </div>

        {/* Field status pills */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {[
            { key: profile.name,        label: isAr ? 'الاسم'   : 'Name' },
            { key: profile.email,       label: isAr ? 'البريد'  : 'Email' },
            { key: profile.phone,       label: isAr ? 'الهاتف'  : 'Phone' },
            { key: profile.idPhotoUrl,  label: isAr ? 'الصورة'  : 'Photo' },
            { key: profile.department,  label: isAr ? 'التخصص'  : 'Major' },
            { key: profile.level,       label: isAr ? 'المستوى' : 'Level' },
            { key: profile.groupId,     label: isAr ? 'الشعبة'  : 'Group' },
          ].map(({ key, label }) => {
            const done = key && String(key).trim() !== '' && key !== 0;
            return (
              <span
                key={label}
                className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                  done
                    ? 'bg-[var(--accent-dim)] border-[var(--accent-glow)] text-[var(--accent)]'
                    : 'bg-red-500/8 border-red-500/20 text-red-400'
                }`}
              >
                {done ? '✓' : '○'} {label}
              </span>
            );
          })}
        </div>
      </motion.div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION A — Academic Identity
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section
        icon="🎓"
        title={isAr ? 'الهوية الأكاديمية' : 'Academic Identity'}
        subtitle={isAr ? 'صورتك، اسمك، تخصصك، مستواك وشعبتك' : 'Avatar, name, major, level & group'}
      >
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative group">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-[var(--accent)]/40 shadow-lg bg-[#0a0a0a] transition-all group-hover:border-[var(--accent)]">
              <img
                src={avatarUrl}
                alt="avatar"
                className="w-full h-full object-cover"
                onError={e => {
                  e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(profile.name || 'student')}`;
                }}
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-[var(--accent)] text-black p-1 rounded-full text-[10px] font-black shadow">📸</div>
          </div>

          {/* File upload */}
          <input
            type="file"
            accept="image/*"
            id="avatarUpload"
            className="hidden"
            onChange={e => {
              const file = e.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onloadend = () => setProfile(p => ({ ...p, idPhotoUrl: reader.result }));
              reader.readAsDataURL(file);
              toast.success(isAr ? 'تم تحميل الصورة!' : 'Photo uploaded!');
            }}
          />
          <label
            htmlFor="avatarUpload"
            className="cmd-input flex items-center justify-between px-4 cursor-pointer w-full max-w-xs hover:border-[var(--accent)] transition-colors"
            style={{ height: '48px' }}
          >
            <span className="text-[var(--text-secondary)] text-xs font-semibold truncate">
              {profile.idPhotoUrl ? (isAr ? '✅ صورة محددة' : '✅ Photo selected') : (isAr ? 'اختر صورة...' : 'Choose photo...')}
            </span>
            <span className="text-[9px] font-black uppercase tracking-wide bg-white/5 border border-white/10 px-2 py-1 rounded shrink-0">
              {isAr ? 'رفع' : 'Browse'}
            </span>
          </label>
        </div>

        {/* Name */}
        <Field label={t('userSettings.nameLabel')}>
          <input
            type="text"
            required
            value={profile.name}
            onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
            className="cmd-input w-full px-4 font-bold"
            style={{ height: '52px' }}
            placeholder={isAr ? 'الاسم الكامل' : 'Full name'}
          />
        </Field>

        {/* Major */}
        <Field label={t('userSettings.majorLabel')}>
          <select
            value={profile.department}
            onChange={e => setProfile(p => ({ ...p, department: e.target.value }))}
            className="cmd-input w-full px-4 font-semibold cursor-pointer"
            style={{ height: '52px' }}
          >
            {DEPARTMENTS.map(d => (
              <option key={d} value={d} className="bg-[#0c0c0c]">{deptLabel(d)}</option>
            ))}
          </select>
        </Field>

        {/* Level + Group */}
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('userSettings.levelLabel')}>
            <select
              value={profile.level}
              onChange={e => setProfile(p => ({ ...p, level: e.target.value }))}
              className="cmd-input w-full px-3 font-semibold cursor-pointer"
              style={{ height: '52px' }}
            >
              {LEVELS.map(l => (
                <option key={l} value={l} className="bg-[#0c0c0c]">
                  {l.replace('Level', isAr ? 'المستوى' : 'Level')}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t('userSettings.groupLabel')}>
            <select
              value={profile.groupId}
              onChange={e => setProfile(p => ({ ...p, groupId: parseInt(e.target.value) }))}
              className="cmd-input w-full px-3 font-bold cursor-pointer"
              style={{ height: '52px' }}
            >
              {groups.map(g => (
                <option key={g.id} value={g.id} className="bg-[#0c0c0c]">{g.name}</option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION B — Contact & Security
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section
        icon="🔐"
        title={isAr ? 'التواصل والأمان' : 'Contact & Security'}
        subtitle={isAr ? 'بريدك الإلكتروني، هاتفك وكلمة المرور' : 'Email, phone & password'}
      >
        <div className="grid grid-cols-1 gap-4">
          <Field label={t('userSettings.emailLabel')}>
            <input
              type="email"
              required
              value={profile.email}
              onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
              className="cmd-input w-full px-4 font-semibold"
              style={{ height: '52px' }}
              dir="ltr"
              placeholder="student@manar.edu"
            />
          </Field>

          <Field label={t('userSettings.phoneLabel')}>
            <input
              type="tel"
              value={profile.phone}
              onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
              className="cmd-input w-full px-4 font-semibold"
              style={{ height: '52px' }}
              dir="ltr"
              placeholder="+967 7XX XXX XXXX"
            />
          </Field>

          <Field label={t('userSettings.passwordLabel')}>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="cmd-input w-full px-4 font-mono"
              style={{ height: '52px' }}
              dir="ltr"
              placeholder={t('userSettings.passwordPlaceholder')}
            />
          </Field>
        </div>

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="w-full btn-neon font-black text-xs tracking-wider rounded-xl transition-all"
          style={{ height: '56px' }}
        >
          {isSaving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              {isAr ? 'جاري الحفظ...' : 'Saving...'}
            </span>
          ) : (
            `💾 ${t('userSettings.saveBtn')}`
          )}
        </button>
      </Section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION D — Quick Tools & Features
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section
        icon="🛠️"
        title={isAr ? 'أدوات وميزات سريعة' : 'Quick Tools & Features'}
        subtitle={isAr ? 'تصدير الجدول، المشاركة، المحاكاة والتنبيهات' : 'Export, share, simulator & notifications'}
      >
        {/* 4-card grid */}
        <div className="grid grid-cols-2 gap-3">
          {CMD_BUTTONS.map((btn, i) => (
            <motion.button
              key={i}
              onClick={btn.onClick}
              whileTap={{ scale: 0.96 }}
              whileHover={{ y: -2 }}
              className={`rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2.5 transition-all duration-300 border border-white/8 bg-white/3 ${btn.glow} min-h-[96px]`}
            >
              <span className="text-2xl leading-none">{btn.icon}</span>
              <div>
                <span className="text-[11px] font-black block text-white leading-tight">{btn.label}</span>
                <span className="text-[9px] text-gray-500 block mt-0.5 font-bold">{btn.sub}</span>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Simulator active notice */}
        <AnimatePresence>
          {sandboxMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden rounded-xl border border-amber-500/40 bg-amber-500/8 px-4 py-3 flex items-center gap-2"
            >
              <span className="text-amber-400 text-sm">🧪</span>
              <div>
                <p className="text-[10px] font-black text-amber-400 uppercase tracking-wide">
                  {isAr ? 'محاكي التعديل نشط' : 'Reschedule Simulator Active'}
                </p>
                <p className="text-[9px] text-gray-400 font-bold mt-0.5">
                  {isAr ? 'انتقل للصفحة الرئيسية وانقر على محاضرة لتجربة تعديلها' : 'Go to Home screen and tap a lecture to simulate.'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Section>



      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION C — App Preferences
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section
        icon="⚙️"
        title={isAr ? 'تفضيلات التطبيق' : 'App Preferences'}
        subtitle={isAr ? 'المظهر، اللغة والإشعارات' : 'Theme, language & notifications'}
      >

        {/* Language */}
        <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
          <div>
            <span className="font-bold block text-gray-200 text-xs">{t('settings.language')}</span>
            <span className="text-[10px] text-gray-500 block mt-0.5">App Language / لغة التطبيق</span>
          </div>
          <div className="flex gap-1.5">
            {['en', 'ar'].map(lang => (
              <button
                key={lang}
                type="button"
                onClick={() => i18n.changeLanguage(lang)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all duration-200 ${
                  i18n.language === lang
                    ? 'bg-[var(--accent)] text-black border-[var(--accent)] shadow-md shadow-[var(--accent-glow)]'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                }`}
              >
                {lang === 'en' ? 'EN' : 'عربي'}
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
          <div>
            <span className="font-bold block text-gray-200 text-xs">{t('settings.theme')}</span>
            <span className="text-[10px] text-gray-500 block mt-0.5">{t('settings.themeModeDesc')}</span>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center gap-1.5 font-black text-gray-200 text-xs transition-all duration-200 shrink-0"
          >
            {themeLabel()}
          </button>
        </div>

        {/* Notification toggles */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
            {isAr ? 'قنوات التنبيهات' : 'Notification Channels'}
          </p>
          <ToggleRow
            label={t('settings.channelPush')}
            desc={t('settings.channelPushDesc')}
            checked={toggles.push}
            onChange={v => setToggles(p => ({ ...p, push: v }))}
          />
          <ToggleRow
            label={t('settings.channelSms')}
            desc={t('settings.channelSmsDesc')}
            checked={toggles.sms}
            onChange={v => setToggles(p => ({ ...p, sms: v }))}
          />
          <ToggleRow
            label={t('settings.channelEmail')}
            desc={t('settings.channelEmailDesc')}
            checked={toggles.email}
            onChange={v => setToggles(p => ({ ...p, email: v }))}
          />
        </div>

        {/* Pre-alert offset */}
        <Field label={t('settings.warningOffset')}>
          <select
            value={toggles.preAlertTime}
            onChange={e => setToggles(p => ({ ...p, preAlertTime: e.target.value }))}
            className="cmd-input w-full px-4 font-bold cursor-pointer"
            style={{ height: '52px' }}
          >
            <option value="5"  className="bg-[#0c0c0c]">{t('settings.minutesBefore', { count: 5 })}</option>
            <option value="15" className="bg-[#0c0c0c]">{t('settings.minutesBefore', { count: 15 })}</option>
            <option value="30" className="bg-[#0c0c0c]">{t('settings.minutesBefore', { count: 30 })}</option>
            <option value="60" className="bg-[#0c0c0c]">{t('settings.hourBefore')}</option>
          </select>
        </Field>

        {/* Download Android App */}
        <a
          href="/Manar_Schedule.apk"
          download
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-[var(--accent-dim)] border border-[var(--accent-glow)] hover:bg-[var(--accent)] hover:text-black text-[var(--accent)] rounded-xl text-xs font-black transition-all duration-200 text-center"
          style={{ textDecoration: 'none' }}
        >
          <span>🤖</span>
          <span>{isAr ? 'تنزيل تطبيق الأندرويد (APK)' : 'Download Android App (APK)'}</span>
        </a>

        {/* Check for updates */}
        <button
          type="button"
          onClick={() => {
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then(regs => {
                regs.forEach(r => r.update());
              });
            }
            toast.success(isAr ? 'جاري التحقق من التحديثات...' : 'Checking for updates...', { icon: '🔄' });
          }}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-white/4 border border-white/8 hover:bg-white/8 hover:border-white/15 text-white rounded-xl text-xs font-black transition-all duration-200"
        >
          <span>📥</span>
          <span>{isAr ? 'التحقق من التحديثات' : 'Check for Updates'}</span>
        </button>
      </Section>

      {/* Bottom spacer for nav dock */}
      <div style={{ height: '32px' }} />
    </motion.div>
  );
}
