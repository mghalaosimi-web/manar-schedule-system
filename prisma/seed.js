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
  const itDept = await prisma.department.upsert({
    where: { name: 'كلية الحاسبات وتكنولوجيا المعلومات' },
    update: {},
    create: { name: 'كلية الحاسبات وتكنولوجيا المعلومات' }
  });
  console.log(`Department upserted: ${itDept.name}`);

  const humDept = await prisma.department.upsert({
    where: { name: 'كلية العلوم الإدارية والإنسانية' },
    update: {},
    create: { name: 'كلية العلوم الإدارية والإنسانية' }
  });
  console.log(`Department upserted: ${humDept.name}`);

  // 2. Create 6 Majors
  // IT Dept
  const itMajors = ['تقنية المعلومات', 'أمن سيبراني'];
  for (const majorName of itMajors) {
    const maj = await upsertMajor(majorName, itDept.id);
    console.log(`Major upserted: ${maj.name} (IT Department)`);
  }

  // Humanities Dept
  const humMajors = ['شريعة وقانون', 'محاسبة', 'إدارة صحية', 'إدارة أعمال'];
  for (const majorName of humMajors) {
    const maj = await upsertMajor(majorName, humDept.id);
    console.log(`Major upserted: ${maj.name} (Humanities Department)`);
  }

  // 3. Create 10 Rooms (8 Lecture Rooms, 2 Labs)
  const rooms = [
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

  for (const roomData of rooms) {
    const rm = await prisma.room.upsert({
      where: { name: roomData.name },
      update: { capacity: roomData.capacity },
      create: { name: roomData.name, capacity: roomData.capacity }
    });
    console.log(`Room upserted: ${rm.name} (Capacity: ${rm.capacity})`);
  }

  // 4. Create Levels 1 to 4
  for (let i = 1; i <= 4; i++) {
    const lvlName = `Level ${i}`;
    const lvl = await upsertLevel(lvlName);
    console.log(`Level upserted: ${lvl.name}`);
  }

  // 5. Create Groups
  const groupNames = ['مجموعة أ (نظري)', 'مجموعة ب (عملي 1)', 'مجموعة ج (عملي 2)'];
  for (const gName of groupNames) {
    const grp = await upsertGroup(gName);
    console.log(`Group upserted: ${grp.name}`);
  }

  // 6. Create SUPER_ADMIN Account
  const superAdminPasswordHash = await bcrypt.hash('708090', 10);
  const superAdmin = await prisma.admin.upsert({
    where: { email: 'developer@mghal.com' },
    update: {
      name: 'mohammed',
      password: superAdminPasswordHash,
      role: 'SUPER_ADMIN'
    },
    create: {
      name: 'mohammed',
      email: 'developer@mghal.com',
      password: superAdminPasswordHash,
      role: 'SUPER_ADMIN'
    }
  });
  console.log(`SUPER_ADMIN upserted: ${superAdmin.email}`);

  // 7. Seed Subjects for 2026 Academic Year (THEORY and PRACTICAL)
  console.log('Seeding subjects...');
  const subjectsData = [
    // Theory Subjects
    { name: 'تصميم مواقع الويب', code: 'IT-2026-WEB', type: 'THEORY' },
    { name: 'البرمجة المرئية', code: 'IT-2026-VISUAL', type: 'THEORY' },
    { name: 'نظم التشغيل', code: 'IT-2026-OS', type: 'THEORY' },
    { name: 'التصميم المنطقي الرقمي', code: 'IT-2026-DIGITAL', type: 'THEORY' },
    { name: 'هياكل البيانات والخوارزميات', code: 'IT-2026-DS', type: 'THEORY' },
    { name: 'القانون الاداري', code: 'HUM-2026-ADMIN-LAW', type: 'THEORY' },
    { name: 'محاسبة شركة اموال', code: 'HUM-2026-ACC', type: 'THEORY' },
    { name: 'إدارة الإنتاج والعمليات', code: 'HUM-2026-PROD', type: 'THEORY' },
    { name: 'مالية عامة', code: 'HUM-2026-FINANCE', type: 'THEORY' },

    // Practical Subjects
    { name: 'تطبيقات قواعد بيانات (1)', code: 'IT-2026-DB1-PRAC', type: 'PRACTICAL' },
    { name: 'تطبيقات قواعد بيانات (2)', code: 'IT-2026-DB2-PRAC', type: 'PRACTICAL' },
    { name: 'تطبيقات أنظمة التشغيل', code: 'IT-2026-OS-PRAC', type: 'PRACTICAL' },
    { name: 'تطبيقات تصميم مواقع الويب', code: 'IT-2026-WEB-PRAC', type: 'PRACTICAL' },
    { name: 'تطبيقات التصميم المنطقي الرقمي', code: 'IT-2026-DIGITAL-PRAC', type: 'PRACTICAL' },
    { name: 'تطبيقات هياكل البيانات', code: 'IT-2026-DS-PRAC', type: 'PRACTICAL' }
  ];

  const subjects = {};
  for (const sub of subjectsData) {
    const s = await prisma.subject.upsert({
      where: { code: sub.code },
      update: { name: sub.name, type: sub.type },
      create: { name: sub.name, code: sub.code, type: sub.type }
    });
    subjects[sub.name] = s;
  }
  console.log('Subjects seeded successfully.');

  // Fetch all rooms from DB to build a map
  const roomsInDb = await prisma.room.findMany();
  const roomsMap = {};
  roomsInDb.forEach(r => {
    roomsMap[r.name] = r;
  });

  // Fetch all groups from DB to build a map
  const groupsInDb = await prisma.group.findMany();
  const groupsMap = {};
  groupsInDb.forEach(g => {
    groupsMap[g.name] = g;
  });

  // 8. Create Schedules for 2026 Academic Year
  console.log('Preparing schedules data...');
  const theorySchedules = [
    { subjectName: 'تصميم مواقع الويب', lecturer: 'أ. افنان الشرفي', roomName: 'قاعة 8', day: 'MONDAY', startTime: '08:00', endTime: '10:00', groupNames: ['مجموعة أ (نظري)'] },
    { subjectName: 'البرمجة المرئية', lecturer: 'د. عبد الرزاق الأهدل', roomName: 'قاعة 1', day: 'TUESDAY', startTime: '10:00', endTime: '12:00', groupNames: ['مجموعة أ (نظري)'] },
    { subjectName: 'نظم التشغيل', lecturer: 'د. عبد الرزاق الأهدل', roomName: 'قاعة 1', day: 'WEDNESDAY', startTime: '08:00', endTime: '10:00', groupNames: ['مجموعة أ (نظري)'] },
    { subjectName: 'التصميم المنطقي الرقمي', lecturer: 'أ. منير مفتاح', roomName: 'قاعة 1', day: 'WEDNESDAY', startTime: '10:00', endTime: '12:00', groupNames: ['مجموعة أ (نظري)'] },
    { subjectName: 'هياكل البيانات والخوارزميات', lecturer: 'د. احمد الناشري', roomName: 'قاعة 6', day: 'THURSDAY', startTime: '08:00', endTime: '10:00', groupNames: ['مجموعة أ (نظري)'] },

    { subjectName: 'القانون الاداري', lecturer: 'د. عدنان الصلوي', roomName: 'قاعة 3', day: 'SUNDAY', startTime: '08:00', endTime: '10:00', groupNames: ['مجموعة أ (نظري)'] },
    { subjectName: 'محاسبة شركة اموال', lecturer: 'أ. فارس الأعور', roomName: 'قاعة 1', day: 'SUNDAY', startTime: '10:00', endTime: '12:00', groupNames: ['مجموعة أ (نظري)'] },
    { subjectName: 'إدارة الإنتاج والعمليات', lecturer: 'د. يحيى العبدلي', roomName: 'قاعة 5', day: 'MONDAY', startTime: '10:00', endTime: '12:00', groupNames: ['مجموعة أ (نظري)'] },
    { subjectName: 'مالية عامة', lecturer: 'د. عبد الله قشوة', roomName: 'قاعة 8', day: 'TUESDAY', startTime: '08:00', endTime: '10:00', groupNames: ['مجموعة أ (نظري)'] }
  ];

  const practicalSchedules = [
    { subjectName: 'تطبيقات قواعد بيانات (1)', lecturer: 'أ. سبأ زمام', roomName: 'مختبر الحاسوب 1', day: 'SATURDAY', startTime: '10:00', endTime: '12:00', groupNames: ['مجموعة ب (عملي 1)', 'مجموعة ج (عملي 2)'] },
    { subjectName: 'تطبيقات قواعد بيانات (2)', lecturer: 'أ. سبأ زمام', roomName: 'مختبر الحاسوب 1', day: 'SATURDAY', startTime: '12:00', endTime: '14:00', groupNames: ['مجموعة ب (عملي 1)', 'مجموعة ج (عملي 2)'] },
    { subjectName: 'تطبيقات أنظمة التشغيل', lecturer: 'أ. إجلال المحن', roomName: 'مختبر الشبكات 2', day: 'SUNDAY', startTime: '10:00', endTime: '12:00', groupNames: ['مجموعة ب (عملي 1)', 'مجموعة ج (عملي 2)'] },
    { subjectName: 'تطبيقات تصميم مواقع الويب', lecturer: 'أ. افنان الشرفي', roomName: 'مختبر الحاسوب 1', day: 'MONDAY', startTime: '10:00', endTime: '12:00', groupNames: ['مجموعة ب (عملي 1)', 'مجموعة ج (عملي 2)'] },
    { subjectName: 'تطبيقات التصميم المنطقي الرقمي', lecturer: 'أ. منير مفتاح', roomName: 'مختبر الحاسوب 1', day: 'WEDNESDAY', startTime: '10:00', endTime: '12:00', groupNames: ['مجموعة ب (عملي 1)', 'مجموعة ج (عملي 2)'] },
    { subjectName: 'تطبيقات هياكل البيانات', lecturer: 'أ. سمر بدر', roomName: 'مختبر الشبكات 2', day: 'WEDNESDAY', startTime: '12:00', endTime: '14:00', groupNames: ['مجموعة ب (عملي 1)', 'مجموعة ج (عملي 2)'] }
  ];

  const allSchedulesToCreate = [];
  const combinedSchedules = [...theorySchedules, ...practicalSchedules];

  for (const item of combinedSchedules) {
    const room = roomsMap[item.roomName];
    const subject = subjects[item.subjectName];
    if (!room) throw new Error(`Room ${item.roomName} not found during seeding.`);
    if (!subject) throw new Error(`Subject ${item.subjectName} not found during seeding.`);

    for (const gName of item.groupNames) {
      const group = groupsMap[gName];
      if (!group) throw new Error(`Group ${gName} not found during seeding.`);

      allSchedulesToCreate.push({
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

  console.log(`Bulk inserting ${allSchedulesToCreate.length} schedules...`);
  await prisma.schedule.createMany({
    data: allSchedulesToCreate
  });
  console.log('Schedules seeded successfully.');

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
