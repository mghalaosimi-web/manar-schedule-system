import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from './config';

const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const DAYS_AR = {
  SUNDAY: 'الأحد',
  MONDAY: 'الإثنين',
  TUESDAY: 'الثلاثاء',
  WEDNESDAY: 'الأربعاء',
  THURSDAY: 'الخميس',
  FRIDAY: 'الجمعة',
  SATURDAY: 'السبت'
};

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

const getActiveRoom = (s) => {
  if (s.overrides && s.overrides.length > 0) {
    const l = s.overrides[s.overrides.length - 1];
    return l.newRoom ? l.newRoom.name : s.room.name;
  }
  return s.room.name;
};

const isOverridden = (s) => s.overrides && s.overrides.length > 0;

export default function LecturerDashboard() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [profile, setProfile] = useState({});
  const [schedules, setSchedules] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedDay, setSelectedDay] = useState(DAYS[new Date().getDay()]);
  const [loading, setLoading] = useState(false);

  // Request Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetSchedule, setTargetSchedule] = useState(null);
  const [requestType, setRequestType] = useState('CANCEL'); // CANCEL or RESCHEDULE
  const [newDay, setNewDay] = useState('SUNDAY');
  const [newStartTime, setNewStartTime] = useState('08:00');
  const [newEndTime, setNewEndTime] = useState('10:00');
  const [newRoomId, setNewRoomId] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('manar_token');
      const userJson = localStorage.getItem('manar_user');
      if (userJson) {
        setProfile(JSON.parse(userJson));
      }

      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const [scheduleRes, roomsRes] = await Promise.all([
        axios.get(`${API_URL}/api/lecturer/schedule`, { headers }),
        axios.get(`${API_URL}/api/rooms`, { headers })
      ]);

      if (scheduleRes.data?.success) {
        setSchedules(scheduleRes.data.data);
      }
      if (roomsRes.data?.success) {
        setRooms(roomsRes.data.data);
        if (roomsRes.data.data.length > 0) {
          setNewRoomId(roomsRes.data.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(isAr ? 'فشل تحميل بيانات الجدول' : 'Failed to load dashboard schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Listen to live SSE update notifications
    const handleSSEUpdate = () => {
      fetchDashboardData();
    };
    window.addEventListener('MANAR_SCHEDULE_UPDATE', handleSSEUpdate);
    return () => {
      window.removeEventListener('MANAR_SCHEDULE_UPDATE', handleSSEUpdate);
    };
  }, []);

  const openRequestModal = (schedule, type) => {
    setTargetSchedule(schedule);
    setRequestType(type);
    setNewDay(schedule.dayOfWeek);
    setNewStartTime(schedule.startTime);
    setNewEndTime(schedule.endTime);
    setNewRoomId(schedule.roomId);
    setReason('');
    setIsModalOpen(true);
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('manar_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const payload = {
        scheduleId: targetSchedule.id,
        requestType,
        reason,
        newDayOfWeek: requestType === 'RESCHEDULE' ? newDay : null,
        newStartTime: requestType === 'RESCHEDULE' ? newStartTime : null,
        newEndTime: requestType === 'RESCHEDULE' ? newEndTime : null,
        newRoomId: requestType === 'RESCHEDULE' ? parseInt(newRoomId) : null
      };

      const res = await axios.post(`${API_URL}/api/lecturer/requests`, payload, { headers });
      if (res.data?.success) {
        toast.success(isAr ? 'تم إرسال الطلب بنجاح وهو قيد المراجعة' : 'Request submitted successfully and is pending approval.');
        setIsModalOpen(false);
      }
    } catch (err) {
      const msg = err.response?.data?.error || (isAr ? 'فشل إرسال الطلب' : 'Failed to submit request');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const todaySchedules = schedules.filter(s => getActiveDay(s) === selectedDay);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return isAr ? 'صباح الخير' : 'Good Morning';
    if (hour >= 12 && hour < 17) return isAr ? 'طاب يومك' : 'Good Afternoon';
    return isAr ? 'مساء الخير' : 'Good Evening';
  };

  return (
    <div className="p-4 space-y-6">
      
      {/* ── Greeting Header ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--accent-dim)] to-transparent border border-white/8 backdrop-blur-xl p-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)]">
              🎓 {isAr ? 'بوابة عضو هيئة التدريس' : 'Faculty Member Portal'}
            </p>
            <h2 className="text-lg font-black text-white leading-tight mt-1">
              {getGreeting()}، {profile.name || (isAr ? 'الدكتور' : 'Doctor')}
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {isAr ? 'يمكنك مراجعة جدولك وتقديم طلبات تعديل أو إلغاء المحاضرات' : 'Manage your timetable and request scheduling overrides'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Day of week horizontal nav ─────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {DAYS.map(day => {
          const isSelected = selectedDay === day;
          const label = isAr ? DAYS_AR[day].substring(0, 7) : day.substring(0, 3);
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 border ${
                isSelected
                  ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                  : 'bg-white/3 text-[var(--text-secondary)] border-white/5 hover:bg-white/5 hover:text-white'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Lectures Timeline list ─────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">
          {isAr ? `محاضرات يوم ${DAYS_AR[selectedDay]}` : `Lectures on ${selectedDay}`}
        </h3>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="frosted-panel p-5 rounded-2xl animate-pulse space-y-3">
                <div className="h-4 bg-white/5 rounded w-2/3" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
                <div className="h-10 bg-white/5 rounded-xl mt-4" />
              </div>
            ))}
          </div>
        ) : todaySchedules.length > 0 ? (
          <div className="space-y-3">
            {todaySchedules.map((schedule, idx) => {
              const activeRoom = getActiveRoom(schedule);
              const activeStart = getActiveStartTime(schedule);
              const activeEnd = getActiveEndTime(schedule);
              const modified = isOverridden(schedule);

              return (
                <motion.div
                  key={schedule.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`frosted-panel p-5 rounded-2xl space-y-4 relative overflow-hidden ${
                    modified ? 'border-[var(--accent-glow)]' : 'border-white/8'
                  }`}
                >
                  {modified && (
                    <div className="absolute top-0 right-0 left-0 bg-[var(--accent)] text-black text-[9px] font-black uppercase tracking-widest py-0.5 text-center shadow-sm">
                      ⚠️ {isAr ? 'تم تعديل هذه المحاضرة بطلب سابق' : 'Override Active for this session'}
                    </div>
                  )}

                  <div className="pt-2">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-extrabold text-sm text-white leading-tight">
                          {schedule.subject.name}
                        </h4>
                        <p className="text-[10px] font-bold text-[var(--text-secondary)] mt-1">
                          {schedule.subject.code} · {schedule.subject.type === 'THEORY' ? (isAr ? 'نظري' : 'Theory') : (isAr ? 'عملي' : 'Practical')}
                        </p>
                      </div>
                      <span className="shrink-0 text-[10px] font-black px-2 py-1 bg-white/5 rounded-lg border border-white/8 text-[var(--accent)]">
                        {schedule.group.name}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4 text-xs font-bold text-[var(--text-secondary)]">
                      <div className="flex items-center gap-1.5">
                        <span>🕒</span>
                        <span>{activeStart} - {activeEnd}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>📍</span>
                        <span>{activeRoom}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => openRequestModal(schedule, 'CANCEL')}
                      className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/15 hover:border-red-500/30 text-[10px] font-black tracking-wider uppercase rounded-xl transition-all"
                    >
                      🚫 {isAr ? 'طلب إلغاء' : 'Request Cancel'}
                    </button>
                    <button
                      onClick={() => openRequestModal(schedule, 'RESCHEDULE')}
                      className="flex-1 py-2 bg-white/3 hover:bg-white/8 text-white border border-white/5 hover:border-white/10 text-[10px] font-black tracking-wider uppercase rounded-xl transition-all"
                    >
                      📅 {isAr ? 'إعادة جدولة' : 'Reschedule'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="frosted-panel p-8 text-center rounded-2xl text-[var(--text-secondary)] space-y-2">
            <span className="text-3xl block">🛋️</span>
            <p className="text-xs font-bold">
              {isAr ? 'لا توجد محاضرات مجدولة لهذا اليوم' : 'No lectures scheduled for this day.'}
            </p>
          </div>
        )}
      </div>

      {/* ── Submit Request Modal ───────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="frosted-panel w-full max-w-sm rounded-2xl p-6 shadow-2xl relative overflow-hidden"
            >
              <h3 className="text-base font-black text-white mb-2">
                {requestType === 'CANCEL' ? (isAr ? 'طلب إلغاء محاضرة' : 'Request Lecture Cancellation') : (isAr ? 'طلب إعادة جدولة المحاضرة' : 'Request Lecture Reschedule')}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mb-5">
                {targetSchedule?.subject.name} ({targetSchedule?.group.name})
              </p>

              <form onSubmit={handleRequestSubmit} className="space-y-4">
                {requestType === 'RESCHEDULE' && (
                  <>
                    {/* New Day */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">
                        {isAr ? 'اليوم الجديد' : 'New Day'}
                      </label>
                      <select
                        value={newDay}
                        onChange={e => setNewDay(e.target.value)}
                        className="cmd-input w-full px-3 text-xs bg-black text-white border-white/10 rounded-xl"
                        style={{ height: '44px' }}
                      >
                        {DAYS.map(d => (
                          <option key={d} value={d}>
                            {isAr ? DAYS_AR[d] : d}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* New Time Slots */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">
                          {isAr ? 'وقت البدء' : 'Start Time'}
                        </label>
                        <input
                          type="time"
                          required
                          value={newStartTime}
                          onChange={e => setNewStartTime(e.target.value)}
                          className="cmd-input w-full px-3 text-xs"
                          style={{ height: '44px' }}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">
                          {isAr ? 'وقت الانتهاء' : 'End Time'}
                        </label>
                        <input
                          type="time"
                          required
                          value={newEndTime}
                          onChange={e => setNewEndTime(e.target.value)}
                          className="cmd-input w-full px-3 text-xs"
                          style={{ height: '44px' }}
                        />
                      </div>
                    </div>

                    {/* New Room */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">
                        {isAr ? 'القاعة الجديدة' : 'New Room'}
                      </label>
                      <select
                        value={newRoomId}
                        onChange={e => setNewRoomId(e.target.value)}
                        className="cmd-input w-full px-3 text-xs bg-black text-white border-white/10 rounded-xl"
                        style={{ height: '44px' }}
                      >
                        {rooms.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.name} ({isAr ? `السعة: ${r.capacity}` : `Cap: ${r.capacity}`})
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* Reason */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">
                    {isAr ? 'سبب الطلب (اختياري)' : 'Reason (Optional)'}
                  </label>
                  <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder={isAr ? 'أدخل سبباً مقنعاً للطلب...' : 'Enter a reason for the request...'}
                    className="cmd-input w-full p-3 text-xs resize-none"
                    style={{ height: '80px' }}
                  />
                </div>

                <div className="flex gap-2 pt-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 bg-white/3 hover:bg-white/8 text-[var(--text-secondary)] hover:text-white text-xs font-bold rounded-xl transition-all"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-glow)] text-black text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1"
                  >
                    {submitting ? (
                      <span className="h-3.5 w-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      isAr ? 'إرسال الطلب' : 'Submit Request'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
