const { Pool } = require('pg');

async function test(port) {
  const host = '[2406:da1c:61c:d601:e0a3:a4bd:b61d:cb66]';
  const connectionString = `postgresql://postgres:m.gh.al.2006@${host}:${port}/postgres`;
  console.log(`Testing direct IPv6 address to ${host}:${port}...`);
  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 5000,
    ssl: { rejectUnauthorized: false }
  });
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW()');
    console.log(`✅ SUCCESS for ${host}:${port}:`, res.rows[0]);
    client.release();
    await pool.end();
    return true;
  } catch (err) {
    console.error(`❌ FAILED for ${host}:${port}:`, err.message);
    await pool.end();
    return false;
  }
}

async function main() {
  await test(5432);
  await test(6543);
}

main();
