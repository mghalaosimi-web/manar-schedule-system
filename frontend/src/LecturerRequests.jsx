import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { API_URL } from './config';

const DAYS_AR = {
  SUNDAY: 'الأحد',
  MONDAY: 'الإثنين',
  TUESDAY: 'الثلاثاء',
  WEDNESDAY: 'الأربعاء',
  THURSDAY: 'الخميس',
  FRIDAY: 'الجمعة',
  SATURDAY: 'السبت'
};

export default function LecturerRequests() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('manar_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API_URL}/api/lecturer/requests`, { headers });
      if (res.data?.success) {
        setRequests(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error(isAr ? 'فشل تحميل الطلبات' : 'Failed to load requests log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-amber-400 border border-amber-500/20 bg-amber-500/5 rounded-lg">
            ⏳ {isAr ? 'قيد الانتظار' : 'Pending'}
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 rounded-lg">
            ✅ {isAr ? 'تمت الموافقة' : 'Approved'}
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-rose-400 border border-rose-500/20 bg-rose-500/5 rounded-lg">
            ❌ {isAr ? 'تم الرفض' : 'Rejected'}
          </span>
        );
      default:
        return status;
    }
  };

  return (
    <div className="p-4 space-y-6">
      
      {/* ── Page Header ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)]">
          📝 {isAr ? 'سجل الإجراءات والتغييرات' : 'Override & Rescheduling Logs'}
        </p>
        <h2 className="text-xl font-black text-white leading-tight">
          {isAr ? 'طلباتي السابقة' : 'My Requests Log'}
        </h2>
        <p className="text-xs text-[var(--text-secondary)]">
          {isAr ? 'متابعة حالة الطلبات المقدمة للتعديل أو إلغاء المحاضرات' : 'Monitor state updates for your submitted overrides'}
        </p>
      </motion.div>

      {/* ── Requests list ──────────────────────────────────────── */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="frosted-panel p-5 rounded-2xl animate-pulse space-y-3">
                <div className="h-4 bg-white/5 rounded w-1/3" />
                <div className="h-3 bg-white/5 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : requests.length > 0 ? (
          <div className="space-y-3">
            {requests.map((req, idx) => {
              const target = req.schedule;
              const isReschedule = req.requestType === 'RESCHEDULE';
              
              return (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="frosted-panel p-5 rounded-2xl space-y-4 border-white/8 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-extrabold text-xs text-white uppercase tracking-wider">
                        {isReschedule ? (isAr ? '🔄 طلب إعادة جدولة' : '🔄 Reschedule Request') : (isAr ? '🚫 طلب إلغاء محاضرة' : '🚫 Cancel Request')}
                      </h4>
                      <p className="text-xs font-bold text-[var(--text-secondary)] mt-1">
                        {target.subject.name} ({target.group.name})
                      </p>
                    </div>
                    <div className="shrink-0">
                      {getStatusBadge(req.status)}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/5 text-xs text-[var(--text-secondary)]">
                    {/* Original Time & Room */}
                    <div className="flex items-start gap-1">
                      <span className="font-extrabold text-white shrink-0">{isAr ? 'الجدول الأصلي:' : 'Original:'}</span>
                      <span>
                        {isAr ? DAYS_AR[target.dayOfWeek] : target.dayOfWeek} · {target.startTime} - {target.endTime} · {target.room.name}
                      </span>
                    </div>

                    {/* Proposed changes if reschedule */}
                    {isReschedule && (
                      <div className="flex items-start gap-1">
                        <span className="font-extrabold text-[var(--accent)] shrink-0">{isAr ? 'الجدول المقترح:' : 'Proposed:'}</span>
                        <span className="text-[var(--accent)] font-bold">
                          {isAr ? DAYS_AR[req.newDayOfWeek] : req.newDayOfWeek} · {req.newStartTime} - {req.newEndTime} · {req.newRoom?.name || (isAr ? 'قاعة محددة' : 'Room')}
                        </span>
                      </div>
                    )}

                    {/* Reason */}
                    {req.reason && (
                      <div className="flex items-start gap-1">
                        <span className="font-extrabold text-white shrink-0">{isAr ? 'سبب الطلب:' : 'Reason:'}</span>
                        <span>{req.reason}</span>
                      </div>
                    )}

                    {/* Admin notes if any */}
                    {req.adminNotes && (
                      <div className="mt-3 p-3 rounded-xl bg-white/2 border border-white/5 space-y-1">
                        <p className="text-[10px] font-black text-white uppercase tracking-wider">
                          💬 {isAr ? 'رد إدارة الكلية:' : 'Admin Reply:'}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] italic">
                          {req.adminNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="frosted-panel p-8 text-center rounded-2xl text-[var(--text-secondary)] space-y-2">
            <span className="text-3xl block">📋</span>
            <p className="text-xs font-bold">
              {isAr ? 'لم تقدم أي طلبات تعديل حتى الآن' : 'You have not submitted any reschedule requests.'}
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
