import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import ConfirmationModal from './ConfirmationModal';
import { Toaster, toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from './config';
import Welcome from './Welcome';
import Login from './Login';
import Register from './Register';
import Verification from './Verification';
import Students from './Students';
import AdminOverview from './AdminOverview';
import Dashboard from './Dashboard';
import GroupManagement from './GroupManagement';
import BroadcastCenter from './BroadcastCenter';
import SystemLog from './SystemLog';
import StudentDashboard from './StudentDashboard';
import StudentApp from './StudentApp';
import NotificationCenter from './NotificationCenter';
import Settings from './Settings';
import GodMode from './GodMode';
import ThemeSwitcher from './ThemeSwitcher';
import Logo from './Logo';
import { useTranslation } from 'react-i18next';
import CommandPalette from './CommandPalette';
import Instructions from './Instructions';
import DevSignature from './DevSignature';
import DevPortal from './DevPortal';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function AppLayout() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ── Session Restoration: Auto-redirect on cold load ──────────────────────
  useEffect(() => {
    const token = localStorage.getItem('manar_token');
    const userJson = localStorage.getItem('manar_user');
    if (!token || !userJson) return;

    let user = null;
    try { user = JSON.parse(userJson); } catch { return; }
    if (!user) return;

    // Only auto-redirect from public / root paths
    const isPublicPath = ['/', '/login', '/register', '/verify'].includes(path);
    if (!isPublicPath) return; // Already on a protected route, let route guards handle it

    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      navigate('/admin/overview', { replace: true });
    } else if (user.role === 'STUDENT') {
      navigate('/student/home', { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Web Push Notification Subscription ───────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('manar_token');
    const userJson = localStorage.getItem('manar_user');
    if (!token || !userJson) return;

    // Ask for permission and register push subscription
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(async (registration) => {
        try {
          // Get public VAPID key
          const keyRes = await axios.get(`${API_URL}/api/notifications/vapid-key`);
          if (keyRes.data?.success && keyRes.data.publicKey) {
            const publicVapidKey = keyRes.data.publicKey;

            let subscription = await registration.pushManager.getSubscription();
            if (!subscription) {
              // Ask permission first
              const permission = await Notification.requestPermission();
              if (permission === 'granted') {
                subscription = await registration.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
                });
              }
            }

            if (subscription) {
              await axios.post(`${API_URL}/api/notifications/subscribe`, { subscription }, {
                headers: { Authorization: `Bearer ${token}` }
              });
              console.log('[PUSH] Successfully subscribed and synced with server.');
            }
          }
        } catch (err) {
          console.warn('[PUSH] Subscription registration failed:', err.message);
        }
      });
    }
  }, [path]);

  // ── Server-Sent Events (SSE) Live Update Listener ────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('manar_token');
    if (!token) return;

    console.log('[SSE] Connecting to live updates stream...');
    const eventSource = new EventSource(`${API_URL}/api/schedules/live`);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        console.log('[SSE] Broadcast event received:', payload);

        if (payload.type === 'SCHEDULE_UPDATE') {
          toast(i18n.language === 'ar' ? '📅 تم تحديث جدول المحاضرات للتو!' : '📅 Lecture schedule has been updated!', {
            icon: '🔔',
            duration: 5000,
            style: { border: '1px solid var(--accent)' }
          });
          // Dispatch custom window event to trigger dashboard/profile re-fetches
          window.dispatchEvent(new CustomEvent('MANAR_SCHEDULE_UPDATE'));
        } else if (payload.type === 'BROADCAST_MESSAGE') {
          const userJson = localStorage.getItem('manar_user');
          let currentUser = null;
          try { currentUser = JSON.parse(userJson); } catch {}

          if (payload.data.groupId === null || (currentUser && currentUser.groupId === payload.data.groupId)) {
            toast(payload.data.message, {
              icon: '📢',
              duration: 8000,
              style: { border: '1px solid #60c4ff' }
            });
            window.dispatchEvent(new CustomEvent('MANAR_BROADCAST_RECEIVE'));
          }
        }
      } catch (err) {
        console.error('[SSE] Error processing incoming event:', err);
      }
    };

    eventSource.onerror = () => {
      console.warn('[SSE] EventSource stream closed. Auto-reconnecting...');
    };

    return () => {
      console.log('[SSE] Closing live updates stream...');
      eventSource.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);
  // ─────────────────────────────────────────────────────────────────────────

  const isAdminPath = path.startsWith('/admin');
  const isStudentPath = path.startsWith('/student');

  const token = localStorage.getItem('manar_token');
  const userJson = localStorage.getItem('manar_user');
  let user = null;
  if (userJson) {
    try {
      user = JSON.parse(userJson);
    } catch (e) {
      console.error(e);
    }
  }

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogoutClick = (e) => {
    e?.preventDefault();
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('manar_token');
    localStorage.removeItem('manar_user');
    localStorage.removeItem('student_profile');
    setIsLogoutModalOpen(false);
    navigate('/login');
  };

  if (isAdminPath) {
    if (!token || !user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return <Navigate to="/login" replace />;
    }

    const isAr = i18n.language === 'ar';

    /* Nav link helper */
    const navLink = (to, icon, label, activeColor = 'var(--accent)') => {
      const isActive = path === to;
      return (
        <Link
          key={to}
          to={to}
          onClick={() => setIsSidebarOpen(false)}
          style={isActive ? { color: activeColor, background: `rgba(222,255,154,0.06)`, borderLeft: isAr ? 'none' : `2px solid ${activeColor}`, borderRight: isAr ? `2px solid ${activeColor}` : 'none' } : {}}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all duration-200 ${
            isActive ? '' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/3'
          }`}
        >
          <span>{icon}</span>
          <span>{label}</span>
        </Link>
      );
    };

    return (
      <div dir={isAr ? 'rtl' : 'ltr'} className="min-h-screen bg-[#000] text-[var(--text-primary)] flex" style={{ paddingTop: '60px' }}>
        
        {/* ── Top header bar ───────────────────────────────────── */}
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
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`h-12 w-12 flex items-center justify-center ${isAr ? '-mr-2 ml-1' : '-ml-2 mr-1'} text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 rounded-xl md:hidden transition-all shrink-0`}
              aria-label="Toggle Menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={isSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
            <Logo size="sm" />
            <span className="text-xs md:text-sm font-black tracking-wider uppercase truncate" style={{ color: 'var(--accent)' }}>
              {isAr ? 'كلية المنارة الجامعية' : 'Al-Manar University College'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <button
              onClick={() => i18n.changeLanguage(isAr ? 'en' : 'ar')}
              className="btn-ghost px-3 py-1.5 text-xs tracking-widest uppercase"
            >
              {isAr ? 'EN' : 'عربي'}
            </button>
          </div>
        </header>

        {/* ── Mobile Backdrop Overlay ───────────────────────────── */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* ── Admin sidebar ────────────────────────────────────── */}
        <aside
          className={`fixed inset-y-0 ${isAr ? 'right-0' : 'left-0'} z-50 w-64 bg-[#000] transition-transform duration-300 ease-in-out transform ${
            isSidebarOpen ? 'translate-x-0' : (isAr ? 'translate-x-full' : '-translate-x-full')
          } md:translate-x-0 md:static md:w-64 md:flex flex-col justify-between shrink-0`}
          style={{
            borderRight: isAr ? 'none' : '1px solid var(--border-color)',
            borderLeft: isAr ? '1px solid var(--border-color)' : 'none'
          }}
        >
          <div className="p-5 pt-7 space-y-7">
            {/* Wordmark */}
            <div>
              <p className="text-[10px] font-black tracking-[0.28em] uppercase" style={{ color: 'var(--text-muted)' }}>
                Admin Panel
              </p>
            </div>

            {/* Nav links */}
            <nav className="space-y-1">
              {navLink('/admin/overview',  '📊', isAr ? 'نظرة عامة' : 'Overview')}
              {navLink('/admin/schedule',  '📅', isAr ? 'الجدول الأسبوعي' : 'Schedule')}
              {navLink('/admin/groups',    '👥', isAr ? 'المجموعات' : 'Groups')}
              {navLink('/admin/students',  '🎓', isAr ? 'الطلاب' : 'Students')}
              {navLink('/admin/broadcast', '📢', isAr ? 'البث العام' : 'Broadcast')}
              {navLink('/admin/logs',      '📜', isAr ? 'السجلات' : 'Logs')}
              {user?.role === 'SUPER_ADMIN' && (
                <>
                  {navLink('/admin/god-mode',   '👑', isAr ? 'God Mode'   : 'God Mode',   '#e879f9')}
                  {navLink('/admin/dev-portal', '⌨️', isAr ? 'Dev Portal' : 'Dev Portal', '#60c4ff')}
                  <button
                    onClick={async () => {
                      try {
                        const tk = localStorage.getItem('manar_token');
                        const sRes = await axios.get(`${API_URL}/api/students`, { headers: { Authorization: `Bearer ${tk}` } });
                        if (sRes.data?.success && sRes.data.data.length > 0) {
                          const s = sRes.data.data[0];
                          const r = await axios.post(`${API_URL}/api/auth/impersonate`, { studentId: s.id }, { headers: { Authorization: `Bearer ${tk}` } });
                          if (r.data?.success) {
                            localStorage.setItem('manar_token', r.data.token);
                            localStorage.setItem('manar_user', JSON.stringify(r.data.user));
                            localStorage.setItem('student_profile', JSON.stringify({ name: s.name, email: s.email, department: s.major?.department?.name || '', level: s.level?.name || '', groupId: s.groupId }));
                            toast.success(isAr ? `معاينة: ${s.name}` : `Preview as ${s.name}`);
                            setIsSidebarOpen(false);
                            navigate('/student/home');
                          }
                        } else {
                          toast.error(isAr ? 'لا يوجد طلاب' : 'No students found');
                        }
                      } catch { toast.error(isAr ? 'فشل المعاينة' : 'Preview failed'); }
                    }}
                    className="w-full mt-1 flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all duration-200 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/3"
                  >
                    <span>🔑 {isAr ? 'دخول كطالب' : 'Student Preview'}</span>
                    <span style={{ color: 'var(--accent)' }}>{isAr ? '←' : '→'}</span>
                  </button>
                </>
              )}
            </nav>
          </div>

          {/* Sidebar footer */}
          <div className="p-5 space-y-4" style={{ borderTop: '1px solid var(--border-color)' }}>
            <button
              onClick={handleLogoutClick}
              className="btn-ghost w-full py-2.5 text-xs font-black tracking-wide"
            >
              🚪 {isAr ? 'تسجيل الخروج' : 'Sign Out'}
            </button>
            <DevSignature centered={true} />
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-y-auto min-w-0">
          <Routes>
            <Route path="/admin/overview" element={<AdminOverview />} />
            <Route path="/admin/schedule" element={<Dashboard />} />
            <Route path="/admin/groups" element={<GroupManagement />} />
            <Route path="/admin/students"   element={<Students />} />
            <Route path="/admin/broadcast"  element={<BroadcastCenter />} />
            <Route path="/admin/logs"       element={<SystemLog />} />
            <Route path="/admin/god-mode"   element={<GodMode />} />
            <Route path="/admin/dev-portal" element={<DevPortal />} />
            <Route path="/admin/instructions" element={<Instructions />} />
            <Route path="*" element={<Navigate to="/admin/overview" replace />} />
          </Routes>
        </div>

        <ConfirmationModal
          isOpen={isLogoutModalOpen}
          title={isAr ? 'تأكيد تسجيل الخروج' : 'Confirm Sign Out'}
          message={isAr ? 'هل أنت متأكد من الخروج؟' : 'Are you sure you want to sign out?'}
          onConfirm={confirmLogout}
          onCancel={() => setIsLogoutModalOpen(false)}
          confirmText={isAr ? 'خروج' : 'Sign Out'}
          cancelText={isAr ? 'إلغاء' : 'Cancel'}
        />
      </div>
    );
  }

  if (isStudentPath) {
    if (!token || !user || user.role !== 'STUDENT') {
      return <Navigate to="/login" replace />;
    }

    const isAr = i18n.language === 'ar';
    const accentStyle = (active) => active ? { color: 'var(--accent)' } : {};

    return (
      <div dir={isAr ? 'rtl' : 'ltr'} className="min-h-screen bg-[#000] text-[var(--text-primary)] flex flex-col items-center">
        <div className="w-full max-w-md min-h-screen flex flex-col relative pb-24" style={{ paddingTop: '60px', borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}>
          
          {/* Student top header */}
          <header
            className="fixed top-0 z-40 flex items-center justify-between px-5"
            style={{
              width: 'inherit', maxWidth: '448px',
              height: '60px',
              background: 'rgba(0,0,0,0.88)',
              backdropFilter: 'blur(20px)',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Logo size="sm" />
              <span className="text-xs font-black tracking-wider uppercase truncate" style={{ color: 'var(--accent)' }}>
                {isAr ? 'كلية المنارة الجامعية' : 'Al-Manar University College'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeSwitcher />
              <button
                onClick={() => i18n.changeLanguage(isAr ? 'en' : 'ar')}
                className="btn-ghost px-3 py-1 text-[10px] tracking-widest uppercase"
              >
                {isAr ? 'EN' : 'عربي'}
              </button>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            <Routes>
              <Route path="/student/home"          element={<StudentDashboard />} />
              <Route path="/student/schedule"      element={<StudentApp />} />
              <Route path="/student/notifications" element={<NotificationCenter />} />
              <Route path="/student/settings"      element={<Settings />} />
              <Route path="*" element={<Navigate to="/student/home" replace />} />
            </Routes>
          </div>

          {/* Premium floating glass nav dock */}
          <nav
            className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center"
            style={{
              width: 'calc(100% - 2rem)', maxWidth: '400px',
              background: 'rgba(8,8,8,0.90)',
              backdropFilter: 'blur(24px)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              padding: '10px 16px',
              gap: '4px',
              boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02) inset',
            }}
          >
            {[
              { to: '/student/home',          icon: '🏠', label: t('nav.home') },
              { to: '/student/schedule',      icon: '📅', label: t('nav.schedule') },
              { to: '/student/notifications', icon: '🔔', label: t('nav.alerts') },
              { to: '/student/settings',      icon: '⚙️', label: t('nav.settings') },
            ].map(({ to, icon, label }) => {
              const active = path === to;
              return (
                <Link key={to} to={to}
                  className="flex-1 flex flex-col items-center py-1.5 rounded-xl transition-all duration-200 relative"
                  style={{ color: active ? 'var(--accent)' : 'var(--text-secondary)' }}
                >
                  <span className="text-[17px] leading-none mb-0.5">{icon}</span>
                  <span className="text-[9px] font-black tracking-wide">{label}</span>
                  {active && <span className="absolute bottom-0.5 h-0.5 w-4 rounded-full" style={{ background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }} />}
                </Link>
              );
            })}
            <button
              onClick={handleLogoutClick}
              className="flex-1 flex flex-col items-center py-1.5 rounded-xl transition-all duration-200"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <span className="text-[17px] leading-none mb-0.5">🚪</span>
              <span className="text-[9px] font-black tracking-wide">{t('nav.logout')}</span>
            </button>
          </nav>
        </div>

        <ConfirmationModal
          isOpen={isLogoutModalOpen}
          title={isAr ? 'تأكيد الخروج' : 'Confirm Sign Out'}
          message={isAr ? 'هل أنت متأكد من الخروج؟' : 'Are you sure you want to sign out?'}
          onConfirm={confirmLogout}
          onCancel={() => setIsLogoutModalOpen(false)}
          confirmText={isAr ? 'خروج' : 'Sign Out'}
          cancelText={isAr ? 'إلغاء' : 'Cancel'}
        />
      </div>
    );
  }

  // Welcome / Default Landing Page Layout
  return (
    <Routes>
      <Route path="/"             element={<Welcome />} />
      <Route path="/login"        element={<Login />} />
      <Route path="/register"     element={<Register />} />
      <Route path="/verify"       element={<Verification />} />
      <Route path="/instructions" element={<Instructions />} />
      <Route path="*"             element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
      <CommandPalette />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0a0a0a',
            color: '#f0f0f0',
            border: '1px solid rgba(222,255,154,0.12)',
            fontFamily: 'Urbanist, system-ui, sans-serif',
            fontWeight: '700',
            fontSize: '13px',
            borderRadius: '12px',
          },
        }}
      />
    </BrowserRouter>
  );
}
