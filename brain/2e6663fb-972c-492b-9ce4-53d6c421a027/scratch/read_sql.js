const fs = require('fs');
const content = fs.readFileSync('init.sql', 'utf16le');
console.log(content.slice(0, 1000));
