require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set in env!');
    return;
  }
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const admins = await prisma.admin.findMany();
    console.log('--- ADMINS ---');
    console.log(admins.map(a => ({ id: a.id, name: a.name, email: a.email, role: a.role })));
    
    const students = await prisma.student.findMany({
      take: 5
    });
    console.log('--- STUDENTS (Up to 5) ---');
    console.log(students.map(s => ({ id: s.id, name: s.name, email: s.email, idNumber: s.idNumber })));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
