const { Pool } = require('pg');
const dns = require('dns').promises;

const indices = [0, 1, 2, 3];
const region = 'ap-southeast-2';

async function test(index) {
  const host = `aws-${index}-${region}.pooler.supabase.com`;
  try {
    const addrs = await dns.resolve(host);
    console.log(`Host ${host} resolves to:`, addrs);
  } catch (err) {
    console.log(`Host ${host} does NOT resolve:`, err.message);
    return;
  }

  const connectionString = `postgresql://postgres.kihimiekjuojrjaejtyk:m.gh.al.2006@${host}:6543/postgres`;
  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 5000,
    ssl: { rejectUnauthorized: false }
  });
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW()');
    console.log(`✅ SUCCESS for ${host}:`, res.rows[0]);
    client.release();
    await pool.end();
    return true;
  } catch (err) {
    console.error(`❌ FAILED for ${host}:`, err.message);
    await pool.end();
    return false;
  }
}

async function main() {
  for (const index of indices) {
    await test(index);
    console.log('--------------------');
  }
}

main();
