const fs = require('fs');
const path = require('path');
const open = require('open');

const files = fs.readdirSync(path.join(__dirname, '..', 'images'));
const jsVariable = value => `const images = ${JSON.stringify(value)}`;

fs.writeFile(path.join(__dirname, 'data.js'), jsVariable(files), err => {
  if (err) return console.error(err);
  open(path.join(__dirname, 'images.html'));
});
