import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
  const [groupId] = useState(1); // Simulating logged-in student belonging to Group A
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
    const fetchStudentSchedule = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:5000/api/schedules?groupId=${groupId}`);
        if (res.data && res.data.success) {
          setSchedules(res.data.data);
          setBackendOnline(true);
        } else {
          throw new Error('API failed');
        }
      } catch (err) {
        console.warn('Backend offline, loading student local mock schedule.', err);
        setBackendOnline(false);

        const saved = localStorage.getItem('manar_schedules');
        if (saved) {
          const allSchedules = JSON.parse(saved);
          setSchedules(allSchedules.filter(s => s.groupId === groupId));
        } else {
          setSchedules(MOCK_SCHEDULES);
        }
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
          <div className="flex-1 p-5 space-y-6">
            
            {/* Top Section: Active Alert / Next Upcoming Lecture */}
            <section className="space-y-3">
              <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Next Upcoming Lecture</h2>
              {nextLecture ? (
                <div className="relative overflow-hidden rounded-xl border-l-4 border-red-500 bg-gradient-to-r from-red-950/40 to-gray-850 p-5 shadow-lg flex flex-col gap-4">
                  {/* Alert Pin Badge */}
                  <div className="self-start flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded text-[9px] font-bold text-red-400 uppercase tracking-wide">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                    </span>
                    Starts in 15 Minutes
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white leading-tight">{nextLecture.subject.name}</h3>
                    <p className="text-xs font-mono text-red-300 mt-1 font-semibold">{nextLecture.subject.code}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 pt-3 border-t border-gray-800/80 text-xs">
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase font-semibold">Time Slot</span>
                      <span className="font-bold text-gray-250 mt-0.5 block">{getActiveStartTime(nextLecture)} - {getActiveEndTime(nextLecture)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase font-semibold">Classroom</span>
                      <span className="font-bold text-gray-250 mt-0.5 block">{nextLecture.room?.name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase font-semibold">Lecturer</span>
                      <span className="font-bold text-gray-250 mt-0.5 block">{nextLecture.lecturerName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase font-semibold">Day</span>
                      <span className="font-bold text-gray-250 mt-0.5 block">{getActiveDay(nextLecture)}</span>
                    </div>
                  </div>

                  {isOverridden(nextLecture) && (
                    <div className="bg-amber-950/30 border border-amber-900/40 rounded-lg p-2.5 text-[11px] text-amber-300">
                      ⚠️ Rescheduled Exception: Please note the updated room or time slot shown above.
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-850/40 border border-gray-800 rounded-xl p-6 text-center text-gray-500 text-xs">
                  No upcoming lectures today.
                </div>
              )}
            </section>

            {/* Bottom Section: Daily Schedule List */}
            <section className="space-y-4">
              <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Weekly Timeline (Group A)</h2>
              <div className="space-y-4">
                {DAYS.map(day => {
                  const daySchedules = schedules.filter(s => getActiveDay(s) === day);
                  if (daySchedules.length === 0) return null;

                  return (
                    <div key={day} className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-450">{day}</span>
                        <span className="text-[9px] text-gray-650 font-bold">{daySchedules.length} class(es)</span>
                      </div>

                      <div className="space-y-2.5">
                        {daySchedules.map(schedule => {
                          const overridden = isOverridden(schedule);
                          const isTheory = schedule.subject.type === 'THEORY';
                          return (
                            <div
                              key={schedule.id}
                              className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition hover:scale-[1.01] duration-150 ${
                                isTheory
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
                                  isTheory
                                    ? 'bg-blue-900/40 border border-blue-800/30 text-blue-300'
                                    : 'bg-green-900/40 border border-green-800/30 text-green-300'
                                }`}>
                                  {isTheory ? 'Theory' : 'Practical (Group A)'}
                                </span>
                              </div>

                              <div className="flex justify-between items-end pt-2 border-t border-white/5 text-[11px] text-gray-400">
                                <div>
                                  Room: <span className="font-semibold text-gray-300">{schedule.room?.name || 'N/A'}</span> • <span className="text-gray-450">{schedule.lecturerName}</span>
                                </div>
                                <div className="text-right">
                                  <span className="font-extrabold text-gray-200">
                                    {getActiveStartTime(schedule)} - {getActiveEndTime(schedule)}
                                  </span>
                                </div>
                              </div>

                              {overridden && (
                                <div className="bg-amber-950/25 border border-amber-900/30 text-amber-400 text-[9px] font-bold px-2 py-0.5 rounded self-start uppercase">
                                  Rescheduled
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
                    No classes registered.
                  </div>
                )}
              </div>
            </section>

          </div>
        )}

        {/* Footer */}
        <footer className="border-t border-gray-800 bg-gray-950/60 p-4 text-center text-[10px] text-gray-600">
          <div>© 2026 Manar Student Alert Portal. All rights reserved.</div>
        </footer>

      </div>
    </div>
  );
}
