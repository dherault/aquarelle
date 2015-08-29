# Aquarelle

**WIP**

Random profile pictures with a sense of Art.

Aquarelle lets you generate random profile pictures from a directory of images. A simple algorithm checks if the result is "good looking" before outputting it.

![Agnes Cecile](http://orig10.deviantart.net/9c1e/f/2012/121/7/0/l__assenza_by_agnes_cecile-d4y6tsc.jpg)
*Watercolor coutersy of Agnes Cecile. http://agnes-cecile.deviantart.com/*


### Installation

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
// This module supports reading JPEG, PNG, WebP, TIFF and GIF (first frame only)
const inputDir = __dirname + '/images/base';
const outputDir = __dirname + '/images/generated';

// Initializes Aquarelle
const profilePictureGenerator = new Aquarelle(inputDir);

// Profile picture options
const options = {
  width: 40,  // If blank, throws exception
  height: 40, // If blank, equals width
  // more options to come
};

// Working with files
const newFilePath = outputDir + '/coolProfilePicture.png'; // Either JPEG, PNG or WebP formats
profilePictureGenerator.generateFile(newFilePath, options).then(
  () => foo(), // Do stuff;
  error => bar() // oh oh
}

// Or with streams
const pictureStream = profilePictureGenerator.generateStream(options); // returns a duplex stream

```

### Contributing

PR are very welcome.

### Licence

MIT
