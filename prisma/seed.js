const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/manardb?schema=public";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');
  
  // 1. Create Default Admin
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@manar.edu' },
    update: {},
    create: {
      name: 'System Administrator',
      email: 'admin@manar.edu',
      password: adminPasswordHash
    }
  });
  console.log(`Created admin: ${admin.email}`);

  // 2. Create Department
  const dept = await prisma.department.upsert({
    where: { name: 'IT' },
    update: {},
    create: {
      name: 'IT'
    }
  });
  console.log(`Created department: ${dept.name}`);

  // 3. Create Major (idempotent check)
  let major = await prisma.major.findFirst({ where: { name: 'Cyber Security' } });
  if (!major) {
    major = await prisma.major.create({
      data: {
        name: 'Cyber Security',
        departmentId: dept.id
      }
    });
  }
  console.log(`Created major: ${major.name}`);

  // 4. Create Level
  let level = await prisma.level.findFirst({ where: { name: 'Level 3' } });
  if (!level) {
    level = await prisma.level.create({
      data: {
        name: 'Level 3'
      }
    });
  }
  console.log(`Created level: ${level.name}`);

  // 5. Create Group
  let group = await prisma.group.findFirst({ where: { name: 'Group A' } });
  if (!group) {
    group = await prisma.group.create({
      data: {
        name: 'Group A'
      }
    });
  }
  console.log(`Created group: ${group.name}`);

  // 6. Create Room
  let room = await prisma.room.findUnique({ where: { name: 'Room 101' } });
  if (!room) {
    room = await prisma.room.create({
      data: {
        name: 'Room 101',
        capacity: 45
      }
    });
  }
  console.log(`Created room: ${room.name}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
    console.log('Seeding complete.');
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
