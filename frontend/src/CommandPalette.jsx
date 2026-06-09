import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from './config';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [schedules, setSchedules] = useState([]);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Global key listener for Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch all schedules for quick indexing on open
  useEffect(() => {
    if (isOpen) {
      const fetchIndex = async () => {
        try {
          const res = await axios.get(`${API_URL}/api/schedules`);
          if (res.data && res.data.success) {
            setSchedules(res.data.data);
          }
        } catch (e) {
          console.error('Command Palette fetch error:', e);
        }
      };
      fetchIndex();
      // Auto-focus input
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Handle action triggers
  const handleAction = (action) => {
    setIsOpen(false);
    if (typeof action === 'function') {
      action();
    } else if (typeof action === 'string') {
      if (action.startsWith('/')) {
        navigate(action);
      } else if (action === 'print') {
        window.print();
      }
    }
  };

  // Navigational shortcuts
  const navigationItems = [
    { name: '📖 دليل المستخدم / Instructions', subtitle: 'كيفية استخدام المنار خطوة بخطوة', action: '/instructions' },
    { name: '⚙️ الذهاب إلى الإعدادات', subtitle: 'تعديل الملف الشخصي والخيارات', action: '/settings' },
    { name: '📅 عرض جدول المحاضرات الأسبوعي', subtitle: 'الانتقال إلى لوحة العرض الرئيسية', action: '/' },
    { name: '🖨️ تصدير / طباعة الجدول الدراسي', subtitle: 'تحميل ملف PDF أو إرسال للطابعة', action: 'print' },
    { name: '🎨 تغيير مظهر التطبيق (Theme)', subtitle: 'التبديل بين الثيمات المتاحة', action: '/settings' },
    { name: '👑 God Mode — لوحة المطور', subtitle: 'صلاحيات المسؤول الخارق (SUPER_ADMIN فقط)', action: '/admin/god-mode' },
    { name: '⌨️ Dev Portal — بيئة التطوير', subtitle: 'التيرمنال الداخلي ومقاييس النظام', action: '/admin/dev-portal' },
    { 
      name: '🚪 تسجيل الخروج من الحساب', 
      subtitle: 'إنهاء الجلسة الحالية', 
      action: () => { 
        localStorage.removeItem('manar_token');
        localStorage.removeItem('manar_user');
        navigate('/login');
      } 
    }
  ];

  // Filter schedules and static navigation
  const filteredNav = navigationItems.filter(item => 
    item.name.toLowerCase().includes(query.toLowerCase()) || 
    item.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  const filteredSchedules = schedules.filter(s => 
    s.subject.name.toLowerCase().includes(query.toLowerCase()) ||
    s.subject.code.toLowerCase().includes(query.toLowerCase()) ||
    s.lecturerName.toLowerCase().includes(query.toLowerCase()) ||
    s.room.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] px-4">
          {/* Backdrop overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Dialog Body */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -20 }}
            className="w-full max-w-lg frosted-panel rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col text-right"
            dir="rtl"
          >
            {/* Search Input area */}
            <div className="p-4 border-b border-white/5 flex items-center gap-3">
              <span className="text-gray-400 text-lg">🔍</span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث عن محاضرة، قاعة، مدرس، أو إجراء سريع..."
                className="w-full bg-transparent border-0 text-white text-sm focus:outline-none focus:ring-0 placeholder-gray-500 font-sans"
              />
              <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-1 rounded border border-white/5 font-mono font-bold leading-none">ESC</span>
            </div>

            {/* Results Scroll Area */}
            <div className="max-h-[350px] overflow-y-auto p-2 space-y-4">
              
              {/* Navigation Shortcuts Section */}
              {filteredNav.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-500 font-bold px-2 uppercase tracking-wider">إجراءات سريعة</span>
                  {filteredNav.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAction(item.action)}
                      className="w-full text-right p-2.5 rounded-xl hover:bg-white/5 transition flex flex-col group"
                    >
                      <span className="text-xs font-bold text-white group-hover:text-lime-400 transition">{item.name}</span>
                      <span className="text-[10px] text-gray-400 mt-0.5">{item.subtitle}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Indexed Lectures Section */}
              {filteredSchedules.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-500 font-bold px-2 uppercase tracking-wider">المحاضرات المجدولة</span>
                  {filteredSchedules.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleAction('/')}
                      className="w-full text-right p-2.5 rounded-xl hover:bg-white/5 transition flex justify-between items-center group"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white group-hover:text-lime-400 transition">{s.subject.name} ({s.subject.code})</span>
                        <span className="text-[10px] text-gray-400 mt-0.5">مع د. {s.lecturerName} في {s.room.name}</span>
                      </div>
                      <div className="text-left">
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-white/5 text-gray-300 font-mono">
                          {s.dayOfWeek} {s.startTime}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {filteredNav.length === 0 && filteredSchedules.length === 0 && (
                <div className="text-center py-6 text-xs text-gray-500 font-medium">
                  لا توجد نتائج تطابق بحثك...
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="p-3 bg-black/20 border-t border-white/5 flex justify-between items-center text-[10px] text-gray-500">
              <span>اضغط على أي خيار للتنفيذ الفوري</span>
              <span className="font-semibold text-gray-450">مساعد المنار الذكي 💡</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
