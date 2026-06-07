const { Pool } = require('pg');

const hosts = [
  'aws-0-ap-southeast-2.pooler.supabase.com',
  'aws-0-ap-east-1.pooler.supabase.com',
  'aws-0-eu-west-2.pooler.supabase.com'
];

async function test(host, port) {
  const connectionString = `postgresql://postgres.kihimiekjuojrjaejtyk:m.gh.al.2006@${host}:${port}/postgres`;
  console.log(`Testing ${host}:${port}...`);
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
  for (const host of hosts) {
    await test(host, 5432);
    await test(host, 6543);
    console.log('--------------------');
  }
}

main();
