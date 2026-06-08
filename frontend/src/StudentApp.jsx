import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { API_URL } from './config';

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

export default function StudentApp() {
  const { t } = useTranslation();
  const [groupId, setGroupId] = useState(() => {
    const saved = localStorage.getItem('manar_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.groupId || 1;
      } catch (e) {}
    }
    return 1;
  });
  const [schedules, setSchedules] = useState([]);
  const [backendOnline, setBackendOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');

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
        const res = await axios.get(`${API_URL}/api/schedules?groupId=${groupId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.data && res.data.success) {
          setSchedules(res.data.data);
          setBackendOnline(true);
        } else {
          throw new Error('API failed');
        }
      } catch (err) {
        console.error('Failed to fetch student schedules from database:', err);
        setBackendOnline(false);
      } finally {
        setLoading(false);
      }
    };

    const interval = setInterval(() => {
      fetchStudentSchedule();
    }, 5000); // Poll every 5s for live updates/rescheduling changes

    fetchStudentSchedule();
    return () => clearInterval(interval);
  }, [groupId]);

  const nextLecture = schedules.length > 0 ? schedules[0] : null;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col items-center">
      <div className="w-full max-w-md bg-gray-900 min-h-screen flex flex-col border-x border-gray-800 shadow-2xl">
        
        {/* Header Section */}
        <header className="px-6 py-5 border-b border-gray-800 bg-gray-900/90 sticky top-0 z-30 backdrop-blur-md flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase border border-red-500/20">
                STUDENT
              </span>
              Manar Schedule
            </h1>
            <p className="text-xs text-gray-450 mt-1">Class Schedule & Smart Alerts</p>
          </div>

          <div className="flex items-center gap-1.5 bg-gray-850 px-3 py-1 rounded-full text-[9px] font-bold text-gray-450 border border-gray-800">
            <span className={`h-1.5 w-1.5 rounded-full ${backendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
            {backendOnline ? 'LIVE SYNC' : 'OFFLINE MODE'}
          </div>
        </header>

        {/* Loading Spinner */}
        {loading && schedules.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20">
            <div className="h-6 w-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-500">Syncing with schedule engine...</span>
          </div>
        ) : (
          <div className="flex-1 p-5 space-y-6 print-area">
            
            {/* View Selection Toggle */}
            <div className="flex justify-between items-center bg-white/5 border border-white/10 p-2 rounded-xl mb-4 no-print">
              <span className="text-xs font-bold text-gray-300">
                {viewMode === 'list' ? 'القائمة الأسبوعية' : 'الجدول الشبكي'}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 text-[10px] font-black rounded-lg transition ${
                    viewMode === 'list' ? 'bg-lime-500 text-black' : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  📝 List
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-3 py-1 text-[10px] font-black rounded-lg transition ${
                    viewMode === 'calendar' ? 'bg-lime-500 text-black' : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  📅 Calendar
                </button>
              </div>
            </div>

            {viewMode === 'list' ? (
              <>
                {/* Top Section: Active Alert / Next Upcoming Lecture */}
                <section className="space-y-3 no-print">
                  <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('dashboard.nextUpcoming')}</h2>
                  {nextLecture ? (
                    <div className={`relative overflow-hidden rounded-xl border-l-4 p-5 shadow-lg flex flex-col gap-4 ${
                      isOverridden(nextLecture)
                        ? 'border-orange-500 bg-orange-950/20 text-orange-200'
                        : 'border-red-500 bg-gradient-to-r from-red-950/40 to-gray-850'
                    }`}>
                      {/* Alert Pin Badge */}
                      <div className="self-start flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded text-[9px] font-bold text-red-400 uppercase tracking-wide">
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

                      <div className="grid grid-cols-2 gap-y-3 gap-x-4 pt-3 border-t border-gray-800/80 text-xs">
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

                      {isOverridden(nextLecture) && (
                        <div className="bg-orange-950/30 border border-orange-900/40 rounded-lg p-2.5 text-[11px] text-orange-350">
                          {t('dashboard.rescheduledWarning')}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-850/40 border border-gray-800 rounded-xl p-6 text-center text-gray-500 text-xs">
                      {t('dashboard.noClassesRegistered')}
                    </div>
                  )}
                </section>

                {/* Bottom Section: Daily Schedule List */}
                <section className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('dashboard.weeklyTimeline')}</h2>
                    <button
                      onClick={() => window.print()}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-black text-gray-300 no-print transition-all"
                    >
                      🖨️ PDF
                    </button>
                  </div>
                  <div className="space-y-4">
                    {DAYS.map(day => {
                      const daySchedules = schedules.filter(s => getActiveDay(s) === day);
                      if (daySchedules.length === 0) return null;

                      return (
                        <div key={day} className="space-y-2 print-card">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-450">{day}</span>
                            <span className="text-[9px] text-gray-650 font-bold">{daySchedules.length} {t('dashboard.classes')}</span>
                          </div>

                          <div className="space-y-2.5">
                            {daySchedules.map(schedule => {
                              const overridden = isOverridden(schedule);
                              const isTheory = schedule.subject.type === 'THEORY';
                              return (
                                <div
                                  key={schedule.id}
                                  className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition hover:scale-[1.01] duration-150 ${
                                    overridden
                                      ? 'border-orange-500 bg-orange-950/20 text-orange-200 shadow-md shadow-orange-950/10'
                                      : isTheory
                                      ? 'bg-blue-900/10 border-blue-800/40 text-blue-200'
                                      : 'bg-green-900/10 border-green-800/40 text-green-200'
                                  }`}
                                >
                                  <div className="flex justify-between items-start gap-1">
                                    <div>
                                      <h4 className="text-sm font-bold text-white">{schedule.subject.name}</h4>
                                      <p className="text-[10px] font-mono mt-0.5 text-gray-450">{schedule.subject.code}</p>
                                    </div>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                      overridden
                                        ? 'bg-orange-900/40 border border-orange-850/30 text-orange-300'
                                        : isTheory
                                        ? 'bg-blue-900/40 border border-blue-800/30 text-blue-300'
                                        : 'bg-green-900/40 border border-green-800/30 text-green-300'
                                    }`}>
                                      {isTheory ? t('dashboard.theory') : t('dashboard.practical')}
                                    </span>
                                  </div>

                                  <div className="flex justify-between items-end pt-2 border-t border-white/5 text-[11px] text-gray-400">
                                    <div>
                                      {t('dashboard.classroom')}: <span className="font-semibold text-gray-300">{schedule.room?.name || 'N/A'}</span> • <span className="text-gray-450">{schedule.lecturerName}</span>
                                    </div>
                                    <div className="text-right">
                                      <span className="font-extrabold text-gray-200">
                                        {getActiveStartTime(schedule)} - {getActiveEndTime(schedule)}
                                      </span>
                                    </div>
                                  </div>

                                  {overridden && (
                                    <div className="bg-orange-500/20 border border-orange-500/50 text-orange-350 text-[10px] font-extrabold px-2 py-0.5 rounded self-start uppercase tracking-wide flex items-center gap-1">
                                      <span>⚠️</span> {t('dashboard.rescheduled') || 'Modified'}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {schedules.length === 0 && (
                      <div className="bg-gray-850/40 border border-gray-850 rounded-xl p-8 text-center text-gray-500 text-xs">
                        {t('dashboard.noClassesRegistered')}
                      </div>
                    )}
                  </div>
                </section>
              </>
            ) : (
              /* Weekly Calendar Grid View */
              <div className="space-y-4">
                <button
                  onClick={() => window.print()}
                  className="w-full mb-2 py-2.5 bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-400 hover:to-emerald-400 text-black font-extrabold text-[11px] rounded-xl shadow-lg no-print flex items-center justify-center gap-2"
                >
                  🖨️ PDF / Print Schedule
                </button>

                <div className="overflow-x-auto border border-white/10 rounded-2xl bg-gray-950/40 p-3 shadow-2xl">
                  <table className="w-full border-collapse text-[10px] text-center min-w-[500px]">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5 text-[9px] text-gray-400 uppercase font-black">
                        <th className="p-3 border-r border-white/5 text-left text-gray-300">Time / Day</th>
                        {['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'].map(day => (
                          <th key={day} className="p-3 border-r border-white/5 text-gray-200 font-extrabold">
                            {day === 'SUNDAY' ? 'الأحد' : day === 'MONDAY' ? 'الاثنين' : day === 'TUESDAY' ? 'الثلاثاء' : day === 'WEDNESDAY' ? 'الأربعاء' : 'الخميس'}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { start: '08:00', end: '10:00' },
                        { start: '10:00', end: '12:00' },
                        { start: '12:00', end: '14:00' },
                        { start: '14:00', end: '16:00' }
                      ].map(slot => (
                        <tr key={slot.start} className="border-b border-white/5 hover:bg-white/2 transition">
                          <td className="p-3 font-mono font-bold text-gray-400 border-r border-white/5 text-left bg-white/2">
                            {slot.start} - {slot.end}
                          </td>
                          {['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'].map(day => {
                            const cellLectures = schedules.filter(
                              s => getActiveDay(s) === day && getActiveStartTime(s).substring(0, 5) === slot.start
                            );
                            return (
                              <td key={day} className="p-2 border-r border-white/5 align-middle h-24">
                                {cellLectures.map(lecture => {
                                  const isTheory = lecture.subject.type === 'THEORY';
                                  const overridden = isOverridden(lecture);
                                  return (
                                    <div
                                      key={lecture.id}
                                      className={`p-2 rounded-xl border text-[8px] font-bold leading-tight space-y-1 shadow-md ${
                                        overridden
                                          ? 'border-orange-500/40 bg-orange-950/20 text-orange-300'
                                          : isTheory
                                          ? 'bg-blue-950/20 border-blue-500/20 text-blue-300'
                                          : 'bg-green-950/20 border-green-500/20 text-green-300'
                                      }`}
                                    >
                                      <div className="text-white truncate max-w-[80px] font-extrabold">{lecture.subject.name}</div>
                                      <div className="font-mono opacity-70 text-[7px]">{lecture.subject.code}</div>
                                      <div className="opacity-90">{lecture.room?.name || 'N/A'}</div>
                                    </div>
                                  );
                                })}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Footer */}
        <footer className="border-t border-gray-800 bg-gray-950/60 p-4 text-center text-[10px] text-gray-600 no-print">
          <div>© 2026 Manar Student Alert Portal. All rights reserved.</div>
        </footer>

      </div>
    </div>
  );
}
