import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from './config';

export default function LecturerAttendanceSession() {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [schedule, setSchedule] = useState(null);
  const [token, setToken] = useState('');
  const [checkedInList, setCheckedInList] = useState([]); // List of checked-in student details in this session
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [timeLeft, setTimeLeft] = useState(10); // Refresh timer countdown

  // 1. Fetch Schedule Info and Existing Checked-in Students
  const fetchSessionDetails = async () => {
    try {
      const jwtToken = localStorage.getItem('manar_token');
      const headers = jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {};

      // Load schedule
      const schedRes = await axios.get(`${API_URL}/api/lecturer/schedule`, { headers });
      if (schedRes.data?.success) {
        const currentSched = schedRes.data.data.find(s => s.id === parseInt(scheduleId));
        if (currentSched) {
          setSchedule(currentSched);
        } else {
          toast.error(isAr ? 'لم يتم العثور على هذه المحاضرة' : 'Lecture schedule not found');
          navigate('/lecturer/home');
          return;
        }
      }

      // Load initial attendance report for today
      const reportRes = await axios.get(`${API_URL}/api/lecturer/attendance/report?scheduleId=${scheduleId}`, { headers });
      if (reportRes.data?.success) {
        const initialReport = reportRes.data.data;
        setReportData(initialReport);
        setTotalStudents(initialReport.length);
        // Filter those who are already marked PRESENT or LATE today
        const checkedIn = initialReport.filter(r => r.status === 'PRESENT' || r.status === 'LATE');
        setCheckedInList(checkedIn.map(c => ({
          studentId: c.studentId,
          studentName: c.studentName,
          status: c.status,
          scannedAt: c.scannedAt
        })));
      }
    } catch (err) {
      console.error(err);
      toast.error(isAr ? 'فشل تحميل تفاصيل الجلسة' : 'Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  // 2. Refresh Token API call
  const refreshToken = async () => {
    try {
      const jwtToken = localStorage.getItem('manar_token');
      const headers = jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {};
      const res = await axios.get(`${API_URL}/api/lecturer/attendance/token?scheduleId=${scheduleId}`, { headers });
      if (res.data?.success) {
        setToken(res.data.token);
        setTimeLeft(10); // Reset timer to 10 seconds
      }
    } catch (err) {
      console.error('Failed to fetch QR token:', err);
    }
  };

  // Fetch initial details on mount
  useEffect(() => {
    fetchSessionDetails();
  }, [scheduleId]);

  // Handle Token Refresh Cycle (every 10 seconds)
  useEffect(() => {
    if (loading || !schedule) return;

    refreshToken(); // Get first token immediately

    const interval = setInterval(() => {
      refreshToken();
    }, 10000);

    return () => clearInterval(interval);
  }, [loading, schedule]);

  // Countdown timer effect
  useEffect(() => {
    if (!token) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 10));
    }, 1000);
    return () => clearInterval(timer);
  }, [token]);

  // 3. Listen to SSE live check-ins from window events (dispatched in App.jsx)
  useEffect(() => {
    const handleLiveCheckIn = (e) => {
      const eventData = e.detail;
      // Ensure the check-in is for this active schedule
      if (eventData.scheduleId === parseInt(scheduleId)) {
        // Add to list if not already present
        setCheckedInList(prev => {
          if (prev.some(s => s.studentId === eventData.studentId)) return prev;
          
          // Sound alert or notification
          toast.success(`${eventData.studentName} ${isAr ? 'سجل حضوره' : 'checked in'}!`, {
            icon: '✅',
            duration: 3000
          });

          return [
            {
              studentId: eventData.studentId,
              studentName: eventData.studentName,
              status: eventData.status,
              scannedAt: eventData.scannedAt
            },
            ...prev
          ];
        });
      }
    };

    window.addEventListener('MANAR_ATTENDANCE_MARKED', handleLiveCheckIn);
    return () => {
      window.removeEventListener('MANAR_ATTENDANCE_MARKED', handleLiveCheckIn);
    };
  }, [scheduleId, isAr]);

  // 4. Open final report
  const handleEndSession = async () => {
    setLoading(true);
    try {
      const jwtToken = localStorage.getItem('manar_token');
      const headers = jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {};
      const reportRes = await axios.get(`${API_URL}/api/lecturer/attendance/report?scheduleId=${scheduleId}`, { headers });
      if (reportRes.data?.success) {
        setReportData(reportRes.data.data);
        setIsReportOpen(true);
      }
    } catch (err) {
      console.error(err);
      toast.error(isAr ? 'فشل تحميل التقرير النهائي' : 'Failed to load final report');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !schedule) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <span className="h-8 w-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold">{isAr ? 'جاري تحضير جلسة التحضير...' : 'Initializing attendance session...'}</p>
        </div>
      </div>
    );
  }

  // QR Server Image API
  const qrUrl = token
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=255-255-255&bgcolor=10-10-10&data=${encodeURIComponent(token)}`
    : '';

  const presentCount = checkedInList.length;
  const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#020202] text-white flex flex-col items-center p-4 md:p-8 relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-[-10%] left-[-20%] w-[60%] h-[50%] bg-[var(--accent-glow)] opacity-[0.05] rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-20%] w-[60%] h-[50%] bg-blue-500/10 opacity-[0.05] rounded-full blur-[120px]" />

      {/* Header Info */}
      <div className="w-full max-w-4xl flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5 z-10">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] bg-[var(--accent-dim)] px-2.5 py-1 rounded-md">
            🔴 {isAr ? 'بث حي ومباشر' : 'LIVE CHECK-IN'}
          </span>
          <h1 className="text-xl md:text-2xl font-black mt-2 text-white">
            {schedule?.subject.name}
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-bold">
            {schedule?.subject.code} · {isAr ? 'الشعبة:' : 'Group:'} <span className="text-white">{schedule?.group.name}</span> · {isAr ? 'القاعة:' : 'Room:'} <span className="text-white">{schedule?.room.name}</span>
          </p>
        </div>
        <button
          onClick={handleEndSession}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black tracking-wider uppercase rounded-xl transition-all shadow-[0_4px_20px_rgba(220,38,38,0.2)] shrink-0 self-start md:self-center"
        >
          🛑 {isAr ? 'إنهاء الجلسة واستعراض التقرير' : 'End Session & Report'}
        </button>
      </div>

      {/* Main Grid: QR & Stats / Live Feed */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-6 mt-6 z-10 flex-1">
        
        {/* Left Column: QR Code Display (Glass panel) */}
        <div className="md:col-span-6 flex flex-col items-center justify-center frosted-panel p-6 md:p-8 rounded-3xl border-white/8 relative">
          <p className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] mb-4 text-center">
            {isAr ? 'امسح رمز الاستجابة السريعة (QR) لتسجيل الحضور' : 'Scan the QR Code to check-in'}
          </p>

          {/* Glowing QR wrapper */}
          <div className="relative p-4 bg-[#0a0a0a] rounded-2xl border border-white/5 shadow-[0_0_50px_rgba(255,255,255,0.03)] overflow-hidden">
            {qrUrl ? (
              <img
                src={qrUrl}
                alt="Attendance QR Code"
                className="w-64 h-64 md:w-72 md:h-72 object-contain"
              />
            ) : (
              <div className="w-64 h-64 md:w-72 md:h-72 flex items-center justify-center bg-black/40">
                <span className="h-8 w-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            )}
            
            {/* Ambient scanning laser effect */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent animate-pulse shadow-[0_0_10px_var(--accent)]" style={{ animationDuration: '2s', animationIterationCount: 'infinite' }} />
          </div>

          {/* Regeneration timer */}
          <div className="mt-5 flex items-center gap-3 bg-white/3 px-4 py-2 rounded-full border border-white/5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[10px] font-bold tracking-wider text-[var(--text-secondary)] uppercase">
              {isAr ? `يتغير الرمز خلال: ${timeLeft} ثوانٍ` : `Refreshes in: ${timeLeft}s`}
            </span>
          </div>
        </div>

        {/* Right Column: Attendance Statistics & Live Stream */}
        <div className="md:col-span-6 flex flex-col gap-6">
          
          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-4">
            <div className="frosted-panel p-5 rounded-2xl border-white/5">
              <p className="text-[10px] font-black tracking-widest text-[var(--text-secondary)] uppercase">
                {isAr ? 'الطلاب الحاضرين' : 'ATTENDING'}
              </p>
              <p className="text-2xl font-black mt-2 text-white">
                {presentCount} <span className="text-xs text-[var(--text-muted)]">/ {totalStudents}</span>
              </p>
            </div>
            <div className="frosted-panel p-5 rounded-2xl border-white/5 flex flex-col justify-between">
              <p className="text-[10px] font-black tracking-widest text-[var(--text-secondary)] uppercase">
                {isAr ? 'نسبة الحضور' : 'RATE'}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-2xl font-black text-[var(--accent)]">{attendanceRate}%</span>
                {/* Micro-progress bar */}
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--accent)] transition-all duration-300" style={{ width: `${attendanceRate}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Real-time stream feed */}
          <div className="frosted-panel p-5 rounded-2xl border-white/5 flex-1 flex flex-col min-h-[300px]">
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] mb-4 flex items-center justify-between">
              <span>{isAr ? 'موجز الحضور المباشر' : 'LIVE CHECK-IN FEED'}</span>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[9px] font-bold">
                ● {isAr ? 'متصل' : 'ONLINE'}
              </span>
            </h3>

            {/* List Stream */}
            <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[350px] pr-1 scrollbar-thin">
              <AnimatePresence initial={false}>
                {checkedInList.length > 0 ? (
                  checkedInList.map((c, index) => (
                    <motion.div
                      key={c.studentId}
                      initial={{ opacity: 0, x: isAr ? 30 : -30, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      className="flex items-center justify-between p-3.5 bg-white/3 rounded-xl border border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="h-7 w-7 rounded-full bg-white/5 border border-white/8 flex items-center justify-center font-bold text-xs">
                          {c.studentName.charAt(0)}
                        </span>
                        <div>
                          <p className="text-xs font-black text-white">{c.studentName}</p>
                          <p className="text-[9px] text-[var(--text-muted)] font-semibold">
                            {c.scannedAt ? new Date(c.scannedAt).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                        c.status === 'PRESENT'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/15'
                      }`}>
                        {c.status === 'PRESENT' ? (isAr ? 'حاضر' : 'Present') : (isAr ? 'متأخر' : 'Late')}
                      </span>
                    </motion.div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-[var(--text-muted)] py-12">
                    <span className="text-3xl mb-2">⏱️</span>
                    <p className="text-xs font-bold">{isAr ? 'بانتظار مسح أول طالب...' : 'Awaiting check-ins...'}</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>

      </div>

      {/* Report Modal */}
      <AnimatePresence>
        {isReportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="frosted-panel w-full max-w-2xl rounded-3xl p-6 md:p-8 shadow-2xl border-white/10 flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-lg font-black text-white">{isAr ? 'تقرير الحضور النهائي' : 'Final Attendance Report'}</h2>
                  <p className="text-[10px] font-bold text-[var(--text-secondary)] mt-1">
                    {schedule?.subject.name} · {schedule?.group.name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsReportOpen(false);
                    navigate('/lecturer/home');
                  }}
                  className="h-10 w-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Attendance Statistics inside Modal */}
              <div className="grid grid-cols-3 gap-3 my-5 text-center">
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3">
                  <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">{isAr ? 'حضور كامل' : 'PRESENT'}</p>
                  <p className="text-lg font-black text-white mt-1">{reportData.filter(r => r.status === 'PRESENT').length}</p>
                </div>
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3">
                  <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest">{isAr ? 'متأخرين' : 'LATE'}</p>
                  <p className="text-lg font-black text-white mt-1">{reportData.filter(r => r.status === 'LATE').length}</p>
                </div>
                <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3">
                  <p className="text-[9px] font-black text-red-400 uppercase tracking-widest">{isAr ? 'غائبين' : 'ABSENT'}</p>
                  <p className="text-lg font-black text-white mt-1">{reportData.filter(r => r.status === 'ABSENT').length}</p>
                </div>
              </div>

              {/* Scrollable list of all student status */}
              <div className="flex-1 overflow-y-auto space-y-2 max-h-[350px] pr-1 scrollbar-thin">
                {reportData.map(student => (
                  <div key={student.studentId} className="flex items-center justify-between p-3.5 bg-white/3 rounded-xl border border-white/5 text-xs">
                    <div>
                      <p className="font-extrabold text-white">{student.studentName}</p>
                      <p className="text-[9px] text-[var(--text-muted)] font-semibold mt-0.5">
                        {student.idNumber} · {student.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {student.scannedAt && (
                        <span className="text-[9px] text-[var(--text-muted)] font-semibold">
                          {new Date(student.scannedAt).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                        student.status === 'PRESENT'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15'
                          : student.status === 'LATE'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/15'
                          : 'bg-red-500/10 text-red-400 border-red-500/15'
                      }`}>
                        {student.status === 'PRESENT' ? (isAr ? 'حاضر' : 'Present') : student.status === 'LATE' ? (isAr ? 'متأخر' : 'Late') : (isAr ? 'غائب' : 'Absent')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal Footer */}
              <div className="mt-5 pt-4 border-t border-white/5 flex gap-3">
                <button
                  onClick={() => {
                    setIsReportOpen(false);
                    navigate('/lecturer/home');
                  }}
                  className="flex-1 py-3 bg-[var(--accent)] hover:bg-[var(--accent-glow)] text-black text-xs font-black rounded-xl transition-all uppercase tracking-wider"
                >
                  {isAr ? 'حفظ والعودة للرئيسية' : 'Save & Return to Home'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
