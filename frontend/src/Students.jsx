import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { API_URL } from './config';

export default function Students() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [impersonatingId, setImpersonatingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('manar_token');
      const res = await axios.get(`${API_URL}/api/students`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data && res.data.success) {
        setStudents(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch students:', err);
      toast.error('Failed to retrieve student directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleImpersonate = async (student) => {
    setImpersonatingId(student.id);
    try {
      const token = localStorage.getItem('manar_token');
      const res = await axios.post(
        `${API_URL}/api/auth/impersonate`,
        { studentId: student.id },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      if (res.data && res.data.success) {
        const { token: studentToken, user: studentUser } = res.data;

        // Store active admin session credentials in a separate cache if we want to restore later,
        // or just perform direct overwriting per phase requirements.
        localStorage.setItem('manar_token', studentToken);
        localStorage.setItem('manar_user', JSON.stringify(studentUser));

        // Create student_profile cache
        localStorage.setItem('student_profile', JSON.stringify({
          name: student.name,
          email: student.email,
          department: student.major?.department?.name || 'Default Department',
          level: student.level?.name || 'Default Level',
          groupId: student.groupId
        }));

        toast.success(`God Mode Activated: Logged in as ${student.name}`);
        navigate('/student/home');
      }
    } catch (err) {
      console.error('Impersonation failed:', err);
      const errMsg = err.response?.data?.error || 'Failed to authenticate impersonated session';
      toast.error(errMsg);
    } finally {
      setImpersonatingId(null);
    }
  };

  // Filter students based on query
  const filteredStudents = students.filter(student => {
    const query = searchQuery.toLowerCase();
    return (
      student.name.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query) ||
      student.idNumber.toLowerCase().includes(query)
    );
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex-1 bg-transparent p-4 md:p-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2,var(--accent))]">
            {t('students.title')}
          </h2>
          <p className="text-sm text-gray-400">{t('students.subtitle')}</p>
        </div>
        
        <div className="w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('students.searchPlaceholder')}
            className="w-full bg-gray-955/50 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[var(--accent)] font-medium"
          />
        </div>
      </div>

      {/* Grid of Student Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <span className="h-8 w-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-gray-900/30 backdrop-blur-md border border-white/10 rounded-xl p-12 text-center text-gray-450 text-xs">
          {t('students.noRecords')}
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {filteredStudents.map(student => (
            <motion.div 
              variants={itemVariants}
              key={student.id} 
              className="bg-gray-900/20 backdrop-blur-md border border-white/10 rounded-xl p-5 hover:border-[var(--accent-glow)] transition duration-300 flex flex-col justify-between space-y-4 shadow-lg group relative overflow-hidden"
            >
              {/* Highlight accent for super admin impersonation potential */}
              <div className="absolute top-0 right-0 h-1.5 w-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2,var(--accent))] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="space-y-3">
                {/* Avatar / Profile Row */}
                <div className="flex items-center gap-3.5">
                  {student.idPhotoUrl ? (
                    <img 
                      src={student.idPhotoUrl} 
                      alt={student.name} 
                      className="h-10 w-10 rounded-full object-cover border border-white/10"
                      onError={(e) => {
                        e.target.src = 'https://api.dicebear.com/7.x/bottts/svg?seed=' + student.name;
                      }}
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[var(--accent)]/10 to-[var(--accent-2,var(--accent))]/10 border border-[var(--accent-glow)] flex items-center justify-center font-bold text-[var(--accent)]">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  <div className="overflow-hidden">
                    <h3 className="font-bold text-sm text-white truncate">{student.name}</h3>
                    <p className="text-[10px] font-mono text-gray-400 truncate">{student.email}</p>
                  </div>
                </div>

                {/* Program Details Table */}
                <div className="bg-gray-955/50 rounded-lg p-3 border border-white/5 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-gray-450">{t('students.studentId')}</span>
                    <span className="font-bold text-white">{student.idNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-455">{t('students.phone')}</span>
                    <span className="text-gray-300 font-medium">{student.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-455">{t('students.department')}</span>
                    <span className="text-gray-300">{student.major?.department?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-455">{t('students.major')}</span>
                    <span className="text-gray-300">{student.major?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-455">{t('students.level')}</span>
                    <span className="text-lime-450">{student.level?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-455">{t('students.group')}</span>
                    <span className="text-emerald-400 font-semibold">{student.group?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-white/5 items-center">
                    <span className="text-gray-455">{t('students.status')}</span>
                    <div className="flex gap-1">
                      <span className={`px-1.5 py-0.5 rounded-[3px] text-[9px] font-bold ${
                        student.isEmailVerified ? 'bg-[var(--accent-dim)] text-[var(--accent)] border border-[var(--accent-glow)]' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                      }`}>
                        📧 {student.isEmailVerified ? t('students.verifiedBadge') : t('students.pendingBadge')}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded-[3px] text-[9px] font-bold ${
                        student.isPhoneVerified ? 'bg-[var(--accent-dim)] text-[var(--accent)] border border-[var(--accent-glow)]' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                      }`}>
                        📱 {student.isPhoneVerified ? t('students.verifiedBadge') : t('students.pendingBadge')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Impersonate Button */}
              <button
                onClick={() => handleImpersonate(student)}
                disabled={impersonatingId !== null}
                className="w-full py-2 bg-gray-900/60 hover:bg-[var(--accent)] hover:text-black text-[11px] font-extrabold rounded-lg border border-white/10 hover:border-[var(--accent)] text-[var(--accent)] transition-all duration-300 flex items-center justify-center gap-1.5"
              >
                {impersonatingId === student.id ? (
                  <span className="h-3.5 w-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>🔑</span>
                    <span>{t('students.impersonateBtn')}</span>
                  </>
                )}
              </button>

            </motion.div>
          ))}
        </motion.div>
      )}

    </div>
  );
}
