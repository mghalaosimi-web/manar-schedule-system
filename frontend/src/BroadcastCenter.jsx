import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from './config';

export default function BroadcastCenter() {
  const [target, setTarget] = useState('ALL');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentStatus, setSentStatus] = useState(null);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/groups`);
        if (res.data && res.data.success) {
          setGroups(res.data.data);
        } else {
          throw new Error('API failed');
        }
      } catch (err) {
        console.error('Error fetching groups for broadcast target:', err);
        toast.error('Failed to load target academic groups.');
      }
    };
    fetchGroups();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setSentStatus(null);

    const token = localStorage.getItem('manar_token');
    try {
      const res = await axios.post(`${API_URL}/api/broadcasts`, {
        groupId: target,
        message: message
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (res.data && res.data.success) {
        setMessage('');
        const targetLabel = target === 'ALL' ? 'All Students' : (groups.find(g => g.id.toString() === target.toString())?.name || 'Selected Group');
        const successMsg = `Alert broadcasted successfully to ${targetLabel}!`;
        setSentStatus({ success: true, message: successMsg });
        toast.success(successMsg);
        setTimeout(() => setSentStatus(null), 5000);
      } else {
        throw new Error('API failed');
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Failed to dispatch broadcast logs.';
      setSentStatus({ success: false, message: errMsg });
      toast.error(errMsg);
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
              <option value="ALL" className="bg-gray-900 text-white">
                All Students (General Broadcast)
              </option>
              {groups.map(g => (
                <option key={g.id} value={g.id} className="bg-gray-900 text-white">
                  {g.name}
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
