import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function AdminOverview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    students: 245,
    lectures: 12,
    departments: 3,
    classrooms: 8
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Attempt to read current count of items from localStorage database if available
    const savedSchedules = localStorage.getItem('manar_schedules');
    if (savedSchedules) {
      try {
        const parsed = JSON.parse(savedSchedules);
        setStats(prev => ({
          ...prev,
          lectures: parsed.length
        }));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSync = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 800);
  };

  return (
    <div className="flex-1 bg-gray-900 text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Admin Overview</h2>
          <p className="text-sm text-gray-400">Real-time system stats and administrative health metrics.</p>
        </div>
        <button
          onClick={handleSync}
          className="px-4 py-2 bg-lime-500 text-black font-semibold text-xs rounded-md shadow-md shadow-lime-500/20 hover:bg-lime-400 transition flex items-center gap-2"
        >
          {loading ? (
            <span className="h-3.5 w-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <span>🔄 Refresh Data</span>
          )}
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-gray-850 p-6 rounded-xl border border-gray-800 flex flex-col justify-between hover:border-sky-500/50 transition duration-200">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-sky-400">Total Enrollment</span>
            <h3 className="text-3xl font-extrabold mt-2 text-white">{stats.students}</h3>
          </div>
          <span className="text-xs text-gray-500 mt-4">Active student profiles</span>
        </div>

        <div className="bg-gray-850 p-6 rounded-xl border border-gray-800 flex flex-col justify-between hover:border-lime-500/50 transition duration-200">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-lime-400">Active Schedules</span>
            <h3 className="text-3xl font-extrabold mt-2 text-white">{stats.lectures}</h3>
          </div>
          <span className="text-xs text-gray-500 mt-4">Weekly lectures scheduled</span>
        </div>

        <div className="bg-gray-850 p-6 rounded-xl border border-gray-800 flex flex-col justify-between hover:border-sky-500/50 transition duration-200">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-sky-400">Departments</span>
            <h3 className="text-3xl font-extrabold mt-2 text-white">{stats.departments}</h3>
          </div>
          <span className="text-xs text-gray-500 mt-4">Academic departments</span>
        </div>

        <div className="bg-gray-850 p-6 rounded-xl border border-gray-800 flex flex-col justify-between hover:border-lime-500/50 transition duration-200">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-lime-400">Classrooms</span>
            <h3 className="text-3xl font-extrabold mt-2 text-white">{stats.classrooms}</h3>
          </div>
          <span className="text-xs text-gray-500 mt-4">Configured lecture halls & labs</span>
        </div>
      </div>

      {/* System Status Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-850 border border-gray-800 p-6 rounded-xl lg:col-span-2 space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400">System Performance</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-900/60 p-4 rounded-lg border border-gray-800/80">
              <span className="text-xs text-gray-400 block">Database Latency</span>
              <span className="text-lg font-bold text-lime-400 mt-1 block">14 ms</span>
            </div>
            <div className="bg-gray-900/60 p-4 rounded-lg border border-gray-800/80">
              <span className="text-xs text-gray-400 block">FCM Alert Dispatch</span>
              <span className="text-lg font-bold text-sky-400 mt-1 block">99.8%</span>
            </div>
            <div className="bg-gray-900/60 p-4 rounded-lg border border-gray-800/80">
              <span className="text-xs text-gray-400 block">Cron Job Status</span>
              <span className="text-lg font-bold text-lime-400 mt-1 block">Active</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-850 border border-gray-800 p-6 rounded-xl space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400">Quick Actions</h4>
            <p className="text-xs text-gray-500 mt-1">Direct shortcut configurations.</p>
          </div>
          
          <div className="space-y-2.5">
            <button
              onClick={() => navigate('/admin/broadcast')}
              className="w-full py-2 bg-gray-800 hover:bg-gray-750 text-xs font-semibold rounded-md border border-gray-750 hover:border-sky-500/40 text-sky-300 transition text-center"
            >
              📢 Open Broadcast Center
            </button>
            <button
              onClick={() => navigate('/admin/groups')}
              className="w-full py-2 bg-gray-800 hover:bg-gray-750 text-xs font-semibold rounded-md border border-gray-750 hover:border-lime-500/40 text-lime-300 transition text-center"
            >
              🛠️ Manage Academic Groups
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
