import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 bg-gray-900 text-white flex flex-col items-center justify-center p-6 min-h-[calc(100vh-50px)]">
      <div className="w-full max-w-md bg-gray-850 border border-gray-800 rounded-2xl p-8 shadow-2xl text-center space-y-8">
        
        {/* Logo Icon */}
        <div className="mx-auto h-16 w-16 bg-lime-500 rounded-2xl flex items-center justify-center shadow-lg shadow-lime-500/20">
          <span className="text-3xl font-black text-black">M</span>
        </div>

        {/* Branding header */}
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Manar Schedule & Alert System</h2>
          <p className="text-xs text-gray-400">Integrated smart scheduling dashboard for administrators and students.</p>
        </div>

        {/* Action Options */}
        <div className="space-y-4 pt-4">
          <button
            onClick={() => navigate('/student/home')}
            className="w-full py-3 px-4 bg-lime-500 hover:bg-lime-400 text-black font-extrabold rounded-xl shadow-lg shadow-lime-500/10 transition flex items-center justify-center gap-3 text-sm"
          >
            <span>🎓 Access Student Schedule Portal</span>
          </button>

          <button
            onClick={() => navigate('/admin/overview')}
            className="w-full py-3 px-4 bg-gray-800 hover:bg-gray-750 text-sky-400 font-extrabold rounded-xl border border-gray-700 hover:border-sky-500/30 transition flex items-center justify-center gap-3 text-sm"
          >
            <span>🛠️ Administrative Access Panel</span>
          </button>
        </div>

        {/* Micro status info */}
        <div className="border-t border-gray-800/80 pt-4 flex justify-between items-center text-[10px] text-gray-500">
          <span>Version 1.0.0 (Phase 7)</span>
          <span>● Status: Active & Synced</span>
        </div>

      </div>
    </div>
  );
}
