import path from 'path'

import sharp from 'sharp'
import { v4 as uuid } from 'uuid'

import data from '../data.json'

// From checkDimensions
const maxWidth = 500
const maxHeight = 326

type AquarelleInputMetadata = {
  fileName: string
  year: string
  author: string
  title: string
}

type AquarelleOutput = AquarelleInputMetadata & {
  width: number
  height: number
  top: number
  left: number
  originalFileName: string
  originalFilePath: string
  fileName: string
  filePath: string
}

async function aquarelle(width: number, height: number, saveDirectory: string): Promise<AquarelleOutput | null> {
  if (typeof width !== 'number' || typeof height !== 'number') throw new Error('You need to specify dimensions as numbers.')
  if (width > maxWidth || height > maxHeight) throw new Error('Given dimensions are too large.')
  if (typeof saveDirectory !== 'string') throw new Error('You need to specify an output folder.')

  const inputMetadata: AquarelleInputMetadata = data[Math.floor(Math.random() * data.length)]
  const inputFilePath = path.resolve(__dirname, '../../images', inputMetadata.fileName)

  const image = sharp(inputFilePath)
  const outputFileName = `${uuid()}.png`
  const outputFilePath = path.join(saveDirectory, outputFileName)

  return image
  .metadata()
  .then(metadata => {
    if (typeof metadata.width !== 'number') return null
    if (typeof metadata.height !== 'number') return null

    const top = Math.floor(Math.random() * (metadata.height - height))
    const left = Math.floor(Math.random() * (metadata.width - width))

    return image
    .extract({
      top,
      left,
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

      const minOfSd = Math.min(sdr, sdg, sdb)
      const brightness = Math.sqrt(0.2126 * r * r + 0.7152 * g * g + 0.0722 * b * b)
      const hsp = Math.sqrt(0.299 * r * r + 0.587 * g * g + 0.114 * b * b) // HSP equation from http://alienryderflex.com/hsp.html

      // Thumbnail quality condition
      if (minOfSd < 35 || brightness < 50 || brightness > 150 || hsp <= 127.5) return aquarelle(width, height, saveDirectory)

      return image
      .toFile(outputFilePath)
      .then(() => ({
        ...inputMetadata,
        width,
        height,
        top,
        left,
        originalFileName: inputMetadata.fileName,
        originalFilePath: inputFilePath,
        fileName: outputFileName,
        filePath: outputFilePath,
      }))
    })
  })
}

export default aquarelle
