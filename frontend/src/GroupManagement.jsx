import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from './config';

export default function GroupManagement() {
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
      toast.error('Failed to load groups. Check database connection.');
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
      toast.error('Failed to load classrooms. Check database connection.');
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
    const token = localStorage.getItem('manar_token');
    try {
      if (type === 'groups') {
        await axios.delete(`${API_URL}/api/groups/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        toast.success('Group deleted successfully');
        fetchGroups();
      } else if (type === 'rooms') {
        await axios.delete(`${API_URL}/api/rooms/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        toast.success('Room deleted successfully');
        fetchRooms();
      } else {
        setLecturers(lecturers.filter(l => l.id !== id));
        toast.success('Lecturer deleted successfully');
      }
    } catch (err) {
      console.error('Delete error:', err);
      const errMsg = err.response?.data?.error || 'Failed to delete record';
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
        const payload = {
          name: formState.name
        };
        if (!isNew) {
          payload.id = formState.id;
        }
        await axios.post(`${API_URL}/api/groups`, payload, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        toast.success('Group saved successfully');
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
        toast.success('Room saved successfully');
        fetchRooms();
      } else if (type === 'lecturers') {
        if (isNew) {
          const newItem = { ...formState, id: Date.now() };
          setLecturers([...lecturers, newItem]);
        } else {
          setLecturers(lecturers.map(l => l.id === formState.id ? formState : l));
        }
        toast.success('Lecturer saved successfully');
      }
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Save error:', err);
      const errMsg = err.response?.data?.error || 'Failed to save record';
      toast.error(errMsg);
    }
  };

  return (
    <div className="flex-1 bg-gray-900 text-white p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Infrastructure Management</h2>
          <p className="text-sm text-gray-400">Configure academic groups, lecture rooms, and instructor credentials.</p>
        </div>
        <button
          onClick={() => openEdit(activeTab, null)}
          className="px-4 py-2 bg-lime-500 text-black font-semibold text-xs rounded-md shadow-md shadow-lime-500/20 hover:bg-lime-400 transition"
        >
          ➕ Add New {activeTab === 'groups' ? 'Group' : activeTab === 'rooms' ? 'Room' : 'Lecturer'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab('groups')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'groups' ? 'border-lime-500 text-lime-400 bg-lime-500/5' : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          👥 Academic Groups ({groups.length})
        </button>
        <button
          onClick={() => setActiveTab('rooms')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'rooms' ? 'border-sky-500 text-sky-400 bg-sky-500/5' : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          🏫 Classrooms/Labs ({rooms.length})
        </button>
        <button
          onClick={() => setActiveTab('lecturers')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'lecturers' ? 'border-lime-500 text-lime-400 bg-lime-500/5' : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          🧑‍🏫 Lecturers ({lecturers.length})
        </button>
      </div>

      {/* Lists */}
      <div className="bg-gray-850 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
        {activeTab === 'groups' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-900 border-b border-gray-800 font-bold text-gray-450 uppercase">
                  <th className="p-4">Group Name</th>
                  <th className="p-4">Major / Specialization</th>
                  <th className="p-4">Academic Level</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {groups.map(g => (
                  <tr key={g.id} className="hover:bg-gray-800/10">
                    <td className="p-4 font-bold text-white">{g.name}</td>
                    <td className="p-4 text-gray-300">{g.major}</td>
                    <td className="p-4 text-gray-400">{g.level}</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => openEdit('groups', g)}
                        className="px-2.5 py-1 bg-gray-800 hover:bg-gray-750 text-[10px] font-bold text-sky-400 rounded transition border border-gray-700 hover:border-sky-500/30"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete('groups', g.id)}
                        className="px-2.5 py-1 bg-gray-800 hover:bg-red-900/30 text-[10px] font-bold text-red-400 rounded transition border border-gray-700 hover:border-red-800/40"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'rooms' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-900 border-b border-gray-800 font-bold text-gray-450 uppercase">
                  <th className="p-4">Room / Hall</th>
                  <th className="p-4">Seating Capacity</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {rooms.map(r => (
                  <tr key={r.id} className="hover:bg-gray-800/10">
                    <td className="p-4 font-bold text-white">{r.name}</td>
                    <td className="p-4 text-gray-300">{r.capacity} seats</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => openEdit('rooms', r)}
                        className="px-2.5 py-1 bg-gray-800 hover:bg-gray-750 text-[10px] font-bold text-sky-400 rounded transition border border-gray-700 hover:border-sky-500/30"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete('rooms', r.id)}
                        className="px-2.5 py-1 bg-gray-800 hover:bg-red-900/30 text-[10px] font-bold text-red-400 rounded transition border border-gray-700 hover:border-red-800/40"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'lecturers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-900 border-b border-gray-800 font-bold text-gray-450 uppercase">
                  <th className="p-4">Lecturer Name</th>
                  <th className="p-4">Email Address</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {lecturers.map(l => (
                  <tr key={l.id} className="hover:bg-gray-800/10">
                    <td className="p-4 font-bold text-white">{l.name}</td>
                    <td className="p-4 text-gray-300 font-mono">{l.email}</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => openEdit('lecturers', l)}
                        className="px-2.5 py-1 bg-gray-800 hover:bg-gray-750 text-[10px] font-bold text-sky-400 rounded transition border border-gray-700 hover:border-sky-500/30"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete('lecturers', l.id)}
                        className="px-2.5 py-1 bg-gray-800 hover:bg-red-900/30 text-[10px] font-bold text-red-400 rounded transition border border-gray-700 hover:border-red-800/40"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-850 border border-gray-800 w-full max-w-md rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-lime-400">
                {editingItem.item ? 'Edit Record' : 'Add New Record'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {editingItem.type === 'groups' && (
                <>
                  <div className="space-y-1">
                    <label className="text-gray-400 block font-medium">Group Name</label>
                    <input
                      type="text"
                      required
                      value={formState.name || ''}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      placeholder="e.g. Group A"
                      className="w-full bg-gray-900 border border-gray-750 rounded p-2.5 text-white focus:outline-none focus:border-lime-500 font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-gray-400 block font-medium">Major / Specialization</label>
                    <input
                      type="text"
                      required
                      value={formState.major || ''}
                      onChange={(e) => setFormState({ ...formState, major: e.target.value })}
                      placeholder="e.g. Software Engineering"
                      className="w-full bg-gray-900 border border-gray-750 rounded p-2.5 text-white focus:outline-none focus:border-lime-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-gray-400 block font-medium">Level</label>
                    <input
                      type="text"
                      required
                      value={formState.level || ''}
                      onChange={(e) => setFormState({ ...formState, level: e.target.value })}
                      placeholder="e.g. Level 3"
                      className="w-full bg-gray-900 border border-gray-750 rounded p-2.5 text-white focus:outline-none focus:border-lime-500"
                    />
                  </div>
                </>
              )}

              {editingItem.type === 'rooms' && (
                <>
                  <div className="space-y-1">
                    <label className="text-gray-400 block font-medium">Room Name</label>
                    <input
                      type="text"
                      required
                      value={formState.name || ''}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      placeholder="e.g. Lab 5"
                      className="w-full bg-gray-900 border border-gray-750 rounded p-2.5 text-white focus:outline-none focus:border-sky-500 font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-gray-400 block font-medium">Seating Capacity</label>
                    <input
                      type="number"
                      required
                      value={formState.capacity || ''}
                      onChange={(e) => setFormState({ ...formState, capacity: e.target.value })}
                      placeholder="e.g. 30"
                      className="w-full bg-gray-900 border border-gray-750 rounded p-2.5 text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </>
              )}

              {editingItem.type === 'lecturers' && (
                <>
                  <div className="space-y-1">
                    <label className="text-gray-400 block font-medium">Lecturer Name</label>
                    <input
                      type="text"
                      required
                      value={formState.name || ''}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      placeholder="e.g. Dr. Ahmad Masri"
                      className="w-full bg-gray-900 border border-gray-750 rounded p-2.5 text-white focus:outline-none focus:border-lime-500 font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-gray-400 block font-medium">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formState.email || ''}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                      placeholder="e.g. ahmad@manar.edu"
                      className="w-full bg-gray-900 border border-gray-750 rounded p-2.5 text-white focus:outline-none focus:border-lime-500 font-mono"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-750 text-gray-300 font-semibold rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-lime-500 hover:bg-lime-400 text-black font-semibold rounded shadow-md shadow-lime-500/10"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
