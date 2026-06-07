import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      nav: {
        home: 'Home',
        schedule: 'Schedule',
        alerts: 'Alerts',
        settings: 'Settings',
        logout: 'Logout',
        adminPanel: 'Admin Panel',
        students: 'Students Directory',
        groups: 'Groups & Classrooms',
        broadcast: 'Broadcast Center',
        logs: 'Audit Logs',
        overview: 'Dashboard Overview',
        weeklyTimeline: 'Weekly Grid',
        leaveAdmin: 'Leave Admin Panel'
      },
      welcome: {
        title: 'Manar Smart Schedule',
        subtitle: 'College of Manar University schedule and exception notification engine.',
        adminPortal: '🔑 Enter Administrative Control Hub',
        studentPortal: '🎓 Access Student Schedule Portal',
        tagline: 'Stay up-to-date with immediate pre-lecture reminders and schedules.'
      },
      login: {
        title: 'System Security Gateway',
        subtitle: 'Please authenticate to access the schedule portal.',
        emailLabel: 'Email Address',
        emailPlaceholder: 'e.g. user@manar.edu',
        passwordLabel: 'Password',
        passwordPlaceholder: '••••••••',
        submitButton: 'Lock In Authenticated Session',
        sandboxDemo: 'Sandbox Demo Credentials:',
        newStudent: 'New student?',
        createAccount: 'Create a new account'
      },
      register: {
        title: 'Student Registration Gate',
        subtitle: 'Enroll your profile to sync with schedule and smart notifications.',
        secAccount: '1. Account Details',
        secProgram: '2. Academic Program',
        secVerification: '3. Human Verification',
        fullName: 'Full Name',
        email: 'Email Address',
        password: 'Password',
        phone: 'Phone Number',
        idNumber: 'Student ID Number',
        idPhoto: 'ID Photo URL (Optional)',
        department: 'Department',
        major: 'Major / Specialization',
        level: 'Academic Level',
        group: 'Class Group',
        captcha: 'Challenge Question',
        submit: 'Request Verification Codes',
        haveAccount: 'Already have an account?',
        signIn: 'Sign In',
        selectDept: '-- Select Department --',
        selectMajor: '-- Select Major --',
        selectLevel: '-- Select Level --',
        selectGroup: '-- Select Group --',
        phonePlaceholder: '9-digit number'
      },
      verify: {
        title: 'Triple Authentication Verification',
        subtitle: 'Please enter the 6-digit OTP codes sent to your registered channels.',
        devHelper: 'Developer God Mode Helper:',
        logNotice: 'Verification OTP codes are printed to:',
        emailVerify: 'Email Verification',
        phoneVerify: 'Phone Verification',
        pending: '⏳ Verification Pending',
        verified: '✓ Verified',
        verifyBtn: 'Verify',
        backToSignIn: '← Back to Sign In'
      },
      students: {
        title: 'Student Directory',
        subtitle: 'View registered student profiles and activate Developer God Mode impersonation.',
        searchPlaceholder: '🔍 Search by name, email, or ID...',
        studentId: 'Student ID:',
        phone: 'Phone:',
        department: 'Department:',
        major: 'Major:',
        level: 'Level:',
        group: 'Group:',
        status: 'Status:',
        verifiedBadge: 'Verified',
        pendingBadge: 'Pending',
        impersonateBtn: 'Impersonate Student',
        noRecords: '🚫 No student profiles found. Try checking database seeds or adjusting search query.'
      },
      dashboard: {
        activeProfile: 'Active Profile',
        manageGroup: 'Manage Group',
        activeAlert: 'Pre-Lecture Active Alert',
        nextStartsIn: 'Next Class Starts in 15 Minutes',
        nextUpcoming: 'Next Upcoming Lecture',
        todaySchedule: "Today's Class Schedule",
        weeklyTimeline: 'Weekly Timeline',
        classes: 'Classes',
        noClassesRegistered: 'No classes registered.',
        noClassesToday: 'No classes scheduled for today. Enjoy your day off!',
        timeSlot: 'Time Slot',
        classroom: 'Classroom',
        lecturer: 'Lecturer',
        day: 'Day',
        theory: 'Theory',
        practical: 'Practical',
        rescheduled: 'Rescheduled',
        rescheduledWarning: 'Rescheduled Exception: Please note the updated room or time slot shown above.',
        offlineMode: 'OFFLINE MODE',
        liveSync: 'LIVE SYNC'
      },
      settings: {
        title: 'Settings',
        language: 'Language',
        theme: 'Theme',
        english: 'English',
        arabic: 'العربية',
        light: 'Light',
        dark: 'Dark'
      },
      notifications: {
        title: 'Notification Center',
        subtitle: 'Official broadcast notices, emergency reschedules, and alerts.',
        broadcast: 'Broadcast',
        emergency: 'Emergency Alert',
        empty: '📭 Clean inbox! No notifications or schedule alerts active.'
      },
      logs: {
        title: 'System Logs',
        subtitle: 'Read-only audit trail of dispatched notifications and schedule exceptions.',
        clearBtn: 'Clear Log History',
        activeLogs: 'Active Audit Logs',
        actionsCount: 'Actions Logged',
        empty: 'No system action or notification logs found in the audit trail.'
      }
    }
  },
  ar: {
    translation: {
      nav: {
        home: 'الرئيسية',
        schedule: 'الجدول',
        alerts: 'التنبيهات',
        settings: 'الإعدادات',
        logout: 'تسجيل الخروج',
        adminPanel: 'لوحة التحكم',
        students: 'دليل الطلاب',
        groups: 'المجموعات والقاعات',
        broadcast: 'مركز البث العام',
        logs: 'سجلات المراجعة',
        overview: 'نظرة عامة',
        weeklyTimeline: 'الجدول الأسبوعي',
        leaveAdmin: 'مغادرة لوحة التحكم'
      },
      welcome: {
        title: 'نظام المنار الذكي للجداول',
        subtitle: 'محرك الجداول وتنبيهات التعديلات الطارئة لكلية المنار الجامعية.',
        adminPortal: '🔑 دخول بوابة الإدارة والتحكم',
        studentPortal: '🎓 دخول بوابة الطلاب والجدول',
        tagline: 'ابق على اطلاع دائم بجدولك مع منبهات ذكية تلقائية قبل المحاضرة.'
      },
      login: {
        title: 'بوابة الأمان والمصادقة',
        subtitle: 'يرجى إثبات الهوية للوصول إلى نظام الجداول.',
        emailLabel: 'البريد الإلكتروني',
        emailPlaceholder: 'مثال: user@manar.edu',
        passwordLabel: 'كلمة المرور',
        passwordPlaceholder: '••••••••',
        submitButton: 'إنشاء جلسة مصادقة نشطة',
        sandboxDemo: 'بيانات الدخول التجريبية (Sandbox):',
        newStudent: 'طالب جديد؟',
        createAccount: 'إنشاء حساب جديد'
      },
      register: {
        title: 'بوابة تسجيل الطلاب',
        subtitle: 'أنشئ ملفك للربط التلقائي مع المحاضرات والتنبيهات الذكية.',
        secAccount: '1. معلومات الحساب',
        secProgram: '2. البرنامج الأكاديمي',
        secVerification: '3. التحقق البشري',
        fullName: 'الاسم الكامل',
        email: 'البريد الإلكتروني',
        password: 'كلمة المرور',
        phone: 'رقم الهاتف',
        idNumber: 'الرقم الأكاديمي',
        idPhoto: 'رابط الصورة الشخصية (اختياري)',
        department: 'القسم الأكاديمي',
        major: 'التخصص',
        level: 'المستوى الدراسي',
        group: 'الشعبة / المجموعة',
        captcha: 'سؤال التحقق',
        submit: 'إرسال رموز التحقق',
        haveAccount: 'لديك حساب بالفعل؟',
        signIn: 'تسجيل الدخول',
        selectDept: '-- اختر القسم --',
        selectMajor: '-- اختر التخصص --',
        selectLevel: '-- اختر المستوى --',
        selectGroup: '-- اختر الشعبة --',
        phonePlaceholder: 'رقم مكون من 9 أرقام'
      },
      verify: {
        title: 'التحقق الثلاثي الآمن',
        subtitle: 'يرجى إدخال رموز الـ OTP المكونة من 6 أرقام والمرسلة إليك.',
        devHelper: 'مساعد المطور (God Mode):',
        logNotice: 'تمت طباعة رموز التحقق في الملف:',
        emailVerify: 'التحقق من البريد',
        phoneVerify: 'التحقق من الهاتف',
        pending: '⏳ في انتظار التحقق',
        verified: '✓ تم التحقق',
        verifyBtn: 'تحقق',
        backToSignIn: '← العودة لتسجيل الدخول'
      },
      students: {
        title: 'دليل الطلاب',
        subtitle: 'استعرض ملفات الطلاب المسجلين وقم بتفعيل وضع محاكاة الطالب المطور.',
        searchPlaceholder: '🔍 ابحث بالاسم، البريد، أو الرقم الدراسي...',
        studentId: 'الرقم الدراسي:',
        phone: 'الهاتف:',
        department: 'القسم:',
        major: 'التخصص:',
        level: 'المستوى:',
        group: 'المجموعة:',
        status: 'الحالة:',
        verifiedBadge: 'متحقق',
        pendingBadge: 'معلق',
        impersonateBtn: 'محاكاة هذا الطالب',
        noRecords: '🚫 لم يتم العثور على ملفات طلاب. تحقق من تهيئة قاعدة البيانات أو قم بتعديل البحث.'
      },
      dashboard: {
        activeProfile: 'الملف الشخصي النشط',
        manageGroup: 'إدارة المجموعة',
        activeAlert: 'التنبيهات النشطة قبل المحاضرة',
        nextStartsIn: 'تبدأ المحاضرة التالية خلال 15 دقيقة',
        nextUpcoming: 'المحاضرة القادمة',
        todaySchedule: 'جدول محاضرات اليوم',
        weeklyTimeline: 'الجدول الأسبوعي',
        classes: 'محاضرات',
        noClassesRegistered: 'لا توجد محاضرات مسجلة.',
        noClassesToday: 'لا توجد محاضرات مجدولة اليوم. استمتع بيومك!',
        timeSlot: 'الوقت',
        classroom: 'القاعة',
        lecturer: 'المحاضر',
        day: 'اليوم',
        theory: 'نظري',
        practical: 'عملي',
        rescheduled: 'تم تعديل الموعد',
        rescheduledWarning: 'تعديل طارئ: يرجى ملاحظة تغيير القاعة أو الوقت الموضح أعلاه.',
        offlineMode: 'وضع غير متصل بالشبكة',
        liveSync: 'مزامنة حية'
      },
      settings: {
        title: 'الإعدادات',
        language: 'اللغة',
        theme: 'المظهر',
        english: 'English',
        arabic: 'العربية',
        light: 'فاتح',
        dark: 'داكن'
      },
      notifications: {
        title: 'مركز التنبيهات',
        subtitle: 'البيانات الرسمية العامة، تعديلات المواعيد الطارئة، والتنبيهات المباشرة.',
        broadcast: 'تعميم عام',
        emergency: 'تنبيه طارئ',
        empty: '📭 صندوق الوارد فارغ! لا توجد تنبيهات أو تعديلات نشطة حالياً.'
      },
      logs: {
        title: 'سجلات النظام',
        subtitle: 'سجل تدقيق للقراءة فقط للإشعارات المرسلة وتعديلات المواعيد الاستثنائية.',
        clearBtn: 'مسح سجل المراجعة',
        activeLogs: 'سجلات التدقيق النشطة',
        actionsCount: 'سجلات الإجراءات',
        empty: 'لا توجد إجراءات مسجلة أو إشعارات في سجل التدقيق حالياً.'
      }
    }
  }
};

const savedLang = localStorage.getItem('manar_lang') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

// Set HTML dir and lang attributes on load
document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = savedLang;

// Dynamically handle language switches
i18n.on('languageChanged', (lng) => {
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
  localStorage.setItem('manar_lang', lng);
});

export default i18n;
