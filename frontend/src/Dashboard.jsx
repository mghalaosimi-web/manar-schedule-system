import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from './ConfirmationModal';
import { API_URL } from './config';
import AnalyticsPanel from './AnalyticsPanel';
import { useTranslation } from 'react-i18next';

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
  const { i18n } = useTranslation();
  const [schedules, setSchedules] = useState([]);
  const navigate = useNavigate();

  const translateDay = (dayName) => {
    const map = {
      SUNDAY: 'الأحد',
      MONDAY: 'الإثنين',
      TUESDAY: 'الثلاثاء',
      WEDNESDAY: 'الأربعاء',
      THURSDAY: 'الخميس',
      FRIDAY: 'الجمعة',
      SATURDAY: 'السبت'
    };
    return i18n.language === 'ar' ? (map[dayName] || dayName) : dayName;
  };

  const handleLogout = () => {
    localStorage.removeItem('manar_token');
    localStorage.removeItem('manar_user');
    navigate('/login');
  };

  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [backendOnline, setBackendOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [draggedSchedule, setDraggedSchedule] = useState(null);
  const [overrideConfirmData, setOverrideConfirmData] = useState(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newScheduleForm, setNewScheduleForm] = useState({
    subjectName: '',
    subjectCode: '',
    subjectType: 'THEORY',
    roomName: '',
    roomCapacity: '45',
    lecturerName: '',
    groupName: 'Group A',
    dayOfWeek: 'SUNDAY',
    timeSlotIndex: '0'
  });

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('manar_token');
      const res = await axios.get(`${API_URL}/api/schedules`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data && res.data.success) {
        setSchedules(res.data.data);
        setBackendOnline(true);
      } else {
        throw new Error('API failed');
      }
    } catch (err) {
      console.error('Failed to fetch schedules from database:', err);
      setBackendOnline(false);
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

  const handleDrop = (e, targetDay, targetStart, targetEnd) => {
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

    setOverrideConfirmData({
      scheduleId,
      targetDay,
      targetStart,
      targetEnd
    });
  };

  const executeOverride = async (overrideType) => {
    if (!overrideConfirmData) return;
    const { scheduleId, targetDay, targetStart, targetEnd } = overrideConfirmData;
    const targetDate = getTargetDateString(targetDay);
    const payload = {
      scheduleId,
      newStartTime: targetStart,
      newEndTime: targetEnd,
      date: targetDate,
      overrideType,
    };

    setOverrideConfirmData(null);
    setDraggedSchedule(null);

    try {
      const token = localStorage.getItem('manar_token');
      const res = await axios.post(`${API_URL}/api/schedules/override`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data && res.data.success) {
        showToast(`Successfully moved to ${targetDay} ${targetStart}-${targetEnd}! Notification sent to Group.`);
        fetchSchedules();
      }
    } catch (err) {
      console.error('Failed to post override', err);
      const errMsg = err.response?.data?.error || 'Error creating override.';
      showToast(errMsg, 'error');
    }
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    const slot = TIME_SLOTS[parseInt(newScheduleForm.timeSlotIndex)];
    const payload = {
      subjectName: newScheduleForm.subjectName,
      subjectCode: newScheduleForm.subjectCode,
      subjectType: newScheduleForm.subjectType,
      roomName: newScheduleForm.roomName,
      roomCapacity: parseInt(newScheduleForm.roomCapacity) || 45,
      lecturerName: newScheduleForm.lecturerName,
      groupName: newScheduleForm.groupName,
      dayOfWeek: newScheduleForm.dayOfWeek,
      startTime: slot.start,
      endTime: slot.end
    };

    try {
      const token = localStorage.getItem('manar_token');
      const res = await axios.post(`${API_URL}/api/schedules`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data && res.data.success) {
        showToast('Schedule created successfully!');
        setIsAddModalOpen(false);
        setNewScheduleForm({
          subjectName: '',
          subjectCode: '',
          subjectType: 'THEORY',
          roomName: '',
          roomCapacity: '45',
          lecturerName: '',
          groupName: 'Group A',
          dayOfWeek: 'SUNDAY',
          timeSlotIndex: '0'
        });
        fetchSchedules();
      }
    } catch (err) {
      console.error('Failed to create schedule', err);
      const errMsg = err.response?.data?.error || 'Error creating new schedule.';
      showToast(errMsg, 'error');
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
            <h1 className="text-xl font-bold tracking-tight text-white">
              {i18n.language === 'ar' ? 'لوحة تحكم المنار للمسؤول' : 'Manar Admin Dashboard'}
            </h1>
            <p className="text-xs text-gray-400">
              {i18n.language === 'ar' ? 'جدولة التعديلات الطارئة وإرسال التنبيهات الذكية' : 'Schedule exceptions & smart notification dispatcher'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700 text-xs">
            <span className={`h-2 w-2 rounded-full ${backendOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            <span className="font-semibold text-gray-300">
              {backendOnline 
                ? (i18n.language === 'ar' ? 'قاعدة البيانات متصلة' : 'Database Connected') 
                : (i18n.language === 'ar' ? 'وضع العمل المنفصل (التجريبي)' : 'Offline Sandbox Mode')}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="text-xs bg-red-950/40 hover:bg-red-900/40 text-red-200 px-3 py-1.5 rounded-md transition border border-red-900/35 font-semibold"
          >
            {i18n.language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
          </button>
        </div>
      </header>

      {/* Control Area */}
      <section className="no-print px-6 py-6 border-b border-gray-800 bg-gray-900/40 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-400">
              {i18n.language === 'ar' ? 'تصفية حسب الشعبة:' : 'Filter Group:'}
            </label>
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

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-lime-500 text-black font-extrabold text-xs rounded-md shadow-md shadow-lime-500/20 hover:bg-lime-400 transition"
          >
            ➕ {i18n.language === 'ar' ? 'إضافة موعد' : 'Add Schedule'}
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs rounded-md shadow-md shadow-purple-500/20 transition flex items-center gap-1.5"
          >
            🖨️ {i18n.language === 'ar' ? 'طباعة الجدول الرئيسي' : 'Print Master Schedule'}
          </button>
        </div>

        <div className="text-xs text-gray-400 bg-gray-850 border border-gray-800 px-3.5 py-1.5 rounded-lg">
          {i18n.language === 'ar' 
            ? '💡 اسحب أي بطاقة وأسقطها في خلية أخرى لتعديل موعدها تلقائياً وإخطار الطلاب.' 
            : '💡 Drag any card and drop it into a different cell to dynamically reschedule it.'}
        </div>
      </section>

      {/* Analytics Dashboard Overview */}
      <section className="no-print px-6 pt-6">
        <AnalyticsPanel />
      </section>

      {/* Main Grid View */}
      <main className="flex-1 p-4 md:p-8 overflow-x-auto">
        {loading ? (
          <div className="h-full flex items-center justify-center flex-col gap-3 py-20">
            <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-455">
              {i18n.language === 'ar' ? 'جاري تحميل الجداول الأكاديمية...' : 'Loading schedules...'}
            </span>
          </div>
        ) : (
          <div className="min-w-[1000px] border border-gray-800 rounded-xl overflow-hidden bg-gray-900/20 shadow-2xl">
            {/* Header row: Days of the week (Strict CSS Grid of 8 columns: Time + 7 Days) */}
            <div className="grid grid-cols-8 bg-gray-850 border-b border-gray-800 text-center font-bold text-xs tracking-wider text-gray-300 uppercase py-4">
              <div className="flex items-center justify-center text-gray-400 border-r border-gray-800 font-bold">
                {i18n.language === 'ar' ? 'الوقت / الحصص' : 'Time Slot'}
              </div>
              {DAYS.map(day => (
                <div key={day} className="flex items-center justify-center">
                  {translateDay(day)}
                </div>
              ))}
            </div>

            {/* Time Slot Rows */}
            {TIME_SLOTS.map(slot => (
              <div key={slot.start} className="grid grid-cols-8 border-b border-gray-800 last:border-0 min-h-[140px]">
                {/* Time Indicator cell */}
                <div className="flex flex-col items-center justify-center bg-gray-950/40 border-r border-gray-800 p-3 text-center">
                  <span className="text-xs font-bold text-gray-200">{slot.start} - {slot.end}</span>
                  <span className="text-[10px] text-gray-500 mt-1.5 uppercase font-semibold tracking-wider">
                    {i18n.language === 'ar' ? 'نظري / عملي' : 'Theory / Lab'}
                  </span>
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
                            className={`p-3.5 rounded-lg text-right cursor-grab active:cursor-grabbing hover:scale-105 transition-all duration-200 shadow-md flex flex-col justify-between ${
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
                                <div className="flex items-center gap-1.5">
                                  <span>{i18n.language === 'ar' ? 'القاعة:' : 'Room:'}</span>
                                  <span className="font-bold">{schedule.room?.name || 'N/A'}</span>
                                  {schedule.room && schedule.group?._count && (
                                    <span 
                                      title={`Capacity Status: ${schedule.group._count.students || 0} students in group / ${schedule.room.capacity} seat capacity`}
                                      className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                        (schedule.group._count.students || 0) > schedule.room.capacity
                                          ? 'bg-red-500 text-white animate-pulse'
                                          : (schedule.group._count.students || 0) >= schedule.room.capacity * 0.8
                                          ? 'bg-amber-500 text-black'
                                          : 'bg-emerald-500/20 text-emerald-300'
                                      }`}
                                    >
                                      {schedule.group._count.students || 0}/{schedule.room.capacity}
                                    </span>
                                  )}
                                </div>
                                <div>{i18n.language === 'ar' ? 'المحاضر: ' : 'Lecturer: '}<span>{schedule.lecturerName}</span></div>
                                <div>{i18n.language === 'ar' ? 'الشعبة: ' : 'Group: '}<span className="font-bold">{schedule.group?.name}</span></div>
                              </div>
                            </div>

                            <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between gap-1 flex-wrap">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                isTheory
                                  ? 'bg-blue-550/30 text-blue-300'
                                  : 'bg-green-550/30 text-green-300'
                              }`}>
                                {isTheory 
                                  ? (i18n.language === 'ar' ? 'نظري' : 'Theory') 
                                  : (i18n.language === 'ar' ? 'عملي' : 'Practical')}
                              </span>

                              {!isTheory && (
                                <span className="text-[9px] bg-green-850/80 border border-green-650 text-green-300 font-bold px-1.5 py-0.5 rounded">
                                  {schedule.group?.name.includes('A') ? 'مجموعة 1' : 'مجموعة 2'}
                                </span>
                              )}

                              {overridden && (
                                <span className="text-[8px] bg-amber-900/40 text-amber-300 font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                                  {i18n.language === 'ar' ? 'تم التعديل' : 'Rescheduled'}
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
          <span>Backend URL: <code className="text-blue-500 font-mono">{API_URL}</code></span>
          <span>Targeted Notification Queue Status: <code className="text-amber-500 font-mono">ON_DEMAND</code></span>
        </div>
      </footer>

      {/* Add Schedule Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-gray-850 border border-gray-800 w-full max-w-lg rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-lime-400">
                Add New Base Schedule
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-450 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSchedule} className="space-y-4 text-xs text-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-gray-405 block font-medium">Subject Name</label>
                  <input
                    type="text"
                    required
                    value={newScheduleForm.subjectName}
                    onChange={(e) => setNewScheduleForm({ ...newScheduleForm, subjectName: e.target.value })}
                    placeholder="e.g. Software Engineering"
                    className="w-full bg-gray-900 border border-gray-750 rounded p-2.5 text-white focus:outline-none focus:border-lime-500 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-405 block font-medium">Subject Code</label>
                  <input
                    type="text"
                    required
                    value={newScheduleForm.subjectCode}
                    onChange={(e) => setNewScheduleForm({ ...newScheduleForm, subjectCode: e.target.value })}
                    placeholder="e.g. CS-303"
                    className="w-full bg-gray-900 border border-gray-750 rounded p-2.5 text-white focus:outline-none focus:border-lime-500 font-mono font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-gray-405 block font-medium">Subject Type</label>
                  <select
                    value={newScheduleForm.subjectType}
                    onChange={(e) => setNewScheduleForm({ ...newScheduleForm, subjectType: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-750 rounded p-2.5 text-white focus:outline-none focus:border-lime-500 font-medium"
                  >
                    <option value="THEORY">Theory</option>
                    <option value="PRACTICAL">Practical</option>
                  </select>
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-gray-405 block font-medium">Lecturer Name</label>
                  <input
                    type="text"
                    required
                    value={newScheduleForm.lecturerName}
                    onChange={(e) => setNewScheduleForm({ ...newScheduleForm, lecturerName: e.target.value })}
                    placeholder="e.g. Dr. Manar Al-Saeed"
                    className="w-full bg-gray-900 border border-gray-750 rounded p-2.5 text-white focus:outline-none focus:border-lime-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-gray-405 block font-medium">Room Name</label>
                  <input
                    type="text"
                    required
                    value={newScheduleForm.roomName}
                    onChange={(e) => setNewScheduleForm({ ...newScheduleForm, roomName: e.target.value })}
                    placeholder="e.g. Hall 1B"
                    className="w-full bg-gray-900 border border-gray-750 rounded p-2.5 text-white focus:outline-none focus:border-lime-500 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-405 block font-medium">Room Capacity</label>
                  <input
                    type="number"
                    required
                    value={newScheduleForm.roomCapacity}
                    onChange={(e) => setNewScheduleForm({ ...newScheduleForm, roomCapacity: e.target.value })}
                    placeholder="e.g. 45"
                    className="w-full bg-gray-900 border border-gray-750 rounded p-2.5 text-white focus:outline-none focus:border-lime-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-gray-405 block font-medium">Group Name</label>
                  <input
                    type="text"
                    required
                    value={newScheduleForm.groupName}
                    onChange={(e) => setNewScheduleForm({ ...newScheduleForm, groupName: e.target.value })}
                    placeholder="e.g. Group A"
                    className="w-full bg-gray-900 border border-gray-750 rounded p-2.5 text-white focus:outline-none focus:border-lime-500 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-405 block font-medium">Day of Week</label>
                  <select
                    value={newScheduleForm.dayOfWeek}
                    onChange={(e) => setNewScheduleForm({ ...newScheduleForm, dayOfWeek: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-750 rounded p-2.5 text-white focus:outline-none focus:border-lime-500 font-medium"
                  >
                    {DAYS.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-gray-405 block font-medium">Time Slot</label>
                  <select
                    value={newScheduleForm.timeSlotIndex}
                    onChange={(e) => setNewScheduleForm({ ...newScheduleForm, timeSlotIndex: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-750 rounded p-2.5 text-white focus:outline-none focus:border-lime-500 font-medium"
                  >
                    {TIME_SLOTS.map((slot, index) => (
                      <option key={index} value={index}>{slot.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-800 font-sans">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-750 text-gray-300 font-semibold rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-lime-500 hover:bg-lime-400 text-black font-extrabold rounded shadow-md shadow-lime-500/10"
                >
                  Create Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirmation Modal for Drag and Drop Exception */}
      <ConfirmationModal
        isOpen={!!overrideConfirmData}
        title="Confirm Schedule Change"
        message="Please select the override type for this change. Temporary applies to the current week only; Permanent reschedules all future weeks."
        onConfirm={executeOverride}
        onCancel={() => {
          setOverrideConfirmData(null);
          setDraggedSchedule(null);
        }}
        cancelText="Cancel"
        options={[
          { label: '📅 Temporary Exception', value: 'TEMPORARY' },
          { label: '🔒 Permanent Reschedule', value: 'PERMANENT' }
        ]}
      />
    </div>
  );
}
