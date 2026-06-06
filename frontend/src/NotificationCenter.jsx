import React, { useState, useEffect } from 'react';

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    groupId: 1,
    groupName: 'Group A',
    message: 'تنبيه طارئ: تم تعديل محاضرة Database Systems الخاصة بـ Group A. يرجى مراجعة الجدول.',
    sentTime: new Date(Date.now() - 3600000).toISOString(),
    status: 'SENT'
  },
  {
    id: 3,
    groupId: null,
    groupName: 'All Groups',
    message: 'عاجل: يرجى العلم ببدء امتحانات منتصف الفصل الدراسي يوم الأحد القادم.',
    sentTime: new Date(Date.now() - 86400000).toISOString(),
    status: 'SENT'
  }
];

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [profile, setProfile] = useState({ groupId: 1 });

  useEffect(() => {
    // Read profile configuration to filter notifications
    const savedProfile = localStorage.getItem('student_profile');
    let studentGroupId = 1;
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setProfile(parsed);
        studentGroupId = parsed.groupId;
      } catch (e) {
        console.error(e);
      }
    }

    const loadNotifications = () => {
      const savedLogs = localStorage.getItem('manar_notifications');
      let allLogs = [];
      if (savedLogs) {
        try {
          allLogs = JSON.parse(savedLogs);
        } catch (e) {
          allLogs = MOCK_NOTIFICATIONS;
        }
      } else {
        allLogs = MOCK_NOTIFICATIONS;
        localStorage.setItem('manar_notifications', JSON.stringify(MOCK_NOTIFICATIONS));
      }
      
      // Filter logs to show matching group alerts or general broadcasts
      const filtered = allLogs.filter(log => log.groupId === null || log.groupId === studentGroupId);
      setNotifications(filtered);
    };

    loadNotifications();
  }, []);

  return (
    <div className="flex-1 bg-gray-900 text-gray-100 p-5 flex flex-col items-center">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header */}
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Notification Center</h2>
          <p className="text-xs text-gray-405 mt-1">Official broadcast notices, emergency reschedules, and alerts.</p>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications.map(notif => {
            const isGeneral = notif.groupId === null;
            return (
              <div
                key={notif.id}
                className={`p-4 rounded-xl border flex flex-col gap-2.5 transition ${
                  isGeneral
                    ? 'bg-gray-850/60 border-gray-800 text-gray-200'
                    : 'bg-red-950/10 border-red-900/40 text-red-200 shadow-md shadow-red-950/5'
                }`}
              >
                <div className="flex justify-between items-center text-[9px] font-bold">
                  <span className={`px-2 py-0.5 rounded uppercase ${
                    isGeneral ? 'bg-sky-900/30 text-sky-400 border border-sky-800/35' : 'bg-red-900/30 text-red-400 border border-red-800/35'
                  }`}>
                    {isGeneral ? 'Broadcast' : 'Emergency Alert'}
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
              </div>
            );
          })}

          {notifications.length === 0 && (
            <div className="bg-gray-850/40 border border-gray-800 rounded-xl p-8 text-center text-gray-500 text-xs">
              📭 Clean inbox! No notifications or schedule alerts active.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
