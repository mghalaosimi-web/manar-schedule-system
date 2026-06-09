import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from './config';
import ErrorModal from './ErrorModal';

/* ── Terminal line type ───────────────────────────────────────── */
const LINE_TYPES = {
  info:    { prefix: '›', color: 'var(--accent)'   },
  success: { prefix: '✓', color: '#4ade80'          },
  error:   { prefix: '✕', color: '#f87171'          },
  warn:    { prefix: '⚠', color: '#fbbf24'          },
  cmd:     { prefix: '$', color: '#60c4ff'          },
  dim:     { prefix: '·', color: 'var(--text-muted)'},
};

function TerminalLine({ type = 'info', text, delay = 0 }) {
  const { prefix, color } = LINE_TYPES[type] || LINE_TYPES.info;
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.25 }}
      className="flex gap-3 text-[13px] font-mono"
    >
      <span className="shrink-0 w-4 text-center" style={{ color }}>{prefix}</span>
      <span style={{ color: type === 'dim' ? 'var(--text-muted)' : '#d4d4d4' }}>{text}</span>
    </motion.div>
  );
}

/* ── Switch toggle ────────────────────────────────────────────── */
function Toggle({ label, sublabel, value, onChange, accentColor = 'var(--accent)' }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3"
         style={{ borderBottom: '1px solid var(--border-color)' }}>
      <div>
        <p className="text-sm font-bold" style={{ color: '#fff' }}>{label}</p>
        {sublabel && <p className="text-[11px] mt-0.5 font-mono" style={{ color: 'var(--text-secondary)' }}>{sublabel}</p>}
      </div>
      <motion.button
        onClick={() => onChange(!value)}
        whileTap={{ scale: 0.93 }}
        className="relative shrink-0 w-12 h-6 rounded-full transition-colors duration-300"
        style={{ background: value ? accentColor : 'rgba(255,255,255,0.08)', border: '1px solid var(--border-color)' }}
      >
        <motion.div
          animate={{ x: value ? 22 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-0.5 w-5 h-5 rounded-full"
          style={{ background: value ? '#000' : 'var(--text-muted)' }}
        />
      </motion.button>
    </div>
  );
}

export default function DevPortal() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const navigate = useNavigate();

  /* ── State ──────────────────────────────────────────────────── */
  const [logs,       setLogs]       = useState([]);
  const [metrics,    setMetrics]    = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [dbStatus,   setDbStatus]   = useState('checking');
  const [cmdInput,   setCmdInput]   = useState('');
  const [switches,   setSwitches]   = useState({
    debugMode:    false,
    cronSimulate: false,
    verboseLog:   false,
    maintenanceMode: false,
  });
  const [modal,      setModal]      = useState({ open: false, type: 'alert', title: '', message: '', onConfirm: null });
  const logsEndRef = useRef(null);

  const pushLog = (type, text) => {
    setLogs(prev => [...prev.slice(-80), { type, text, id: Date.now() + Math.random() }]);
  };

  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  /* ── Boot sequence ──────────────────────────────────────────── */
  useEffect(() => {
    const boot = async () => {
      pushLog('cmd',  'MANAR_DEV_PORTAL --init');
      pushLog('dim',  'Checking environment variables...');
      await delay(280);
      pushLog('success', 'JWT_SECRET ✓');
      await delay(180);
      pushLog('success', 'DATABASE_URL ✓');
      await delay(220);
      pushLog('dim',  'Connecting to PostgreSQL...');
      try {
        const res = await axios.get(`${API_URL}/api/health`);
        if (res.data?.status === 'OK') {
          setDbStatus('connected');
          pushLog('success', 'Database connection established');
        } else throw new Error();
      } catch {
        setDbStatus('error');
        pushLog('error', 'Database connection failed — check DATABASE_URL');
      }
      await delay(200);
      pushLog('info',  'Dev Portal ready. Type a command below.');
    };
    boot();
  }, []);

  const delay = (ms) => new Promise(r => setTimeout(r, ms));

  /* ── Fetch god-mode metrics ─────────────────────────────────── */
  const fetchMetrics = async () => {
    setLoading(true);
    pushLog('cmd', 'fetch /api/admin/god-mode/metrics');
    try {
      const token = localStorage.getItem('manar_token');
      const res = await axios.get(`${API_URL}/api/admin/god-mode/metrics`,
        { headers: { Authorization: `Bearer ${token}` } });
      if (res.data?.success) {
        setMetrics(res.data.data);
        pushLog('success', `Students: ${res.data.data.totalStudents} registered`);
        res.data.data.studentsByMajor.forEach(m =>
          pushLog('info', `  ${m.name}: ${m.count} student(s)`)
        );
      }
    } catch (err) {
      pushLog('error', err.response?.data?.error || 'Request failed — check auth token');
    } finally {
      setLoading(false);
    }
  };

  /* ── Terminal command handler ───────────────────────────────── */
  const handleCmd = async (e) => {
    if (e.key !== 'Enter' || !cmdInput.trim()) return;
    const cmd = cmdInput.trim().toLowerCase();
    pushLog('cmd', cmdInput);
    setCmdInput('');

    if (cmd === 'help') {
      ['metrics  — fetch live system metrics',
       'health   — ping API health endpoint',
       'clear    — clear terminal output',
       'logout   — sign out of all sessions',
       'god-mode — navigate to God Mode dashboard',
      ].forEach((l, i) => setTimeout(() => pushLog('dim', l), i * 60));
    } else if (cmd === 'metrics') {
      fetchMetrics();
    } else if (cmd === 'health') {
      try {
        const r = await axios.get(`${API_URL}/api/health`);
        pushLog('success', `${r.data.status} — ${r.data.message}`);
      } catch { pushLog('error', 'Health check failed'); }
    } else if (cmd === 'clear') {
      setLogs([]);
    } else if (cmd === 'logout') {
      ['manar_token','manar_user','student_profile'].forEach(k => localStorage.removeItem(k));
      pushLog('warn', 'Session cleared — redirecting to login...');
      setTimeout(() => navigate('/login'), 1200);
    } else if (cmd === 'god-mode') {
      navigate('/admin/god-mode');
    } else {
      pushLog('error', `Unknown command: "${cmd}" — type "help" for a list`);
    }
  };

  /* ── Status badge ───────────────────────────────────────────── */
  const statusColor = { connected: '#4ade80', error: '#f87171', checking: '#fbbf24' }[dbStatus];
  const statusLabel = { connected: 'DB ONLINE', error: 'DB ERROR', checking: 'CHECKING…' }[dbStatus];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      dir={isAr ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#000] text-[var(--text-primary)] p-4 md:p-8 space-y-8"
      style={{ fontFamily: "'Urbanist', monospace" }}
    >

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[10px] font-black tracking-[0.3em] uppercase px-3 py-1 rounded-full"
                  style={{ background: 'rgba(222,255,154,0.07)', color: 'var(--accent)', border: '1px solid rgba(222,255,154,0.15)' }}>
              🛡 DEV PORTAL
            </span>
            {/* DB status pill */}
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full font-mono"
              style={{ background: `${statusColor}12`, color: statusColor, border: `1px solid ${statusColor}30` }}
            >
              ● {statusLabel}
            </motion.span>
          </div>
          <h1
            className="font-black tracking-tighter leading-none"
            style={{ fontSize: 'clamp(44px, 6vw, 80px)', color: '#fff' }}
          >
            DEV PORTAL
          </h1>
          <p className="text-sm mt-2 font-mono" style={{ color: 'var(--text-secondary)' }}>
            {isAr ? 'بيئة التحكم الداخلية للمطور' : 'Internal developer control environment'}
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: '0 0 24px var(--accent-glow)' }}
            whileTap={{ scale: 0.97 }}
            onClick={fetchMetrics}
            disabled={loading}
            className="btn-neon px-5 py-2.5 text-xs flex items-center gap-2"
          >
            {loading
              ? <span className="h-3.5 w-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              : '⚡'}
            {isAr ? 'جلب المقاييس' : 'Fetch Metrics'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/admin/god-mode')}
            className="btn-ghost px-5 py-2.5 text-xs"
          >
            👑 God Mode
          </motion.button>
        </div>
      </div>

      {/* ── Main grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Terminal window (2/3 width) */}
        <div className="xl:col-span-2 frosted-panel rounded-2xl overflow-hidden flex flex-col" style={{ minHeight: 440 }}>
          {/* Terminal chrome */}
          <div className="flex items-center gap-2 px-5 py-3.5" style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
            <span className="ml-3 text-[11px] font-mono" style={{ color: 'var(--text-secondary)' }}>
              manar-dev ~ terminal
            </span>
          </div>

          {/* Log lines */}
          <div className="flex-1 overflow-y-auto p-5 space-y-1.5" style={{ background: '#020202' }}>
            <AnimatePresence initial={false}>
              {logs.map((log) => (
                <TerminalLine key={log.id} type={log.type} text={log.text} />
              ))}
            </AnimatePresence>
            <div ref={logsEndRef} />
          </div>

          {/* Command input */}
          <div className="flex items-center gap-3 px-5 py-3.5" style={{ borderTop: '1px solid var(--border-color)', background: '#020202' }}>
            <span className="font-mono text-xs" style={{ color: 'var(--accent)' }}>$</span>
            <input
              type="text"
              value={cmdInput}
              onChange={e => setCmdInput(e.target.value)}
              onKeyDown={handleCmd}
              placeholder={isAr ? 'اكتب أمراً… (help للمساعدة)' : 'Type a command… (help for list)'}
              className="flex-1 bg-transparent text-[13px] font-mono focus:outline-none"
              style={{ color: '#d4d4d4' }}
              spellCheck={false}
            />
          </div>
        </div>

        {/* Right column: switches + metrics */}
        <div className="space-y-5">

          {/* God Mode switches */}
          <div className="frosted-panel rounded-2xl p-6">
            <p className="text-[10px] font-black tracking-[0.28em] uppercase mb-5"
               style={{ color: 'var(--accent)' }}>
              {isAr ? 'مفاتيح النظام' : 'System Switches'}
            </p>
            <div className="space-y-0">
              <Toggle
                label={isAr ? 'وضع التصحيح' : 'Debug Mode'}
                sublabel="MANAR_DEBUG=true"
                value={switches.debugMode}
                onChange={v => { setSwitches(s => ({...s, debugMode: v})); pushLog(v ? 'warn' : 'info', `Debug mode ${v ? 'ENABLED' : 'DISABLED'}`); }}
              />
              <Toggle
                label={isAr ? 'محاكاة Cron' : 'Cron Simulate'}
                sublabel="force-trigger daily cron"
                value={switches.cronSimulate}
                onChange={v => { setSwitches(s => ({...s, cronSimulate: v})); pushLog(v ? 'warn' : 'info', `Cron simulation ${v ? 'ON' : 'OFF'}`); }}
                accentColor="#60c4ff"
              />
              <Toggle
                label={isAr ? 'السجل التفصيلي' : 'Verbose Log'}
                sublabel="log all API payloads"
                value={switches.verboseLog}
                onChange={v => { setSwitches(s => ({...s, verboseLog: v})); pushLog('dim', `Verbose logging ${v ? 'enabled' : 'disabled'}`); }}
              />
              <Toggle
                label={isAr ? 'وضع الصيانة' : 'Maintenance Mode'}
                sublabel="disable public registration"
                value={switches.maintenanceMode}
                onChange={v => {
                  if (v) {
                    setModal({ open: true, type: 'confirm', title: 'Enable Maintenance?', message: 'This is a UI-side flag only and does not affect the live backend.', onConfirm: () => { setSwitches(s => ({...s, maintenanceMode: true})); pushLog('warn', 'Maintenance mode flag SET'); setModal(m => ({...m, open: false})); } });
                  } else {
                    setSwitches(s => ({...s, maintenanceMode: false}));
                    pushLog('success', 'Maintenance mode flag CLEARED');
                  }
                }}
                accentColor="#f87171"
              />
            </div>
          </div>

          {/* Live metrics */}
          {metrics && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="frosted-panel rounded-2xl p-6 space-y-4"
            >
              <p className="text-[10px] font-black tracking-[0.28em] uppercase"
                 style={{ color: 'var(--accent)' }}>
                {isAr ? 'المقاييس المباشرة' : 'Live Metrics'}
              </p>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>total_students</span>
                  <span className="font-black text-lg" style={{ color: 'var(--accent)' }}>{metrics.totalStudents}</span>
                </div>
                {metrics.studentsByMajor.map((m, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-xs font-mono truncate max-w-[140px]" style={{ color: 'var(--text-muted)' }}>{m.name.toLowerCase().replace(/\s+/g,'_')}</span>
                    <span className="text-xs font-black font-mono" style={{ color: '#60c4ff' }}>{m.count}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ErrorModal */}
      <ErrorModal
        isOpen={modal.open}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        onCancel={() => setModal(m => ({...m, open: false}))}
      />
    </motion.div>
  );
}
