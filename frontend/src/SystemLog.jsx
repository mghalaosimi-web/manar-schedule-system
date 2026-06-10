import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { API_URL } from './config';

export default function SystemLog() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [logs, setLogs] = useState([]);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('manar_token');
      const res = await axios.get(`${API_URL}/api/admin/logs`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data && res.data.success) {
        setLogs(res.data.data.map(log => ({
          id: log.id,
          groupName: log.group ? log.group.name : (isAr ? 'جميع المجموعات' : 'All Groups'),
          message: log.message,
          sentTime: log.sentTime,
          status: log.status
        })));
      } else {
        throw new Error('API failed');
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      toast.error(isAr ? 'فشل في تحميل سجلات التدقيق للنظام.' : 'Failed to fetch system logs directory.');
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [isAr]);

  const handleClearLogs = async () => {
    if (!window.confirm(isAr ? 'هل أنت متأكد من رغبتك في مسح جميع سجلات النظام؟' : 'Are you sure you want to clear all audit logs?')) return;
    try {
      const token = localStorage.getItem('manar_token');
      const res = await axios.delete(`${API_URL}/api/admin/logs`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data && res.data.success) {
        setLogs([]);
        toast.success(isAr ? 'تم مسح سجل التدقيق بنجاح.' : 'All system logs cleared successfully.');
      } else {
        throw new Error('API failed');
      }
    } catch (err) {
      console.error('Failed to clear logs:', err);
      const errMsg = err.response?.data?.error || (isAr ? 'فشل مسح السجلات.' : 'Failed to clear system logs.');
      toast.error(errMsg);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-emerald-400">
            {t('logs.title')}
          </h2>
          <p className="text-sm text-gray-400 mt-1">{t('logs.subtitle')}</p>
        </div>
        
        {logs.length > 0 && (
          <button
            onClick={handleClearLogs}
            className="px-4 py-2 text-xs font-bold rounded-lg transition-colors border border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/45"
          >
            {t('logs.clearBtn')}
          </button>
        )}
      </div>

      {/* Logs List */}
      <div className="frosted-panel rounded-2xl overflow-hidden">
        <div 
          className="p-4 bg-white/[0.015] border-b flex justify-between items-center" 
          style={{ borderColor: 'var(--border-color)' }}
        >
          <span className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
            {t('logs.activeLogs')}
          </span>
          <span className="text-[10px] bg-[var(--accent-dim)] border border-[var(--accent)]/15 px-2.5 py-1 rounded text-[var(--accent)] font-mono font-bold">
            {logs.length} {t('logs.actionsCount')}
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-xs leading-relaxed font-semibold">
            {t('logs.empty')}
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="divide-y max-h-[550px] overflow-y-auto"
            style={{ borderColor: 'var(--border-color)' }}
          >
            {logs.map(log => (
              <motion.div 
                variants={itemVariants}
                key={log.id} 
                className="p-4 hover:bg-white/[0.01] transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <div className="space-y-1 sm:max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="bg-[var(--accent-dim)] text-[var(--accent)] border border-[var(--accent)]/15 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                      {log.groupName}
                    </span>
                    <span className="text-gray-500 font-mono text-[10px]">
                      {new Date(log.sentTime).toLocaleString(isAr ? 'ar-SA' : 'en-US')}
                    </span>
                  </div>
                  <p className="text-gray-200 leading-relaxed font-semibold mt-1.5">
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
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
