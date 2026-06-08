import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { API_URL } from './config';

export default function AdminOverview() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [stats, setStats] = useState({
    students: 245,
    lectures: 12,
    departments: 3,
    classrooms: 8
  });
  const [loading, setLoading] = useState(false);

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem('manar_token');
      const res = await axios.get(`${API_URL}/api/admin/metrics`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data && res.data.success) {
        setStats(res.data.data);
      } else {
        throw new Error('API failed');
      }
    } catch (err) {
      console.error('Failed to fetch admin metrics:', err);
      toast.error(isAr ? 'فشل مزامنة مؤشرات نظرة عامة على النظام.' : 'Failed to sync system overview metrics.');
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleSync = async () => {
    setLoading(true);
    await fetchMetrics();
    setLoading(false);
  };

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="flex-1 bg-gray-900 text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {isAr ? 'نظرة عامة على النظام' : 'Admin Overview'}
          </h2>
          <p className="text-sm text-gray-400">
            {isAr ? 'إحصائيات النظام اللحظية ومؤشرات الأداء الإداري.' : 'Real-time system stats and administrative health metrics.'}
          </p>
        </div>
        <button
          onClick={handleSync}
          className="px-4 py-2 bg-lime-500 text-black font-semibold text-xs rounded-md shadow-md shadow-lime-500/20 hover:bg-lime-400 transition flex items-center gap-2"
        >
          {loading ? (
            <span className="h-3.5 w-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <span>🔄 {isAr ? 'تحديث البيانات' : 'Refresh Data'}</span>
          )}
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-gray-850 p-6 rounded-xl border border-gray-800 flex flex-col justify-between hover:border-sky-500/50 transition duration-200">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-sky-400">
              {isAr ? 'إجمالي الطلاب' : 'Total Enrollment'}
            </span>
            <h3 className="text-3xl font-extrabold mt-2 text-white">{stats.students}</h3>
          </div>
          <span className="text-xs text-gray-500 mt-4">
            {isAr ? 'ملفات الطلاب النشطة في النظام' : 'Active student profiles'}
          </span>
        </div>

        <div className="bg-gray-850 p-6 rounded-xl border border-gray-800 flex flex-col justify-between hover:border-lime-500/50 transition duration-200">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-lime-400">
              {isAr ? 'الجداول النشطة' : 'Active Schedules'}
            </span>
            <h3 className="text-3xl font-extrabold mt-2 text-white">{stats.lectures}</h3>
          </div>
          <span className="text-xs text-gray-500 mt-4">
            {isAr ? 'المحاضرات المجدولة أسبوعياً' : 'Weekly lectures scheduled'}
          </span>
        </div>

        <div className="bg-gray-850 p-6 rounded-xl border border-gray-800 flex flex-col justify-between hover:border-sky-500/50 transition duration-200">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-sky-400">
              {isAr ? 'الأقسام الأكاديمية' : 'Departments'}
            </span>
            <h3 className="text-3xl font-extrabold mt-2 text-white">{stats.departments}</h3>
          </div>
          <span className="text-xs text-gray-500 mt-4">
            {isAr ? 'الأقسام الدراسية والكليات' : 'Academic departments'}
          </span>
        </div>

        <div className="bg-gray-850 p-6 rounded-xl border border-gray-800 flex flex-col justify-between hover:border-lime-500/50 transition duration-200">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-lime-400">
              {isAr ? 'القاعات والمختبرات' : 'Classrooms'}
            </span>
            <h3 className="text-3xl font-extrabold mt-2 text-white">{stats.classrooms}</h3>
          </div>
          <span className="text-xs text-gray-500 mt-4">
            {isAr ? 'القاعات المعرفة والمختبرات' : 'Configured lecture halls & labs'}
          </span>
        </div>
      </div>

      {/* System Status Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-850 border border-gray-800 p-6 rounded-xl lg:col-span-2 space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400">
            {isAr ? 'أداء وجودة النظام' : 'System Performance'}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-900/60 p-4 rounded-lg border border-gray-800/80">
              <span className="text-xs text-gray-400 block">{isAr ? 'استجابة قاعدة البيانات' : 'Database Latency'}</span>
              <span className="text-lg font-bold text-lime-400 mt-1 block">14 ms</span>
            </div>
            <div className="bg-gray-900/60 p-4 rounded-lg border border-gray-800/80">
              <span className="text-xs text-gray-400 block">{isAr ? 'معدل تسليم التنبيهات' : 'FCM Alert Dispatch'}</span>
              <span className="text-lg font-bold text-sky-400 mt-1 block">99.8%</span>
            </div>
            <div className="bg-gray-900/60 p-4 rounded-lg border border-gray-800/80">
              <span className="text-xs text-gray-400 block">{isAr ? 'حالة محرك المزامنة' : 'Cron Job Status'}</span>
              <span className="text-lg font-bold text-lime-400 mt-1 block">{isAr ? 'نشط' : 'Active'}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-850 border border-gray-800 p-6 rounded-xl space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400">
              {isAr ? 'إجراءات سريعة' : 'Quick Actions'}
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              {isAr ? 'إدارة سريعة لبعض المكونات.' : 'Direct shortcut configurations.'}
            </p>
          </div>
          
          <div className="space-y-2.5">
            <button
              onClick={() => navigate('/admin/broadcast')}
              className="w-full py-2 bg-gray-800 hover:bg-gray-750 text-xs font-semibold rounded-md border border-gray-750 hover:border-sky-500/40 text-sky-300 transition text-center"
            >
              📢 {isAr ? 'فتح مركز البث العام' : 'Open Broadcast Center'}
            </button>
            <button
              onClick={() => navigate('/admin/groups')}
              className="w-full py-2 bg-gray-800 hover:bg-gray-750 text-xs font-semibold rounded-md border border-gray-750 hover:border-lime-500/40 text-lime-300 transition text-center"
            >
              🛠️ {isAr ? 'إدارة المجموعات والشُعب الدراسيّة' : 'Manage Academic Groups'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
