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
    console.log('1. Fetching departments...');
    const depts = await prisma.department.findMany();
    console.log('Departments:', depts.length);

    console.log('2. Fetching levels...');
    const lvls = await prisma.level.findMany();
    console.log('Levels:', lvls.length);

    console.log('3. Fetching groups...');
    const groups = await prisma.group.findMany();
    console.log('Groups:', groups.length);

  } catch (err) {
    console.error('Prisma test failed:');
    console.error(err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
