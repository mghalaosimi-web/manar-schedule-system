import React, { useState } from 'react';
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

function AppLayout() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const path = location.pathname;

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
  const navigate = useNavigate();

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

    return (
      <div dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex pt-16 transition-colors duration-300">
        {/* Global Institution Header */}
        <header className="fixed top-0 left-0 right-0 h-16 bg-[var(--bg-card)] backdrop-blur-lg border-b border-[var(--border-color)] shadow-sm z-40 flex items-center justify-between px-6 transition-all duration-300">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-lg md:text-xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-emerald-400">
              كلية المنار الجامعية
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <button
              onClick={() => i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-gray-300 transition-all duration-200"
            >
              {i18n.language === 'ar' ? 'English' : 'العربية'}
            </button>
          </div>
        </header>

        {/* Admin Left Sidebar */}
        <aside className="w-64 m-4 mr-0 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl flex flex-col justify-between shrink-0 shadow-2xl relative transition-all duration-300">
          <div className="p-6 space-y-8">
            <div className="flex items-center gap-3">
              <Logo size="sm" />
              <div>
                <h1 className="font-extrabold text-sm tracking-tight">MANAR</h1>
                <p className="text-[10px] text-gray-500 font-semibold uppercase">Admin Panel</p>
              </div>
            </div>

            <nav className="space-y-1.5 flex flex-col text-xs font-bold text-gray-400">
              <Link
                to="/admin/overview"
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition ${
                  path === '/admin/overview' ? 'bg-lime-500/10 text-lime-400 border-l-2 border-lime-500 shadow-[0_0_15px_rgba(132,204,22,0.06)]' : 'hover:bg-white/5 hover:text-white'
                }`}
              >
                📊 {t('nav.overview')}
              </Link>
              <Link
                to="/admin/schedule"
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition ${
                  path === '/admin/schedule' ? 'bg-lime-500/10 text-lime-400 border-l-2 border-lime-500 shadow-[0_0_15px_rgba(132,204,22,0.06)]' : 'hover:bg-white/5 hover:text-white'
                }`}
              >
                📅 {t('nav.weeklyTimeline')}
              </Link>
              <Link
                to="/admin/groups"
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition ${
                  path === '/admin/groups' ? 'bg-lime-500/10 text-lime-400 border-l-2 border-lime-500 shadow-[0_0_15px_rgba(132,204,22,0.06)]' : 'hover:bg-white/5 hover:text-white'
                }`}
              >
                👥 {t('nav.groups')}
              </Link>
              <Link
                to="/admin/students"
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition ${
                  path === '/admin/students' ? 'bg-lime-500/10 text-lime-400 border-l-2 border-lime-500 shadow-[0_0_15px_rgba(132,204,22,0.06)]' : 'hover:bg-white/5 hover:text-white'
                }`}
              >
                🎓 {t('nav.students')}
              </Link>
              <Link
                to="/admin/broadcast"
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition ${
                  path === '/admin/broadcast' ? 'bg-lime-500/10 text-lime-400 border-l-2 border-lime-500 shadow-[0_0_15px_rgba(132,204,22,0.06)]' : 'hover:bg-white/5 hover:text-white'
                }`}
              >
                📢 {t('nav.broadcast')}
              </Link>
              <Link
                to="/admin/logs"
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition ${
                  path === '/admin/logs' ? 'bg-lime-500/10 text-lime-400 border-l-2 border-lime-500 shadow-[0_0_15px_rgba(132,204,22,0.06)]' : 'hover:bg-white/5 hover:text-white'
                }`}
              >
                📜 {t('nav.logs')}
              </Link>
              {user?.role === 'SUPER_ADMIN' && (
                <>
                  <Link
                    to="/admin/god-mode"
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition ${
                      path === '/admin/god-mode' ? 'bg-purple-500/10 text-purple-400 border-l-2 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.06)]' : 'hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    👑 {i18n.language === 'ar' ? 'وضع المطور (God Mode)' : 'God Mode'}
                  </Link>

                  <button
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('manar_token');
                        const studentsRes = await axios.get(`${API_URL}/api/students`, {
                          headers: token ? { Authorization: `Bearer ${token}` } : {}
                        });
                        if (studentsRes.data?.success && studentsRes.data.data.length > 0) {
                          const firstStudent = studentsRes.data.data[0];
                          const res = await axios.post(
                            `${API_URL}/api/auth/impersonate`,
                            { studentId: firstStudent.id },
                            { headers: token ? { Authorization: `Bearer ${token}` } : {} }
                          );
                          if (res.data?.success) {
                            const { token: studentToken, user: studentUser } = res.data;
                            localStorage.setItem('manar_token', studentToken);
                            localStorage.setItem('manar_user', JSON.stringify(studentUser));
                            localStorage.setItem('student_profile', JSON.stringify({
                              name: firstStudent.name,
                              email: firstStudent.email,
                              department: firstStudent.major?.department?.name || (i18n.language === 'ar' ? 'قسم الهندسة البرمجية' : 'Software Engineering'),
                              level: firstStudent.level?.name || 'Level 1',
                              groupId: firstStudent.groupId
                            }));
                            toast.success(i18n.language === 'ar' ? `وضع المعاينة: دخول باسم ${firstStudent.name}` : `Preview Mode: Entered as ${firstStudent.name}`);
                            navigate('/student/home');
                          }
                        } else {
                          toast.error(i18n.language === 'ar' ? 'لم يتم العثور على أي طالب مسجل في النظام للمعاينة.' : 'No registered student found in system for simulation preview.');
                        }
                      } catch (e) {
                        console.error('Failed to trigger student preview:', e);
                        toast.error(i18n.language === 'ar' ? 'فشل بدء معاينة واجهة الطالب. يرجى التحقق من اتصال قاعدة البيانات.' : 'Failed to start student preview. Check database connection.');
                      }
                    }}
                    className="w-full text-right flex items-center justify-between px-4 py-2.5 bg-lime-500/10 hover:bg-lime-500/20 text-lime-400 rounded-xl text-xs font-bold transition border border-lime-500/25 mt-2"
                  >
                    <span>{i18n.language === 'ar' ? '🔑 دخول مباشر كطالب' : '🔑 Quick Student View'}</span>
                    <span>➜</span>
                  </button>
                </>
              )}
            </nav>
          </div>

          <div className="p-6 border-t border-gray-850 space-y-4">
            <button
              onClick={handleLogoutClick}
              className="w-full flex items-center justify-center py-2 bg-gray-900 hover:bg-gray-850 border border-gray-800 text-xs font-semibold rounded-lg text-gray-400 hover:text-white transition"
            >
              🚪 {t('nav.leaveAdmin')}
            </button>
            
            <div className="border-t border-white/10 pt-4 text-center text-gray-500 text-xs font-medium">
              Developed by <a href="https://github.com/mghalaosimi-web" target="_blank" rel="noopener noreferrer" className="bg-gradient-to-r from-lime-400 to-emerald-500 bg-clip-text text-transparent font-extrabold tracking-widest hover:drop-shadow-[0_0_10px_rgba(132,204,22,0.8)] hover:scale-105 hover:text-white transition-all duration-300 cursor-pointer inline-block">M.GH.AL</a>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <Routes>
            <Route path="/admin/overview" element={<AdminOverview />} />
            <Route path="/admin/schedule" element={<Dashboard />} />
            <Route path="/admin/groups" element={<GroupManagement />} />
            <Route path="/admin/students" element={<Students />} />
            <Route path="/admin/broadcast" element={<BroadcastCenter />} />
            <Route path="/admin/logs" element={<SystemLog />} />
            <Route path="/admin/god-mode" element={<GodMode />} />
            <Route path="*" element={<Navigate to="/admin/overview" replace />} />
          </Routes>
        </div>
        <ConfirmationModal
          isOpen={isLogoutModalOpen}
          title="Confirm Logout"
          message="Are you sure you want to log out of the Manar Schedule System?"
          onConfirm={confirmLogout}
          onCancel={() => setIsLogoutModalOpen(false)}
          confirmText="Log Out"
          cancelText="Cancel"
        />
      </div>
    );
  }

  if (isStudentPath) {
    if (!token || !user || user.role !== 'STUDENT') {
      return <Navigate to="/login" replace />;
    }

    return (
      <div dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col items-center transition-colors duration-300">
        <div className="w-full max-w-md bg-[var(--bg-card)] border-x border-[var(--border-color)] min-h-screen flex flex-col shadow-2xl relative pb-24 pt-16 transition-all duration-300">
          {/* Global Institution Header */}
          <header className="absolute top-0 left-0 right-0 h-16 bg-[var(--bg-card)] backdrop-blur-lg border-b border-[var(--border-color)] shadow-sm z-40 flex items-center justify-between px-6 transition-all duration-300">
            <div className="flex items-center gap-2">
              <Logo size="sm" />
              <span className="text-base font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-emerald-400">
                كلية المنار الجامعية
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeSwitcher />
              <button
                onClick={() => i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')}
                className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[10px] font-bold text-gray-300 transition-all duration-200"
              >
                {i18n.language === 'ar' ? 'English' : 'العربية'}
              </button>
            </div>
          </header>
          
          {/* Main App Content */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            <Routes>
              <Route path="/student/home" element={<StudentDashboard />} />
              <Route path="/student/schedule" element={<StudentApp />} />
              <Route path="/student/notifications" element={<NotificationCenter />} />
              <Route path="/student/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/student/home" replace />} />
            </Routes>
          </div>

          {/* Student Bottom Navigation Bar - Floating Glass Dock */}
          <nav className="fixed bottom-4 max-w-sm w-[90%] left-1/2 -translate-x-1/2 bg-gray-950/75 backdrop-blur-lg border border-gray-800/80 rounded-2xl flex justify-around items-center py-2.5 px-4 z-50 shadow-2xl">
            <Link
              to="/student/home"
              className={`flex flex-col items-center text-[10px] font-bold transition relative ${
                path === '/student/home' ? 'text-lime-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="text-base mb-0.5">🏠</span>
              <span>{t('nav.home')}</span>
              {path === '/student/home' && <span className="absolute -bottom-1 h-1 w-1 bg-lime-400 rounded-full shadow-[0_0_8px_#84cc16]" />}
            </Link>
            <Link
              to="/student/schedule"
              className={`flex flex-col items-center text-[10px] font-bold transition relative ${
                path === '/student/schedule' ? 'text-lime-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="text-base mb-0.5">📅</span>
              <span>{t('nav.schedule')}</span>
              {path === '/student/schedule' && <span className="absolute -bottom-1 h-1 w-1 bg-lime-400 rounded-full shadow-[0_0_8px_#84cc16]" />}
            </Link>
            <Link
              to="/student/notifications"
              className={`flex flex-col items-center text-[10px] font-bold transition relative ${
                path === '/student/notifications' ? 'text-lime-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="text-base mb-0.5">🔔</span>
              <span>{t('nav.alerts')}</span>
              {path === '/student/notifications' && <span className="absolute -bottom-1 h-1 w-1 bg-lime-400 rounded-full shadow-[0_0_8px_#84cc16]" />}
            </Link>
            <Link
              to="/student/settings"
              className={`flex flex-col items-center text-[10px] font-bold transition relative ${
                path === '/student/settings' ? 'text-lime-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="text-base mb-0.5">⚙️</span>
              <span>{t('nav.settings')}</span>
              {path === '/student/settings' && <span className="absolute -bottom-1 h-1 w-1 bg-lime-400 rounded-full shadow-[0_0_8px_#84cc16]" />}
            </Link>
            <button
              onClick={handleLogoutClick}
              className="flex flex-col items-center text-[10px] font-bold text-gray-400 hover:text-red-400 transition"
            >
              <span className="text-base mb-0.5">🚪</span>
              <span>{t('nav.logout')}</span>
            </button>
          </nav>
        </div>
        <ConfirmationModal
          isOpen={isLogoutModalOpen}
          title="Confirm Logout"
          message="Are you sure you want to log out of the Manar Schedule System?"
          onConfirm={confirmLogout}
          onCancel={() => setIsLogoutModalOpen(false)}
          confirmText="Log Out"
          cancelText="Cancel"
        />
      </div>
    );
  }

  // Welcome / Default Landing Page Layout
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify" element={<Verification />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
      <CommandPalette />
      <Toaster position="top-right" toastOptions={{ className: 'bg-gray-800 text-white border border-gray-700' }} />
    </BrowserRouter>
  );
}
