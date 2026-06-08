import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { API_URL } from './config';

export default function GodMode() {
  const [metrics, setMetrics] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchGodModeData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('manar_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [metricsRes, studentsRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/god-mode/metrics`, { headers }),
        axios.get(`${API_URL}/api/admin/god-mode/students`, { headers })
      ]);

      if (metricsRes.data?.success) setMetrics(metricsRes.data.data);
      if (studentsRes.data?.success) setStudents(studentsRes.data.data);
    } catch (err) {
      console.error('Failed to load God Mode data:', err);
      toast.error('Failed to fetch developer stats. Ensure you are logged in as Super Admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGodModeData();
  }, []);

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Are you absolutely sure you want to purge this student from the system? This action is irreversible.')) {
      return;
    }

    try {
      setDeletingId(studentId);
      const token = localStorage.getItem('manar_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.delete(`${API_URL}/api/admin/god-mode/students/${studentId}`, { headers });
      if (res.data?.success) {
        toast.success('Student account purged successfully.');
        setStudents(prev => prev.filter(s => s.id !== studentId));
        // Refresh metrics too
        const metricsRes = await axios.get(`${API_URL}/api/admin/god-mode/metrics`, { headers });
        if (metricsRes.data?.success) setMetrics(metricsRes.data.data);
      }
    } catch (err) {
      console.error('Purge error:', err);
      toast.error(err.response?.data?.error || 'Failed to purge student account.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px]">
        <div className="h-10 w-10 border-4 border-lime-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-gray-400 mt-4 tracking-widest uppercase font-bold">Synchronizing God Mode...</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto w-full"
    >
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900/40 via-violet-950/20 to-black border border-purple-500/35 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-purple-500/10 rounded-full blur-[60px]" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
          <div>
            <div className="inline-flex items-center gap-1 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full text-[10px] font-black text-purple-400 uppercase tracking-widest">
              👑 Developer Access
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white mt-2 tracking-tight">God Mode Dashboard</h1>
            <p className="text-xs text-gray-400 mt-1 max-w-lg leading-relaxed">
              Super Admin Control Panel. Purge spam accounts, audit registration flow, and view live system telemetry.
            </p>
          </div>
          <button
            onClick={fetchGodModeData}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-purple-500/10 transition-all duration-200"
          >
            🔄 Refresh Metrics
          </button>
        </div>
      </div>

      {/* Metrics Section */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Total Students */}
          <div className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-xl flex items-center gap-4 relative overflow-hidden">
            <div className="p-4 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/25">
              🎓
            </div>
            <div>
              <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider">Total Registered</span>
              <h3 className="text-3xl font-black text-white mt-1">{metrics.totalStudents}</h3>
            </div>
          </div>

          {/* Card 2: Majors Breakdown */}
          <div className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <span className="text-lime-400">📊</span>
              <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Students by Major</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {metrics.studentsByMajor.map((m, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-gray-300 truncate max-w-[180px]">{m.name}</span>
                  <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-gray-400">
                    {m.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Levels Breakdown */}
          <div className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <span className="text-sky-400">📈</span>
              <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Students by Level</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {metrics.studentsByLevel.map((l, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-gray-300">{l.name}</span>
                  <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-gray-400">
                    {l.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Students Directory List */}
      <div className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-white">System Directory</h2>
            <p className="text-xs text-gray-500 mt-0.5">Manage and purge student credentials and verify registration logs.</p>
          </div>
          <span className="text-[10px] bg-white/5 border border-white/10 text-gray-300 font-bold px-2 py-0.5 rounded-full">
            {students.length} Total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-white/2 text-[10px] text-gray-400 uppercase font-black tracking-wider">
                <th className="p-4">ID</th>
                <th className="p-4">Name</th>
                <th className="p-4">Email / Phone</th>
                <th className="p-4">Major</th>
                <th className="p-4">Group</th>
                <th className="p-4">Registration Time</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-b border-white/5 hover:bg-white/2 transition">
                  <td className="p-4 font-mono font-bold text-gray-400">#{student.id}</td>
                  <td className="p-4">
                    <div className="font-extrabold text-white">{student.name}</div>
                    <div className="text-[10px] text-gray-500 font-mono mt-0.5">{student.idNumber}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-gray-300">{student.email}</div>
                    <div className="text-[10px] text-gray-500 font-mono mt-0.5">{student.phone}</div>
                  </td>
                  <td className="p-4 text-gray-300 font-medium">{student.major?.name || 'N/A'}</td>
                  <td className="p-4">
                    <span className="bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded text-[10px] font-bold text-purple-400">
                      {student.group?.name || 'N/A'}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400 font-mono">
                    {student.createdAt ? new Date(student.createdAt).toLocaleString() : 'N/A'}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleDeleteStudent(student.id)}
                      disabled={deletingId === student.id}
                      className="px-2.5 py-1 bg-red-650/15 hover:bg-red-650 border border-red-500/30 text-red-400 hover:text-white font-extrabold text-[10px] rounded-lg transition"
                    >
                      {deletingId === student.id ? 'Purging...' : '🗑️ Delete'}
                    </button>
                  </td>
                </tr>
              ))}

              {students.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500 text-xs">
                    No student registrations found.
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
