import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const TIME_SLOTS = [
  { start: '08:00', end: '10:00', label: '08:00 AM - 10:00 AM' },
  { start: '10:00', end: '12:00', label: '10:00 AM - 12:00 PM' },
  { start: '12:00', end: '14:00', label: '12:00 PM - 02:00 PM' },
  { start: '14:00', end: '16:00', label: '02:00 PM - 04:00 PM' },
  { start: '16:00', end: '18:00', label: '04:00 PM - 06:00 PM' },
];

const MOCK_SCHEDULES = [
  {
    id: 1,
    subjectId: 101,
    subject: { name: 'Database Systems', code: 'CS-301', type: 'THEORY' },
    roomId: 201,
    room: { name: 'Hall 3A', capacity: 60 },
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
    room: { name: 'Lab 5', capacity: 30 },
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
    room: { name: 'Hall 1B', capacity: 80 },
    lecturerName: 'Dr. Manar Al-Saeed',
    groupId: 1,
    group: { name: 'Group A' },
    dayOfWeek: 'TUESDAY',
    startTime: '12:00',
    endTime: '14:00',
    overrides: []
  },
  {
    id: 4,
    subjectId: 104,
    subject: { name: 'Artificial Intelligence', code: 'CS-304', type: 'THEORY' },
    roomId: 204,
    room: { name: 'Hall 2A', capacity: 50 },
    lecturerName: 'Dr. Hisham Kordi',
    groupId: 2,
    group: { name: 'Group B' },
    dayOfWeek: 'WEDNESDAY',
    startTime: '14:00',
    endTime: '16:00',
    overrides: []
  }
];

export default function Dashboard() {
  const [schedules, setSchedules] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [backendOnline, setBackendOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [draggedSchedule, setDraggedSchedule] = useState(null);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/schedules');
      if (res.data && res.data.success) {
        setSchedules(res.data.data);
        setBackendOnline(true);
      } else {
        throw new Error('API failed');
      }
    } catch (err) {
      console.warn('Backend offline, running in offline mock mode.', err);
      setBackendOnline(false);
      
      const saved = localStorage.getItem('manar_schedules');
      if (saved) {
        setSchedules(JSON.parse(saved));
      } else {
        setSchedules(MOCK_SCHEDULES);
        localStorage.setItem('manar_schedules', JSON.stringify(MOCK_SCHEDULES));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const getTargetDateString = (dayOfWeekName) => {
    const daysMap = { SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6 };
    const targetIndex = daysMap[dayOfWeekName];
    const now = new Date();
    const currentDayIndex = now.getDay();
    const diff = targetIndex - currentDayIndex;
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + diff);
    return targetDate.toISOString().split('T')[0];
  };

  const handleDragStart = (e, schedule) => {
    setDraggedSchedule(schedule);
    e.dataTransfer.setData('scheduleId', schedule.id.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetDay, targetStart, targetEnd) => {
    e.preventDefault();
    const scheduleIdStr = e.dataTransfer.getData('scheduleId');
    const scheduleId = parseInt(scheduleIdStr);

    if (!scheduleId || !draggedSchedule) return;
    
    const currentDay = getActiveDay(draggedSchedule);
    const currentStart = getActiveStartTime(draggedSchedule);
    if (currentDay === targetDay && currentStart === targetStart) {
      setDraggedSchedule(null);
      return;
    }

    const targetDate = getTargetDateString(targetDay);
    const payload = {
      scheduleId,
      newStartTime: targetStart,
      newEndTime: targetEnd,
      date: targetDate,
      overrideType: 'TEMPORARY',
    };

    try {
      if (backendOnline) {
        const res = await axios.post('http://localhost:5000/api/schedules/override', payload);
        if (res.data && res.data.success) {
          showToast(`Successfully moved to ${targetDay} ${targetStart}-${targetEnd}! Notification sent to Group.`);
          fetchSchedules();
        }
      } else {
        const updated = schedules.map(s => {
          if (s.id === scheduleId) {
            const newOverride = {
              id: Date.now(),
              scheduleId,
              newStartTime: targetStart,
              newEndTime: targetEnd,
              newRoomId: s.roomId,
              newRoom: s.room,
              date: new Date(targetDate),
              overrideType: 'TEMPORARY'
            };
            return {
              ...s,
              overrides: [...s.overrides, newOverride]
            };
          }
          return s;
        });
        setSchedules(updated);
        localStorage.setItem('manar_schedules', JSON.stringify(updated));
        showToast(`[Mock Mode] Moved schedule and simulated targeted notification alert!`, 'info');
      }
    } catch (err) {
      console.error('Failed to post override', err);
      showToast('Error creating override.', 'error');
    } finally {
      setDraggedSchedule(null);
    }
  };

  const handleReset = () => {
    localStorage.removeItem('manar_schedules');
    setSchedules(MOCK_SCHEDULES);
    showToast('Mock data reset to original schedules.', 'info');
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

  const filteredSchedules = schedules.filter(s => {
    if (selectedGroup === 'ALL') return true;
    return s.group && s.group.name === selectedGroup;
  });

  const getSchedulesForCell = (day, startSlot) => {
    return filteredSchedules.filter(s => getActiveDay(s) === day && getActiveStartTime(s) === startSlot);
  };

  const groupsList = ['ALL', ...new Set(schedules.map(s => s.group?.name).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 border transition-all duration-300 transform translate-y-0 ${
          notification.type === 'error' ? 'bg-red-950/90 border-red-500 text-red-100' :
          notification.type === 'info' ? 'bg-blue-950/90 border-blue-500 text-blue-100' :
          'bg-green-950/90 border-green-500 text-green-100'
        }`}>
          <div className="h-2 w-2 rounded-full animate-ping bg-current" />
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Sleek Top Navigation/Header */}
      <header className="border-b border-gray-800 bg-gray-900/90 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white font-extrabold p-2 rounded-lg text-lg tracking-wider shadow-lg shadow-blue-900/30">M</div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Manar Admin Dashboard</h1>
            <p className="text-xs text-gray-400">Schedule exceptions & smart notification dispatcher</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700 text-xs">
            <span className={`h-2 w-2 rounded-full ${backendOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            <span className="font-semibold text-gray-300">
              {backendOnline ? 'Database Connected' : 'Offline Sandbox Mode'}
            </span>
          </div>

          {!backendOnline && (
            <button
              onClick={handleReset}
              className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-md transition border border-gray-700 font-medium"
            >
              Reset Mock Data
            </button>
          )}
        </div>
      </header>

      {/* Control Area */}
      <section className="px-6 py-6 border-b border-gray-800 bg-gray-900/40 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-gray-400">Filter Group:</label>
          <div className="flex gap-2">
            {groupsList.map(group => (
              <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition ${
                  selectedGroup === group
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/30'
                    : 'bg-gray-850 border-gray-750 hover:bg-gray-755 text-gray-300'
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-gray-400 bg-gray-850 border border-gray-800 px-3.5 py-1.5 rounded-lg">
          💡 Drag any card and drop it into a different cell to dynamically reschedule it.
        </div>
      </section>

      {/* Main Grid View */}
      <main className="flex-1 p-6 overflow-x-auto">
        {loading ? (
          <div className="h-full flex items-center justify-center flex-col gap-3 py-20">
            <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-450">Loading schedules...</span>
          </div>
        ) : (
          <div className="min-w-[1000px] border border-gray-800 rounded-xl overflow-hidden bg-gray-900/20 shadow-2xl">
            {/* Header row: Days of the week (Strict CSS Grid of 8 columns: Time + 7 Days) */}
            <div className="grid grid-cols-8 bg-gray-850 border-b border-gray-800 text-center font-bold text-xs tracking-wider text-gray-300 uppercase py-4">
              <div className="flex items-center justify-center text-gray-400 border-r border-gray-800 font-bold">
                Time Slot
              </div>
              {DAYS.map(day => (
                <div key={day} className="flex items-center justify-center">
                  {day}
                </div>
              ))}
            </div>

            {/* Time Slot Rows */}
            {TIME_SLOTS.map(slot => (
              <div key={slot.start} className="grid grid-cols-8 border-b border-gray-800 last:border-0 min-h-[140px]">
                {/* Time Indicator cell */}
                <div className="flex flex-col items-center justify-center bg-gray-950/40 border-r border-gray-800 p-3 text-center">
                  <span className="text-xs font-bold text-gray-200">{slot.start} - {slot.end}</span>
                  <span className="text-[10px] text-gray-500 mt-1.5 uppercase font-semibold tracking-wider">Theory / Lab</span>
                </div>

                {/* Day cells (CSS Grid drop targets) */}
                {DAYS.map(day => {
                  const cellSchedules = getSchedulesForCell(day, slot.start);
                  return (
                    <div
                      key={`${day}-${slot.start}`}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, day, slot.start, slot.end)}
                      className="p-3 flex flex-col gap-2 bg-gray-900/10 hover:bg-gray-800/10 transition-colors border-r border-gray-800 last:border-r-0 relative group min-h-[140px]"
                    >
                      {cellSchedules.map(schedule => {
                        const overridden = isOverridden(schedule);
                        const isTheory = schedule.subject.type === 'THEORY';
                        return (
                          <div
                            key={schedule.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, schedule)}
                            className={`p-3.5 rounded-lg text-left cursor-grab active:cursor-grabbing hover:scale-105 transition-all duration-200 shadow-md flex flex-col justify-between ${
                              isTheory
                                ? 'bg-blue-900/40 border border-blue-700 text-blue-100'
                                : 'bg-green-900/40 border border-green-700 text-green-100'
                            } ${
                              overridden ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-gray-900' : ''
                            }`}
                          >
                            <div>
                              <div className="flex justify-between items-start gap-1 mb-2">
                                <span className="text-xs font-extrabold leading-tight">
                                  {schedule.subject.name}
                                </span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold leading-none ${
                                  isTheory
                                    ? 'bg-blue-800/50 text-blue-300'
                                    : 'bg-green-800/50 text-green-300'
                                }`}>
                                  {schedule.subject.code}
                                </span>
                              </div>

                              <div className="text-[10px] text-gray-300 space-y-1">
                                <div>Room: <span className="font-bold">{schedule.room?.name || 'N/A'}</span></div>
                                <div>Lecturer: <span>{schedule.lecturerName}</span></div>
                                <div>Group: <span className="font-bold">{schedule.group?.name}</span></div>
                              </div>
                            </div>

                            <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between gap-1 flex-wrap">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                isTheory
                                  ? 'bg-blue-550/30 text-blue-300'
                                  : 'bg-green-550/30 text-green-300'
                              }`}>
                                {isTheory ? 'Theory' : 'Practical'}
                              </span>

                              {!isTheory && (
                                <span className="text-[9px] bg-green-850/80 border border-green-650 text-green-300 font-bold px-1.5 py-0.5 rounded">
                                  {schedule.group?.name.includes('A') ? 'مجموعة 1' : 'مجموعة 2'}
                                </span>
                              )}

                              {overridden && (
                                <span className="text-[8px] bg-amber-900/40 text-amber-300 font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                                  Rescheduled
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Empty cell indicator visible on hover */}
                      {cellSchedules.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <span className="text-[10px] text-gray-500 font-semibold border border-dashed border-gray-700 px-2 py-1 rounded bg-gray-900/60">
                            Drop Here
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer Details */}
      <footer className="border-t border-gray-800 bg-gray-950/40 px-6 py-4 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500 gap-4">
        <div>
          © 2026 Manar Smart Schedule & Alert System. All rights reserved.
        </div>
        <div className="flex gap-4">
          <span>Backend URL: <code className="text-blue-500 font-mono">http://localhost:5000</code></span>
          <span>Targeted Notification Queue Status: <code className="text-amber-500 font-mono">ON_DEMAND</code></span>
        </div>
      </footer>
    </div>
  );
}
