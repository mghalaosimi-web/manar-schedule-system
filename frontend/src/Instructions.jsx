import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const steps = [
  {
    id: '01',
    iconEn: '🎓', iconAr: '🎓',
    titleEn: 'Create Your Account',
    titleAr: 'إنشاء حسابك',
    bodyEn: 'Register using your full name, university email, student ID, and academic details. Your account is activated instantly — no email verification required.',
    bodyAr: 'سجّل باستخدام اسمك الكامل، بريدك الجامعي، رقمك الدراسي، وتفاصيلك الأكاديمية. يُفعَّل حسابك فوراً دون الحاجة لتأكيد البريد الإلكتروني.',
    accentColor: 'var(--accent)',
  },
  {
    id: '02',
    iconEn: '🔑', iconAr: '🔑',
    titleEn: 'Sign In — One Field',
    titleAr: 'تسجيل الدخول — حقل واحد',
    bodyEn: 'Enter your name, email address, or student ID in a single field. The system finds your account automatically. Your session persists for 90 days.',
    bodyAr: 'أدخل اسمك أو بريدك الإلكتروني أو رقمك الدراسي في حقل واحد. يجد النظام حسابك تلقائياً. جلستك تستمر 90 يوماً.',
    accentColor: '#60c4ff',
  },
  {
    id: '03',
    iconEn: '📅', iconAr: '📅',
    titleEn: 'View Your Schedule',
    titleAr: 'عرض جدولك الدراسي',
    bodyEn: 'Your weekly lecture schedule is loaded automatically based on your registered group. Overrides and room changes appear in real-time.',
    bodyAr: 'يُحمَّل جدولك الأسبوعي تلقائياً بناءً على شعبتك المسجّلة. التعديلات وتغييرات القاعات تظهر فورياً.',
    accentColor: 'var(--accent)',
  },
  {
    id: '04',
    iconEn: '🔔', iconAr: '🔔',
    titleEn: 'Live Notifications',
    titleAr: 'الإشعارات الفورية',
    bodyEn: 'Receive system broadcasts from your university administration instantly. Daily schedule summaries are dispatched every evening at 8:00 PM.',
    bodyAr: 'استقبل الإشعارات الإدارية فورياً. ملخصات الجدول اليومي تُرسَل كل مساء في تمام الساعة 8:00 م.',
    accentColor: '#60c4ff',
  },
  {
    id: '05',
    iconEn: '⚙️', iconAr: '⚙️',
    titleEn: 'Settings & Themes',
    titleAr: 'الإعدادات والمظاهر',
    bodyEn: 'Personalise your portal: switch between Arabic and English, choose from 4 premium colour themes, and toggle between dark and light mode.',
    bodyAr: 'خصّص بوابتك: تبديل بين العربية والإنجليزية، اختر من بين 4 ألوان مميزة، وتبديل بين الوضع الليلي والنهاري.',
    accentColor: 'var(--accent)',
  },
  {
    id: '06',
    iconEn: '⌨️', iconAr: '⌨️',
    titleEn: 'Command Palette',
    titleAr: 'لوحة الأوامر',
    bodyEn: 'Press Ctrl+K (or ⌘+K on Mac) anywhere to open the command palette. Search lectures, rooms, instructors, or jump to any section instantly.',
    bodyAr: 'اضغط Ctrl+K في أي مكان لفتح لوحة الأوامر. ابحث عن المحاضرات، القاعات، الأساتذة، أو انتقل لأي قسم فوراً.',
    accentColor: '#60c4ff',
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

export default function Instructions() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const navigate = useNavigate();
  const [active, setActive] = useState(null);

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#000] text-[var(--text-primary)] px-6 py-20 flex flex-col items-center"
    >
      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-0">
        <div className="ambient-orb absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full"
             style={{ background: 'radial-gradient(circle, rgba(222,255,154,0.07) 0%, transparent 70%)' }} />
        <div className="ambient-orb absolute bottom-[5%] right-[10%] w-[380px] h-[380px] rounded-full"
             style={{ background: 'radial-gradient(circle, rgba(96,196,255,0.05) 0%, transparent 70%)', animationDelay: '7s' }} />
      </div>

      <div className="relative z-10 w-full max-w-4xl">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <p className="text-[10px] font-black tracking-[0.30em] uppercase mb-4"
             style={{ color: 'var(--accent)' }}>
            {isAr ? 'دليل المستخدم' : 'User Guide'}
          </p>
          <h1
            className="font-black tracking-tighter leading-none mb-4"
            style={{ fontSize: 'clamp(44px, 7vw, 80px)', color: '#fff' }}
          >
            {isAr ? 'كيف تستخدم المنار' : 'How to Use Manar'}
          </h1>
          <p className="text-base max-w-xl mx-auto leading-relaxed"
             style={{ color: 'var(--text-secondary)' }}>
            {isAr
              ? 'دليلك الشامل لكل ميزات بوابة كلية المنار الجامعية.'
              : 'Your complete guide to every feature of the Al-Manar University portal.'}
          </p>
        </motion.div>

        {/* Steps grid */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          {steps.map((step) => (
            <motion.div
              key={step.id}
              variants={cardVariants}
              onClick={() => setActive(active === step.id ? null : step.id)}
              className="frosted-panel rounded-2xl p-7 cursor-pointer transition-all duration-300 group"
              style={{
                borderTop: `2px solid ${active === step.id ? step.accentColor : 'transparent'}`,
                boxShadow: active === step.id ? `0 0 40px rgba(222,255,154,0.08)` : 'none',
              }}
              whileHover={{ scale: 1.015, borderTopColor: step.accentColor }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-start gap-5">
                {/* Step number */}
                <div className="shrink-0">
                  <span
                    className="block text-[11px] font-black tracking-[0.25em] mb-2"
                    style={{ color: step.accentColor }}
                  >
                    {step.id}
                  </span>
                  <span className="text-2xl">{isAr ? step.iconAr : step.iconEn}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-base mb-2 tracking-tight" style={{ color: '#fff' }}>
                    {isAr ? step.titleAr : step.titleEn}
                  </h3>

                  <AnimatePresence initial={false}>
                    {active === step.id && (
                      <motion.p
                        key="body"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{    opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-sm leading-relaxed overflow-hidden"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {isAr ? step.bodyAr : step.bodyEn}
                      </motion.p>
                    )}
                    {active !== step.id && (
                      <p className="text-xs line-clamp-1" style={{ color: 'var(--text-muted)' }}>
                        {isAr ? step.bodyAr : step.bodyEn}
                      </p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-14 text-center flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: '0 0 28px var(--accent-glow)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/login')}
            className="btn-neon px-8 py-3.5 text-sm"
          >
            {isAr ? 'ابدأ الآن ←' : 'Get Started →'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => window.history.back()}
            className="btn-ghost px-8 py-3.5 text-sm"
          >
            {isAr ? 'رجوع' : 'Go Back'}
          </motion.button>
        </motion.div>

      </div>
    </div>
  );
}
