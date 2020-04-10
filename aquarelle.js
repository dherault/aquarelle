const path = require('path')
const sharp = require('sharp')
const uuid = require('uuid').v4

const data = require('./data.json')

// From checkDimensions
const maxWidth = 500
const maxHeight = 326

function aquarelle(width, height, saveDirectory) {
  if (width > maxWidth || height > maxHeight) throw new Error('Given dimensions are too large.')
  if (typeof saveDirectory !== 'string') throw new Error('You need to specify an output folder.')

  const inputMetadata = data[Math.floor(Math.random() * data.length)]
  const inputFilePath = path.join(__dirname, 'images', inputMetadata.fileName)

  const image = sharp(inputFilePath)
  const outputFileName = `${uuid()}.png`
  const outputFilePath = path.join(saveDirectory, outputFileName)

  return image
  .metadata()
  .then(metadata => image
    .extract({
      top: Math.floor(Math.random() * (metadata.height - height)),
      left: Math.floor(Math.random() * (metadata.width - width)),
      width,
      height,
    })
    .stats()
    .then(({ channels }) => {
      const r = channels[0].mean
      const g = channels[1].mean
      const b = channels[2].mean
      const sdr = channels[0].stdev
      const sdg = channels[1].stdev
      const sdb = channels[2].stdev

      const brightness = Math.sqrt(0.2126 * r * r + 0.7152 * g * g + 0.0722 * b * b)
      const minOfSd = Math.min(sdr, sdg, sdb)

      // Thumbnail quality condition
      if (minOfSd < 35 || brightness < 50 || brightness > 150) return aquarelle(width, height, saveDirectory)

      return image
      .toFile(outputFilePath)
      .then(() => ({
        ...inputMetadata,
        width,
        height,
        originalFileName: inputMetadata.fileName,
        originalFilePath: inputFilePath,
        fileName: outputFileName,
        filePath: outputFilePath,
      }))
    })
  )
}

module.exports = aquarelle
