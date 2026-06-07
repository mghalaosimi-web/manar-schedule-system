const { Pool } = require('pg');

async function test(port) {
  const host = 'aws-1-ap-southeast-2.pooler.supabase.com';
  // URL encode the password to see if it bypasses any pooler parser issues
  const connectionString = `postgresql://postgres.kihimiekjuojrjaejtyk:m%2Egh%2Eal%2E2006@${host}:${port}/postgres`;
  console.log(`Testing ${host}:${port} with URL encoded password...`);
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
