require('dotenv').config();

const url = process.env.DATABASE_URL;
console.log('DATABASE_URL length:', url.length);
console.log('DATABASE_URL chars:');
for (let i = 0; i < url.length; i++) {
  console.log(`${i}: ${JSON.stringify(url[i])} (code ${url.charCodeAt(i)})`);
}
