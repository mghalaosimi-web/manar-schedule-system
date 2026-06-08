require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('Running student query...');
    const students = await prisma.student.findMany({
      include: {
        major: true,
        group: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    console.log('Query Succeeded! Students count:', students.length);
  } catch (err) {
    console.error('DATABASE INVOCATION FAILED:');
    console.error(err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
