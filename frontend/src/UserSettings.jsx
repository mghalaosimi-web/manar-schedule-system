import React, { useState, useEffect } from 'react';

const DEPARTMENTS = ['Computer Science', 'Information Systems', 'Software Engineering'];
const LEVELS = ['Level 1', 'Level 2', 'Level 3', 'Level 4'];
const GROUPS = [
  { id: 1, name: 'Group A' },
  { id: 2, name: 'Group B' },
  { id: 3, name: 'Group C' }
];

export default function UserSettings() {
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('student_profile');
    return saved ? JSON.parse(saved) : {
      name: 'Mohammad Al-Otaibi',
      email: 'student.mohammad@manar.edu',
      department: 'Software Engineering',
      level: 'Level 3',
      groupId: 1
    };
  });

  const [savedStatus, setSavedStatus] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('student_profile', JSON.stringify(profile));
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 3000);
  };

  return (
    <div className="flex-1 bg-gray-900 text-white p-5 flex flex-col items-center">
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
              {GROUPS.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
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
    </div>
  );
}
