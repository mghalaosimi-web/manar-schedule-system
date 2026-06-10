import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { API_URL } from './config';
import usePWAInstall from './usePWAInstall';

const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const MOCK_SCHEDULES = [
  {
    id: 1,
    subjectId: 101,
    subject: { name: 'Database Systems', code: 'CS-301', type: 'THEORY' },
    roomId: 201,
    room: { name: 'Hall 3A' },
    lecturerName: 'Dr. Ahmad Masri',
    groupId: 1,
    group: { name: 'Group A' },
    dayOfWeek: 'SUNDAY',
    startTime: '08:00',
    endTime: '10:00',
    overrides: []
  },
  {
    id: 2,
    subjectId: 102,
    subject: { name: 'Web Development Lab', code: 'CS-302', type: 'PRACTICAL' },
    roomId: 202,
    room: { name: 'Lab 5' },
    lecturerName: 'Eng. Sarah Taji',
    groupId: 1,
    group: { name: 'Group A' },
    dayOfWeek: 'MONDAY',
    startTime: '10:00',
    endTime: '12:00',
    overrides: []
  },
  {
    id: 3,
    subjectId: 103,
    subject: { name: 'Software Engineering', code: 'CS-303', type: 'THEORY' },
    roomId: 203,
    room: { name: 'Hall 1B' },
    lecturerName: 'Dr. Manar Al-Saeed',
    groupId: 1,
    group: { name: 'Group A' },
    dayOfWeek: 'TUESDAY',
    startTime: '12:00',
    endTime: '14:00',
    overrides: []
  }
];

export default function StudentDashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isInstallable, installApp } = usePWAInstall();

  const handleInstallClick = async () => {
    const success = await installApp();
    if (success) {
      toast.success(
        i18n.language === 'ar' ? 'تم بدء التثبيت بنجاح!' : 'Installation started successfully!',
        {
          style: {
            background: '#1f2937',
            color: '#f3f4f6',
            border: '1px solid #374151',
          }
        }
      );
    }
  };

  const getInitialProfile = () => {
    const userJson = localStorage.getItem('manar_user');
    let loggedInName = 'Student Account';
    let loggedInGroupId = 1;
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        loggedInName = user.name || 'Student Account';
        loggedInGroupId = user.groupId || 1;
      } catch (e) {}
    }

    const savedProfile = localStorage.getItem('student_profile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        return {
          name: parsed.name || loggedInName,
          groupId: parsed.groupId || loggedInGroupId,
          groupName: parsed.groupId === 1 ? 'Group A' : (parsed.groupId === 2 ? 'Group B' : 'Group C')
        };
      } catch (e) {}
    }
    return {
      name: loggedInName,
      groupId: loggedInGroupId,
      groupName: loggedInGroupId === 1 ? 'Group A' : (loggedInGroupId === 2 ? 'Group B' : 'Group C')
    };
  };

  const [profile, setProfile] = useState(getInitialProfile);
  const [schedules, setSchedules] = useState([]);
  const [backendOnline, setBackendOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(() => {
    const initial = getInitialProfile();
    return initial.groupId;
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (i18n.language === 'ar') {
      if (hour >= 5 && hour < 12) return '🌅 صباح الخير، طاب صباحك!';
      if (hour >= 12 && hour < 17) return '☀️ طاب يومك، مرحباً بك!';
      if (hour >= 17 && hour < 22) return '🌇 مساء الخير، مرحباً بك!';
      return '🌙 مساء الخير، أتمنى لك ليلة هادئة!';
    } else {
      if (hour >= 5 && hour < 12) return '🌅 Good morning, have a great day!';
      if (hour >= 12 && hour < 17) return '☀️ Good afternoon, welcome back!';
      if (hour >= 17 && hour < 22) return '🌇 Good evening, welcome!';
      return '🌙 Good night, rest well!';
    }
  };

  const getActiveDay = (schedule) => {
    if (schedule.overrides && schedule.overrides.length > 0) {
      const latestOverride = schedule.overrides[schedule.overrides.length - 1];
      const date = new Date(latestOverride.date);
      const dayIndex = date.getDay();
      const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      return days[dayIndex];
    }
    return schedule.dayOfWeek;
  };

  const getActiveStartTime = (schedule) => {
    if (schedule.overrides && schedule.overrides.length > 0) {
      const latest = schedule.overrides[schedule.overrides.length - 1];
      return latest.newStartTime || schedule.startTime;
    }
    return schedule.startTime;
  };

  const getActiveEndTime = (schedule) => {
    if (schedule.overrides && schedule.overrides.length > 0) {
      const latest = schedule.overrides[schedule.overrides.length - 1];
      return latest.newEndTime || schedule.endTime;
    }
    return schedule.endTime;
  };

  const isOverridden = (schedule) => {
    return schedule.overrides && schedule.overrides.length > 0;
  };

  useEffect(() => {
    const fetchStudentSchedule = async () => {
      try {
        setLoading(true);
        const [scheduleRes, groupsRes] = await Promise.all([
          axios.get(`${API_URL}/api/schedules?groupId=${selectedGroupId}`),
          axios.get(`${API_URL}/api/groups`)
        ]);

        if (groupsRes.data && groupsRes.data.success) {
          setGroups(groupsRes.data.data);
          
          // Dynamically map active group name to profile card
          const activeG = groupsRes.data.data.find(g => g.id === selectedGroupId);
          if (activeG) {
            setProfile(prev => ({
              ...prev,
              groupId: selectedGroupId,
              groupName: activeG.name
            }));
          }
        }

        if (scheduleRes.data && scheduleRes.data.success) {
          setSchedules(scheduleRes.data.data);
          setBackendOnline(true);
        } else {
          throw new Error('API failed');
        }
      } catch (err) {
        console.error('Failed to fetch schedules or groups:', err);
        setBackendOnline(false);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentSchedule();
  }, [selectedGroupId]);

  useEffect(() => {
    const fetchLatestNotificationToast = async () => {
      const hasShown = sessionStorage.getItem('manar_welcome_toast_shown');
      if (hasShown) return;

      try {
        const token = localStorage.getItem('manar_token');
        const res = await axios.get(`${API_URL}/api/notifications/student`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.data && res.data.success && res.data.data.length > 0) {
          const latest = res.data.data[0];
          toast(latest.message, {
            duration: 6000,
            icon: '📢',
            style: {
              background: '#1f2937',
              color: '#f3f4f6',
              border: '1px solid #374151',
            }
          });
          sessionStorage.setItem('manar_welcome_toast_shown', 'true');
        }
      } catch (e) {
        console.error('Failed to toast welcome notification:', e);
      }
    };

    fetchLatestNotificationToast();

    const handleScheduleUpdate = () => {
      console.log('[StudentDashboard] Real-time schedule update triggered.');
      axios.get(`${API_URL}/api/schedules?groupId=${selectedGroupId}`).then(res => {
        if (res.data && res.data.success) {
          setSchedules(res.data.data);
        }
      }).catch(e => console.error(e));
    };

    window.addEventListener('MANAR_SCHEDULE_UPDATE', handleScheduleUpdate);
    return () => {
      window.removeEventListener('MANAR_SCHEDULE_UPDATE', handleScheduleUpdate);
    };
  }, [selectedGroupId]);

  const getNextLecture = () => {
    if (schedules.length === 0) return null;
    const now = new Date();
    const currentDayName = DAYS[now.getDay()];
    const currentTimeStr = now.toTimeString().substring(0, 5);

    const todayRemaining = schedules.filter(s => {
      if (getActiveDay(s) !== currentDayName) return false;
      return getActiveStartTime(s) > currentTimeStr;
    });

    if (todayRemaining.length > 0) {
      return todayRemaining.sort((a, b) => getActiveStartTime(a).localeCompare(getActiveStartTime(b)))[0];
    }

    let checkDayIndex = (now.getDay() + 1) % 7;
    for (let i = 0; i < 7; i++) {
      const nextDayName = DAYS[checkDayIndex];
      const nextDayLectures = schedules.filter(s => getActiveDay(s) === nextDayName);
      if (nextDayLectures.length > 0) {
        return nextDayLectures.sort((a, b) => getActiveStartTime(a).localeCompare(getActiveStartTime(b)))[0];
      }
      checkDayIndex = (checkDayIndex + 1) % 7;
    }
    return schedules[0];
  };

  const getGreetingData = () => {
    const hour = new Date().getHours();
    const isAr = i18n.language === 'ar';
    
    if (hour >= 5 && hour < 12) {
      return {
        title: isAr ? 'صباح الخير والبركات 🌅' : 'Good Morning 🌅',
        subtitle: isAr ? 'طاب صباحك وأسعد الله يومك بالنشاط والنجاح!' : 'Have a wonderful day filled with productivity!',
        gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
        border: 'border-orange-500/20',
        text: 'text-orange-400',
        bgGlow: 'bg-orange-500/5',
        shadowGlow: 'shadow-[0_0_30px_rgba(249,115,22,0.15)]'
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        title: isAr ? 'طاب يومك السعيد ☀️' : 'Good Afternoon ☀️',
        subtitle: isAr ? 'أهلاً بك مجدداً في يوم مليء بالفرص والإنجازات!' : 'Welcome back! Let\'s make this afternoon count.',
        gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
        border: 'border-cyan-500/20',
        text: 'text-cyan-400',
        bgGlow: 'bg-cyan-500/5',
        shadowGlow: 'shadow-[0_0_30px_rgba(6,182,212,0.15)]'
      };
    } else if (hour >= 17 && hour < 22) {
      return {
        title: isAr ? 'مساء الخير والجمال 🌇' : 'Good Evening 🌇',
        subtitle: isAr ? 'مساء مفعم بالهدوء والراحة بعد يوم دراسي حافل!' : 'Hope you are having a pleasant and relaxing evening.',
        gradient: 'from-pink-500/20 via-purple-500/10 to-transparent',
        border: 'border-pink-500/20',
        text: 'text-pink-400',
        bgGlow: 'bg-pink-500/5',
        shadowGlow: 'shadow-[0_0_30px_rgba(236,72,153,0.15)]'
      };
    } else {
      return {
        title: isAr ? 'مساء الخير والهدوء 🌙' : 'Good Night 🌙',
        subtitle: isAr ? 'نتمنى لك ليلة هادئة ومريحة ونوماً هنيئاً!' : 'Rest well and recharge for another bright day tomorrow.',
        gradient: 'from-indigo-950/20 via-violet-600/10 to-transparent',
        border: 'border-violet-500/20',
        text: 'text-violet-400',
        bgGlow: 'bg-violet-500/5',
        shadowGlow: 'shadow-[0_0_30px_rgba(139,92,246,0.15)]'
      };
    }
  };

  const nextLecture = getNextLecture();

  // Determine current day of the week
  const todayIndex = new Date().getDay();
  const todayName = DAYS[todayIndex];
  const todayLectures = schedules.filter(s => getActiveDay(s) === todayName);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex-1 w-full p-4 md:p-8 flex flex-col items-center"
    >
      <div className="w-full max-w-md space-y-6 pb-20">
        
        {/* Profile Card Summary - Redesigned to be massive, premium and dynamic based on time */}
        {(() => {
          const g = getGreetingData();
          return (
            <div className={`relative overflow-hidden rounded-3xl border ${g.border} bg-[var(--bg-card)] bg-gradient-to-br ${g.gradient} ${g.shadowGlow} p-6 flex flex-col gap-4 backdrop-blur-xl transition-all duration-500`}>
              <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-white/5 blur-3xl pointer-events-none" />
              
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${g.bgGlow} ${g.text} border ${g.border}`}>
                    {g.title}
                  </span>
                  <h3 className="text-xl font-black text-[var(--text-primary)] mt-3 leading-tight">
                    {profile.name}
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)] font-bold mt-1">
                    {profile.groupName}
                  </p>
                </div>

                <button
                  onClick={() => navigate('/student/settings')}
                  className="btn-neon px-4 py-2 text-xs rounded-2xl shadow-lg shadow-[var(--accent-glow)]"
                >
                  {t('dashboard.manageGroup')}
                </button>
              </div>

              <div className="text-xs text-[var(--text-secondary)]/80 leading-relaxed font-semibold border-t border-[var(--border-color)] pt-3.5 mt-1">
                {g.subtitle}
              </div>
            </div>
          );
        })()}

        {/* Dynamic Group Switcher */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 flex flex-col gap-2.5">
          <label className="text-[10px] font-black tracking-widest uppercase text-[var(--text-secondary)]">
            {i18n.language === 'ar' ? 'عرض جدول شعبة:' : 'View Schedule for Group:'}
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

        {/* Custom Glassmorphic Install App Prompt */}
        {isInstallable && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-2xl border border-[var(--accent-glow)] bg-[var(--accent-dim)] backdrop-blur-md p-4 shadow-xl flex justify-between items-center gap-3 transition-all duration-300"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">📱</span>
              <div>
                <h4 className="text-xs font-black text-[var(--accent)]">
                  {i18n.language === 'ar' ? 'تثبيت التطبيق على جهازك' : 'Install App on Your Device'}
                </h4>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                  {i18n.language === 'ar' ? 'احصل على وصول سريع وتنبيهات فورية' : 'Get quick access and instant push alerts'}
                </p>
              </div>
            </div>
            <button
              onClick={handleInstallClick}
              className="btn-neon px-4 py-2 text-xs rounded-xl active:scale-95 shadow-lg shadow-[var(--accent-glow)] whitespace-nowrap"
            >
              {i18n.language === 'ar' ? 'تثبيت التطبيق' : 'Install App'}
            </button>
          </motion.div>
        )}

        {/* Top Section: Glowing Alert Card for Next Lecture */}
        <section className="space-y-3">
          <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('dashboard.activeAlert')}</h2>
          {nextLecture ? (
            <div className="relative overflow-hidden rounded-2xl border border-red-500/35 bg-red-950/20 backdrop-blur-md p-5 shadow-2xl flex flex-col gap-4 shadow-[0_0_20px_rgba(239,68,68,0.2)] animate-[pulse_2s_infinite]">
              <div className="self-start flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 px-2.5 py-0.5 rounded-full text-[9px] font-bold text-red-400 uppercase tracking-wide">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                </span>
                {t('dashboard.nextStartsIn')}
              </div>

              <div>
                <h3 className="text-xl font-bold text-white leading-tight">{nextLecture.subject.name}</h3>
                <p className="text-xs font-mono text-red-300 mt-1 font-semibold">{nextLecture.subject.code}</p>
              </div>

              <div className="grid grid-cols-2 gap-y-3 gap-x-4 pt-3 border-t border-white/10 text-xs">
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-semibold">{t('dashboard.timeSlot')}</span>
                  <span className="font-bold text-gray-250 mt-0.5 block">{getActiveStartTime(nextLecture)} - {getActiveEndTime(nextLecture)}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-semibold">{t('dashboard.classroom')}</span>
                  <span className="font-bold text-gray-250 mt-0.5 block">{nextLecture.room?.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-semibold">{t('dashboard.lecturer')}</span>
                  <span className="font-bold text-gray-250 mt-0.5 block">{nextLecture.lecturerName}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-semibold">{t('dashboard.day')}</span>
                  <span className="font-bold text-gray-250 mt-0.5 block">{getActiveDay(nextLecture)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-6 text-center text-gray-500 text-xs shadow-xl">
              {t('dashboard.noClassesRegistered')}
            </div>
          )}
        </section>

        {/* Current Day Status Section */}
        <section className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('dashboard.todaySchedule')} ({todayName})</h2>
            <span className="text-[9px] bg-white/5 border border-white/10 text-gray-300 font-bold px-2 py-0.5 rounded-full">
              {todayLectures.length} {t('dashboard.classes')}
            </span>
          </div>

          <div className="space-y-2.5">
            {todayLectures.map(schedule => {
              const isTheory = schedule.subject.type === 'THEORY';
              return (
                <div
                  key={schedule.id}
                  className={`p-4 rounded-2xl border flex justify-between items-center gap-3 transition hover:scale-[1.02] duration-200 ${
                    isTheory
                      ? 'bg-blue-950/20 backdrop-blur-md border-blue-500/30 text-blue-200 hover:shadow-[0_0_15px_rgba(59,130,246,0.25)]'
                      : 'bg-green-950/20 backdrop-blur-md border-green-500/30 text-green-200 hover:shadow-[0_0_15px_rgba(34,197,94,0.25)]'
                  }`}
                >
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">{schedule.subject.name}</h4>
                    <p className="text-[10px] text-gray-400">
                      {t('dashboard.classroom')}: <span className="text-gray-300 font-semibold">{schedule.room?.name || 'N/A'}</span> • {schedule.lecturerName}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-extrabold text-gray-200 block">
                      {getActiveStartTime(schedule)} - {getActiveEndTime(schedule)}
                    </span>
                    <span className="text-[9px] text-gray-500 uppercase tracking-wider block mt-0.5 font-bold">
                      {isTheory ? t('dashboard.theory') : t('dashboard.practical')}
                    </span>
                  </div>
                </div>
              );
            })}

            {todayLectures.length === 0 && (
              <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-8 text-center text-gray-500 text-xs shadow-xl">
                <span className="text-xl block mb-2">🎉</span>
                {t('dashboard.noClassesToday')}
              </div>
            )}
          </div>
        </section>
      </div>
    </motion.div>
  );
}
