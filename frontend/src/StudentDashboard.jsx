import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from './config';
import usePWAInstall from './usePWAInstall';

const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const MOCK_SCHEDULES = [
  {
    id: 1,
    subject: { name: 'Database Systems', code: 'CS-301', type: 'THEORY' },
    room: { name: 'Hall 3A' },
    lecturerName: 'Dr. Ahmad Masri',
    group: { name: 'Group A' },
    dayOfWeek: 'SUNDAY',
    startTime: '08:00',
    endTime: '10:00',
    overrides: []
  },
  {
    id: 2,
    subject: { name: 'Web Development Lab', code: 'CS-302', type: 'PRACTICAL' },
    room: { name: 'Lab 5' },
    lecturerName: 'Eng. Sarah Taji',
    group: { name: 'Group A' },
    dayOfWeek: 'MONDAY',
    startTime: '10:00',
    endTime: '12:00',
    overrides: []
  },
  {
    id: 3,
    subject: { name: 'Software Engineering', code: 'CS-303', type: 'THEORY' },
    room: { name: 'Hall 1B' },
    lecturerName: 'Dr. Manar Al-Saeed',
    group: { name: 'Group A' },
    dayOfWeek: 'TUESDAY',
    startTime: '12:00',
    endTime: '14:00',
    overrides: []
  }
];

// ── Schedule helper hooks ──────────────────────────────────────────────
const getActiveDay = (schedule) => {
  if (schedule.overrides && schedule.overrides.length > 0) {
    const latest = schedule.overrides[schedule.overrides.length - 1];
    const date = new Date(latest.date);
    return DAYS[date.getDay()];
  }
  return schedule.dayOfWeek;
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

const isOverridden = (s) => s.overrides && s.overrides.length > 0;

// ── Smart Greeting Header ──────────────────────────────────────────────
function SmartGreetingHeader({ profile, groupName, isAr }) {
  const now = new Date();
  const hour = now.getHours();

  let emoji, greeting, bgAccent, textAccent;
  if (hour >= 5 && hour < 12) {
    emoji = '🌅'; greeting = isAr ? 'صباح الخير' : 'Good Morning';
    bgAccent = 'from-amber-500/15 to-transparent'; textAccent = 'text-amber-400';
  } else if (hour >= 12 && hour < 17) {
    emoji = '☀️'; greeting = isAr ? 'طاب يومك' : 'Good Afternoon';
    bgAccent = 'from-cyan-500/15 to-transparent'; textAccent = 'text-cyan-400';
  } else if (hour >= 17 && hour < 22) {
    emoji = '🌇'; greeting = isAr ? 'مساء الخير' : 'Good Evening';
    bgAccent = 'from-violet-500/15 to-transparent'; textAccent = 'text-violet-400';
  } else {
    emoji = '🌙'; greeting = isAr ? 'مساء النور' : 'Good Night';
    bgAccent = 'from-indigo-500/10 to-transparent'; textAccent = 'text-indigo-400';
  }

  const firstName = profile.name?.split(' ')[0] || (isAr ? 'الطالب' : 'Student');
  const avatarUrl = profile.idPhotoUrl
    ? profile.idPhotoUrl
    : `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(profile.name || 'student')}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${bgAccent} border border-white/8 backdrop-blur-xl p-4 flex items-center justify-between gap-4`}
    >
      {/* Ambient glow */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/3 blur-2xl pointer-events-none" />

      <div className="flex items-center gap-3 min-w-0">
        {/* Mini avatar */}
        <div className="w-11 h-11 rounded-xl overflow-hidden border border-white/10 shadow-md shrink-0 bg-[#111]">
          <img
            src={avatarUrl}
            alt="avatar"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(profile.name || 'student')}`;
            }}
          />
        </div>

        {/* Greeting text */}
        <div className="min-w-0">
          <p className={`text-[10px] font-black uppercase tracking-widest ${textAccent}`}>
            {emoji} {greeting}
          </p>
          <p className="text-sm font-black text-white truncate leading-tight mt-0.5">
            {firstName}
          </p>
        </div>
      </div>

      {/* Group badge */}
      {groupName && (
        <div
          className={`shrink-0 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${textAccent} border-current bg-white/5 flex items-center gap-1`}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
          </span>
          {groupName}
        </div>
      )}
    </motion.div>
  );
}

// ── Daily Progress Summary ────────────────────────────────────────────
function DailyProgress({ schedules, getActiveDay: gad, getActiveStartTime: gast, isAr }) {
  const now = new Date();
  const todayName = DAYS[now.getDay()];
  const currentTime = now.toTimeString().substring(0, 5);

  const todayAll = schedules.filter(s => gad(s) === todayName);
  const done = todayAll.filter(s => gast(s) < currentTime).length;
  const total = todayAll.length;
  const remaining = total - done;
  const pct = total === 0 ? 100 : Math.round((done / total) * 100);
  const allDone = total > 0 && remaining === 0;

  if (total === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className={`rounded-2xl border p-4 ${
        allDone
          ? 'border-[var(--accent-glow)] bg-[var(--accent-dim)] shadow-[0_0_20px_var(--accent-glow)]'
          : 'border-white/8 bg-white/3'
      }`}
    >
      <div className="flex justify-between items-center mb-2.5">
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
          {isAr ? 'تقدم اليوم الدراسي' : "Today's Progress"}
        </p>
        <span className={`text-[10px] font-black ${allDone ? 'text-[var(--accent)]' : 'text-gray-400'}`}>
          {allDone
            ? (isAr ? '✅ أنهيت يومك!' : '✅ All done!')
            : (isAr ? `${remaining} من ${total} متبقية` : `${remaining} of ${total} remaining`)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          className={`h-full rounded-full ${
            allDone
              ? 'bg-[var(--accent)] shadow-[0_0_8px_var(--accent-glow)]'
              : 'bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2,#84cc16)]'
          }`}
        />
      </div>

      <div className="flex justify-between mt-1.5">
        <span className="text-[9px] text-[var(--text-secondary)] font-bold">
          {done} {isAr ? 'مكتمل' : 'completed'}
        </span>
        <span className="text-[9px] text-[var(--text-secondary)] font-bold">{pct}%</span>
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────
export default function StudentDashboard() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { isInstallable, installApp } = usePWAInstall();

  const handleInstallClick = async () => {
    const success = await installApp();
    if (success) {
      toast.success(
        isAr ? 'تم بدء التثبيت بنجاح!' : 'Installation started successfully!',
        { style: { background: '#1f2937', color: '#f3f4f6', border: '1px solid #374151' } }
      );
    }
  };

  const getInitialProfile = () => {
    const userJson = localStorage.getItem('manar_user');
    let base = { name: 'Student', email: '', phone: '', idPhotoUrl: '', department: '', level: '', groupId: 1, groupName: 'Group A' };
    if (userJson) {
      try {
        const u = JSON.parse(userJson);
        base = { ...base, name: u.name || base.name, email: u.email || '', phone: u.phone || '', idPhotoUrl: u.idPhotoUrl || '', groupId: u.groupId || 1 };
      } catch {}
    }
    const saved = localStorage.getItem('student_profile');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        return { ...base, ...p };
      } catch {}
    }
    return base;
  };

  const [profile, setProfile] = useState(getInitialProfile);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(() => getInitialProfile().groupId);

  // ── Data fetching ───────────────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('manar_token');
        const [schedRes, groupsRes, profileRes] = await Promise.all([
          axios.get(`${API_URL}/api/schedules?groupId=${selectedGroupId}`),
          axios.get(`${API_URL}/api/groups`),
          axios.get(`${API_URL}/api/student/settings`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          }).catch(() => null)
        ]);

        if (groupsRes.data?.success) {
          setGroups(groupsRes.data.data);
          const active = groupsRes.data.data.find(g => g.id === selectedGroupId);
          if (active) setProfile(p => ({ ...p, groupId: selectedGroupId, groupName: active.name }));
        }

        if (profileRes?.data?.success) {
          const s = profileRes.data.data;
          setProfile(p => ({
            ...p,
            name: s.name || p.name,
            email: s.email || p.email,
            phone: s.phone || p.phone,
            idPhotoUrl: s.idPhotoUrl || p.idPhotoUrl,
            department: s.departmentName || s.majorName || p.department,
            level: s.levelName || p.level,
            groupId: s.groupId || p.groupId,
            groupName: s.groupName || p.groupName
          }));
        }

        if (schedRes.data?.success) {
          setSchedules(schedRes.data.data);
        } else throw new Error('API failed');
      } catch {
        setSchedules(MOCK_SCHEDULES);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [selectedGroupId]);

  useEffect(() => {
    const fetchToast = async () => {
      if (sessionStorage.getItem('manar_welcome_toast_shown')) return;
      try {
        const token = localStorage.getItem('manar_token');
        const res = await axios.get(`${API_URL}/api/notifications/student`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.data?.success && res.data.data.length > 0) {
          toast(res.data.data[0].message, { duration: 6000, icon: '📢' });
          sessionStorage.setItem('manar_welcome_toast_shown', 'true');
        }
      } catch {}
    };
    fetchToast();

    const onUpdate = () => {
      axios.get(`${API_URL}/api/schedules?groupId=${selectedGroupId}`)
        .then(r => { if (r.data?.success) setSchedules(r.data.data); })
        .catch(() => {});
    };
    window.addEventListener('MANAR_SCHEDULE_UPDATE', onUpdate);
    return () => window.removeEventListener('MANAR_SCHEDULE_UPDATE', onUpdate);
  }, [selectedGroupId]);

  const getNextLecture = () => {
    if (!schedules.length) return null;
    const now = new Date();
    const todayName = DAYS[now.getDay()];
    const curTime = now.toTimeString().substring(0, 5);
    const todayLeft = schedules.filter(s => getActiveDay(s) === todayName && getActiveStartTime(s) > curTime);
    if (todayLeft.length > 0) return todayLeft.sort((a, b) => getActiveStartTime(a).localeCompare(getActiveStartTime(b)))[0];
    let idx = (now.getDay() + 1) % 7;
    for (let i = 0; i < 7; i++) {
      const name = DAYS[idx];
      const lecs = schedules.filter(s => getActiveDay(s) === name);
      if (lecs.length > 0) return lecs.sort((a, b) => getActiveStartTime(a).localeCompare(getActiveStartTime(b)))[0];
      idx = (idx + 1) % 7;
    }
    return schedules[0];
  };

  const nextLecture = getNextLecture();
  const todayIndex = new Date().getDay();
  const todayName = DAYS[todayIndex];
  const todayLectures = schedules.filter(s => getActiveDay(s) === todayName);

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex-1 w-full p-4 md:p-6 flex flex-col items-center"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="w-full max-w-md space-y-4 pb-28">

        {/* ── Smart Greeting Header ─────────────────────────── */}
        <SmartGreetingHeader
          profile={profile}
          groupName={profile.groupName}
          isAr={isAr}
        />

        {/* ── Daily Progress Summary ────────────────────────── */}
        <DailyProgress
          schedules={schedules}
          getActiveDay={getActiveDay}
          getActiveStartTime={getActiveStartTime}
          isAr={isAr}
        />



        {/* ── Group Switcher ────────────────────────────────── */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 space-y-2.5">
          <label className="text-[9px] font-black tracking-widest uppercase text-[var(--text-secondary)]">
            {isAr ? 'عرض جدول شعبة:' : 'View Schedule for Group:'}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {groups.map(g => (
              <button
                key={g.id}
                onClick={() => setSelectedGroupId(g.id)}
                className={`px-3.5 py-2 rounded-xl text-[10px] font-black tracking-wider uppercase border transition-all duration-200 ${
                  selectedGroupId === g.id
                    ? 'bg-[var(--accent)] border-[var(--accent)] text-black shadow-lg shadow-[var(--accent-glow)] scale-105'
                    : 'bg-white/3 border-white/5 hover:bg-white/8 text-[var(--text-primary)]'
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>

        {/* ── PWA Install Prompt ────────────────────────────── */}
        <AnimatePresence>
          {isInstallable && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative overflow-hidden rounded-2xl border border-[var(--accent-glow)] bg-[var(--accent-dim)] p-4 flex justify-between items-center gap-3 shadow-xl"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">📱</span>
                <div>
                  <h4 className="text-xs font-black text-[var(--accent)]">
                    {isAr ? 'تثبيت التطبيق' : 'Install App'}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                    {isAr ? 'وصول سريع وتنبيهات فورية' : 'Quick access & push alerts'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleInstallClick}
                className="btn-neon px-4 py-2.5 text-xs rounded-xl active:scale-95 shadow-lg shadow-[var(--accent-glow)] whitespace-nowrap shrink-0"
              >
                {isAr ? 'تثبيت' : 'Install'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Next Lecture Alert ────────────────────────────── */}
        <section className="space-y-3">
          <h2 className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] px-1">
            {t('dashboard.activeAlert')}
          </h2>
          {nextLecture ? (
            <motion.div
              whileTap={{ scale: 0.985 }}
              style={{}}
              className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-red-950/20 backdrop-blur-md p-5 shadow-[0_0_24px_rgba(239,68,68,0.18)] space-y-4"
            >
              <div className="self-start flex items-center gap-1.5 bg-red-500/10 border border-red-500/25 px-2.5 py-0.5 rounded-full text-[9px] font-bold text-red-400 uppercase tracking-wide w-fit">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                </span>
                {t('dashboard.nextStartsIn')}
              </div>

              <div>
                <h3 className="text-xl font-black text-white leading-tight">{nextLecture.subject.name}</h3>
                <p className="text-xs font-mono text-red-300 mt-1 font-semibold">{nextLecture.subject.code}</p>
              </div>

              <div className="grid grid-cols-2 gap-y-3 gap-x-4 pt-3 border-t border-white/8 text-xs">
                {[
                  { label: t('dashboard.timeSlot'), val: `${getActiveStartTime(nextLecture)} - ${getActiveEndTime(nextLecture)}` },
                  { label: t('dashboard.classroom'), val: nextLecture.room?.name || 'N/A' },
                  { label: t('dashboard.lecturer'), val: nextLecture.lecturerName },
                  { label: t('dashboard.day'), val: getActiveDay(nextLecture) },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <span className="text-gray-500 block text-[9px] uppercase font-bold">{label}</span>
                    <span className="font-bold text-gray-200 mt-0.5 block">{val}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="bg-white/5 border border-white/5 rounded-2xl p-6 text-center text-gray-500 text-xs">
              {t('dashboard.noClassesRegistered')}
            </div>
          )}
        </section>

        {/* ── Today's Schedule ──────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
              {t('dashboard.todaySchedule')} ({todayName})
            </h2>
            <span className="text-[9px] bg-white/5 border border-white/10 text-gray-300 font-bold px-2 py-0.5 rounded-full">
              {todayLectures.length} {t('dashboard.classes')}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-6 w-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-2.5">
              {todayLectures.map(schedule => {
                const isTheory = schedule.subject.type === 'THEORY';
                return (
                  <motion.div
                    key={schedule.id}
                    whileTap={{ scale: 0.985 }}
                    className={`p-4 rounded-2xl border flex justify-between items-center gap-3 transition-all duration-200 hover:scale-[1.015] ${
                      isTheory
                        ? 'bg-blue-950/20 border-blue-500/25 text-blue-200 hover:shadow-[0_0_16px_rgba(59,130,246,0.2)]'
                        : 'bg-green-950/20 border-green-500/25 text-green-200 hover:shadow-[0_0_16px_rgba(34,197,94,0.2)]'
                    } ${isOverridden(schedule) ? 'ring-1 ring-amber-500/50' : ''}`}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="text-sm font-black text-white leading-tight truncate">{schedule.subject.name}</h4>
                      <p className="text-[10px] text-gray-400 truncate">
                        {t('dashboard.classroom')}: <span className="text-gray-300 font-semibold">{schedule.room?.name || 'N/A'}</span>
                        {' • '}{schedule.lecturerName}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-extrabold text-gray-200 block">
                        {getActiveStartTime(schedule)} - {getActiveEndTime(schedule)}
                      </span>
                      <span className="text-[9px] text-gray-500 uppercase tracking-wider block mt-0.5 font-bold">
                        {isTheory ? t('dashboard.theory') : t('dashboard.practical')}
                      </span>
                    </div>
                  </motion.div>
                );
              })}

              {todayLectures.length === 0 && (
                <div className="bg-white/5 border border-white/5 rounded-2xl p-8 text-center text-gray-500 text-xs">
                  <span className="text-xl block mb-2">🎉</span>
                  {t('dashboard.noClassesToday')}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

    </motion.div>
  );
}
