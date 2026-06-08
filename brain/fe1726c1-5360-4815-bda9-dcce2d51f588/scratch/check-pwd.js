const bcrypt = require('bcryptjs');

async function main() {
  const hash = '$2b$10$J8/S4jl8JWRUavO9qFySlOBHkAa7/98uy8m1yodMa1G9ViUSifOV6';
  const matches = await bcrypt.compare('student123', hash);
  console.log('Does "student123" match the student hash?', matches);
}

main();
