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

async function upsertMajor(name, departmentId) {
  let major = await prisma.major.findFirst({
    where: { name, departmentId }
  });
  if (!major) {
    major = await prisma.major.create({
      data: { name, departmentId }
    });
  }
  return major;
}

async function upsertLevel(name) {
  let lvl = await prisma.level.findFirst({ where: { name } });
  if (!lvl) {
    lvl = await prisma.level.create({ data: { name } });
  }
  return lvl;
}

async function upsertGroup(name) {
  let grp = await prisma.group.findFirst({ where: { name } });
  if (!grp) {
    grp = await prisma.group.create({ data: { name } });
  }
  return grp;
}

async function main() {
  console.log('Clearing existing database tables...');
  await prisma.pushSubscription.deleteMany();
  await prisma.scheduleOverride.deleteMany();
  await prisma.notificationLog.deleteMany();
  await prisma.verificationCode.deleteMany();
  await prisma.student.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.room.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.group.deleteMany();
  await prisma.level.deleteMany();
  await prisma.major.deleteMany();
  await prisma.department.deleteMany();
  await prisma.admin.deleteMany();
  console.log('All tables cleared.');

  console.log('Seeding database with academic data...');

  // 1. Create Departments
  const itDept = await prisma.department.create({
    data: { name: 'كلية الحاسبات وتكنولوجيا المعلومات' }
  });
  console.log(`Department created: ${itDept.name}`);

  const humDept = await prisma.department.create({
    data: { name: 'كلية العلوم الإدارية والإنسانية' }
  });
  console.log(`Department created: ${humDept.name}`);

  // 2. Create Majors
  const majorsList = [];
  // IT Dept
  const itMajors = ['تقنية المعلومات', 'أمن سيبراني'];
  for (const majorName of itMajors) {
    const maj = await upsertMajor(majorName, itDept.id);
    majorsList.push(maj);
    console.log(`Major created: ${maj.name} (IT Department)`);
  }

  // Humanities Dept
  const humMajors = ['شريعة وقانون', 'محاسبة', 'إدارة صحية', 'إدارة أعمال'];
  for (const majorName of humMajors) {
    const maj = await upsertMajor(majorName, humDept.id);
    majorsList.push(maj);
    console.log(`Major created: ${maj.name} (Humanities Department)`);
  }

  // 3. Create Rooms
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
      data: { name: rData.name, capacity: rData.capacity }
    });
    rooms.push(rm);
    console.log(`Room created: ${rm.name} (Capacity: ${rm.capacity})`);
  }

  // 4. Create Levels
  const levels = [];
  for (let i = 1; i <= 4; i++) {
    const lvl = await upsertLevel(`Level ${i}`);
    levels.push(lvl);
    console.log(`Level created: ${lvl.name}`);
  }

  // 5. Create Groups
  const groupsList = [];
  const groupNames = ['مجموعة أ (نظري)', 'مجموعة ب (عملي 1)', 'مجموعة ج (عملي 2)'];
  for (const gName of groupNames) {
    const grp = await upsertGroup(gName);
    groupsList.push(grp);
    console.log(`Group created: ${grp.name}`);
  }

  // 6. Create SUPER_ADMIN Account
  const superAdminPasswordHash = await bcrypt.hash('708090', 10);
  const superAdmin = await prisma.admin.create({
    data: {
      name: 'mohammed',
      email: 'developer@mghal.com',
      password: superAdminPasswordHash,
      role: 'SUPER_ADMIN'
    }
  });
  console.log(`SUPER_ADMIN created: ${superAdmin.email} (Password: 708090)`);

  // 7. Seed Subjects
  console.log('Seeding subjects...');
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
      data: { name: sub.name, code: sub.code, type: sub.type }
    });
    subjectsMap[sub.name] = s;
  }
  console.log('Subjects seeded successfully.');

  // 8. Create Schedules (Dynamic: include "TODAY" for testing convenience)
  console.log('Preparing schedules data...');
  const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const todayDayName = daysOfWeek[new Date().getDay()];
  console.log(`Current local day is detected as: ${todayDayName}`);

  // We will schedule some lectures dynamically for TODAY, and others for static days
  const dynamicSchedules = [
    // 4 Lectures scheduled dynamically for TODAY
    { subjectName: 'تصميم مواقع الويب', lecturer: 'أ. افنان الشرفي', roomName: 'قاعة 8', day: todayDayName, startTime: '08:00', endTime: '10:00', groupNames: ['مجموعة أ (نظري)'] },
    { subjectName: 'البرمجة المرئية', lecturer: 'د. عبد الرزاق الأهدل', roomName: 'قاعة 1', day: todayDayName, startTime: '10:00', endTime: '12:00', groupNames: ['مجموعة أ (نظري)'] },
    { subjectName: 'تطبيقات قواعد بيانات (1)', lecturer: 'أ. سبأ زمام', roomName: 'مختبر الحاسوب 1', day: todayDayName, startTime: '12:00', endTime: '14:00', groupNames: ['مجموعة ب (عملي 1)'] },
    { subjectName: 'تطبيقات أنظمة التشغيل', lecturer: 'أ. إجلال المحن', roomName: 'مختبر الشبكات 2', day: todayDayName, startTime: '14:00', endTime: '16:00', groupNames: ['مجموعة ج (عملي 2)'] },

    // Other lectures spread throughout the week
    { subjectName: 'نظم التشغيل', lecturer: 'د. عبد الرزاق الأهدل', roomName: 'قاعة 1', day: 'WEDNESDAY', startTime: '08:00', endTime: '10:00', groupNames: ['مجموعة أ (نظري)'] },
    { subjectName: 'التصميم المنطقي الرقمي', lecturer: 'أ. منير مفتاح', roomName: 'قاعة 1', day: 'WEDNESDAY', startTime: '10:00', endTime: '12:00', groupNames: ['مجموعة أ (نظري)'] },
    { subjectName: 'هياكل البيانات والخوارزميات', lecturer: 'د. احمد الناشري', roomName: 'قاعة 6', day: 'THURSDAY', startTime: '08:00', endTime: '10:00', groupNames: ['مجموعة أ (نظري)'] },
    { subjectName: 'القانون الاداري', lecturer: 'د. عدنان الصلوي', roomName: 'قاعة 3', day: 'SUNDAY', startTime: '08:00', endTime: '10:00', groupNames: ['مجموعة أ (نظري)'] },
    { subjectName: 'محاسبة شركة اموال', lecturer: 'أ. فارس الأعور', roomName: 'قاعة 1', day: 'SUNDAY', startTime: '10:00', endTime: '12:00', groupNames: ['مجموعة أ (نظري)'] },
    { subjectName: 'إدارة الإنتاج والعمليات', lecturer: 'د. يحيى العبدلي', roomName: 'قاعة 5', day: 'MONDAY', startTime: '10:00', endTime: '12:00', groupNames: ['مجموعة أ (نظري)'] },
    { subjectName: 'مالية عامة', lecturer: 'د. عبد الله قشوة', roomName: 'قاعة 8', day: 'TUESDAY', startTime: '08:00', endTime: '10:00', groupNames: ['مجموعة أ (نظري)'] }
  ];

  const roomsMap = {};
  rooms.forEach(r => { roomsMap[r.name] = r; });

  const groupsMap = {};
  groupsList.forEach(g => { groupsMap[g.name] = g; });

  const schedulesToCreate = [];
  for (const item of dynamicSchedules) {
    const room = roomsMap[item.roomName];
    const subject = subjectsMap[item.subjectName];
    if (!room || !subject) continue;

    for (const gName of item.groupNames) {
      const group = groupsMap[gName];
      if (!group) continue;

      schedulesToCreate.push({
        subjectId: subject.id,
        roomId: room.id,
        lecturerName: item.lecturer,
        groupId: group.id,
        dayOfWeek: item.day,
        startTime: item.startTime,
        endTime: item.endTime
      });
    }
  }

  await prisma.schedule.createMany({ data: schedulesToCreate });
  console.log(`Seeded ${schedulesToCreate.length} schedules.`);

  // 9. Generate and seed 300 realistic dummy students
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

  // Hash student password once to save processing time during bulk generation
  const studentPasswordHash = await bcrypt.hash('12345678', 10);
  const studentsToCreate = [];

  for (let i = 1; i <= 300; i++) {
    const randFirst = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randLast = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${randFirst} ${randLast}`;

    // Cycle through groups, levels, and majors evenly
    const group = groupsList[(i - 1) % groupsList.length];
    const level = levels[(i - 1) % levels.length];
    const major = majorsList[(i - 1) % majorsList.length];

    studentsToCreate.push({
      name: fullName,
      email: `student.${i}@manar.edu`,
      password: studentPasswordHash,
      idNumber: `2026-${String(i).padStart(4, '0')}`,
      phone: `+96777${String(i).padStart(7, '0')}`,
      isEmailVerified: true,
      isPhoneVerified: true,
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
