# Aquarelle

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
```
Once you have added some images to the `/example/images/base/` directory, 
type `npm start` and open `/` or `/stream` in your browser (port 8080) to see a generated picture.

### Visual example

Consider this piece of art - Salvador Dalí, Illumined pleasures:
![Dali](https://s3.amazonaws.com/aquest-dev/Salvador+Dali_Illumined+Pleasures_1929.jpg)

And some generated pictures from it:

![](https://s3.amazonaws.com/aquest-dev/68714710-53ad-11e5-99f6-130baf5c4636.png) .
![](https://s3.amazonaws.com/aquest-dev/6981ccb0-53ad-11e5-99f6-130baf5c4636.png) .
![](https://s3.amazonaws.com/aquest-dev/6a1d4960-53ad-11e5-99f6-130baf5c4636.png) .
![](https://s3.amazonaws.com/aquest-dev/6c49c650-53ad-11e5-99f6-130baf5c4636.png) .
![](https://s3.amazonaws.com/aquest-dev/6cd03460-53ad-11e5-99f6-130baf5c4636.png) .
![](https://s3.amazonaws.com/aquest-dev/6f034100-53ad-11e5-99f6-130baf5c4636.png) .
![](https://s3.amazonaws.com/aquest-dev/6fbca5f0-53ad-11e5-99f6-130baf5c4636.png) .
![](https://s3.amazonaws.com/aquest-dev/712f6fd0-53ad-11e5-99f6-130baf5c4636.png) .
![](https://s3.amazonaws.com/aquest-dev/6aaba6b0-53ad-11e5-99f6-130baf5c4636.png) .
![](https://s3.amazonaws.com/aquest-dev/6b359730-53ad-11e5-99f6-130baf5c4636.png) .
![](https://s3.amazonaws.com/aquest-dev/72bf85b0-53ad-11e5-99f6-130baf5c4636.png) .
![](https://s3.amazonaws.com/aquest-dev/73a32ef0-53ad-11e5-99f6-130baf5c4636.png) .
![](https://s3.amazonaws.com/aquest-dev/7503d060-53ad-11e5-99f6-130baf5c4636.png)

Notice how none of them comes from the plain blue sky, or the brown earth, because the aglorithm checks for a sufficient level of color scattering. It also ensures that the pictures are not too dark or bright. But to acheive best results, you'll need more colorful images:

Joan Miró, Abstraction:

![Miro](https://s3.amazonaws.com/aquest-dev/test/Joan+Miro_Abstraction_.jpg)

![](https://s3.amazonaws.com/aquest-dev/test/736449d0-53b0-11e5-9440-6d407ff0796f.png) .
![](https://s3.amazonaws.com/aquest-dev/test/73f73b00-53b0-11e5-9440-6d407ff0796f.png) .
![](https://s3.amazonaws.com/aquest-dev/test/74682540-53b0-11e5-9440-6d407ff0796f.png) .
![](https://s3.amazonaws.com/aquest-dev/test/74da4800-53b0-11e5-9440-6d407ff0796f.png) .
![](https://s3.amazonaws.com/aquest-dev/test/754c91d0-53b0-11e5-9440-6d407ff0796f.png) .
![](https://s3.amazonaws.com/aquest-dev/test/75babcf0-53b0-11e5-9440-6d407ff0796f.png) .
![](https://s3.amazonaws.com/aquest-dev/test/76f1dd60-53b0-11e5-9440-6d407ff0796f.png) .
![](https://s3.amazonaws.com/aquest-dev/test/77550c00-53b0-11e5-9440-6d407ff0796f.png) .
![](https://s3.amazonaws.com/aquest-dev/test/77b888c0-53b0-11e5-9440-6d407ff0796f.png) .
![](https://s3.amazonaws.com/aquest-dev/test/781aa5f0-53b0-11e5-9440-6d407ff0796f.png) .
![](https://s3.amazonaws.com/aquest-dev/test/78824160-53b0-11e5-9440-6d407ff0796f.png) .
![](https://s3.amazonaws.com/aquest-dev/test/78df0760-53b0-11e5-9440-6d407ff0796f.png) .
![](https://s3.amazonaws.com/aquest-dev/test/7689a5b0-53b0-11e5-9440-6d407ff0796f.png)

### Usage

```javascript
import Aquarelle from 'aquarelle';

// The folder containing your base images
const inputDir = __dirname + '/images/base';

// Profile picture options
const newFilePath = __dirname + '/images/generated/coolProfilePicture.png';
const options = {
  width: 40,  // If blank, rejects error.
  // All other options are optionnal, those are the defaults:
  height: 40, // defaults to width,
  minSD: 10,  // Color scattering
  minBrightness: 30,
  maxBrightness: 80,
  maxLoops: 15, // Maximum iterations before rejection of image
};

const profilePictureGenerator = new Aquarelle(inputDir);

// Working with files.
profilePictureGenerator.generateFile(newFilePath, options).then(
  () => foo(newFilePath),
  error => bar(error) // A string describing what happended
);

// Or with readable streams.
profilePictureGenerator.generateStream(options).then(
  ({stdout, stderr})  => foo(stdout),
  error => bar(error)
);
```

### Supported formats

Files ending with `/png|jpe?g|webp|tiff|gif/i`. 
Make sure your GraphicsMagick installation support the PNG and JPG formats by installing the appropriate delegates.

### Contributing

PR are very welcome, there is much to do!

Whatever you want, in addition to:
- [x] Streams.
- [ ] More options.
- [ ] A better algo.
- [ ] Way better error handling.
- [ ] Utils to check if eveything is ok.
- [ ] Taking ppi into account ? Or allow resizing.

### Licence

MIT
