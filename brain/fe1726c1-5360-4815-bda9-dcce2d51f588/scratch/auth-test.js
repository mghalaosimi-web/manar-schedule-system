require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const admin = await prisma.admin.findFirst({
      where: {
        OR: [
          { email: 'mohammed' },
          { name: 'mohammed' }
        ]
      }
    });
    console.log('Found Admin:', admin ? { id: admin.id, name: admin.name, email: admin.email } : 'None');

    if (admin) {
      const isMatch = await bcrypt.compare('708090', admin.password);
      console.log('Password "708090" matches:', isMatch);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
