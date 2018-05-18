# Aquarelle

Aquarelle is a random profile picture generator, based on famous paintings.

## Example thumbnails

![](https://imgur.com/29wqN0T) .
![](https://imgur.com/lSpkUWJ) .
![](https://imgur.com/XNk6VR8) .
![](https://imgur.com/Z0K32ZG) .
![](https://imgur.com/NrVkJgd) .
![](https://imgur.com/a8pCTGT)

## Installation

`npm i aquarelle --save`

## Usage

js
```
const aquarelle = require('aquarelle');

const {
  width,
  height,
  title,
  year,
  author,
  fileName,
  filePath,
  originalFileName,
  originalFilePath,
} = aquarelle(128, 128, 'path/to/output/dir');
```

## License

MIT
