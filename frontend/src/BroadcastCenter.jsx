import React, { useState } from 'react';
import axios from 'axios';

const TARGET_OPTIONS = [
  { id: 'ALL', label: 'All Students (General Broadcast)' },
  { id: '1', label: 'Group A (Software Engineering)' },
  { id: '2', label: 'Group B (Computer Science)' },
  { id: '3', label: 'Group C (Information Systems)' }
];

export default function BroadcastCenter() {
  const [target, setTarget] = useState('ALL');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentStatus, setSentStatus] = useState(null);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setSentStatus(null);

    const logEntry = {
      id: Date.now(),
      studentId: null,
      groupId: target === 'ALL' ? null : parseInt(target),
      groupName: target === 'ALL' ? 'All Groups' : (target === '1' ? 'Group A' : (target === '2' ? 'Group B' : 'Group C')),
      message: message,
      sentTime: new Date().toISOString(),
      status: 'SENT'
    };

    // Save to simulated localStorage database
    try {
      const savedLogs = localStorage.getItem('manar_notifications');
      const currentLogs = savedLogs ? JSON.parse(savedLogs) : [];
      localStorage.setItem('manar_notifications', JSON.stringify([logEntry, ...currentLogs]));

      // Clear input fields and notify
      setMessage('');
      setSentStatus({ success: true, message: `Alert broadcasted successfully to ${logEntry.groupName}!` });
      setTimeout(() => setSentStatus(null), 5000);
    } catch (err) {
      setSentStatus({ success: false, message: 'Failed to dispatch broadcast logs.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-gray-900 text-white p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Broadcast Center</h2>
        <p className="text-sm text-gray-400">Send instant push alerts and schedule notices to targeted academic groups.</p>
      </div>

      {/* Broadcast Form */}
      <div className="max-w-2xl bg-gray-850 border border-gray-800 rounded-xl p-6 shadow-xl space-y-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-lime-400 border-b border-gray-800 pb-3">
          📢 Compose Targeted Broadcast
        </h3>

        {sentStatus && (
          <div className={`p-4 rounded-lg text-xs font-semibold border ${
            sentStatus.success ? 'bg-green-950/40 border-green-600/50 text-green-200' : 'bg-red-950/40 border-red-650/50 text-red-200'
          }`}>
            {sentStatus.message}
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-4 text-xs">
          {/* Target Selector */}
          <div className="space-y-1">
            <label className="text-gray-400 block font-medium">Select Target Group</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full bg-gray-900 border border-gray-750 rounded p-2.5 text-white font-bold focus:outline-none focus:border-lime-500"
            >
              {TARGET_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id} className="bg-gray-900 text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Alert Message Box */}
          <div className="space-y-1">
            <label className="text-gray-400 block font-medium">Alert Message</label>
            <textarea
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Please note that the Database Systems lab scheduled for tomorrow will be held in Lab 2 instead of Lab 5."
              className="w-full bg-gray-900 border border-gray-750 rounded p-2.5 text-white focus:outline-none focus:border-lime-500 text-xs leading-relaxed"
            />
            <p className="text-[10px] text-gray-500">This alert will trigger immediate SMS, Email, and Push notifications to the selected group.</p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-lime-500 hover:bg-lime-400 text-black font-extrabold rounded-md shadow-lg shadow-lime-500/15 transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>🚀 Send Emergency Alert Notice</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
