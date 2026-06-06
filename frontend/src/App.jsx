import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import Welcome from './Welcome';
import AdminOverview from './AdminOverview';
import Dashboard from './Dashboard';
import GroupManagement from './GroupManagement';
import BroadcastCenter from './BroadcastCenter';
import SystemLog from './SystemLog';
import StudentDashboard from './StudentDashboard';
import StudentApp from './StudentApp';
import NotificationCenter from './NotificationCenter';
import Settings from './Settings';

function AppLayout() {
  const location = useLocation();
  const path = location.pathname;

  const isAdminPath = path.startsWith('/admin');
  const isStudentPath = path.startsWith('/student');

  if (isAdminPath) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex">
        {/* Admin Left Sidebar */}
        <aside className="w-64 bg-gray-950 border-r border-gray-800 flex flex-col justify-between shrink-0">
          <div className="p-6 space-y-8">
            <div className="flex items-center gap-3">
              <span className="bg-lime-500 text-black font-black px-2.5 py-1 rounded text-sm shadow-md shadow-lime-500/20">M</span>
              <div>
                <h1 className="font-extrabold text-sm tracking-tight">MANAR</h1>
                <p className="text-[10px] text-gray-500 font-semibold uppercase">Admin Panel</p>
              </div>
            </div>

            <nav className="space-y-1.5 flex flex-col text-xs font-bold text-gray-400">
              <Link
                to="/admin/overview"
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition ${
                  path === '/admin/overview' ? 'bg-lime-500/10 text-lime-400 border-l-2 border-lime-500' : 'hover:bg-gray-900 hover:text-white'
                }`}
              >
                📊 Dashboard Overview
              </Link>
              <Link
                to="/admin/schedule"
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition ${
                  path === '/admin/schedule' ? 'bg-lime-500/10 text-lime-400 border-l-2 border-lime-500' : 'hover:bg-gray-900 hover:text-white'
                }`}
              >
                📅 Weekly Grid (Drag/Drop)
              </Link>
              <Link
                to="/admin/groups"
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition ${
                  path === '/admin/groups' ? 'bg-lime-500/10 text-lime-400 border-l-2 border-lime-500' : 'hover:bg-gray-900 hover:text-white'
                }`}
              >
                👥 Groups & Classrooms
              </Link>
              <Link
                to="/admin/broadcast"
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition ${
                  path === '/admin/broadcast' ? 'bg-lime-500/10 text-lime-400 border-l-2 border-lime-500' : 'hover:bg-gray-900 hover:text-white'
                }`}
              >
                📢 Broadcast Center
              </Link>
              <Link
                to="/admin/logs"
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition ${
                  path === '/admin/logs' ? 'bg-lime-500/10 text-lime-400 border-l-2 border-lime-500' : 'hover:bg-gray-900 hover:text-white'
                }`}
              >
                📜 System Audit Logs
              </Link>
            </nav>
          </div>

          <div className="p-6 border-t border-gray-850">
            <Link
              to="/"
              className="flex items-center justify-center py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-xs font-semibold rounded-lg text-gray-400 hover:text-white transition"
            >
              🚪 Leave Admin Panel
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <Routes>
            <Route path="/admin/overview" element={<AdminOverview />} />
            <Route path="/admin/schedule" element={<Dashboard />} />
            <Route path="/admin/groups" element={<GroupManagement />} />
            <Route path="/admin/broadcast" element={<BroadcastCenter />} />
            <Route path="/admin/logs" element={<SystemLog />} />
            <Route path="*" element={<Navigate to="/admin/overview" replace />} />
          </Routes>
        </div>
      </div>
    );
  }

  if (isStudentPath) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center">
        <div className="w-full max-w-md bg-gray-900 min-h-screen flex flex-col border-x border-gray-800 shadow-2xl relative pb-20">
          
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

          {/* Student Bottom Navigation Bar */}
          <nav className="fixed bottom-0 max-w-md w-full bg-gray-950 border-t border-gray-800 flex justify-around items-center py-2 px-4 z-50">
            <Link
              to="/student/home"
              className={`flex flex-col items-center text-[10px] font-bold transition ${
                path === '/student/home' ? 'text-lime-400' : 'text-gray-450 hover:text-gray-250'
              }`}
            >
              <span className="text-base mb-0.5">🏠</span>
              <span>Home</span>
            </Link>
            <Link
              to="/student/schedule"
              className={`flex flex-col items-center text-[10px] font-bold transition ${
                path === '/student/schedule' ? 'text-lime-400' : 'text-gray-450 hover:text-gray-250'
              }`}
            >
              <span className="text-base mb-0.5">📅</span>
              <span>Schedule</span>
            </Link>
            <Link
              to="/student/notifications"
              className={`flex flex-col items-center text-[10px] font-bold transition ${
                path === '/student/notifications' ? 'text-lime-400' : 'text-gray-450 hover:text-gray-250'
              }`}
            >
              <span className="text-base mb-0.5">🔔</span>
              <span>Alerts</span>
            </Link>
            <Link
              to="/student/settings"
              className={`flex flex-col items-center text-[10px] font-bold transition ${
                path === '/student/settings' ? 'text-lime-400' : 'text-gray-450 hover:text-gray-250'
              }`}
            >
              <span className="text-base mb-0.5">⚙️</span>
              <span>Settings</span>
            </Link>
            <Link
              to="/"
              className="flex flex-col items-center text-[10px] font-bold text-gray-450 hover:text-red-400 transition"
            >
              <span className="text-base mb-0.5">🚪</span>
              <span>Logout</span>
            </Link>
          </nav>
        </div>
      </div>
    );
  }

  // Welcome / Default Landing Page Layout
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
