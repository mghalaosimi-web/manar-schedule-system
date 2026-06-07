const { Pool } = require('pg');

const regions = [
  'ap-southeast-2', // Sydney - highly likely
  'eu-north-1',
  'us-east-2',
  'ap-east-1',
  'me-south-1',
  'eu-central-1',
  'us-east-1',
  'ap-southeast-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'us-west-2',
  'us-west-1',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-south-1',
  'sa-east-1',
  'ca-central-1'
];

async function testConnection(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const connectionString = `postgresql://postgres.kihimiekjuojrjaejtyk:m.gh.al.2006@${host}:6543/postgres?pgbouncer=true`;
  console.log(`Testing region: ${region} (${host})...`);
  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 5000,
    ssl: { rejectUnauthorized: false }
  });
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW()');
    console.log(`✅ SUCCESS for ${region}:`, res.rows[0]);
    client.release();
    await pool.end();
    return connectionString;
  } catch (err) {
    console.error(`❌ FAILED for ${region}:`, err.message);
    await pool.end();
    return null;
  }
}

async function main() {
  for (const region of regions) {
    const successUrl = await testConnection(region);
    if (successUrl) {
      console.log(`\n🎉 Found working connection string:\n${successUrl}`);
      break;
    }
  }
}

main();
