import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DEPARTMENTS = ['Computer Science', 'Information Systems', 'Software Engineering'];
const LEVELS = ['Level 1', 'Level 2', 'Level 3', 'Level 4'];

export default function UserSettings() {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    department: 'Software Engineering',
    level: 'Level 3',
    groupId: 1
  });
  const [groups, setGroups] = useState([]);
  const [password, setPassword] = useState('');
  const [savedStatus, setSavedStatus] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('student_profile');
    if (saved) {
      try {
        setProfile(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    } else {
      const userJson = localStorage.getItem('manar_user');
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          setProfile({
            name: user.name || '',
            email: user.email || '',
            department: 'Software Engineering',
            level: 'Level 3',
            groupId: user.groupId || 1
          });
        } catch (e) {
          console.error(e);
        }
      }
    }

    const fetchGroups = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/groups');
        if (res.data && res.data.success) {
          setGroups(res.data.data);
        }
      } catch (e) {
        console.error('Failed to fetch groups:', e);
      }
    };
    fetchGroups();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('manar_token');
    try {
      const res = await axios.put('http://localhost:5000/api/student/settings', {
        name: profile.name,
        groupId: profile.groupId,
        departmentName: profile.department,
        levelName: profile.level,
        password: password || undefined
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (res.data && res.data.success) {
        const updatedProfile = {
          name: res.data.data.name,
          email: res.data.data.email,
          department: res.data.data.majorName || profile.department,
          level: res.data.data.levelName || profile.level,
          groupId: res.data.data.groupId
        };
        localStorage.setItem('student_profile', JSON.stringify(updatedProfile));
        
        const savedUser = localStorage.getItem('manar_user');
        if (savedUser) {
          try {
            const userObj = JSON.parse(savedUser);
            userObj.name = res.data.data.name;
            userObj.groupId = res.data.data.groupId;
            localStorage.setItem('manar_user', JSON.stringify(userObj));
          } catch (e) {}
        }
        
        setProfile(updatedProfile);
        setPassword('');
        setSavedStatus(true);
        setTimeout(() => setSavedStatus(false), 3000);
      }
    } catch (err) {
      console.error('Failed to update student settings:', err);
    }
  };

  return (
    <div className="w-full max-w-md bg-gray-850 border border-gray-800 rounded-xl p-6 shadow-xl space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">Academic Group Config</h2>
        <p className="text-xs text-gray-400 mt-1">Configure your department, level, and group for custom schedule feeds.</p>
      </div>

      {savedStatus && (
        <div className="p-3 bg-green-950/40 border border-green-600/50 text-green-200 text-xs font-semibold rounded-lg">
          ✓ Academic profile configuration updated successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 text-xs">
        <div className="space-y-1">
          <label className="text-gray-400 block font-medium">Full Name</label>
          <input
            type="text"
            required
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            className="w-full bg-gray-900 border border-gray-750 rounded p-2.5 text-white focus:outline-none focus:border-lime-500 font-bold"
          />
        </div>

        <div className="space-y-1">
          <label className="text-gray-400 block font-medium">Department</label>
          <select
            value={profile.department}
            onChange={(e) => setProfile({ ...profile, department: e.target.value })}
            className="w-full bg-gray-900 border border-gray-750 rounded p-2.5 text-white focus:outline-none focus:border-lime-500 font-semibold"
          >
            {DEPARTMENTS.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-gray-400 block font-medium">Academic Level</label>
          <select
            value={profile.level}
            onChange={(e) => setProfile({ ...profile, level: e.target.value })}
            className="w-full bg-gray-900 border border-gray-750 rounded p-2.5 text-white focus:outline-none focus:border-lime-500 font-semibold"
          >
            {LEVELS.map(lvl => (
              <option key={lvl} value={lvl}>{lvl}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-gray-400 block font-medium">Academic Group Allocation</label>
          <select
            value={profile.groupId}
            onChange={(e) => setProfile({ ...profile, groupId: parseInt(e.target.value) })}
            className="w-full bg-gray-900 border border-gray-750 rounded p-2.5 text-white focus:outline-none focus:border-lime-500 font-bold"
          >
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-gray-400 block font-medium">New Password (leave blank to keep unchanged)</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-gray-900 border border-gray-750 rounded p-2.5 text-white focus:outline-none focus:border-lime-500 font-mono"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-2.5 bg-lime-500 hover:bg-lime-400 text-black font-extrabold rounded-md shadow-md shadow-lime-500/10 transition"
          >
            Save Configuration Settings
          </button>
        </div>
      </form>
    </div>
  );
}
