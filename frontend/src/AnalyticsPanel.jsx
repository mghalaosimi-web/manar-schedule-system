import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from './config';

export default function AnalyticsPanel() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const token = localStorage.getItem('manar_token');
        const res = await axios.get(`${API_URL}/api/admin/god-mode/metrics`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.data && res.data.success) {
          setMetrics(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="frosted-panel rounded-2xl p-6 flex flex-col items-center justify-center h-80 space-y-3">
        <div className="h-8 w-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-gray-400">جاري تحميل لوحة الإحصائيات...</span>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="frosted-panel rounded-2xl p-6 text-center text-gray-400 text-xs">
        فشل تحميل البيانات الإحصائية. يرجى التحقق من اتصال قاعدة البيانات.
      </div>
    );
  }

  // Find max count for scaling bar charts
  const maxMajorCount = Math.max(...metrics.studentsByMajor.map(m => m.count), 1);
  
  // Calculate Pie Chart portions for Level distribution
  const totalStudents = metrics.totalStudents || 0;
  let accumulatedAngle = 0;

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 text-right" dir="rtl">
      
      {/* Metric Card: Total Students */}
      <div className="frosted-panel rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/5 rounded-full blur-2xl group-hover:bg-[var(--accent)]/10 transition-all duration-500" />
        <div>
          <span className="text-gray-450 text-[11px] font-bold uppercase tracking-wider block">إجمالي الطلاب المسجلين</span>
          <h3 className="text-4xl font-extrabold text-white mt-3 tracking-tight">
            {totalStudents} <span className="text-xs text-gray-400 font-normal">طالب</span>
          </h3>
        </div>
        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[11px]">
          <span className="text-gray-500">حالة قاعدة البيانات:</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> متصل
          </span>
        </div>
      </div>

      {/* SVG Bar Chart: Students by Major */}
      <div className="frosted-panel rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <span className="text-gray-455 text-[11px] font-bold uppercase tracking-wider block mb-4">توزيع الطلاب حسب التخصص</span>
          <div className="space-y-4">
            {metrics.studentsByMajor.map(m => {
              const pct = (m.count / maxMajorCount) * 100;
              return (
                <div key={m.name} className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-gray-300">{m.name}</span>
                    <span className="text-[var(--accent)] font-mono">{m.count} طالب</span>
                  </div>
                  <div className="h-2 w-full bg-gray-950 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${pct}%` }} 
                      className="h-full bg-gradient-to-l from-[var(--accent)] to-[var(--accent-2,var(--accent))] rounded-full transition-all duration-1000 ease-out" 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SVG Ring Chart: Students by Level */}
      <div className="frosted-panel rounded-2xl p-6 flex flex-col justify-between items-center">
        <div className="w-full text-right">
          <span className="text-gray-455 text-[11px] font-bold uppercase tracking-wider block mb-2">توزيع الطلاب حسب المستوى الدراسي</span>
        </div>
        
        {totalStudents === 0 ? (
          <div className="text-xs text-gray-500 my-auto">لا يوجد طلاب كافيين لعرض المخطط.</div>
        ) : (
          <div className="flex items-center justify-between w-full my-auto">
            {/* Level breakdown list */}
            <div className="space-y-2 text-right">
              {metrics.studentsByLevel.map((l, index) => {
                const colors = ['bg-[var(--accent)]', 'bg-emerald-500', 'bg-blue-500', 'bg-purple-500'];
                return (
                  <div key={l.name} className="flex items-center gap-2 text-[10px] font-semibold text-gray-300">
                    <span className={`w-2 h-2 rounded-full ${colors[index % colors.length]}`} />
                    <span>{l.name}:</span>
                    <span className="text-white font-bold font-mono">{l.count}</span>
                  </div>
                );
              })}
            </div>
 
            {/* Circular Ring Chart */}
            <div className="relative w-24 h-24">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
                {metrics.studentsByLevel.map((l, index) => {
                  const strokeColors = ['var(--accent)', '#10b981', '#3b82f6', '#a855f7'];
                  const pct = (l.count / totalStudents) * 100;
                  const strokeDash = `${pct} ${100 - pct}`;
                  const offset = 100 - accumulatedAngle;
                  accumulatedAngle += pct;
                  
                  return (
                    <circle
                      key={l.name}
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke={strokeColors[index % strokeColors.length]}
                      strokeWidth="3.2"
                      strokeDasharray={strokeDash}
                      strokeDashoffset={offset}
                      className="transition-all duration-1000 ease-out"
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[10px] font-bold text-gray-400">
                <span>المستويات</span>
                <span className="text-white font-mono">{metrics.studentsByLevel.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
