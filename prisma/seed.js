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

  // 3. Create 8 Rooms (6 Lecture Rooms, 2 Labs)
  const rooms = [
    { name: 'قاعة 1', capacity: 45 },
    { name: 'قاعة 2', capacity: 45 },
    { name: 'قاعة 3', capacity: 45 },
    { name: 'قاعة 4', capacity: 45 },
    { name: 'قاعة 5', capacity: 45 },
    { name: 'قاعة 6', capacity: 45 },
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
  const superAdminPasswordHash = await bcrypt.hash('securepassword', 10);
  const superAdmin = await prisma.admin.upsert({
    where: { email: 'developer@mghal.com' },
    update: {
      password: superAdminPasswordHash,
      role: 'SUPER_ADMIN'
    },
    create: {
      name: 'Chief Architect',
      email: 'developer@mghal.com',
      password: superAdminPasswordHash,
      role: 'SUPER_ADMIN'
    }
  });
  console.log(`SUPER_ADMIN upserted: ${superAdmin.email}`);

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
