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
        logout: 'Logout'
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
        logout: 'تسجيل الخروج'
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
