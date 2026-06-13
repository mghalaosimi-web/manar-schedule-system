import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from './config';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export default function SuperAdminDashboard() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  
  const [activeTab, setActiveTab] = useState('university'); // 'university' or 'college'
  const [universities, setUniversities] = useState([]);
  
  // University Form
  const [uniName, setUniName] = useState('');
  const [uniSlug, setUniSlug] = useState('');
  const [uniThemeColor, setUniThemeColor] = useState('#3b82f6');
  const [uniLogoUrl, setUniLogoUrl] = useState('');
  
  // College Form
  const [colName, setColName] = useState('');
  const [colSlug, setColSlug] = useState('');
  const [colLocation, setColLocation] = useState('');
  const [colUniId, setColUniId] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUniversities();
  }, []);

  const fetchUniversities = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/tenants`);
      if (res.data.success) {
        setUniversities(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateUniversity = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('manar_token');
      await axios.post(`${API_URL}/api/admin/universities`, {
        name: uniName,
        slug: uniSlug,
        themeColor: uniThemeColor,
        logoUrl: uniLogoUrl
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(isAr ? 'تمت إضافة الجامعة بنجاح' : 'University added successfully');
      setUniName('');
      setUniSlug('');
      setUniLogoUrl('');
      fetchUniversities();
    } catch (err) {
      toast.error(err.response?.data?.error || (isAr ? 'فشل في إضافة الجامعة' : 'Failed to add university'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollege = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('manar_token');
      await axios.post(`${API_URL}/api/admin/colleges`, {
        name: colName,
        slug: colSlug,
        location: colLocation,
        universityId: colUniId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(isAr ? 'تمت إضافة الكلية بنجاح' : 'College added successfully');
      setColName('');
      setColSlug('');
      setColLocation('');
    } catch (err) {
      toast.error(err.response?.data?.error || (isAr ? 'فشل في إضافة الكلية' : 'Failed to add college'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto font-urbanist w-full">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-black mb-2 flex items-center gap-3">
          <span className="text-[var(--accent)]">👑</span>
          {isAr ? 'إدارة المستأجرين (Tenants)' : 'Tenant Management'}
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          {isAr ? 'إضافة جامعات وكليات جديدة لتظهر فوراً في بوابة الدخول.' : 'Add new universities and colleges to appear instantly in the gateway.'}
        </p>
      </motion.div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('university')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all ${
            activeTab === 'university' 
              ? 'bg-[var(--accent-dim)] border-[var(--accent)] text-[var(--accent)]' 
              : 'bg-white/5 border-white/10 hover:bg-white/10'
          }`}
        >
          {isAr ? 'إضافة جامعة جديدة' : 'Add New University'}
        </button>
        <button
          onClick={() => setActiveTab('college')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all ${
            activeTab === 'college' 
              ? 'bg-[var(--accent-dim)] border-[var(--accent)] text-[var(--accent)]' 
              : 'bg-white/5 border-white/10 hover:bg-white/10'
          }`}
        >
          {isAr ? 'إضافة كلية لجامعة' : 'Add College to University'}
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        {activeTab === 'university' && (
          <form onSubmit={handleCreateUniversity} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">
                  {isAr ? 'اسم الجامعة' : 'University Name'}
                </label>
                <input 
                  type="text" required value={uniName} onChange={(e) => setUniName(e.target.value)}
                  className="cmd-input w-full" placeholder={isAr ? 'مثال: جامعة حجة' : 'e.g., Hajjah University'}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">
                  {isAr ? 'الرابط التعريفي (Slug)' : 'Slug (Unique)'}
                </label>
                <input 
                  type="text" required value={uniSlug} onChange={(e) => setUniSlug(e.target.value)}
                  className="cmd-input w-full" placeholder="e.g., hajjah-university"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">
                  {isAr ? 'رابط الشعار (Logo URL)' : 'Logo URL'}
                </label>
                <input 
                  type="text" value={uniLogoUrl} onChange={(e) => setUniLogoUrl(e.target.value)}
                  className="cmd-input w-full" placeholder="e.g., /hajjah-logo.png"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">
                  {isAr ? 'لون الهوية البصرية (Theme Color)' : 'Theme Color'}
                </label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" value={uniThemeColor} onChange={(e) => setUniThemeColor(e.target.value)}
                    className="w-12 h-12 rounded cursor-pointer border border-white/20 bg-transparent p-1"
                  />
                  <span className="text-sm font-mono text-white/70">{uniThemeColor}</span>
                </div>
              </div>
            </div>
            
            <button type="submit" disabled={loading} className="btn-neon w-full py-3 mt-4">
              {loading ? '...' : (isAr ? 'إنشاء جامعة' : 'Create University')}
            </button>
          </form>
        )}

        {activeTab === 'college' && (
          <form onSubmit={handleCreateCollege} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">
                  {isAr ? 'الجامعة التابعة' : 'Parent University'}
                </label>
                <select 
                  required value={colUniId} onChange={(e) => setColUniId(e.target.value)}
                  className="cmd-input w-full"
                >
                  <option value="" disabled>{isAr ? 'اختر الجامعة...' : 'Select university...'}</option>
                  {universities.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">
                  {isAr ? 'اسم الكلية' : 'College Name'}
                </label>
                <input 
                  type="text" required value={colName} onChange={(e) => setColName(e.target.value)}
                  className="cmd-input w-full" placeholder={isAr ? 'مثال: كلية الطب' : 'e.g., Faculty of Medicine'}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">
                  {isAr ? 'الرابط التعريفي (Slug)' : 'Slug (Unique)'}
                </label>
                <input 
                  type="text" required value={colSlug} onChange={(e) => setColSlug(e.target.value)}
                  className="cmd-input w-full" placeholder="e.g., hajjah-medicine"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">
                  {isAr ? 'الموقع الجغرافي (اختياري)' : 'Location (Optional)'}
                </label>
                <input 
                  type="text" value={colLocation} onChange={(e) => setColLocation(e.target.value)}
                  className="cmd-input w-full" placeholder="e.g., Main Campus"
                />
              </div>
            </div>
            
            <button type="submit" disabled={loading} className="btn-neon w-full py-3 mt-4">
              {loading ? '...' : (isAr ? 'إنشاء كلية' : 'Create College')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
