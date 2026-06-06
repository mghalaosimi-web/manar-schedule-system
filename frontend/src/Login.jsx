import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Login() {
  const { i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      if (res.data && res.data.success) {
        const { token, user } = res.data;
        
        // Save to localStorage
        localStorage.setItem('manar_token', token);
        localStorage.setItem('manar_user', JSON.stringify(user));

        // Redirect based on role
        if (user.role === 'ADMIN') {
          navigate('/admin/overview');
        } else {
          // Initialize student profile local state too
          localStorage.setItem('student_profile', JSON.stringify({
            name: user.name,
            email: user.email,
            department: 'Software Engineering',
            level: 'Level 3',
            groupId: user.groupId || 1
          }));
          navigate('/student/home');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Connection failed. Please verify the backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6 relative pt-20">
      {/* Global Institution Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-gray-900/60 backdrop-blur-lg border-b border-white/10 shadow-sm z-40 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-lime-500/10 rounded border border-lime-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-lime-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
            </svg>
          </div>
          <span className="text-lg md:text-xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-emerald-400">
            كلية المنار الجامعية
          </span>
        </div>
        <button
          onClick={() => i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')}
          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-gray-300 transition-all duration-200"
        >
          {i18n.language === 'ar' ? 'English' : 'العربية'}
        </button>
      </header>

      <div className="w-full max-w-md bg-gray-850 border border-gray-800 rounded-2xl p-8 shadow-2xl space-y-6">
        
        {/* Logo and title */}
        <div className="text-center space-y-3">
          <div className="mx-auto h-12 w-12 bg-lime-500 rounded-xl flex items-center justify-center shadow-lg shadow-lime-500/20">
            <span className="text-2xl font-black text-black">M</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">System Security Gateway</h2>
            <p className="text-xs text-gray-400 mt-1">Please authenticate to access the schedule portal.</p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-200 text-xs font-semibold rounded-lg text-center leading-relaxed">
            ⚠️ {error}
          </div>
        )}

        {/* Credentials Tip */}
        <div className="bg-gray-900 border border-gray-800 p-3 rounded-lg text-[10px] text-gray-400 space-y-1">
          <span className="font-bold text-lime-400 uppercase tracking-wide block mb-1">Sandbox Demo Credentials:</span>
          <div>Admin: <code className="text-gray-200 font-mono">admin@manar.edu</code> / <code className="text-gray-200 font-mono">admin123</code></div>
          <div>Student: <code className="text-gray-200 font-mono">student@manar.edu</code> / <code className="text-gray-200 font-mono">student123</code></div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="text-gray-400 block font-medium">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. user@manar.edu"
              className="w-full bg-gray-900 border border-gray-750 rounded p-2.5 text-white focus:outline-none focus:border-lime-500 font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-gray-400 block font-medium">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-gray-900 border border-gray-750 rounded p-2.5 text-white focus:outline-none focus:border-lime-500 font-mono"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-lime-500 hover:bg-lime-400 text-black font-extrabold rounded-md shadow-md shadow-lime-500/10 transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Lock In Authenticated Session</span>
              )}
            </button>
          </div>
        </form>

      </div>
      
      {/* Developer Branding */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 text-gray-500 text-xs font-medium">
        Developed by <a href="https://github.com/mghalaosimi-web" target="_blank" rel="noopener noreferrer" className="bg-gradient-to-r from-lime-400 to-emerald-500 bg-clip-text text-transparent font-extrabold tracking-widest hover:drop-shadow-[0_0_10px_rgba(132,204,22,0.8)] hover:scale-105 hover:text-white transition-all duration-300 cursor-pointer inline-block">M.GH.AL</a>
      </div>
    </div>
  );
}
