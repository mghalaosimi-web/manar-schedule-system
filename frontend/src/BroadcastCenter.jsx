import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { API_URL } from './config';

export default function BroadcastCenter() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

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
        toast.error(isAr ? 'فشل في تحميل المجموعات الأكاديمية المستهدفة.' : 'Failed to load target academic groups.');
      }
    };
    fetchGroups();
  }, [isAr]);

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
        const targetLabel = target === 'ALL' 
          ? (isAr ? 'جميع الطلاب' : 'All Students') 
          : (groups.find(g => g.id.toString() === target.toString())?.name || 'Selected Group');
        
        const successMsg = t('broadcast.successMsg', { target: targetLabel });
        setSentStatus({ success: true, message: successMsg });
        toast.success(successMsg);
        setTimeout(() => setSentStatus(null), 5000);
      } else {
        throw new Error('API failed');
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || t('broadcast.failMsg');
      setSentStatus({ success: false, message: errMsg });
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      dir={isAr ? 'rtl' : 'ltr'}
      className="flex-1 bg-transparent p-4 md:p-8 space-y-6 text-[var(--text-primary)]"
    >
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-emerald-400">
          {t('broadcast.title')}
        </h2>
        <p className="text-sm text-gray-400 mt-1">{t('broadcast.subtitle')}</p>
      </div>

      {/* Broadcast Form */}
      <div className="max-w-2xl frosted-panel rounded-2xl p-6 space-y-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-lime-400 border-b border-white/5 pb-3">
          📢 {t('broadcast.composeTitle')}
        </h3>

        {sentStatus && (
          <div className={`p-4 rounded-xl text-xs font-semibold border ${
            sentStatus.success ? 'bg-green-950/40 border-green-600/50 text-green-200' : 'bg-red-950/40 border-red-650/50 text-red-200'
          }`}>
            {sentStatus.message}
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-4 text-xs">
          {/* Target Group Selector */}
          <div className="space-y-1">
            <label className="text-gray-400 block font-medium">{t('broadcast.targetLabel')}</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full cmd-input p-3 font-bold cursor-pointer"
            >
              <option value="ALL" className="bg-[#0c0c0c] text-white">
                {t('broadcast.targetAll')}
              </option>
              {groups.map(g => (
                <option key={g.id} value={g.id} className="bg-[#0c0c0c] text-white">
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Alert Message Box */}
          <div className="space-y-1">
            <label className="text-gray-400 block font-medium">{t('broadcast.messageLabel')}</label>
            <textarea
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('broadcast.messagePlaceholder')}
              className="w-full cmd-input p-3 leading-relaxed text-xs"
            />
            <p className="text-[10px] text-gray-500 mt-1">{t('broadcast.messageDesc')}</p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 btn-neon text-xs font-extrabold flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>🚀 {t('broadcast.sendBtn')}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
