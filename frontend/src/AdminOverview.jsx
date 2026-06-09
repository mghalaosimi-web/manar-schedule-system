import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { API_URL } from './config';

/* ── Animated counter hook ─────────────────────────────────── */
function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target && target !== 0) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      setValue(start);
      if (start >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

/* ── Metric card ───────────────────────────────────────────── */
function MetricCard({ label, value, sublabel, accentColor = 'var(--accent)', delay = 0 }) {
  const count = useCountUp(value);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      className="command-card p-8 flex flex-col justify-between"
      style={{ minHeight: 180, borderTopColor: accentColor }}
    >
      <p className="text-[10px] font-black tracking-[0.28em] uppercase"
         style={{ color: accentColor }}>
        {label}
      </p>
      <div>
        <span
          className="block font-black leading-none tracking-tighter"
          style={{ fontSize: 'clamp(52px, 6vw, 80px)', color: '#fff' }}
        >
          {count}
        </span>
        {sublabel && (
          <span className="text-xs mt-2 block" style={{ color: 'var(--text-secondary)' }}>
            {sublabel}
          </span>
        )}
      </div>
    </motion.div>
  );
}

export default function AdminOverview() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('manar_token');
      const res = await axios.get(`${API_URL}/api/admin/metrics`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.data?.success) setStats(res.data.data);
    } catch (err) {
      toast.error(isAr ? 'فشل تحميل الإحصائيات' : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMetrics(); }, []);

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="flex-1 bg-[#000] text-[var(--text-primary)] p-8 space-y-12">

      {/* ── Page header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-6">
        <motion.div initial={{ opacity: 0, x: isAr ? 20 : -20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}>
          <p className="text-[10px] font-black tracking-[0.28em] uppercase mb-3"
             style={{ color: 'var(--accent)' }}>
            {isAr ? 'مركز القيادة' : 'Command Center'}
          </p>
          <h1 className="font-black tracking-tighter leading-none"
              style={{ fontSize: 'clamp(36px, 5vw, 64px)', color: '#fff' }}>
            {isAr ? 'نظرة عامة' : 'Overview'}
          </h1>
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          onClick={fetchMetrics}
          disabled={loading}
          className="btn-ghost px-5 py-2.5 text-xs font-black tracking-widest uppercase flex items-center gap-2 mt-2 shrink-0"
        >
          {loading
            ? <span className="h-3.5 w-3.5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            : <span>↺</span>}
          {isAr ? 'تحديث' : 'Refresh'}
        </motion.button>
      </div>

      {/* ── Metric cards grid ─────────────────────────────────── */}
      {stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <MetricCard
            label={isAr ? 'إجمالي الطلاب' : 'Total Enrollment'}
            value={stats.students}
            sublabel={isAr ? 'ملف نشط في النظام' : 'Active student profiles'}
            accentColor="var(--accent)"
            delay={0}
          />
          <MetricCard
            label={isAr ? 'الجداول النشطة' : 'Active Schedules'}
            value={stats.lectures}
            sublabel={isAr ? 'محاضرة مجدولة أسبوعياً' : 'Weekly lectures scheduled'}
            accentColor="#60c4ff"
            delay={0.07}
          />
          <MetricCard
            label={isAr ? 'الأقسام الأكاديمية' : 'Departments'}
            value={stats.departments}
            sublabel={isAr ? 'قسم وكلية دراسية' : 'Academic departments'}
            accentColor="var(--accent)"
            delay={0.14}
          />
          <MetricCard
            label={isAr ? 'القاعات والمختبرات' : 'Classrooms'}
            value={stats.classrooms}
            sublabel={isAr ? 'قاعة ومختبر معرّف' : 'Configured halls & labs'}
            accentColor="#60c4ff"
            delay={0.21}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {[0,1,2,3].map(i => (
            <div key={i} className="command-card p-8 animate-pulse" style={{ minHeight: 180 }}>
              <div className="h-2 w-24 rounded mb-6" style={{ background: 'var(--border-color)' }} />
              <div className="h-16 w-32 rounded" style={{ background: 'var(--border-color)' }} />
            </div>
          ))}
        </div>
      )}

      {/* ── System status row ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Performance */}
        <div className="frosted-panel rounded-2xl p-7 lg:col-span-2 space-y-6">
          <p className="text-[10px] font-black tracking-[0.28em] uppercase" style={{ color: 'var(--text-secondary)' }}>
            {isAr ? 'أداء النظام' : 'System Performance'}
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: isAr ? 'استجابة قاعدة البيانات' : 'DB Latency',    value: '14 ms',  color: 'var(--accent)' },
              { label: isAr ? 'معدل تسليم التنبيهات' : 'Alert Dispatch',  value: '99.8%',  color: '#60c4ff'       },
              { label: isAr ? 'حالة محرك المزامنة'   : 'Cron Status',     value: isAr ? 'نشط' : 'Active', color: 'var(--accent)' },
            ].map((item, i) => (
              <div key={i} className="rounded-xl p-4 space-y-2"
                   style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
                <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{item.label}</p>
                <p className="text-xl font-black" style={{ color: item.color }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="frosted-panel rounded-2xl p-7 flex flex-col justify-between space-y-6">
          <p className="text-[10px] font-black tracking-[0.28em] uppercase" style={{ color: 'var(--text-secondary)' }}>
            {isAr ? 'إجراءات سريعة' : 'Quick Actions'}
          </p>
          <div className="space-y-3 flex-1 flex flex-col justify-end">
            <button onClick={() => navigate('/admin/broadcast')}
                    className="btn-ghost w-full py-3 text-xs font-black tracking-wide text-center">
              📢 {isAr ? 'مركز البث العام' : 'Broadcast Center'}
            </button>
            <button onClick={() => navigate('/admin/groups')}
                    className="btn-ghost w-full py-3 text-xs font-black tracking-wide text-center">
              🛠 {isAr ? 'إدارة المجموعات' : 'Manage Groups'}
            </button>
            <button onClick={() => navigate('/admin/students')}
                    className="btn-ghost w-full py-3 text-xs font-black tracking-wide text-center">
              🎓 {isAr ? 'دليل الطلاب' : 'Student Directory'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
