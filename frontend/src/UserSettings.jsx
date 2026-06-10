import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from './config';
import { useTranslation } from 'react-i18next';

const DEPARTMENTS = ['Computer Science', 'Information Systems', 'Software Engineering'];
const LEVELS = ['Level 1', 'Level 2', 'Level 3', 'Level 4'];

export default function UserSettings() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

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
    // 1. Set fallback/initial state from local storage first for smooth loading
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

    // 2. Fetch the actual database-backed settings dynamically
    const fetchDBSettings = async () => {
      const token = localStorage.getItem('manar_token');
      try {
        const res = await axios.get(`${API_URL}/api/student/settings`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.data && res.data.success) {
          const s = res.data.data;
          const dbProfile = {
            name: s.name || '',
            email: s.email || '',
            phone: s.phone || '',
            idPhotoUrl: s.idPhotoUrl || '',
            department: s.majorName || 'Software Engineering',
            level: s.levelName || 'Level 3',
            groupId: s.groupId || 1
          };
          setProfile(dbProfile);
          localStorage.setItem('student_profile', JSON.stringify(dbProfile));
          
          // Also sync manar_user
          const userJson = localStorage.getItem('manar_user');
          if (userJson) {
            try {
              const userObj = JSON.parse(userJson);
              userObj.name = s.name;
              userObj.email = s.email;
              userObj.phone = s.phone;
              userObj.idPhotoUrl = s.idPhotoUrl;
              userObj.groupId = s.groupId;
              localStorage.setItem('manar_user', JSON.stringify(userObj));
            } catch (e) {}
          }
        }
      } catch (err) {
        console.error('Failed to sync student settings with DB:', err);
      }
    };
    fetchDBSettings();

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
        toast.error(isAr ? 'فشل في تحميل قائمة المجموعات الأكاديمية.' : 'Failed to load academic groups list.');
      }
    };
    fetchGroups();
  }, [isAr]);

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
        toast.success(t('userSettings.savedSuccess'));
      } else {
        throw new Error('API failed');
      }
    } catch (err) {
      console.error('Failed to update student settings:', err);
      const errMsg = err.response?.data?.error || (isAr ? 'فشل في تحديث إعدادات الملف الشخصي.' : 'Failed to update profile settings.');
      toast.error(errMsg);
    }
  };

  const getDeptDisplayName = (dept) => {
    if (dept === 'Computer Science') return isAr ? 'علوم الحاسوب' : 'Computer Science';
    if (dept === 'Information Systems') return isAr ? 'نظم المعلومات' : 'Information Systems';
    if (dept === 'Software Engineering') return isAr ? 'هندسة البرمجيات' : 'Software Engineering';
    return dept;
  };

  const getLevelDisplayName = (lvl) => {
    return lvl.replace('Level', isAr ? 'المستوى' : 'Level');
  };

  return (
    <div 
      className={`w-full max-w-md frosted-panel rounded-2xl p-6 space-y-6 ${isAr ? 'text-right' : 'text-left'}`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="flex flex-col items-center text-center space-y-3">
        {/* Profile Avatar Preview */}
        <div className="relative group">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[var(--accent)]/50 shadow-lg shadow-[var(--accent-glow)] bg-[#0a0a0a] flex items-center justify-center transition-all duration-300 group-hover:border-[var(--accent)]">
            {profile.idPhotoUrl ? (
              <img 
                src={profile.idPhotoUrl} 
                alt={t('userSettings.avatarAlt')} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(profile.name || 'avatar');
                }}
              />
            ) : (
              <img 
                src={'https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(profile.name || 'avatar')} 
                alt={t('userSettings.defaultAvatarAlt')} 
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-[var(--accent)] text-black p-1.5 rounded-full text-[10px] font-bold shadow-md">
            📸
          </div>
        </div>
        
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">{t('userSettings.title')}</h2>
          <p className="text-xs text-gray-400 mt-1">{t('userSettings.subtitle')}</p>
        </div>
      </div>

      {savedStatus && (
        <div className="p-3 bg-green-950/40 border border-green-600/50 text-green-200 text-xs font-semibold rounded-xl text-center">
          {t('userSettings.savedSuccess')}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 text-xs">
        <div className="space-y-1">
          <label className="text-gray-400 block font-medium">{t('userSettings.nameLabel')}</label>
          <input
            type="text"
            required
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            className="w-full cmd-input p-3 font-bold"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-gray-400 block font-medium">{t('userSettings.emailLabel')}</label>
            <input
              type="email"
              required
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="w-full cmd-input p-3 font-semibold text-left"
              dir="ltr"
            />
          </div>

          <div className="space-y-1">
            <label className="text-gray-400 block font-medium">{t('userSettings.phoneLabel')}</label>
            <input
              type="text"
              required
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full cmd-input p-3 font-semibold text-left"
              dir="ltr"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-gray-400 block font-medium">{isAr ? 'تحميل صورة الهوية' : 'Upload ID Photo'}</label>
          <div className="relative">
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setProfile({ ...profile, idPhotoUrl: reader.result });
                    toast.success(isAr ? 'تم تحميل الصورة!' : 'Image uploaded!');
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="hidden" 
              id="avatarPhotoUpload"
            />
            <label 
              htmlFor="avatarPhotoUpload"
              className="cmd-input w-full flex items-center justify-between p-3 cursor-pointer hover:border-[var(--accent)] transition-colors duration-200"
            >
              <span className="text-[var(--text-secondary)] font-semibold truncate max-w-[80%]">
                {profile.idPhotoUrl 
                  ? (isAr ? '✅ تم اختيار صورة' : '✅ Image Selected') 
                  : (isAr ? 'اختر صورة لتحديثها...' : 'Choose image file...')}
              </span>
              <span className="bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-black tracking-wider uppercase px-2 py-1 rounded">
                {isAr ? 'رفع ملف' : 'Browse'}
              </span>
            </label>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-gray-400 block font-medium">{t('userSettings.majorLabel')}</label>
          <select
            value={profile.department}
            onChange={(e) => setProfile({ ...profile, department: e.target.value })}
            className="w-full cmd-input p-3 font-semibold cursor-pointer"
          >
            {DEPARTMENTS.map(dept => (
              <option key={dept} value={dept} className="bg-[#0c0c0c]">
                {getDeptDisplayName(dept)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-gray-400 block font-medium">{t('userSettings.levelLabel')}</label>
            <select
              value={profile.level}
              onChange={(e) => setProfile({ ...profile, level: e.target.value })}
              className="w-full cmd-input p-3 font-semibold cursor-pointer"
            >
              {LEVELS.map(lvl => (
                <option key={lvl} value={lvl} className="bg-[#0c0c0c]">
                  {getLevelDisplayName(lvl)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-gray-400 block font-medium">{t('userSettings.groupLabel')}</label>
            <select
              value={profile.groupId}
              onChange={(e) => setProfile({ ...profile, groupId: parseInt(e.target.value) })}
              className="w-full cmd-input p-3 font-bold cursor-pointer"
            >
              {groups.map(g => (
                <option key={g.id} value={g.id} className="bg-[#0c0c0c]">{g.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-gray-400 block font-medium">{t('userSettings.passwordLabel')}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('userSettings.passwordPlaceholder')}
            className="w-full cmd-input p-3 font-mono text-left"
            dir="ltr"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-3 btn-neon text-xs font-extrabold"
          >
            {t('userSettings.saveBtn')}
          </button>
        </div>
      </form>
    </div>
  );
}
