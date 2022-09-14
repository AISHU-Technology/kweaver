const fs = require('fs');
const path = require('path');
const open = require('open');

const files = fs.readdirSync(path.join(__dirname, '..', 'images'));
const jsVariable = value => `const images = ${JSON.stringify(value)}`;
console.log(`一共有${files.length}张图片`);

fs.writeFile(path.join(__dirname, 'data.js'), jsVariable(files), err => {
  if (err) return console.error(err);
  open(path.join(__dirname, 'images.html'));
});
