import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function SystemLog() {
  const [logs, setLogs] = useState([]);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('manar_token');
      const res = await axios.get('http://localhost:5000/api/admin/logs', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data && res.data.success) {
        setLogs(res.data.data.map(log => ({
          id: log.id,
          groupName: log.group ? log.group.name : 'All Groups',
          message: log.message,
          sentTime: log.sentTime,
          status: log.status
        })));
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleClearLogs = async () => {
    try {
      const token = localStorage.getItem('manar_token');
      await axios.delete('http://localhost:5000/api/admin/logs', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setLogs([]);
    } catch (err) {
      console.error('Failed to clear logs:', err);
    }
  };

  return (
    <div className="flex-1 bg-gray-900 text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Logs</h2>
          <p className="text-sm text-gray-400">Read-only audit trail of dispatched notifications and schedule exceptions.</p>
        </div>
        
        {logs.length > 0 && (
          <button
            onClick={handleClearLogs}
            className="px-3 py-1.5 bg-gray-800 hover:bg-red-900/30 hover:border-red-800/40 text-xs font-semibold text-red-400 border border-gray-700 rounded-md transition"
          >
            Clear Log History
          </button>
        )}
      </div>

      {/* Logs List */}
      <div className="bg-gray-850 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 bg-gray-900 border-b border-gray-800 flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-450">Active Audit Logs</span>
          <span className="text-[10px] bg-gray-800 border border-gray-700 px-2 py-0.5 rounded text-gray-400 font-mono font-bold">
            {logs.length} Actions Logged
          </span>
        </div>

        <div className="divide-y divide-gray-800/60 max-h-[500px] overflow-y-auto">
          {logs.map(log => (
            <div key={log.id} className="p-4 hover:bg-gray-800/5 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-1 sm:max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="bg-sky-950 text-sky-400 border border-sky-850 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                    {log.groupName || 'All Groups'}
                  </span>
                  <span className="text-gray-500 font-mono text-[10px]">
                    {new Date(log.sentTime).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-250 leading-relaxed font-medium mt-1.5">
                  {log.message}
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <span className={`h-2 w-2 rounded-full ${
                  log.status === 'SENT' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                }`} />
                <span className="font-bold text-[10px] tracking-wide text-gray-400 uppercase">
                  {log.status}
                </span>
              </div>
            </div>
          ))}

          {logs.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-sm">
              No system action or notification logs found in the audit trail.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
