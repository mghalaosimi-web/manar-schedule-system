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

export default function StudentDashboard() {
  const [profile, setProfile] = useState({
    name: 'Mohammad Al-Otaibi',
    groupId: 1,
    groupName: 'Group A'
  });
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

  const nextLecture = schedules.length > 0 ? schedules[0] : null;

  // Determine current day of the week
  const todayIndex = new Date().getDay();
  const todayName = DAYS[todayIndex];
  const todayLectures = schedules.filter(s => getActiveDay(s) === todayName);

  return (
    <div className="flex-1 bg-gray-900 text-gray-100 p-5 flex flex-col items-center">
      <div className="w-full max-w-md space-y-6">
        
        {/* Profile Card Summary */}
        <div className="bg-gray-850 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-lime-400 font-bold uppercase tracking-widest">Active Profile</span>
            <h3 className="text-sm font-extrabold text-white mt-0.5">{profile.name}</h3>
            <span className="text-[10px] text-gray-500 font-semibold">{profile.groupName}</span>
          </div>

          <button
            onClick={() => window.location.hash = '#/student/settings'}
            className="px-2.5 py-1 bg-gray-800 hover:bg-gray-750 text-[10px] font-bold text-gray-300 rounded border border-gray-700 transition"
          >
            Manage Group
          </button>
        </div>

        {/* Top Section: Glowing Alert Card for Next Lecture */}
        <section className="space-y-3">
          <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Pre-Lecture Active Alert</h2>
          {nextLecture ? (
            <div className="relative overflow-hidden rounded-xl border-l-4 border-red-500 bg-gradient-to-r from-red-950/40 to-gray-850 p-5 shadow-lg flex flex-col gap-4">
              <div className="self-start flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded text-[9px] font-bold text-red-400 uppercase tracking-wide">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                </span>
                Next Class Starts in 15 Minutes
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
            </div>
          ) : (
            <div className="bg-gray-850/40 border border-gray-800 rounded-xl p-6 text-center text-gray-500 text-xs">
              No classes scheduled on record.
            </div>
          )}
        </section>

        {/* Current Day Status Section */}
        <section className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Today's Class Schedule ({todayName})</h2>
            <span className="text-[9px] bg-sky-950 text-sky-400 font-bold px-2 py-0.5 rounded-full">
              {todayLectures.length} Classes
            </span>
          </div>

          <div className="space-y-2.5">
            {todayLectures.map(schedule => {
              const isTheory = schedule.subject.type === 'THEORY';
              return (
                <div
                  key={schedule.id}
                  className={`p-4 rounded-xl border flex justify-between items-center gap-3 ${
                    isTheory ? 'bg-blue-900/10 border-blue-800/40 text-blue-200' : 'bg-green-900/10 border-green-800/40 text-green-200'
                  }`}
                >
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">{schedule.subject.name}</h4>
                    <p className="text-[10px] text-gray-400">
                      Room: <span className="text-gray-300 font-semibold">{schedule.room?.name || 'N/A'}</span> • {schedule.lecturerName}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-extrabold text-gray-200 block">
                      {getActiveStartTime(schedule)} - {getActiveEndTime(schedule)}
                    </span>
                    <span className="text-[9px] text-gray-500 uppercase tracking-wider block mt-0.5">
                      {isTheory ? 'Theory' : 'Lab'}
                    </span>
                  </div>
                </div>
              );
            })}

            {todayLectures.length === 0 && (
              <div className="bg-gray-850/40 border border-gray-800 rounded-xl p-8 text-center text-gray-500 text-xs">
                🎉 No classes scheduled for today. Enjoy your day off!
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
