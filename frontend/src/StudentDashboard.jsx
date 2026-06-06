import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

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
  const { t } = useTranslation();
  const navigate = useNavigate();

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
    // Read profile configuration
    const savedProfile = localStorage.getItem('student_profile');
    let currentGroupId = 1;
    let currentGroupName = 'Group A';
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setProfile({
          name: parsed.name,
          groupId: parsed.groupId,
          groupName: parsed.groupId === 1 ? 'Group A' : (parsed.groupId === 2 ? 'Group B' : 'Group C')
        });
        currentGroupId = parsed.groupId;
        currentGroupName = parsed.groupId === 1 ? 'Group A' : (parsed.groupId === 2 ? 'Group B' : 'Group C');
      } catch (e) {
        console.error(e);
      }
    }

    const fetchStudentSchedule = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:5000/api/schedules?groupId=${currentGroupId}`);
        if (res.data && res.data.success) {
          setSchedules(res.data.data);
          setBackendOnline(true);
        } else {
          throw new Error('API failed');
        }
      } catch (err) {
        setBackendOnline(false);
        const saved = localStorage.getItem('manar_schedules');
        if (saved) {
          const allSchedules = JSON.parse(saved);
          setSchedules(allSchedules.filter(s => s.groupId === currentGroupId));
        } else {
          setSchedules(MOCK_SCHEDULES.filter(s => s.groupId === currentGroupId));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStudentSchedule();
  }, []);

  useEffect(() => {
    // Show a toast with the latest notification if it hasn't been shown in this session
    const hasShown = sessionStorage.getItem('manar_welcome_toast_shown');
    if (!hasShown && schedules.length > 0) {
      const savedLogs = localStorage.getItem('manar_notifications');
      let allLogs = [
        {
          id: 1,
          groupId: 1,
          groupName: 'Group A',
          message: 'تنبيه طارئ: تم تعديل محاضرة Database Systems الخاصة بـ Group A. يرجى مراجعة الجدول.',
          sentTime: new Date(Date.now() - 3600000).toISOString(),
          status: 'SENT'
        },
        {
          id: 3,
          groupId: null,
          groupName: 'All Groups',
          message: 'عاجل: يرجى العلم ببدء امتحانات منتصف الفصل الدراسي يوم الأحد القادم.',
          sentTime: new Date(Date.now() - 86400000).toISOString(),
          status: 'SENT'
        }
      ];
      if (savedLogs) {
        try {
          allLogs = JSON.parse(savedLogs);
        } catch (e) {}
      }
      
      const currentGroupId = profile.groupId || 1;
      const filtered = allLogs.filter(log => log.groupId === null || log.groupId === currentGroupId);
      
      if (filtered.length > 0) {
        const latest = filtered[0];
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
    }
  }, [profile, schedules]);

  const nextLecture = schedules.length > 0 ? schedules[0] : null;

  // Determine current day of the week
  const todayIndex = new Date().getDay();
  const todayName = DAYS[todayIndex];
  const todayLectures = schedules.filter(s => getActiveDay(s) === todayName);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex-1 w-full p-5 flex flex-col items-center"
    >
      <div className="w-full max-w-md space-y-6 pb-20">
        
        {/* Profile Card Summary */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-2xl">
          <div>
            <span className="text-[10px] text-lime-400 font-extrabold uppercase tracking-widest">{t('dashboard.activeProfile')}</span>
            <h3 className="text-sm font-black text-white mt-0.5">{profile.name}</h3>
            <span className="text-[10px] text-gray-400 font-semibold">{profile.groupName}</span>
          </div>

          <button
            onClick={() => navigate('/student/settings')}
            className="px-3 py-1.5 bg-lime-500 hover:bg-lime-400 text-black font-extrabold text-[10px] rounded-xl shadow-lg shadow-lime-500/15 hover:shadow-[0_0_15px_rgba(132,204,22,0.45)] transition duration-200"
          >
            {t('dashboard.manageGroup')}
          </button>
        </div>

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
