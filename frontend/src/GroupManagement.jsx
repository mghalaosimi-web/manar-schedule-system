import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from './config';

export default function GroupManagement() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [activeTab, setActiveTab] = useState('groups');
  const [groups, setGroups] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [lecturers, setLecturers] = useState([
    { id: 1, name: 'Dr. Ahmad Masri', email: 'ahmad@manar.edu' },
    { id: 2, name: 'Eng. Sarah Taji', email: 'sarah@manar.edu' },
    { id: 3, name: 'Dr. Manar Al-Saeed', email: 'manar@manar.edu' }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formState, setFormState] = useState({});

  const fetchGroups = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/groups`);
      if (res.data && res.data.success) {
        setGroups(res.data.data);
      } else {
        throw new Error('API failed');
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
      toast.error(isAr ? 'فشل تحميل قائمة الشعب الدراسية.' : 'Failed to load groups. Check database connection.');
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/rooms`);
      if (res.data && res.data.success) {
        setRooms(res.data.data);
      } else {
        throw new Error('API failed');
      }
    } catch (err) {
      console.error('Error fetching rooms:', err);
      toast.error(isAr ? 'فشل تحميل قائمة القاعات الدراسية.' : 'Failed to load classrooms. Check database connection.');
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchRooms();
  }, []);

  const openEdit = (type, item) => {
    setEditingItem({ type, item });
    setFormState(item || {});
    setIsModalOpen(true);
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(t('groups.confirmDelete'))) return;
    const token = localStorage.getItem('manar_token');
    try {
      if (type === 'groups') {
        await axios.delete(`${API_URL}/api/groups/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        toast.success(t('groups.groupDeleted'));
        fetchGroups();
      } else if (type === 'rooms') {
        await axios.delete(`${API_URL}/api/rooms/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        toast.success(t('groups.roomDeleted'));
        fetchRooms();
      } else {
        setLecturers(lecturers.filter(l => l.id !== id));
        toast.success(t('groups.lecturerDeleted'));
      }
    } catch (err) {
      console.error('Delete error:', err);
      const errMsg = err.response?.data?.error || (isAr ? 'فشل حذف السجل' : 'Failed to delete record');
      toast.error(errMsg);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const type = editingItem.type;
    const isNew = !editingItem.item;
    const token = localStorage.getItem('manar_token');

    try {
      if (type === 'groups') {
        const payload = { name: formState.name };
        if (!isNew) {
          payload.id = formState.id;
        }
        await axios.post(`${API_URL}/api/groups`, payload, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        toast.success(t('groups.groupSaved'));
        fetchGroups();
      } else if (type === 'rooms') {
        const payload = {
          name: formState.name,
          capacity: parseInt(formState.capacity) || 30
        };
        if (!isNew) {
          payload.id = formState.id;
        }
        await axios.post(`${API_URL}/api/rooms`, payload, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        toast.success(t('groups.roomSaved'));
        fetchRooms();
      } else if (type === 'lecturers') {
        if (isNew) {
          const newItem = { ...formState, id: Date.now() };
          setLecturers([...lecturers, newItem]);
        } else {
          setLecturers(lecturers.map(l => l.id === formState.id ? formState : l));
        }
        toast.success(t('groups.lecturerSaved'));
      }
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Save error:', err);
      const errMsg = err.response?.data?.error || (isAr ? 'فشل حفظ السجل' : 'Failed to save record');
      toast.error(errMsg);
    }
  };

  const currentTabTypeLabel = activeTab === 'groups' 
    ? t('groups.typeGroup') 
    : activeTab === 'rooms' 
      ? t('groups.typeRoom') 
      : t('groups.typeLecturer');

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
          <h2 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(to right, var(--accent), var(--accent-2, var(--accent)))' }}>
            {t('groups.title')}
          </h2>
          <p className="text-sm text-gray-400 mt-1">{t('groups.subtitle')}</p>
        </div>
        <button
          onClick={() => openEdit(activeTab, null)}
          className="btn-neon px-4 py-2.5 text-xs font-bold flex items-center gap-1.5"
        >
          ➕ {t('groups.addNewBtn', { type: currentTabTypeLabel })}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5" style={{ borderColor: 'var(--border-color)' }}>
        <button
          onClick={() => setActiveTab('groups')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition duration-200 ${
            activeTab === 'groups' 
              ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-dim)]' 
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          👥 {t('groups.tabGroups')} ({groups.length})
        </button>
        <button
          onClick={() => setActiveTab('rooms')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition duration-200 ${
            activeTab === 'rooms' 
              ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-dim)]' 
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          🏫 {t('groups.tabRooms')} ({rooms.length})
        </button>
        <button
          onClick={() => setActiveTab('lecturers')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition duration-200 ${
            activeTab === 'lecturers' 
              ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-dim)]' 
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          🧑‍🏫 {t('groups.tabLecturers')} ({lecturers.length})
        </button>
      </div>

      {/* Lists */}
      <div className="frosted-panel rounded-2xl overflow-hidden">
        {activeTab === 'groups' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.015)', borderBottom: '1px solid var(--border-color)' }}>
                  <th className={`p-4 font-black uppercase text-gray-400 text-xs tracking-wider ${isAr ? 'text-right' : 'text-left'}`}>
                    {t('groups.groupName')}
                  </th>
                  <th className={`p-4 font-black uppercase text-gray-400 text-xs tracking-wider ${isAr ? 'text-right' : 'text-left'}`}>
                    {t('groups.majorSpecialization')}
                  </th>
                  <th className={`p-4 font-black uppercase text-gray-400 text-xs tracking-wider ${isAr ? 'text-right' : 'text-left'}`}>
                    {t('groups.academicLevel')}
                  </th>
                  <th className={`p-4 font-black uppercase text-gray-400 text-xs tracking-wider ${isAr ? 'text-left' : 'text-right'}`}>
                    {t('groups.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                {groups.map((g, idx) => (
                  <tr key={g.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-4 font-bold text-white">{g.name}</td>
                    <td className="p-4 text-gray-300">{g.major || '—'}</td>
                    <td className="p-4 text-gray-400">{g.level || '—'}</td>
                    <td className={`p-4 space-x-2 whitespace-nowrap ${isAr ? 'text-left' : 'text-right'}`}>
                      <button
                        onClick={() => openEdit('groups', g)}
                        className="btn-ghost px-2.5 py-1 text-[10px] font-bold rounded"
                      >
                        {t('groups.editBtn')}
                      </button>
                      <button
                        onClick={() => handleDelete('groups', g.id)}
                        className="px-2.5 py-1 text-[10px] font-bold rounded border transition border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/40"
                      >
                        {t('groups.deleteBtn')}
                      </button>
                    </td>
                  </tr>
                ))}
                {groups.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500 font-semibold">
                      {isAr ? 'لا توجد شعب دراسية مضافة بعد.' : 'No academic groups added yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'rooms' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.015)', borderBottom: '1px solid var(--border-color)' }}>
                  <th className={`p-4 font-black uppercase text-gray-400 text-xs tracking-wider ${isAr ? 'text-right' : 'text-left'}`}>
                    {t('groups.roomHall')}
                  </th>
                  <th className={`p-4 font-black uppercase text-gray-400 text-xs tracking-wider ${isAr ? 'text-right' : 'text-left'}`}>
                    {t('groups.seatingCapacity')}
                  </th>
                  <th className={`p-4 font-black uppercase text-gray-400 text-xs tracking-wider ${isAr ? 'text-left' : 'text-right'}`}>
                    {t('groups.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                {rooms.map(r => (
                  <tr key={r.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-4 font-bold text-white">{r.name}</td>
                    <td className="p-4 text-gray-300">{r.capacity} {isAr ? 'مقعد' : 'seats'}</td>
                    <td className={`p-4 space-x-2 whitespace-nowrap ${isAr ? 'text-left' : 'text-right'}`}>
                      <button
                        onClick={() => openEdit('rooms', r)}
                        className="btn-ghost px-2.5 py-1 text-[10px] font-bold rounded"
                      >
                        {t('groups.editBtn')}
                      </button>
                      <button
                        onClick={() => handleDelete('rooms', r.id)}
                        className="px-2.5 py-1 text-[10px] font-bold rounded border transition border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/40"
                      >
                        {t('groups.deleteBtn')}
                      </button>
                    </td>
                  </tr>
                ))}
                {rooms.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-500 font-semibold">
                      {isAr ? 'لا توجد قاعات أو مختبرات مضافة بعد.' : 'No rooms or labs added yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'lecturers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.015)', borderBottom: '1px solid var(--border-color)' }}>
                  <th className={`p-4 font-black uppercase text-gray-400 text-xs tracking-wider ${isAr ? 'text-right' : 'text-left'}`}>
                    {t('groups.lecturerName')}
                  </th>
                  <th className={`p-4 font-black uppercase text-gray-400 text-xs tracking-wider ${isAr ? 'text-right' : 'text-left'}`}>
                    {t('groups.emailAddress')}
                  </th>
                  <th className={`p-4 font-black uppercase text-gray-400 text-xs tracking-wider ${isAr ? 'text-left' : 'text-right'}`}>
                    {t('groups.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                {lecturers.map(l => (
                  <tr key={l.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-4 font-bold text-white">{l.name}</td>
                    <td className="p-4 text-gray-300 font-mono text-[11px]">{l.email}</td>
                    <td className={`p-4 space-x-2 whitespace-nowrap ${isAr ? 'text-left' : 'text-right'}`}>
                      <button
                        onClick={() => openEdit('lecturers', l)}
                        className="btn-ghost px-2.5 py-1 text-[10px] font-bold rounded"
                      >
                        {t('groups.editBtn')}
                      </button>
                      <button
                        onClick={() => handleDelete('lecturers', l.id)}
                        className="px-2.5 py-1 text-[10px] font-bold rounded border transition border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/40"
                      >
                        {t('groups.deleteBtn')}
                      </button>
                    </td>
                  </tr>
                ))}
                {lecturers.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-500 font-semibold">
                      {isAr ? 'لا توجد محاضرين مضافين بعد.' : 'No lecturers added yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="frosted-panel w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 text-[var(--text-primary)]"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--accent)]">
                  {editingItem.item ? t('groups.editRecord') : t('groups.addNewRecord')}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-white text-base transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4 text-xs">
                {editingItem.type === 'groups' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-gray-400 block font-semibold">{t('groups.groupName')}</label>
                      <input
                        type="text"
                        required
                        value={formState.name || ''}
                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                        placeholder="e.g. Group A"
                        className="w-full cmd-input p-3 font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-400 block font-semibold">{t('groups.majorSpecialization')}</label>
                      <input
                        type="text"
                        value={formState.major || ''}
                        onChange={(e) => setFormState({ ...formState, major: e.target.value })}
                        placeholder="e.g. Software Engineering"
                        className="w-full cmd-input p-3"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-400 block font-semibold">{t('groups.academicLevel')}</label>
                      <input
                        type="text"
                        value={formState.level || ''}
                        onChange={(e) => setFormState({ ...formState, level: e.target.value })}
                        placeholder="e.g. Level 3"
                        className="w-full cmd-input p-3"
                      />
                    </div>
                  </>
                )}

                {editingItem.type === 'rooms' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-gray-400 block font-semibold">{t('groups.roomHall')}</label>
                      <input
                        type="text"
                        required
                        value={formState.name || ''}
                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                        placeholder="e.g. Lab 5"
                        className="w-full cmd-input p-3 font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-400 block font-semibold">{t('groups.seatingCapacity')}</label>
                      <input
                        type="number"
                        required
                        value={formState.capacity || ''}
                        onChange={(e) => setFormState({ ...formState, capacity: e.target.value })}
                        placeholder="e.g. 30"
                        className="w-full cmd-input p-3"
                      />
                    </div>
                  </>
                )}

                {editingItem.type === 'lecturers' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-gray-400 block font-semibold">{t('groups.lecturerName')}</label>
                      <input
                        type="text"
                        required
                        value={formState.name || ''}
                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                        placeholder="e.g. Dr. Ahmad Masri"
                        className="w-full cmd-input p-3 font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-400 block font-semibold">{t('groups.emailAddress')}</label>
                      <input
                        type="email"
                        required
                        value={formState.email || ''}
                        onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                        placeholder="e.g. ahmad@manar.edu"
                        className="w-full cmd-input p-3 font-mono"
                      />
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-2.5 pt-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn-ghost px-4 py-2 font-semibold text-xs"
                  >
                    {t('groups.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="btn-neon px-5 py-2 font-semibold text-xs"
                  >
                    {t('groups.saveChanges')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
