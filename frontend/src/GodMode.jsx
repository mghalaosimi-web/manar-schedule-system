import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_URL } from './config';

export default function GodMode() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [metrics,        setMetrics]        = useState(null);
  const [students,       setStudents]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [deletingId,     setDeletingId]     = useState(null);
  const [impersonatingId,setImpersonatingId]= useState(null);
  const [search,         setSearch]         = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('manar_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const [mRes, sRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/god-mode/metrics`, { headers }),
        axios.get(`${API_URL}/api/admin/god-mode/students`, { headers }),
      ]);
      if (mRes.data?.success) setMetrics(mRes.data.data);
      if (sRes.data?.success) setStudents(sRes.data.data);
    } catch (err) {
      toast.error(isAr ? 'فشل تحميل بيانات المطور' : 'Failed to load God Mode data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm(isAr
      ? 'هل أنت متأكد من حذف هذا الطالب نهائياً؟'
      : 'Permanently delete this student?')) return;
    setDeletingId(id);
    try {
      const token = localStorage.getItem('manar_token');
      await axios.delete(`${API_URL}/api/admin/god-mode/students/${id}`,
        { headers: { Authorization: `Bearer ${token}` } });
      toast.success(isAr ? 'تم الحذف بنجاح' : 'Student purged');
      setStudents(prev => prev.filter(s => s.id !== id));
      const mRes = await axios.get(`${API_URL}/api/admin/god-mode/metrics`,
        { headers: { Authorization: `Bearer ${token}` } });
      if (mRes.data?.success) setMetrics(mRes.data.data);
    } catch (err) {
      toast.error(err.response?.data?.error || (isAr ? 'فشل الحذف' : 'Delete failed'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleImpersonate = async (student) => {
    setImpersonatingId(student.id);
    try {
      const token = localStorage.getItem('manar_token');
      const res = await axios.post(`${API_URL}/api/auth/impersonate`,
        { studentId: student.id },
        { headers: { Authorization: `Bearer ${token}` } });
      if (res.data?.success) {
        localStorage.setItem('manar_token', res.data.token);
        localStorage.setItem('manar_user', JSON.stringify(res.data.user));
        localStorage.setItem('student_profile', JSON.stringify({
          name: student.name, email: student.email,
          department: student.major?.department?.name || '',
          level: student.level?.name || '', groupId: student.groupId,
        }));
        toast.success(isAr ? `جارٍ المعاينة كـ ${student.name}` : `Previewing as ${student.name}`);
        navigate('/student/home');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || (isAr ? 'فشل الدخول كطالب' : 'Impersonation failed'));
    } finally {
      setImpersonatingId(null);
    }
  };

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.idNumber?.toLowerCase().includes(q)
    );
  });

  /* ── Loading ──────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] gap-4 bg-[#000]">
        <div className="h-10 w-10 border-2 rounded-full animate-spin"
             style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        <p className="text-xs font-black tracking-[0.25em] uppercase"
           style={{ color: 'var(--text-secondary)' }}>
          {isAr ? 'جاري التحميل...' : 'Synchronizing...'}
        </p>
      </div>
    );
  }

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      dir={isAr ? 'rtl' : 'ltr'}
      className="flex-1 bg-[#000] p-8 space-y-12 text-[var(--text-primary)]"
    >

      {/* ── Hero header ──────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl p-10"
           style={{
             background: 'linear-gradient(135deg, rgba(222,255,154,0.06) 0%, rgba(0,0,0,0) 60%)',
             border: '1px solid rgba(222,255,154,0.12)',
           }}>
        {/* Glow blob */}
        <div className="absolute top-[-40px] right-[-40px] w-72 h-72 rounded-full pointer-events-none"
             style={{ background: 'radial-gradient(circle, rgba(222,255,154,0.12) 0%, transparent 70%)' }} />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-block text-[10px] font-black tracking-[0.3em] uppercase px-3 py-1 rounded-full mb-4"
                  style={{ background: 'rgba(222,255,154,0.08)', color: 'var(--accent)', border: '1px solid rgba(222,255,154,0.15)' }}>
              👑 {isAr ? 'صلاحيات المطور' : 'Developer Access'}
            </span>
            <h1 className="font-black tracking-tighter leading-none"
                style={{ fontSize: 'clamp(48px, 7vw, 88px)', color: '#fff' }}>
              GOD MODE
            </h1>
            <p className="mt-3 text-sm max-w-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {isAr
                ? 'منطقة المسؤول الخارق. معاينة حسابات الطلاب، تطهير الحسابات العشوائية، ومراقبة النظام.'
                : 'Super admin control panel. Impersonate students, purge accounts, and monitor live telemetry.'}
            </p>
          </div>
          <button
            onClick={fetchData}
            className="btn-ghost px-6 py-3 text-xs font-black tracking-widest uppercase flex items-center gap-2 shrink-0"
          >
            ↺ {isAr ? 'تحديث' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ── Metrics ──────────────────────────────────────────── */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total */}
          <div className="command-card p-8 flex flex-col justify-between" style={{ minHeight: 160 }}>
            <p className="text-[10px] font-black tracking-[0.28em] uppercase mb-4"
               style={{ color: 'var(--accent)' }}>
              {isAr ? 'إجمالي الطلاب المسجلين' : 'Total Registered'}
            </p>
            <span className="font-black leading-none tracking-tighter"
                  style={{ fontSize: 'clamp(44px, 5vw, 72px)', color: '#fff' }}>
              {metrics.totalStudents}
            </span>
          </div>

          {/* By major */}
          <div className="frosted-panel rounded-2xl p-6 space-y-4">
            <p className="text-[10px] font-black tracking-[0.28em] uppercase"
               style={{ color: 'var(--accent)' }}>
              {isAr ? 'حسب التخصص' : 'By Major'}
            </p>
            <div className="space-y-2.5 max-h-40 overflow-y-auto">
              {metrics.studentsByMajor.map((m, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="truncate max-w-[160px]" style={{ color: 'var(--text-primary)' }}>{m.name}</span>
                  <span className="font-black ml-2" style={{ color: 'var(--accent)' }}>{m.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* By level */}
          <div className="frosted-panel rounded-2xl p-6 space-y-4">
            <p className="text-[10px] font-black tracking-[0.28em] uppercase"
               style={{ color: '#60c4ff' }}>
              {isAr ? 'حسب المستوى' : 'By Level'}
            </p>
            <div className="space-y-2.5 max-h-40 overflow-y-auto">
              {metrics.studentsByLevel.map((l, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span style={{ color: 'var(--text-primary)' }}>{l.name}</span>
                  <span className="font-black ml-2" style={{ color: '#60c4ff' }}>{l.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Student directory ─────────────────────────────────── */}
      <div className="frosted-panel rounded-3xl overflow-hidden">
        {/* Table header */}
        <div className="p-7 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4"
             style={{ borderColor: 'var(--border-color)' }}>
          <div>
            <p className="text-[10px] font-black tracking-[0.28em] uppercase mb-1"
               style={{ color: 'var(--accent)' }}>
              {isAr ? 'دليل الطلاب' : 'Student Directory'}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {students.length} {isAr ? 'حساب مسجل' : 'registered accounts'}
            </p>
          </div>
          {/* Search */}
          <input
            type="text"
            placeholder={isAr ? 'بحث بالاسم، البريد، أو الرقم...' : 'Search name, email, ID…'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="cmd-input px-4 py-2.5 text-sm w-full sm:w-72"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse" dir={isAr ? 'rtl' : 'ltr'}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.015)', borderBottom: '1px solid var(--border-color)' }}>
                {[
                  isAr ? '#' : '#',
                  isAr ? 'الطالب' : 'Student',
                  isAr ? 'البريد / الهاتف' : 'Email / Phone',
                  isAr ? 'التخصص' : 'Major',
                  isAr ? 'الشعبة' : 'Group',
                  isAr ? 'تاريخ التسجيل' : 'Registered',
                  isAr ? 'الإجراءات' : 'Actions',
                ].map((h, i) => (
                  <th key={i}
                      className="px-5 py-4 text-right font-black tracking-[0.18em] uppercase"
                      style={{ color: 'var(--text-secondary)', fontSize: '10px', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((s, idx) => (
                  <motion.tr
                    key={s.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: idx * 0.025 }}
                    className="group transition-colors"
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      background: idx % 2 === 0 ? 'rgba(255,255,255,0.008)' : 'transparent',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(222,255,154,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(255,255,255,0.008)' : 'transparent'}
                  >
                    <td className="px-5 py-4 font-mono font-bold" style={{ color: 'var(--text-secondary)' }}>
                      {s.id}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold" style={{ color: '#fff' }}>{s.name}</div>
                      {s.idNumber && (
                        <div className="font-mono mt-0.5" style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>
                          {s.idNumber}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div style={{ color: 'var(--text-primary)' }}>{s.email}</div>
                      {s.phone && (
                        <div className="font-mono mt-0.5" style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>
                          {s.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4" style={{ color: 'var(--text-primary)' }}>
                      {s.major?.name || '—'}
                    </td>
                    <td className="px-5 py-4">
                      {s.group?.name
                        ? <span className="px-2.5 py-1 rounded-full text-[10px] font-black"
                                style={{ background: 'rgba(222,255,154,0.08)', color: 'var(--accent)', border: '1px solid rgba(222,255,154,0.15)' }}>
                            {s.group.name}
                          </span>
                        : <span style={{ color: 'var(--text-secondary)' }}>—</span>}
                    </td>
                    <td className="px-5 py-4 font-mono whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                      {s.createdAt
                        ? new Date(s.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        {/* Enter as student */}
                        <button
                          onClick={() => handleImpersonate(s)}
                          disabled={!!impersonatingId || !!deletingId}
                          className="btn-neon px-3 py-1.5 text-[10px] font-black flex items-center gap-1.5 rounded-lg disabled:opacity-40"
                        >
                          {impersonatingId === s.id
                            ? <span className="h-3 w-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            : <>🔑 {isAr ? 'دخول' : 'Enter'}</>}
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(s.id)}
                          disabled={deletingId === s.id || !!impersonatingId}
                          className="px-3 py-1.5 text-[10px] font-black rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-40"
                          style={{
                            background: 'rgba(239,68,68,0.06)',
                            border: '1px solid rgba(239,68,68,0.25)',
                            color: '#f87171',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; }}
                        >
                          {deletingId === s.id ? '…' : `🗑 ${isAr ? 'حذف' : 'Delete'}`}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-xs font-bold"
                      style={{ color: 'var(--text-secondary)' }}>
                    {search
                      ? (isAr ? 'لا نتائج للبحث' : 'No results found')
                      : (isAr ? 'لا يوجد طلاب مسجلون بعد' : 'No student registrations yet')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
