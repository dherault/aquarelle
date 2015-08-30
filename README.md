# Aquarelle

**WIP**

Random profile pictures with a sense of Art.

Aquarelle lets you generate random profile pictures from a directory of images. 
A simple algorithm checks if the result is "good looking" before outputting it.

![Agnes Cecile](http://orig10.deviantart.net/9c1e/f/2012/121/7/0/l__assenza_by_agnes_cecile-d4y6tsc.jpg)
*Watercolor coutersy of Agnes Cecile. http://agnes-cecile.deviantart.com/*


### Installation

This package is intended for server-side use only.

You will need [GraphicsMagick](http://www.graphicsmagick.org/) installed on your machine with the necessary delegates.

`npm install aquarelle`

### Example

```
git clone https://github.com/AquestTechnologies/aquarelle.git
cd ./aquarelle && npm install
cd ./example && npm install
npm start
```
Will be available on port 8080.

### Usage

```javascript
import Aquarelle from 'aquarelle';

// The folder containing your base images
const inputDir = __dirname + '/images/base';
const outputDir = __dirname + '/images/generated';

// Profile picture options
const newFilePath = outputDir + '/coolProfilePicture.png';
const options = {
  width: 40,  // If blank, throws exception
  height: 40, // If blank, equals width
  // ... more options to come
};

const profilePictureGenerator = new Aquarelle(inputDir);

// Working with files, returns a Promise
profilePictureGenerator.generateFile(newFilePath, options).then(
  () => foo(newFilePath),
  error => bar(error) // A string describing what happended
);

// Or with streams, not implemented yet
profilePictureGenerator.generateStream(options).then(
  readableStream  => foo(readableStream),
  error => bar(error)
);
```

### Supported formats

Whatever your GraphicsMagick installation can support.

### Contributing

PR are very welcome.

### Licence

MIT

### Next: improvement ideas

Current algorithm: min([StandardDeviation(channel) *]) > 10% (color variety)

Improvements: nColors / (w * h) > C1 (color density) and \[C2 < Mean(channel) < C3 *\] (not too pale or dark)
