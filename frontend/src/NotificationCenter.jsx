import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { API_URL } from './config';

export default function NotificationCenter() {
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('manar_token');
        const res = await axios.get(`${API_URL}/api/notifications/student`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.data && res.data.success) {
          setNotifications(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch student notifications:', err);
      }
    };

    fetchNotifications();

    const handleBroadcastReceive = () => {
      console.log('[NotificationCenter] Real-time notification receive triggered.');
      fetchNotifications();
    };

    window.addEventListener('MANAR_BROADCAST_RECEIVE', handleBroadcastReceive);
    window.addEventListener('MANAR_SCHEDULE_UPDATE', handleBroadcastReceive);
    return () => {
      window.removeEventListener('MANAR_BROADCAST_RECEIVE', handleBroadcastReceive);
      window.removeEventListener('MANAR_SCHEDULE_UPDATE', handleBroadcastReceive);
    };
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="flex-1 bg-transparent p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header */}
        <div>
          <h2 className="text-xl font-extrabold text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(to right, var(--accent), var(--accent-2, var(--accent)))' }}>
            {t('notifications.title')}
          </h2>
          <p className="text-xs text-gray-400 mt-1">{t('notifications.subtitle')}</p>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="bg-gray-900/30 backdrop-blur-md border border-white/10 rounded-2xl p-8 text-center text-gray-500 text-xs shadow-xl">
            {t('notifications.empty')}
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-3.5"
          >
            {notifications.map(notif => {
              const isGeneral = notif.groupId === null;
              return (
                <motion.div
                  variants={itemVariants}
                  key={notif.id}
                  className={`p-4 rounded-2xl border flex flex-col gap-2.5 transition duration-200 ${
                    isGeneral
                      ? 'bg-gray-900/20 backdrop-blur-md border-white/10 text-gray-200'
                      : 'bg-red-950/10 backdrop-blur-md border-red-500/20 text-red-200 shadow-md shadow-red-950/5'
                  }`}
                >
                  <div className="flex justify-between items-center text-[9px] font-bold">
                    <span className={`px-2 py-0.5 rounded uppercase ${
                      isGeneral ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {isGeneral ? t('notifications.broadcast') : t('notifications.emergency')}
                    </span>
                    
                    <span className="text-gray-500 font-mono">
                      {new Date(notif.sentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed font-medium">
                    {notif.message}
                  </p>
                  
                  <span className="text-[8px] text-gray-550 block text-right">
                    {new Date(notif.sentTime).toLocaleDateString()}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>
        )}

      </div>
    </div>
  );
}
