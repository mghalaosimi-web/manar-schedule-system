import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from './config';
import { useTranslation } from 'react-i18next';

const DEPARTMENTS = ['Computer Science', 'Information Systems', 'Software Engineering'];
const LEVELS = ['Level 1', 'Level 2', 'Level 3', 'Level 4'];

export default function UserSettings() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    idPhotoUrl: '',
    department: 'Software Engineering',
    level: 'Level 3',
    groupId: 1
  });
  const [groups, setGroups] = useState([]);
  const [password, setPassword] = useState('');
  const [savedStatus, setSavedStatus] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('student_profile');
    let initialProfile = {
      name: '',
      email: '',
      phone: '',
      idPhotoUrl: '',
      department: 'Software Engineering',
      level: 'Level 3',
      groupId: 1
    };

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        initialProfile = { ...initialProfile, ...parsed };
      } catch (e) {
        console.error(e);
      }
    } else {
      const userJson = localStorage.getItem('manar_user');
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          initialProfile = {
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            idPhotoUrl: user.idPhotoUrl || '',
            department: 'Software Engineering',
            level: 'Level 3',
            groupId: user.groupId || 1
          };
        } catch (e) {
          console.error(e);
        }
      }
    }
    setProfile(initialProfile);

    const fetchGroups = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/groups`);
        if (res.data && res.data.success) {
          setGroups(res.data.data);
        } else {
          throw new Error('API failed');
        }
      } catch (e) {
        console.error('Failed to fetch groups:', e);
        toast.error('فشل في تحميل قائمة المجموعات الأكاديمية.');
      }
    };
    fetchGroups();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('manar_token');
    try {
      const res = await axios.put(`${API_URL}/api/student/settings`, {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        idPhotoUrl: profile.idPhotoUrl,
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
          phone: res.data.data.phone || '',
          idPhotoUrl: res.data.data.idPhotoUrl || '',
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
            userObj.email = res.data.data.email;
            userObj.phone = res.data.data.phone;
            userObj.idPhotoUrl = res.data.data.idPhotoUrl;
            userObj.groupId = res.data.data.groupId;
            localStorage.setItem('manar_user', JSON.stringify(userObj));
          } catch (e) {}
        }
        
        setProfile(updatedProfile);
        setPassword('');
        setSavedStatus(true);
        setTimeout(() => setSavedStatus(false), 3000);
        toast.success('تم تحديث الملف الشخصي والإعدادات بنجاح!');
      } else {
        throw new Error('API failed');
      }
    } catch (err) {
      console.error('Failed to update student settings:', err);
      const errMsg = err.response?.data?.error || 'فشل في تحديث إعدادات الملف الشخصي.';
      toast.error(errMsg);
    }
  };

  return (
    <div className="w-full max-w-md frosted-panel rounded-2xl p-6 space-y-6 text-right" dir="rtl">
      <div className="flex flex-col items-center text-center space-y-3">
        {/* Profile Avatar Preview */}
        <div className="relative group">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-lime-500/50 shadow-lg shadow-lime-500/20 bg-gray-900 flex items-center justify-center transition-all duration-300 group-hover:border-lime-400">
            {profile.idPhotoUrl ? (
              <img 
                src={profile.idPhotoUrl} 
                alt="Avatar" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(profile.name || 'avatar');
                }}
              />
            ) : (
              <img 
                src={'https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(profile.name || 'avatar')} 
                alt="Default Avatar" 
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-lime-500 text-black p-1.5 rounded-full text-[10px] font-bold shadow-md">
            📸
          </div>
        </div>
        
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">إعدادات الحساب الأكاديمي</h2>
          <p className="text-xs text-gray-400 mt-1">تحديث معلوماتك الشخصية وصورة الحساب والمجموعة الدراسية.</p>
        </div>
      </div>

      {savedStatus && (
        <div className="p-3 bg-green-950/40 border border-green-600/50 text-green-200 text-xs font-semibold rounded-xl text-center">
          ✓ تم حفظ تعديلات الملف الشخصي بنجاح!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 text-xs">
        <div className="space-y-1">
          <label className="text-gray-400 block font-medium">الاسم الكامل</label>
          <input
            type="text"
            required
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            className="w-full bg-gray-900 border border-gray-750 rounded-lg p-2.5 text-white focus:outline-none focus:border-lime-500 font-bold"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-gray-400 block font-medium">البريد الإلكتروني</label>
            <input
              type="email"
              required
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="w-full bg-gray-900 border border-gray-750 rounded-lg p-2.5 text-white focus:outline-none focus:border-lime-500 font-semibold text-left"
              dir="ltr"
            />
          </div>

          <div className="space-y-1">
            <label className="text-gray-400 block font-medium">رقم الهاتف</label>
            <input
              type="text"
              required
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full bg-gray-900 border border-gray-750 rounded-lg p-2.5 text-white focus:outline-none focus:border-lime-500 font-semibold text-left"
              dir="ltr"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-gray-400 block font-medium">رابط صورة الملف الشخصي (URL)</label>
          <input
            type="url"
            placeholder="https://example.com/avatar.jpg"
            value={profile.idPhotoUrl}
            onChange={(e) => setProfile({ ...profile, idPhotoUrl: e.target.value })}
            className="w-full bg-gray-900 border border-gray-750 rounded-lg p-2.5 text-white focus:outline-none focus:border-lime-500 font-mono text-left"
            dir="ltr"
          />
        </div>

        <div className="space-y-1">
          <label className="text-gray-400 block font-medium">التخصص / القسم</label>
          <select
            value={profile.department}
            onChange={(e) => setProfile({ ...profile, department: e.target.value })}
            className="w-full bg-gray-900 border border-gray-750 rounded-lg p-2.5 text-white focus:outline-none focus:border-lime-500 font-semibold"
          >
            {DEPARTMENTS.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-gray-400 block font-medium">المستوى الدراسي</label>
            <select
              value={profile.level}
              onChange={(e) => setProfile({ ...profile, level: e.target.value })}
              className="w-full bg-gray-900 border border-gray-750 rounded-lg p-2.5 text-white focus:outline-none focus:border-lime-500 font-semibold"
            >
              {LEVELS.map(lvl => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-gray-400 block font-medium">المجموعة / الشعبة</label>
            <select
              value={profile.groupId}
              onChange={(e) => setProfile({ ...profile, groupId: parseInt(e.target.value) })}
              className="w-full bg-gray-900 border border-gray-750 rounded-lg p-2.5 text-white focus:outline-none focus:border-lime-500 font-bold"
            >
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-gray-400 block font-medium">كلمة مرور جديدة (اتركه فارغاً للإبقاء دون تغيير)</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-gray-900 border border-gray-750 rounded-lg p-2.5 text-white focus:outline-none focus:border-lime-500 font-mono text-left"
            dir="ltr"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-2.5 bg-lime-500 hover:bg-lime-400 text-black font-extrabold rounded-lg shadow-md shadow-lime-500/10 transition duration-300"
          >
            حفظ إعدادات الملف الشخصي
          </button>
        </div>
      </form>
    </div>
  );
}
