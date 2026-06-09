require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function verify() {
  console.log('--- DB Verification ---');
  const countSubjects = await prisma.subject.count();
  const countRooms = await prisma.room.count();
  const countSchedules = await prisma.schedule.count();

  console.log(`Subjects in DB: ${countSubjects}`);
  console.log(`Rooms in DB: ${countRooms}`);
  console.log(`Schedules in DB: ${countSchedules}`);

  const schedules = await prisma.schedule.findMany({
    include: {
      subject: true,
      room: true,
      group: true
    }
  });

  console.log('\n--- Detailed Schedules list ---');
  schedules.forEach(s => {
    console.log(`[${s.dayOfWeek}] ${s.startTime} - ${s.endTime} | Subject: ${s.subject.name} (${s.subject.type}) | Lecturer: ${s.lecturerName} | Room: ${s.room.name} | Group: ${s.group.name}`);
  });
}

verify()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
  });
