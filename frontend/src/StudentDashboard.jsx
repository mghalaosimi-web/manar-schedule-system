import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
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
    let loggedInEmail = '';
    let loggedInPhone = '';
    let loggedInIdPhotoUrl = '';
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        loggedInName = user.name || 'Student Account';
        loggedInGroupId = user.groupId || 1;
        loggedInEmail = user.email || '';
        loggedInPhone = user.phone || '';
        loggedInIdPhotoUrl = user.idPhotoUrl || '';
      } catch (e) {}
    }

    const savedProfile = localStorage.getItem('student_profile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        return {
          name: parsed.name || loggedInName,
          email: parsed.email || loggedInEmail,
          phone: parsed.phone || loggedInPhone,
          idPhotoUrl: parsed.idPhotoUrl || loggedInIdPhotoUrl,
          department: parsed.department || '',
          level: parsed.level || '',
          groupId: parsed.groupId || loggedInGroupId,
          groupName: parsed.groupId === 1 ? 'Group A' : (parsed.groupId === 2 ? 'Group B' : 'Group C')
        };
      } catch (e) {}
    }
    return {
      name: loggedInName,
      email: loggedInEmail,
      phone: loggedInPhone,
      idPhotoUrl: loggedInIdPhotoUrl,
      department: '',
      level: '',
      groupId: loggedInGroupId,
      groupName: loggedInGroupId === 1 ? 'Group A' : (loggedInGroupId === 2 ? 'Group B' : 'Group C')
    };
  };

  const [profile, setProfile] = useState(getInitialProfile);
  const [schedules, setSchedules] = useState([]);
  const [originalSchedules, setOriginalSchedules] = useState([]);
  const [sandboxMode, setSandboxMode] = useState(false);
  const [activeSimulatorSchedule, setActiveSimulatorSchedule] = useState(null);
  
  const [simulatorDay, setSimulatorDay] = useState('SUNDAY');
  const [simulatorStart, setSimulatorStart] = useState('08:00');
  const [simulatorEnd, setSimulatorEnd] = useState('10:00');

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
        const token = localStorage.getItem('manar_token');
        const [scheduleRes, groupsRes, profileRes] = await Promise.all([
          axios.get(`${API_URL}/api/schedules?groupId=${selectedGroupId}`),
          axios.get(`${API_URL}/api/groups`),
          axios.get(`${API_URL}/api/student/settings`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          }).catch(e => {
            console.warn('Profile fetch error, falling back to local storage', e);
            return null;
          })
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

        if (profileRes && profileRes.data && profileRes.data.success) {
          const s = profileRes.data.data;
          setProfile(prev => ({
            ...prev,
            name: s.name || prev.name,
            email: s.email || prev.email,
            phone: s.phone || prev.phone,
            idPhotoUrl: s.idPhotoUrl || prev.idPhotoUrl,
            department: s.departmentName || s.majorName || prev.department,
            level: s.levelName || prev.level,
            groupId: s.groupId || prev.groupId,
            groupName: s.groupName || prev.groupName
          }));
        }

        if (scheduleRes.data && scheduleRes.data.success) {
          setSchedules(scheduleRes.data.data);
          setOriginalSchedules(scheduleRes.data.data);
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

  const handleExportICS = () => {
    if (schedules.length === 0) {
      toast.error(isAr ? 'لا توجد محاضرات لتصديرها' : 'No lectures to export');
      return;
    }
    
    let icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Manar University//Schedule Portal//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];
    
    const dayOffsets = { SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6 };
    
    schedules.forEach(item => {
      const today = new Date();
      const currentDay = today.getDay();
      const targetDay = dayOffsets[item.dayOfWeek] ?? 0;
      const diff = targetDay - currentDay;
      const eventDate = new Date();
      eventDate.setDate(today.getDate() + diff);
      
      const dateStr = eventDate.toISOString().slice(0, 10).replace(/-/g, '');
      const startTimeClean = item.startTime.replace(/:/g, '') + '00';
      const endTimeClean = item.endTime.replace(/:/g, '') + '00';
      
      icsLines.push('BEGIN:VEVENT');
      icsLines.push(`UID:lecture-${item.id}@manar.edu`);
      icsLines.push(`DTSTAMP:${dateStr}T000000Z`);
      icsLines.push(`DTSTART;TZID=Asia/Aden:${dateStr}T${startTimeClean}`);
      icsLines.push(`DTEND;TZID=Asia/Aden:${dateStr}T${endTimeClean}`);
      icsLines.push(`SUMMARY:${item.subject.name} (${item.subject.code})`);
      icsLines.push(`LOCATION:${item.room?.name || 'Classroom'}`);
      icsLines.push(`DESCRIPTION:Lecturer: ${item.lecturerName} - Group: ${profile.groupName}`);
      icsLines.push('RRULE:FREQ=WEEKLY;BYDAY=' + item.dayOfWeek.slice(0, 2));
      icsLines.push('END:VEVENT');
    });
    
    icsLines.push('END:VCALENDAR');
    
    const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Manar_Schedule_${profile.groupName || 'Student'}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success(isAr ? 'تم تصدير ملف التقويم بنجاح!' : 'Calendar file exported successfully!');
  };

  const handleCopySummary = () => {
    if (schedules.length === 0) {
      toast.error(isAr ? 'الجدول فارغ' : 'Schedule is empty');
      return;
    }
    
    let text = isAr 
      ? `📅 الجدول الدراسي لـ (${profile.groupName || 'الطالب'}) - كلية المنار الجامعية\n\n`
      : `📅 Class Schedule for (${profile.groupName || 'Student'}) - Al-Manar University\n\n`;
      
    const dayLabels = isAr 
      ? { SUNDAY: 'الأحد', MONDAY: 'الاثنين', TUESDAY: 'الثلاثاء', WEDNESDAY: 'الأربعاء', THURSDAY: 'الخميس', FRIDAY: 'الجمعة', SATURDAY: 'السبت' }
      : { SUNDAY: 'Sunday', MONDAY: 'Monday', TUESDAY: 'Tuesday', WEDNESDAY: 'Wednesday', THURSDAY: 'Thursday', FRIDAY: 'Friday', SATURDAY: 'Saturday' };
      
    DAYS.forEach(day => {
      const daySchedules = schedules.filter(s => getActiveDay(s) === day);
      if (daySchedules.length > 0) {
        text += `🔹 ${dayLabels[day] || day}:\n`;
        daySchedules.forEach(s => {
          text += `   - [${getActiveStartTime(s)} - ${getActiveEndTime(s)}] ${s.subject.name} (${s.subject.code}) | ${s.room?.name || 'Classroom'} | د. ${s.lecturerName}\n`;
        });
        text += `\n`;
      }
    });
    
    text += isAr ? `تم التوليد بواسطة بوابة المنار الذكية 💡` : `Generated by Manar Smart Portal 💡`;
    
    navigator.clipboard.writeText(text)
      .then(() => {
        toast.success(isAr ? 'تم نسخ خلاصة الجدول للحافظة!' : 'Schedule copied to clipboard!');
      })
      .catch(() => {
        toast.error(isAr ? 'فشل في نسخ النص' : 'Failed to copy text');
      });
  };

  const handleTestNotification = () => {
    if (!("Notification" in window)) {
      toast.error(isAr ? 'التنبيهات غير مدعومة في متصفحك' : 'Notifications not supported in your browser');
      return;
    }
    
    if (Notification.permission === "granted") {
      new Notification(isAr ? "كلية المنار الجامعية - تجربة" : "Al-Manar University - Test", {
        body: isAr ? "هذا تنبيه تجريبي من بوابة المنار الذكية!" : "This is a test notification from the Manar Smart Portal!",
        icon: "/assets/logo-CAkLai4O.png"
      });
      toast.success(isAr ? 'تم إرسال التنبيه التجريبي!' : 'Test notification sent!');
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          new Notification(isAr ? "كلية المنار الجامعية - تجربة" : "Al-Manar University - Test", {
            body: isAr ? "تم تفعيل التنبيهات التجريبية بنجاح!" : "Test notifications enabled successfully!"
          });
          toast.success(isAr ? 'تم تفعيل التنبيهات!' : 'Notifications enabled!');
        }
      });
    } else {
      toast.error(isAr ? 'تم حظر التنبيهات في متصفحك. يرجى تفعيلها من الإعدادات.' : 'Notifications blocked. Enable them in site settings.');
    }
  };

  const handleSimulateReschedule = (e) => {
    e.preventDefault();
    if (!activeSimulatorSchedule) return;
    
    setSchedules(prev => prev.map(s => {
      if (s.id === activeSimulatorSchedule.id) {
        return {
          ...s,
          dayOfWeek: simulatorDay,
          startTime: simulatorStart,
          endTime: simulatorEnd,
          overrides: [] // clear overrides locally to show sandbox change
        };
      }
      return s;
    }));
    
    setActiveSimulatorSchedule(null);
    toast.success(isAr ? 'تمت محاكاة التعديل بنجاح في لوحة الرصد!' : 'Timetable modification simulated successfully!');
  };

  const toggleSandbox = () => {
    if (sandboxMode) {
      // Disabling: restore original schedules from database cache
      setSchedules(originalSchedules);
      setSandboxMode(false);
      toast.success(isAr ? 'تم الخروج من محاكي التعديل واستعادة الجدول الرسمي!' : 'Exited Reschedule Simulator. Official timetable restored!');
    } else {
      setSandboxMode(true);
      toast.success(
        isAr ? 'تم تفعيل محاكي التعديل! انقر على أي محاضرة بالجدول لتجربة تعديلها.' : 'Reschedule Simulator Active! Tap any lecture card to simulate moves.',
        { icon: '🧪' }
      );
    }
  };

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
        
        {/* Sandbox Warning Banner */}
        {sandboxMode && (
          <div className="w-full frosted-panel border-amber-500/40 bg-amber-500/10 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right shadow-[0_0_20px_rgba(245,158,11,0.15)] animate-pulse">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
                🧪 {isAr ? 'محاكي التعديل نشط (محلي)' : 'Reschedule Simulator Active (Local)'}
              </span>
              <span className="text-[11px] text-gray-300 font-bold block">
                {isAr ? 'أي تغييرات تقوم بها بالجدول هنا هي تجريبية وتأثيرها محلي فقط.' : 'Any moves you simulate are temporary and client-side only.'}
              </span>
            </div>
            <button
              onClick={toggleSandbox}
              className="px-3 py-1.5 bg-amber-500 text-black text-[10px] font-black rounded-lg hover:bg-amber-400 transition"
            >
              {isAr ? 'إعادة تعيين / خروج' : 'Exit / Reset'}
            </button>
          </div>
        )}

        {/* Profile Card Summary - Redesigned to be massive, premium and dynamic based on database */}
        {(() => {
          const g = getGreetingData();
          const avatarUrl = profile.idPhotoUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(profile.name || 'avatar');
          return (
            <div className={`relative overflow-hidden rounded-3xl border ${g.border} bg-[var(--bg-card)] bg-gradient-to-br ${g.gradient} ${g.shadowGlow} p-6 flex flex-col gap-5 backdrop-blur-xl transition-all duration-500`}>
              <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-white/5 blur-3xl pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                {/* Photo Avatar */}
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/10 shadow-lg bg-[#0c0c0c] shrink-0">
                  <img src={avatarUrl} alt="Student avatar" className="w-full h-full object-cover" />
                </div>
                
                {/* Profile Meta info */}
                <div className="flex-1 text-center sm:text-right space-y-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${g.bgGlow} ${g.text} border ${g.border}`}>
                      {g.title}
                    </span>
                    {profile.level && (
                      <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300">
                        {profile.level}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-black text-white mt-1.5 leading-tight">{profile.name}</h3>
                  <p className="text-xs font-semibold text-[var(--text-secondary)]">{profile.department || (isAr ? 'قسم البرمجيات والذكاء' : 'Engineering Department')}</p>
                </div>
              </div>

              {/* Complete Contact Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] border-t border-[var(--border-color)] pt-4 mt-1">
                <div className="flex justify-between sm:justify-start gap-2 items-center text-gray-400">
                  <span className="font-bold uppercase tracking-wider">{isAr ? 'البريد:' : 'Email:'}</span>
                  <span className="text-white font-mono truncate max-w-[150px]">{profile.email || '—'}</span>
                </div>
                <div className="flex justify-between sm:justify-start gap-2 items-center text-gray-400">
                  <span className="font-bold uppercase tracking-wider">{isAr ? 'الهاتف:' : 'Phone:'}</span>
                  <span className="text-white font-mono">{profile.phone || '—'}</span>
                </div>
                <div className="flex justify-between sm:justify-start gap-2 items-center text-gray-400 col-span-1 sm:col-span-2">
                  <span className="font-bold uppercase tracking-wider">{isAr ? 'الشعبة النشطة:' : 'Active Timetable:'}</span>
                  <span className="text-[var(--accent)] font-bold">{profile.groupName || '—'}</span>
                </div>
              </div>

              {/* Edit Profile Action Button */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
                <p className="text-[10px] text-[var(--text-secondary)] font-semibold text-center sm:text-right">
                  {g.subtitle}
                </p>
                <button
                  onClick={() => navigate('/student/settings')}
                  className="btn-neon w-full sm:w-auto px-5 py-2.5 text-xs rounded-xl shadow-lg shadow-[var(--accent-glow)] flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  ⚙️ {isAr ? 'تعديل الملف الشخصي' : 'Modify Profile / Edit'}
                </button>
              </div>
            </div>
          );
        })()}

        {/* Smart action shortcuts command hub - Massive glowing buttons */}
        <div className="space-y-3">
          <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{isAr ? 'المركز الذكي للتحكم والإجراءات السريعة' : 'Smart Command Hub & Quick Actions'}</h2>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Export calendar */}
            <button
              onClick={handleExportICS}
              className="frosted-panel p-4.5 rounded-2xl hover:border-[var(--accent)] transition-all duration-300 flex flex-col items-center justify-center text-center gap-2.5 active:scale-95 group"
            >
              <span className="text-2xl group-hover:scale-110 transition duration-300">📅</span>
              <div>
                <span className="text-[11px] font-black block text-white">{isAr ? 'تصدير التقويم (ICS)' : 'Export Calendar'}</span>
                <span className="text-[9px] text-gray-400 block mt-0.5">{isAr ? 'مزامنة مع Google' : 'Sync to Google / iOS'}</span>
              </div>
            </button>

            {/* Copy schedule summary */}
            <button
              onClick={handleCopySummary}
              className="frosted-panel p-4.5 rounded-2xl hover:border-[var(--accent)] transition-all duration-300 flex flex-col items-center justify-center text-center gap-2.5 active:scale-95 group"
            >
              <span className="text-2xl group-hover:scale-110 transition duration-300">🔗</span>
              <div>
                <span className="text-[11px] font-black block text-white">{isAr ? 'نسخ ملخص الجدول' : 'Copy Timetable'}</span>
                <span className="text-[9px] text-gray-400 block mt-0.5">{isAr ? 'مشاركة الجدول الدراسي' : 'Share formatted text'}</span>
              </div>
            </button>

            {/* Timetable Sandbox simulator */}
            <button
              onClick={toggleSandbox}
              className={`frosted-panel p-4.5 rounded-2xl transition-all duration-300 flex flex-col items-center justify-center text-center gap-2.5 active:scale-95 group ${
                sandboxMode ? 'border-amber-500 bg-amber-500/5 shadow-md shadow-amber-500/10' : 'hover:border-[var(--accent)]'
              }`}
            >
              <span className="text-2xl group-hover:scale-110 transition duration-300">🧪</span>
              <div>
                <span className="text-[11px] font-black block text-white">
                  {sandboxMode ? (isAr ? 'تعطيل المحاكاة' : 'Disable Sandbox') : (isAr ? 'محاكي التعديل' : 'Move Simulator')}
                </span>
                <span className="text-[9px] text-gray-400 block mt-0.5">
                  {sandboxMode ? (isAr ? 'استعادة الجدول الرسمي' : 'Restore Official') : (isAr ? 'محاكاة تعديل الحصص' : 'Simulate custom timetable')}
                </span>
              </div>
            </button>

            {/* Test notifications */}
            <button
              onClick={handleTestNotification}
              className="frosted-panel p-4.5 rounded-2xl hover:border-[var(--accent)] transition-all duration-300 flex flex-col items-center justify-center text-center gap-2.5 active:scale-95 group"
            >
              <span className="text-2xl group-hover:scale-110 transition duration-300">🔔</span>
              <div>
                <span className="text-[11px] font-black block text-white">{isAr ? 'اختبار التنبيهات' : 'Test Live Alerts'}</span>
                <span className="text-[9px] text-gray-400 block mt-0.5">{isAr ? 'إرسال تنبيه تجريبي' : 'Send mock push alert'}</span>
              </div>
            </button>
          </div>
        </div>

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
            <div 
              onClick={() => {
                if (sandboxMode) {
                  setActiveSimulatorSchedule(nextLecture);
                  setSimulatorDay(nextLecture.dayOfWeek);
                  setSimulatorStart(nextLecture.startTime);
                  setSimulatorEnd(nextLecture.endTime);
                }
              }}
              style={sandboxMode ? { cursor: 'pointer' } : {}}
              className="relative overflow-hidden rounded-2xl border border-red-500/35 bg-red-950/20 backdrop-blur-md p-5 shadow-2xl flex flex-col gap-4 shadow-[0_0_20px_rgba(239,68,68,0.2)] animate-[pulse_2s_infinite]"
            >
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
                  onClick={() => {
                    if (sandboxMode) {
                      setActiveSimulatorSchedule(schedule);
                      setSimulatorDay(schedule.dayOfWeek);
                      setSimulatorStart(schedule.startTime);
                      setSimulatorEnd(schedule.endTime);
                    }
                  }}
                  style={sandboxMode ? { cursor: 'pointer' } : {}}
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

      {/* Sandbox Rescheduling Simulator Modal */}
      <AnimatePresence>
        {activeSimulatorSchedule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="frosted-panel w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 text-[var(--text-primary)]"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                  🧪 {isAr ? 'محاكي تعديل الحصة الدراسي' : 'Timetable Reschedule Simulator'}
                </h3>
                <button
                  onClick={() => setActiveSimulatorSchedule(null)}
                  className="text-gray-400 hover:text-white text-base transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-[11px] text-gray-300 leading-relaxed font-bold">
                {isAr ? 'المحاضرة المراد محاكاتها:' : 'Simulating rescheduling for:'}
                <div className="text-white text-xs font-black mt-1">
                  {activeSimulatorSchedule.subject.name} ({activeSimulatorSchedule.subject.code})
                </div>
              </div>

              <form onSubmit={handleSimulateReschedule} className="space-y-4 text-xs">
                {/* Target Day */}
                <div className="space-y-1">
                  <label className="text-gray-400 block font-medium">{isAr ? 'اليوم المستهدف' : 'Target Day'}</label>
                  <select
                    value={simulatorDay}
                    onChange={(e) => setSimulatorDay(e.target.value)}
                    className="w-full cmd-input p-3 font-bold cursor-pointer"
                  >
                    {DAYS.map(day => (
                      <option key={day} value={day} className="bg-[#0c0c0c] text-white">
                        {isAr
                          ? (day === 'SUNDAY' ? 'الأحد' : day === 'MONDAY' ? 'الاثنين' : day === 'TUESDAY' ? 'الثلاثاء' : day === 'WEDNESDAY' ? 'الأربعاء' : day === 'THURSDAY' ? 'الخميس' : day === 'FRIDAY' ? 'الجمعة' : 'السبت')
                          : day}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Start Time */}
                <div className="space-y-1">
                  <label className="text-gray-400 block font-medium">{isAr ? 'وقت البدء' : 'Start Time'}</label>
                  <input
                    type="time"
                    required
                    value={simulatorStart}
                    onChange={(e) => setSimulatorStart(e.target.value)}
                    className="w-full cmd-input p-3 font-bold text-left"
                    dir="ltr"
                  />
                </div>

                {/* Target End Time */}
                <div className="space-y-1">
                  <label className="text-gray-400 block font-medium">{isAr ? 'وقت الانتهاء' : 'End Time'}</label>
                  <input
                    type="time"
                    required
                    value={simulatorEnd}
                    onChange={(e) => setSimulatorEnd(e.target.value)}
                    className="w-full cmd-input p-3 font-bold text-left"
                    dir="ltr"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setActiveSimulatorSchedule(null)}
                    className="btn-ghost px-4 py-2 font-semibold text-xs"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="btn-neon px-5 py-2 font-semibold text-xs border border-amber-500/20 text-black bg-amber-500 hover:bg-amber-400"
                  >
                    ⚡ {isAr ? 'تحديث المحاكاة' : 'Simulate Change'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
