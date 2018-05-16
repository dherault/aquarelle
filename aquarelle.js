const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const uuid = require('uuid').v4;
const data = require('data.json');

// From checkDimensions
const maxWidth = 500;
const maxHeight = 326;

function aquarelle(width, height, saveDirectory) {
  if (width < maxWidth || height < maxHeight) throw new Error('Given dimensions are too large.');
  if (typeof saveDirectory !== 'String') throw new Error('Need to specify an output folder.');

  const metadata = data[Math.floor(Math.random() * data.length)];
  const filePath = path.join(__dirname, 'images', metadata.fileName);

  const image = sharp(filePath);

  image
  .metadata()
  .then(metadata => {
    image
    .extract({
      top: Math.floor(Math.random() * (metadata.height - height));
      left: Math.floor(Math.random() * (metadata.width - width));
      width,
      height,
    })
    .toFile(path.join(saveDirectory, `${uuid()}.jpg`));
  });
}

module.exports = aquarelle;
