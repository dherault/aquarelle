const fs = require('fs');
const path = require('path');
const data = require('../data.json');

const imagesDir = path.join(__dirname, '../images');

const files = fs.readdirSync(imagesDir);

console.log('files.length:', files.length);
console.log('data.length:', data.length);

const toDelete = [];

files.forEach(file => {
  if (!data.some(d => d.fileName === file)) toDelete.push(file);
});

console.log('toDelete:', toDelete);

toDelete.forEach(file => fs.unlinkSync(path.join(imagesDir, file)));
