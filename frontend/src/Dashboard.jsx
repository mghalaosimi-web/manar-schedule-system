import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from './ConfirmationModal';
import ErrorModal from './ErrorModal';
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
  const [mobileSelectedDay, setMobileSelectedDay] = useState(DAYS[new Date().getDay()] || 'SUNDAY');
  const [mobileRescheduleTarget, setMobileRescheduleTarget] = useState(null);
  const [conflictError, setConflictError] = useState(null);

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

    const handleScheduleUpdate = () => {
      console.log('[AdminDashboard] Real-time schedule update triggered.');
      fetchSchedules();
    };

    window.addEventListener('MANAR_SCHEDULE_UPDATE', handleScheduleUpdate);
    return () => {
      window.removeEventListener('MANAR_SCHEDULE_UPDATE', handleScheduleUpdate);
    };
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

  const handleMobileCardClick = (schedule) => {
    setMobileRescheduleTarget(schedule);
  };

  const handleMobileRescheduleSubmit = (e) => {
    e.preventDefault();
    if (!mobileRescheduleTarget) return;
    const targetDay = e.target.dayOfWeek.value;
    const slotIndex = parseInt(e.target.timeSlotIndex.value);
    const slot = TIME_SLOTS[slotIndex];

    setOverrideConfirmData({
      scheduleId: mobileRescheduleTarget.id,
      targetDay,
      targetStart: slot.start,
      targetEnd: slot.end
    });
    setMobileRescheduleTarget(null);
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
      if (err.response?.status === 409) {
        setConflictError({
          title: i18n.language === 'ar' ? 'تعارض في الجدول' : 'Scheduling Conflict',
          message: errMsg
        });
      } else {
        showToast(errMsg, 'error');
      }
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
      if (err.response?.status === 409) {
        setConflictError({
          title: i18n.language === 'ar' ? 'تعارض في الجدول' : 'Scheduling Conflict',
          message: errMsg
        });
      } else {
        showToast(errMsg, 'error');
      }
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
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col font-sans transition-colors duration-300">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border transition-all duration-300 transform translate-y-0 frosted-panel ${
          notification.type === 'error' ? 'border-red-500/40 text-red-400' :
          notification.type === 'info' ? 'border-blue-500/40 text-blue-400' :
          'border-[var(--accent)] text-[var(--accent)]'
        }`}>
          <div className="h-2 w-2 rounded-full animate-ping bg-current" />
          <span className="text-xs font-black tracking-wide">{notification.message}</span>
        </div>
      )}

      {/* Sleek Top Navigation/Header */}
      <header 
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6"
        style={{
          height: '60px',
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1 md:flex-none">
          <div className="bg-[var(--accent)] text-black font-extrabold p-1.5 rounded-lg text-sm tracking-wider shadow-lg shadow-[var(--accent-glow)] shrink-0">M</div>
          <div>
            <h1 className="text-xs md:text-sm font-black tracking-wider uppercase text-white truncate">
              {i18n.language === 'ar' ? 'لوحة تحكم المسؤول' : 'Manar Admin Dashboard'}
            </h1>
            <p className="text-[9px] text-[var(--text-secondary)] font-semibold tracking-wider truncate">
              {i18n.language === 'ar' ? 'جدولة التعديلات الطارئة وإرسال التنبيهات' : 'Schedule overrides & live notifications'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 text-[10px] font-bold">
            <span className={`h-2 w-2 rounded-full ${backendOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            <span className="text-[var(--text-secondary)]">
              {backendOnline 
                ? (i18n.language === 'ar' ? 'متصل بقاعدة البيانات' : 'Connected') 
                : (i18n.language === 'ar' ? 'وضع التجربة المنفصل' : 'Offline Sandbox')}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="btn-ghost px-3 py-1.5 text-[10px] tracking-widest uppercase"
          >
            {i18n.language === 'ar' ? 'خروج' : 'Logout'}
          </button>
        </div>
      </header>

      {/* Spacing offset for fixed header */}
      <div style={{ height: '60px' }} />

      {/* Control Area */}
      <section className="no-print px-6 py-6 border-b border-[var(--border-color)] bg-white/1 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black tracking-widest uppercase text-[var(--text-secondary)]">
              {i18n.language === 'ar' ? 'تصفية حسب الشعبة:' : 'Filter Group:'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {groupsList.map(group => (
                <button
                  key={group}
                  onClick={() => setSelectedGroup(group)}
                  className={`px-3.5 py-2 rounded-xl text-[10px] font-black tracking-wider uppercase border transition-all ${
                    selectedGroup === group
                      ? 'bg-[var(--accent)] border-[var(--accent)] text-black shadow-lg shadow-[var(--accent-glow)] scale-105'
                      : 'bg-white/3 border-white/5 hover:bg-white/8 text-[var(--text-primary)]'
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn-neon px-4 py-2.5 text-xs font-black tracking-wider"
              style={{ minHeight: '46px' }}
            >
              ➕ {i18n.language === 'ar' ? 'إضافة موعد' : 'Add Schedule'}
            </button>

            <button
              onClick={() => window.print()}
              className="btn-ghost px-4 py-2.5 text-xs font-black tracking-wider"
              style={{ minHeight: '46px' }}
            >
              🖨️ {i18n.language === 'ar' ? 'طباعة الجدول' : 'Print Schedule'}
            </button>
          </div>
        </div>

        <div className="text-[10px] text-[var(--text-secondary)] font-semibold leading-relaxed border-t border-white/3 pt-3">
          {i18n.language === 'ar' 
            ? '💡 للكمبيوتر: اسحب أي بطاقة وأسقطها لتعديل موعدها. للهاتف: اضغط على أي بطاقة لتعديل موعدها بسهولة.' 
            : '💡 Desktop: Drag & drop to reschedule. Mobile: Tap any card to reschedule.'}
        </div>
      </section>

      {/* Analytics Dashboard Overview */}
      <section className="no-print px-6 pt-6">
        <AnalyticsPanel />
      </section>

      {/* Mobile Day Selector Tabs (Only visible on mobile screens) */}
      <div className="md:hidden no-print px-6 pt-6">
        <p className="text-[10px] font-black tracking-widest uppercase text-[var(--text-secondary)] mb-3">
          {i18n.language === 'ar' ? 'اختر اليوم لعرض الجدول:' : 'Select Day:'}
        </p>
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none" style={{ direction: i18n.language === 'ar' ? 'rtl' : 'ltr' }}>
          {DAYS.map(day => (
            <button
              key={day}
              onClick={() => setMobileSelectedDay(day)}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black tracking-wider uppercase whitespace-nowrap transition-all duration-200 ${
                mobileSelectedDay === day
                  ? 'bg-[var(--accent)] text-black shadow-lg shadow-[var(--accent-glow)] scale-105'
                  : 'bg-white/3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
              }`}
            >
              {translateDay(day)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid View */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {loading ? (
          <div className="h-full flex items-center justify-center flex-col gap-3 py-20">
            <div className="h-8 w-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-[var(--text-secondary)] font-bold">
              {i18n.language === 'ar' ? 'جاري تحميل الجداول الأكاديمية...' : 'Loading schedules...'}
            </span>
          </div>
        ) : (
          <>
            {/* Desktop Grid View (Hidden on mobile) */}
            <div className="hidden md:block border border-[var(--border-color)] rounded-2xl overflow-x-auto frosted-panel">
              <div className="min-w-[1000px]">
                {/* Header row: Days of the week */}
                <div className="grid grid-cols-8 bg-white/2 border-b border-[var(--border-color)] text-center font-black text-[10px] tracking-widest uppercase py-4">
                  <div className="flex items-center justify-center text-[var(--text-secondary)] border-r border-[var(--border-color)]">
                    {i18n.language === 'ar' ? 'الحصة / الوقت' : 'Time Slot'}
                  </div>
                  {DAYS.map(day => (
                    <div key={day} className="flex items-center justify-center text-white">
                      {translateDay(day)}
                    </div>
                  ))}
                </div>

                {/* Time Slot Rows */}
                {TIME_SLOTS.map(slot => (
                  <div key={slot.start} className="grid grid-cols-8 border-b border-[var(--border-color)] last:border-0 min-h-[140px]">
                    {/* Time Indicator cell */}
                    <div className="flex flex-col items-center justify-center bg-black/40 border-r border-[var(--border-color)] p-3 text-center">
                      <span className="text-xs font-black text-white">{slot.start} - {slot.end}</span>
                      <span className="text-[9px] text-[var(--text-secondary)] mt-1.5 uppercase font-bold tracking-wider">
                        {i18n.language === 'ar' ? 'المحاضرات' : 'Lectures'}
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
                          className="p-3 flex flex-col gap-2 bg-transparent hover:bg-white/1 transition-colors border-r border-[var(--border-color)] last:border-r-0 relative group min-h-[140px]"
                        >
                          {cellSchedules.map(schedule => {
                            const overridden = isOverridden(schedule);
                            const isTheory = schedule.subject.type === 'THEORY';
                            const studentCount = schedule.group?.students?.length || 0;
                            const roomCap = schedule.room?.capacity || 45;
                            const isOverCap = studentCount > roomCap;
                            
                            return (
                              <div
                                key={schedule.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, schedule)}
                                className={`p-3.5 rounded-xl text-right cursor-grab active:cursor-grabbing hover:scale-[1.03] transition-all duration-200 border flex flex-col justify-between ${
                                  isTheory
                                    ? 'bg-[var(--accent-dim)] border-[var(--border-color)] text-white'
                                    : 'bg-cyan-950/20 border-cyan-800/30 text-cyan-100'
                                } ${
                                  overridden ? 'ring-1 ring-amber-500 ring-offset-2 ring-offset-black' : ''
                                }`}
                              >
                                <div>
                                  <div className="flex justify-between items-start gap-1 mb-2">
                                    <span className="text-[11px] font-black leading-tight">
                                      {schedule.subject.name}
                                    </span>
                                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono font-bold leading-none ${
                                      isTheory
                                        ? 'bg-white/5 text-[var(--accent)]'
                                        : 'bg-cyan-500/10 text-cyan-400'
                                    }`}>
                                      {schedule.subject.code}
                                    </span>
                                  </div>

                                  <div className="text-[10px] text-[var(--text-secondary)] space-y-1 font-medium">
                                    <div className="flex items-center gap-1.5">
                                      <span>{i18n.language === 'ar' ? 'القاعة:' : 'Room:'}</span>
                                      <span className="font-bold text-white">{schedule.room?.name || 'N/A'}</span>
                                      
                                      {/* Capacity status indicator */}
                                      <span 
                                        title={`Group Students: 30 / Room Capacity: ${roomCap}`}
                                        className={`text-[8px] px-1.5 py-0.2 rounded font-black ${
                                          isOverCap
                                            ? 'bg-red-500/20 text-red-400 border border-red-500/20'
                                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/15'
                                        }`}
                                      >
                                        30/{roomCap}
                                      </span>
                                    </div>
                                    <div>{i18n.language === 'ar' ? 'المحاضر: ' : 'Lecturer: '}<span className="text-white">{schedule.lecturerName}</span></div>
                                    <div>{i18n.language === 'ar' ? 'الشعبة: ' : 'Group: '}<span className="font-bold text-white">{schedule.group?.name}</span></div>
                                  </div>
                                </div>

                                <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between gap-1 flex-wrap">
                                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                    isTheory
                                      ? 'bg-white/5 text-[var(--accent)]'
                                      : 'bg-cyan-500/10 text-cyan-400'
                                  }`}>
                                    {isTheory 
                                      ? (i18n.language === 'ar' ? 'نظري' : 'Theory') 
                                      : (i18n.language === 'ar' ? 'عملي' : 'Practical')}
                                  </span>

                                  {overridden && (
                                    <span className="text-[8px] bg-amber-500/15 text-amber-400 font-bold px-1.5 py-0.5 rounded border border-amber-500/25">
                                      {i18n.language === 'ar' ? 'معدّل' : 'Rescheduled'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          
                          {/* Empty cell indicator visible on hover */}
                          {cellSchedules.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              <span className="text-[9px] text-[var(--text-secondary)] font-black border border-dashed border-white/10 px-2.5 py-1 rounded-lg bg-black/60 tracking-wider">
                                DROP
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Stacked Day View (Visible on mobile instead of horizontal grid) */}
            <div className="md:hidden space-y-3 no-print">
              {TIME_SLOTS.map(slot => {
                const cellSchedules = getSchedulesForCell(mobileSelectedDay, slot.start);
                return (
                  <div key={slot.start} className="frosted-panel rounded-2xl p-4 space-y-3 border border-white/5 bg-black/30">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-xs font-black text-[var(--text-secondary)] tracking-wider">{slot.label}</span>
                      <button
                        onClick={() => {
                          setNewScheduleForm({
                            ...newScheduleForm,
                            dayOfWeek: mobileSelectedDay,
                            timeSlotIndex: TIME_SLOTS.indexOf(slot).toString()
                          });
                          setIsAddModalOpen(true);
                        }}
                        className="text-[var(--accent)] font-bold text-xs"
                      >
                        + {i18n.language === 'ar' ? 'إضافة' : 'Add'}
                      </button>
                    </div>

                    {cellSchedules.length === 0 ? (
                      <p className="text-[10px] text-[var(--text-secondary)] italic py-2">
                        {i18n.language === 'ar' ? 'لا توجد محاضرات مجدولة' : 'No lectures scheduled'}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {cellSchedules.map(schedule => {
                          const overridden = isOverridden(schedule);
                          const isTheory = schedule.subject.type === 'THEORY';
                          const roomCap = schedule.room?.capacity || 45;
                          
                          return (
                            <div
                              key={schedule.id}
                              onClick={() => handleMobileCardClick(schedule)}
                              className={`p-4 rounded-xl text-right transition-all border flex flex-col justify-between cursor-pointer hover:bg-white/5 active:scale-95 ${
                                isTheory
                                  ? 'bg-[var(--accent-dim)] border-[var(--border-color)] text-white'
                                  : 'bg-cyan-950/20 border-cyan-800/30 text-cyan-100'
                              } ${
                                overridden ? 'ring-1 ring-amber-500' : ''
                              }`}
                            >
                              <div className="flex justify-between items-start gap-1 mb-2">
                                <span className="text-[11px] font-black leading-tight text-white">
                                  {schedule.subject.name}
                                </span>
                                <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono font-bold leading-none ${
                                  isTheory
                                    ? 'bg-white/5 text-[var(--accent)]'
                                    : 'bg-cyan-500/10 text-cyan-400'
                                }`}>
                                  {schedule.subject.code}
                                </span>
                              </div>

                              <div className="text-[10px] text-[var(--text-secondary)] space-y-1 font-medium mb-3">
                                <div>
                                  {i18n.language === 'ar' ? 'القاعة: ' : 'Room: '}
                                  <span className="font-bold text-white">{schedule.room?.name || 'N/A'}</span>
                                  <span className="text-[8px] px-1.5 py-0.2 rounded font-black bg-white/5 text-gray-300 ml-1.5 inline-block">
                                    30/{roomCap}
                                  </span>
                                </div>
                                <div>{i18n.language === 'ar' ? 'المحاضر: ' : 'Lecturer: '}<span className="text-white">{schedule.lecturerName}</span></div>
                                <div>{i18n.language === 'ar' ? 'الشعبة: ' : 'Group: '}<span className="font-bold text-white">{schedule.group?.name}</span></div>
                              </div>

                              <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                <span className="text-[8px] text-[var(--accent)] font-black uppercase tracking-widest">
                                  {i18n.language === 'ar' ? '📱 انقر لإعادة الجدولة' : '📱 Tap to reschedule'}
                                </span>
                                {overridden && (
                                  <span className="text-[8px] bg-amber-500/15 text-amber-400 font-bold px-1.5 py-0.5 rounded border border-amber-500/20">
                                    {i18n.language === 'ar' ? 'معدّل' : 'Rescheduled'}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* Footer Details */}
      <footer className="border-t border-[var(--border-color)] bg-black/40 px-6 py-4 flex flex-col md:flex-row items-center justify-between text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider gap-4">
        <div>
          © 2026 Manar Smart Schedule System.
        </div>
        <div className="flex flex-wrap gap-4 justify-center">
          <span>Targeted Notification Queue Status: <code className="text-amber-400 font-mono">ON_DEMAND</code></span>
        </div>
      </footer>

      {/* Add Schedule Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 no-print">
          <div className="frosted-panel w-full max-w-lg rounded-2xl p-6 space-y-4 border border-white/5 bg-[#0a0a0a]">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-[var(--accent)]">
                {i18n.language === 'ar' ? 'إضافة محاضرة جديدة للجدول' : 'Add New Base Schedule'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[var(--text-secondary)] hover:text-white font-black text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSchedule} className="space-y-4 text-xs text-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-wider">Subject Name</label>
                  <input
                    type="text"
                    required
                    value={newScheduleForm.subjectName}
                    onChange={(e) => setNewScheduleForm({ ...newScheduleForm, subjectName: e.target.value })}
                    placeholder="e.g. Software Engineering"
                    className="cmd-input w-full px-4"
                    style={{ height: '48px' }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-wider">Subject Code</label>
                  <input
                    type="text"
                    required
                    value={newScheduleForm.subjectCode}
                    onChange={(e) => setNewScheduleForm({ ...newScheduleForm, subjectCode: e.target.value })}
                    placeholder="e.g. CS-303"
                    className="cmd-input w-full px-4 font-mono uppercase"
                    style={{ height: '48px' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-wider">Subject Type</label>
                  <select
                    value={newScheduleForm.subjectType}
                    onChange={(e) => setNewScheduleForm({ ...newScheduleForm, subjectType: e.target.value })}
                    className="cmd-input w-full px-3"
                    style={{ height: '48px' }}
                  >
                    <option value="THEORY">Theory</option>
                    <option value="PRACTICAL">Practical</option>
                  </select>
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-wider">Lecturer Name</label>
                  <input
                    type="text"
                    required
                    value={newScheduleForm.lecturerName}
                    onChange={(e) => setNewScheduleForm({ ...newScheduleForm, lecturerName: e.target.value })}
                    placeholder="e.g. Dr. Manar Al-Saeed"
                    className="cmd-input w-full px-4"
                    style={{ height: '48px' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-wider">Room Name</label>
                  <input
                    type="text"
                    required
                    value={newScheduleForm.roomName}
                    onChange={(e) => setNewScheduleForm({ ...newScheduleForm, roomName: e.target.value })}
                    placeholder="e.g. Hall 1B"
                    className="cmd-input w-full px-4 font-bold"
                    style={{ height: '48px' }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-wider">Room Capacity</label>
                  <input
                    type="number"
                    required
                    value={newScheduleForm.roomCapacity}
                    onChange={(e) => setNewScheduleForm({ ...newScheduleForm, roomCapacity: e.target.value })}
                    placeholder="e.g. 45"
                    className="cmd-input w-full px-4"
                    style={{ height: '48px' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-wider">Group Name</label>
                  <input
                    type="text"
                    required
                    value={newScheduleForm.groupName}
                    onChange={(e) => setNewScheduleForm({ ...newScheduleForm, groupName: e.target.value })}
                    placeholder="e.g. Group A"
                    className="cmd-input w-full px-4 font-bold"
                    style={{ height: '48px' }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-wider">Day of Week</label>
                  <select
                    value={newScheduleForm.dayOfWeek}
                    onChange={(e) => setNewScheduleForm({ ...newScheduleForm, dayOfWeek: e.target.value })}
                    className="cmd-input w-full px-3"
                    style={{ height: '48px' }}
                  >
                    {DAYS.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-wider">Time Slot</label>
                  <select
                    value={newScheduleForm.timeSlotIndex}
                    onChange={(e) => setNewScheduleForm({ ...newScheduleForm, timeSlotIndex: e.target.value })}
                    className="cmd-input w-full px-2"
                    style={{ height: '48px' }}
                  >
                    {TIME_SLOTS.map((slot, index) => (
                      <option key={index} value={index}>{slot.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/5 font-sans">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-ghost px-4 py-2 text-[10px] tracking-wider font-bold"
                  style={{ minHeight: '44px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-neon px-4 py-2 text-[10px] tracking-wider font-black"
                  style={{ minHeight: '44px' }}
                >
                  Create Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Reschedule Modal */}
      {mobileRescheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 no-print">
          <div className="frosted-panel w-full max-w-md rounded-2xl p-6 space-y-4 border border-white/5 bg-[#0a0a0a]">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-[var(--accent)]">
                {i18n.language === 'ar' ? 'إعادة جدولة المحاضرة' : 'Reschedule Class'}
              </h3>
              <button
                onClick={() => setMobileRescheduleTarget(null)}
                className="text-[var(--text-secondary)] hover:text-white font-black text-sm"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-[var(--text-secondary)] space-y-1.5 mb-2 font-medium">
              <div>{i18n.language === 'ar' ? 'المادة: ' : 'Subject: '}<span className="text-white font-bold">{mobileRescheduleTarget.subject?.name}</span></div>
              <div>{i18n.language === 'ar' ? 'المحاضر: ' : 'Lecturer: '}<span className="text-white">{mobileRescheduleTarget.lecturerName}</span></div>
              <div>{i18n.language === 'ar' ? 'الشعبة: ' : 'Group: '}<span className="text-white font-bold">{mobileRescheduleTarget.group?.name}</span></div>
            </div>

            <form onSubmit={handleMobileRescheduleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-wider">
                  {i18n.language === 'ar' ? 'اختر اليوم الجديد:' : 'Select Target Day:'}
                </label>
                <select
                  name="dayOfWeek"
                  defaultValue={getActiveDay(mobileRescheduleTarget)}
                  className="cmd-input w-full px-4"
                  style={{ height: '50px' }}
                >
                  {DAYS.map(day => (
                    <option key={day} value={day}>{translateDay(day)}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-wider">
                  {i18n.language === 'ar' ? 'اختر الحصة/الوقت الجديد:' : 'Select Target Time Slot:'}
                </label>
                <select
                  name="timeSlotIndex"
                  defaultValue={TIME_SLOTS.findIndex(slot => slot.start === getActiveStartTime(mobileRescheduleTarget)).toString()}
                  className="cmd-input w-full px-4"
                  style={{ height: '50px' }}
                >
                  {TIME_SLOTS.map((slot, index) => (
                    <option key={index} value={index}>{slot.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/5 font-sans">
                <button
                  type="button"
                  onClick={() => setMobileRescheduleTarget(null)}
                  className="btn-ghost px-4 py-2 text-[10px] tracking-wider font-bold"
                  style={{ minHeight: '44px' }}
                >
                  {i18n.language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="btn-neon px-4 py-2 text-[10px] tracking-wider font-black"
                  style={{ minHeight: '44px' }}
                >
                  {i18n.language === 'ar' ? 'إعادة جدولة' : 'Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Drag and Drop Exception */}
      <ConfirmationModal
        isOpen={!!overrideConfirmData}
        title={i18n.language === 'ar' ? 'تأكيد التعديل' : 'Confirm Schedule Change'}
        message={i18n.language === 'ar' 
          ? 'يرجى اختيار نوع الاستثناء. "مؤقت" يطبق لهذا الأسبوع فقط، بينما "دائم" يطبق على جميع الأسابيع القادمة.'
          : 'Please select the override type. Temporary applies to the current week only; Permanent reschedules all future weeks.'}
        onConfirm={executeOverride}
        onCancel={() => {
          setOverrideConfirmData(null);
          setDraggedSchedule(null);
        }}
        cancelText={i18n.language === 'ar' ? 'إلغاء' : 'Cancel'}
        options={[
          { label: i18n.language === 'ar' ? '📅 استثناء مؤقت' : '📅 Temporary Exception', value: 'TEMPORARY' },
          { label: i18n.language === 'ar' ? '🔒 تعديل دائم' : '🔒 Permanent Reschedule', value: 'PERMANENT' }
        ]}
      />

      {/* Conflict Error Modal */}
      <ErrorModal
        isOpen={!!conflictError}
        type="error"
        title={conflictError?.title}
        message={conflictError?.message}
        onCancel={() => setConflictError(null)}
      />
    </div>
  );
}
