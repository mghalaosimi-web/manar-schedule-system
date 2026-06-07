require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

client.connect()
  .then(() => Promise.all([
    client.query('SELECT COUNT(*)::int as count FROM "Major"'),
    client.query('SELECT COUNT(*)::int as count FROM "Room"'),
    client.query('SELECT * FROM "Major"'),
    client.query('SELECT * FROM "Room"')
  ]))
  .then(([majorsCount, roomsCount, majors, rooms]) => {
    console.log('Majors Count:', majorsCount.rows[0].count);
    console.log('Rooms Count:', roomsCount.rows[0].count);
    console.log('Majors:', majors.rows.map(m => m.name));
    console.log('Rooms:', rooms.rows.map(r => r.name));
    return client.end();
  })
  .catch(err => {
    console.error('Verification failed:', err);
    client.end().catch(() => {});
  });
