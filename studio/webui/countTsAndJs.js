const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, 'src');

const tsList = [];
const jsList = [];
const ignoreDir = ['assets'];
const readDirSync = _path => {
  const pa = fs.readdirSync(_path);
  pa.forEach(item => {
    const info = fs.statSync(`${_path}/${item}`);
    if (info.isDirectory() && !ignoreDir.includes(item)) {
      readDirSync(path.join(_path, item));
    } else {
      if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        tsList.push(item);
      }
      if (item.endsWith('.js')) {
        jsList.push(item);
      }
    }
  });
};

readDirSync(root);
console.log('ts文件数量', tsList.length);
console.log('js文件数量', jsList.length);
