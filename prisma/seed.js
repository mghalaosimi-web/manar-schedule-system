require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const collegesConfig = [
  {
    name: "كلية الطب والعلوم الصحية",
    slug: "medicine-health",
    location: "Hajjah",
    majors: ["الطب البشري", "الرعاية التنفسية", "الصيدلة", "التمريض", "القبالة", "المختبرات", "طب الطوارئ"]
  },
  {
    name: "كلية العلوم التطبيقية",
    slug: "applied-sciences",
    location: "Hajjah",
    majors: ["علوم الحاسوب", "الذكاء الاصطناعي", "تقنية المعلومات IT", "الأمن السيبراني", "الاتصالات والشبكات", "الكيمياء الصناعية", "الجيولوجيا والتعدين", "ميكروبيولوجي"]
  },
  {
    name: "كلية الشريعة والقانون",
    slug: "sharia-law",
    location: "Hajjah",
    majors: ["شريعة وقانون"]
  },
  {
    name: "كلية العلوم المالية والمصرفية",
    slug: "finance-banking",
    location: "Hajjah",
    majors: ["محاسبة", "إدارة أعمال", "تسويق", "مصارف", "نظم معلومات إدارية"]
  },
  {
    name: "كلية التربية والعلوم الإنسانية",
    slug: "education-humanities",
    location: "Hajjah",
    majors: ["القرآن الكريم", "الدراسات الإسلامية", "اللغة العربية", "معلم حاسوب", "معلم صف", "الفيزياء", "الكيمياء", "الرياضيات", "اللغة الإنجليزية", "الجغرافيا والسياحة", "التاريخ والآثار", "علوم الحياة"]
  },
  {
    name: "كلية الزراعة والطب البيطري - عبس",
    slug: "agriculture-veterinary",
    location: "Abs",
    majors: ["بساتين", "محاصيل", "إنتاج نباتي", "إنتاج حيواني", "علوم الأغذية", "تقانة زراعية", "الطب البيطري"]
  },
  {
    name: "مركز التدريب وخدمة المجتمع",
    slug: "training-community",
    location: "Hajjah",
    majors: ["دبلوم مختبرات", "دبلوم صيدلة", "دبلوم رعاية تنفسية", "دبلوم طب طوارئ", "دبلوم تمريض", "دبلوم العلاج الطبيعي"]
  }
];

async function main() {
  console.log('Clearing existing database tables...');
  await prisma.seatAllocation.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.verificationCode.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.scheduleOverride.deleteMany();
  await prisma.notificationLog.deleteMany();
  await prisma.rescheduleRequest.deleteMany();
  await prisma.student.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.examSchedule.deleteMany();
  await prisma.lecturer.deleteMany();
  await prisma.room.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.group.deleteMany();
  await prisma.level.deleteMany();
  await prisma.major.deleteMany();
  await prisma.department.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.college.deleteMany();
  await prisma.university.deleteMany();
  console.log('All tables cleared.');

  console.log('Creating Hajjah University...');
  const university = await prisma.university.create({
    data: {
      name: "جامعة حجة",
      slug: "hajjah-university",
      logoUrl: "/hajjah-logo.png",
      themeColor: "#1e3a8a"
    }
  });

  console.log('Creating Al-Manar University...');
  const almanarUniversity = await prisma.university.create({
    data: {
      name: "كلية المنار الجامعية",
      slug: "almanar-college",
      logoUrl: null,
      themeColor: "#059669"
    }
  });

  const almanarCollege = await prisma.college.create({
    data: {
      name: "كلية المنار الجامعية",
      slug: "almanar-main",
      location: "Sanaa",
      universityId: almanarUniversity.id
    }
  });

  const allMajors = [];
  const createdColleges = [];

  console.log('Creating Colleges, Departments, and Majors...');
  for (const config of collegesConfig) {
    const college = await prisma.college.create({
      data: {
        name: config.name,
        slug: config.slug,
        location: config.location,
        universityId: university.id
      }
    });
    createdColleges.push(college);
    console.log(`College created: ${college.name} (Slug: ${college.slug}, Location: ${college.location})`);

    const dept = await prisma.department.create({
      data: {
        name: college.name,
        collegeId: college.id
      }
    });

    for (const majorName of config.majors) {
      const major = await prisma.major.create({
        data: {
          name: majorName,
          departmentId: dept.id
        }
      });
      allMajors.push({ ...major, collegeId: college.id });
    }
  }
  console.log('Colleges, Departments, and Majors successfully seeded.');

  const appliedCollege = createdColleges.find(c => c.slug === 'applied-sciences') || createdColleges[0];

  // Create SUPER_ADMIN Account
  console.log('Creating SUPER_ADMIN user...');
  const superAdminPasswordHash = await bcrypt.hash('securepassword', 10);
  const superAdmin = await prisma.admin.create({
    data: {
      name: 'Chief Architect',
      email: 'developer@mghal.com',
      password: superAdminPasswordHash,
      role: 'SUPER_ADMIN'
    }
  });
  console.log(`SUPER_ADMIN created: ${superAdmin.email} (Role: SUPER_ADMIN)`);

  // Create standard ADMIN Account
  console.log('Creating standard ADMIN user for Applied Sciences college...');
  const adminPasswordHash = await bcrypt.hash('12345678', 10);
  const standardAdmin = await prisma.admin.create({
    data: {
      name: 'Applied Sciences Admin',
      email: 'admin.applied@manar.edu',
      password: adminPasswordHash,
      role: 'ADMIN',
      collegeId: appliedCollege.id
    }
  });
  console.log(`Standard ADMIN created: ${standardAdmin.email} (College: ${appliedCollege.name})`);

  // Create Lecturers
  console.log('Creating Lecturers...');
  const lecturerNames = [
    'أ. افنان الشرفي', 'د. عبد الرزاق الأهدل', 'أ. سبأ زمام', 'أ. إجلال المحن',
    'أ. منير مفتاح', 'د. احمد الناشري', 'د. عدنان الصلوي', 'أ. فارس الأعور',
    'د. يحيى العبدلي', 'د. عبد الله قشوة'
  ];
  const lecturerPasswordHash = await bcrypt.hash('12345678', 10);
  const lecturersMap = {};
  for (let idx = 0; idx < lecturerNames.length; idx++) {
    const name = lecturerNames[idx];
    const email = `lecturer.${idx + 1}@manar.edu`;
    const lecturer = await prisma.lecturer.create({
      data: {
        name,
        email,
        password: lecturerPasswordHash,
        phone: `+9677800000${idx + 1}`,
        collegeId: appliedCollege.id
      }
    });
    lecturersMap[name] = lecturer;
  }

  // Create Rooms
  console.log('Creating Rooms...');
  const roomsData = [
    { name: 'قاعة 1', capacity: 45 },
    { name: 'قاعة 2', capacity: 45 },
    { name: 'قاعة 3', capacity: 45 },
    { name: 'قاعة 4', capacity: 45 },
    { name: 'قاعة 5', capacity: 45 },
    { name: 'قاعة 6', capacity: 45 },
    { name: 'قاعة 7', capacity: 45 },
    { name: 'قاعة 8', capacity: 45 },
    { name: 'مختبر الحاسوب 1', capacity: 30 },
    { name: 'مختبر الشبكات 2', capacity: 30 }
  ];
  const rooms = [];
  for (const rData of roomsData) {
    const rm = await prisma.room.create({
      data: { name: rData.name, capacity: rData.capacity, collegeId: appliedCollege.id }
    });
    rooms.push(rm);
  }

  // Create Levels
  console.log('Creating Levels...');
  const levels = [];
  for (let i = 1; i <= 4; i++) {
    const lvl = await prisma.level.create({ data: { name: `Level ${i}` } });
    levels.push(lvl);
  }

  // Create Groups
  console.log('Creating Groups...');
  const groupsList = [];
  const groupNames = ['مجموعة أ (نظري)', 'مجموعة ب (عملي 1)', 'مجموعة ج (عملي 2)'];
  for (const gName of groupNames) {
    const grp = await prisma.group.create({ data: { name: gName, collegeId: appliedCollege.id } });
    groupsList.push(grp);
  }

  // Seed Subjects
  console.log('Creating Subjects...');
  const subjectsData = [
    { name: 'تصميم مواقع الويب', code: 'IT-2026-WEB', type: 'THEORY' },
    { name: 'البرمجة المرئية', code: 'IT-2026-VISUAL', type: 'THEORY' },
    { name: 'نظم التشغيل', code: 'IT-2026-OS', type: 'THEORY' },
    { name: 'التصميم المنطقي الرقمي', code: 'IT-2026-DIGITAL', type: 'THEORY' },
    { name: 'هياكل البيانات والخوارزميات', code: 'IT-2026-DS', type: 'THEORY' },
    { name: 'القانون الاداري', code: 'HUM-2026-ADMIN-LAW', type: 'THEORY' },
    { name: 'محاسبة شركة اموال', code: 'HUM-2026-ACC', type: 'THEORY' },
    { name: 'إدارة الإنتاج والعمليات', code: 'HUM-2026-PROD', type: 'THEORY' },
    { name: 'مالية عامة', code: 'HUM-2026-FINANCE', type: 'THEORY' },
    { name: 'تطبيقات قواعد بيانات (1)', code: 'IT-2026-DB1-PRAC', type: 'PRACTICAL' },
    { name: 'تطبيقات قواعد بيانات (2)', code: 'IT-2026-DB2-PRAC', type: 'PRACTICAL' },
    { name: 'تطبيقات أنظمة التشغيل', code: 'IT-2026-OS-PRAC', type: 'PRACTICAL' },
    { name: 'تطبيقات تصميم مواقع الويب', code: 'IT-2026-WEB-PRAC', type: 'PRACTICAL' },
    { name: 'تطبيقات التصميم المنطقي الرقمي', code: 'IT-2026-DIGITAL-PRAC', type: 'PRACTICAL' },
    { name: 'تطبيقات هياكل البيانات', code: 'IT-2026-DS-PRAC', type: 'PRACTICAL' }
  ];
  const subjectsMap = {};
  for (const sub of subjectsData) {
    const s = await prisma.subject.create({
      data: { name: sub.name, code: sub.code, type: sub.type, collegeId: appliedCollege.id }
    });
    subjectsMap[sub.name] = s;
  }

  // Create Schedules
  console.log('Creating Schedules...');
  const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const todayDayName = daysOfWeek[new Date().getDay()];

  const dynamicSchedules = [
    { subjectName: 'تصميم مواقع الويب', lecturer: 'أ. افنان الشرفي', roomName: 'قاعة 8', day: todayDayName, startTime: '08:00', endTime: '10:00', groupNames: ['مجموعة أ (نظري)'] },
    { subjectName: 'البرمجة المرئية', lecturer: 'د. عبد الرزاق الأهدل', roomName: 'قاعة 1', day: todayDayName, startTime: '10:00', endTime: '12:00', groupNames: ['مجموعة أ (نظري)'] },
    { subjectName: 'تطبيقات قواعد بيانات (1)', lecturer: 'أ. سبأ زمام', roomName: 'مختبر الحاسوب 1', day: todayDayName, startTime: '12:00', endTime: '14:00', groupNames: ['مجموعة ب (عملي 1)'] },
    { subjectName: 'تطبيقات أنظمة التشغيل', lecturer: 'أ. إجلال المحن', roomName: 'مختبر الشبكات 2', day: todayDayName, startTime: '14:00', endTime: '16:00', groupNames: ['مجموعة ج (عملي 2)'] },

    { subjectName: 'نظم التشغيل', lecturer: 'د. عبد الرزاق الأهدل', roomName: 'قاعة 1', day: 'WEDNESDAY', startTime: '08:00', endTime: '10:00', groupNames: ['مجموعة أ (نظري)'] },
    { subjectName: 'التصميم المنطقي الرقمي', lecturer: 'أ. منير مفتاح', roomName: 'قاعة 1', day: 'WEDNESDAY', startTime: '10:00', endTime: '12:00', groupNames: ['مجموعة أ (نظري)'] },
    { subjectName: 'هياكل البيانات والخوارزميات', lecturer: 'د. احمد الناشري', roomName: 'قاعة 6', day: 'THURSDAY', startTime: '08:00', endTime: '10:00', groupNames: ['مجموعة أ (نظري)'] },
    { subjectName: 'القانون الاداري', lecturer: 'د. عدنان الصلوي', roomName: 'قاعة 3', day: 'SUNDAY', startTime: '08:00', endTime: '10:00', groupNames: ['مجموعة أ (نظري)'] },
    { subjectName: 'محاسبة شركة اموال', lecturer: 'أ. فارس الأعور', roomName: 'قاعة 1', day: 'SUNDAY', startTime: '10:00', endTime: '12:00', groupNames: ['مجموعة أ (نظري)'] },
    { subjectName: 'إدارة الإنتاج والعمليات', lecturer: 'د. يحيى العبدلي', roomName: 'قاعة 5', day: 'MONDAY', startTime: '10:00', endTime: '12:00', groupNames: ['مجموعة أ (نظري)'] },
    { subjectName: 'مالية عامة', lecturer: 'د. عبد الله قشوة', roomName: 'قاعة 8', day: 'TUESDAY', startTime: '08:00', endTime: '10:00', groupNames: ['مجموعة أ (نظري)'] }
  ];

  const schedulesToCreate = [];
  for (const item of dynamicSchedules) {
    const room = rooms.find(r => r.name === item.roomName);
    const subject = subjectsMap[item.subjectName];
    const lecturer = lecturersMap[item.lecturer];
    if (!room || !subject) continue;

    for (const gName of item.groupNames) {
      const group = groupsList.find(g => g.name === gName);
      if (!group) continue;

      schedulesToCreate.push({
        subjectId: subject.id,
        roomId: room.id,
        lecturerName: item.lecturer,
        lecturerId: lecturer ? lecturer.id : null,
        groupId: group.id,
        dayOfWeek: item.day,
        startTime: item.startTime,
        endTime: item.endTime,
        collegeId: appliedCollege.id
      });
    }
  }
  await prisma.schedule.createMany({ data: schedulesToCreate });
  console.log(`Seeded ${schedulesToCreate.length} schedules.`);

  // Generate 300 realistic students
  console.log('Generating 300 realistic dummy students...');
  const firstNames = [
    'احمد', 'خالد', 'فاطمة', 'سارة', 'محمد', 'علي', 'عمر', 'عثمان',
    'صالح', 'عبدالله', 'زينب', 'منى', 'ياسمين', 'رنا', 'حمزة', 'بلال',
    'ياسر', 'سعيد', 'حسن', 'حسين', 'مريم', 'أروى', 'نهى', 'ريهام',
    'طارق', 'ماجد', 'سلطان', 'فيصل', 'سلمان', 'نورة', 'هيفاء', 'شهد',
    'مصطفى', 'عبد الرحمن', 'ابراهيم', 'شروق', 'روان', 'هند', 'بثينة', 'عادل'
  ];
  const lastNames = [
    'الحداد', 'العولقي', 'اليماني', 'صالح', 'الناشري', 'المعمري', 'الأهدل', 'الشرفي',
    'مفتاح', 'عبدالله', 'الصلوي', 'العبدلي', 'قشوة', 'الرشيدي', 'العتيبي', 'الشمري',
    'الحربي', 'المطيري', 'الدوسري', 'القحطاني', 'الغامدي', 'الزهراني', 'المالكي', 'الشهري',
    'صبري', 'باعلوي', 'السقاف', 'الجابري', 'العمودي', 'باوزير', 'الشبامي', 'الحضرمي'
  ];

  const studentPasswordHash = await bcrypt.hash('12345678', 10);
  const studentsToCreate = [];

  for (let i = 1; i <= 300; i++) {
    const randFirst = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randLast = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${randFirst} ${randLast}`;

    const group = groupsList[(i - 1) % groupsList.length];
    const level = levels[(i - 1) % levels.length];
    const major = allMajors[(i - 1) % allMajors.length];

    studentsToCreate.push({
      name: fullName,
      email: `student.${i}@manar.edu`,
      password: studentPasswordHash,
      idNumber: `2026-${String(i).padStart(4, '0')}`,
      phone: `+96777${String(i).padStart(7, '0')}`,
      isEmailVerified: true,
      isPhoneVerified: true,
      collegeId: major.collegeId,
      majorId: major.id,
      levelId: level.id,
      groupId: group.id
    });
  }

  console.log('Bulk inserting 300 students into the database...');
  await prisma.student.createMany({ data: studentsToCreate });
  console.log('300 dummy students successfully seeded! (Password for all students: 12345678)');

  console.log('Seeding process completed successfully.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error('Error during seeding:', e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
