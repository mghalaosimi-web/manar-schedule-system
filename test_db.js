const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://manar_db_yp8w_user:OkXm02eV5EShTnnypuJfuzdIof2zjfu9@dpg-d8isfpcvikkc73c6r1g0-a.frankfurt-postgres.render.com/manar_db_yp8w?sslmode=require",
  ssl: { rejectUnauthorized: false }
});

client.connect()
  .then(() => {
    console.log('Connected successfully!');
    return client.query('SELECT NOW()');
  })
  .then(res => {
    console.log('Query result:', res.rows[0]);
    return client.end();
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });
