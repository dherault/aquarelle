const path = require('path')

const sharp = require('sharp')

const data = require('../data.json')

let minWidth = Infinity
let minHeight = Infinity

data.forEach(({ fileName }) => {
  sharp(path.join(__dirname, '../images', fileName))
  .metadata()
  .then(metadata => {
    console.log(fileName)
    if (metadata.width < minWidth) minWidth = metadata.width
    if (metadata.height < minHeight) minHeight = metadata.height
  })
})

setTimeout(() => {
  console.log('minWidth:', minWidth)
  console.log('minHeight:', minHeight)
}, 2000)
