import fs from 'fs';
import gm from 'gm';

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

export default class Aquarelle {
  
  constructor(baseDir, verbose) {
    
    this.log = (...msg) => verbose ? console.log(...msg) : false;
    this.log('\nInitializing Aquarelle...');
    
    if (typeof baseDir !== 'string') throw new Error('Aquarelle - missing baseDir arg in constructor');
    
    this.fileList = [];
    this.fileCount = 0;
    this.dataExtractionRegexp = /\((.*)\)$/;
    this.baseDir = baseDir.endsWith('/') ? baseDir : baseDir + '/';
    
    // Loops through every file in baseDir to find images
    this.ready = new Promise((resolve, reject) => {
      
      fs.readdir(baseDir, (err, files) => {
        if (err) return reject('Cannot read given baseDir', this.baseDir);
        
        const statsPromises = [];
        const extensionRegexp = /(?:\.([^.]+))?$/;
        const validExtensionsRegexp = /png|jpe?g|webp|tiff|gif/i;
        
        files.forEach(file => statsPromises.push(new Promise((resolve, reject) => {
          const filePath = this.baseDir + file;
          
          fs.stat(filePath, (err, stats) => {
            if (err) return reject('Error while reading file', filePath);
            if (stats && stats.isFile()) {
              
              const extension = extensionRegexp.exec(file)[1];
              if (extension && validExtensionsRegexp.test(extension)) this.fileList.push(filePath);
            }
            resolve();
          });
        })));
        
        Promise.all(statsPromises).then(() => {
          const n = this.fileList.length;
          this.fileCount = n;
          
          if (n) {
            this.log(`Ready! ${n} valid images found.`);
            resolve();
          }
          else reject('No valid image found in', this.baseDir);
        });
      });
    });
  }
  
  _extractData(data) {
    // Data from GM looks like 'rbg (frac)'. We only need the frac part * 100.
    return parseFloat(data.match(this.dataExtractionRegexp)[1], 10) * 100;
  }
  
  // Validates options, applies defaults and waits for baseDir scan to be over before calling the main loop
  // Returns a valid thumbnail
  _generateImage(options) {
    
    const errors = [];
    const { width, height, minBrightness, maxBrightness, minSD, maxIterations } = options;
    
    if (minSD && !isNumeric(minSD)) errors.push('Invalid minSD: ' + minSD);
    if (!width || !isNumeric(width)) errors.push('Invalid width: ' + width);
    if (height && !isNumeric(height)) errors.push('Invalid height: ' + height);
    if (minBrightness && !isNumeric(minBrightness)) errors.push('Invalid minBrightness: ' + minBrightness);
    if (maxBrightness && !isNumeric(maxBrightness)) errors.push('Invalid maxBrightness: ' + maxBrightness);
    if (maxIterations && !isNumeric(maxIterations)) errors.push('Invalid maxIterations: ' + maxIterations);
    
    if (errors.length) return Promise.reject(errors.join('; '));
    
    options.width = Math.abs(width);
    options.minSD = minSD || 15;
    options.minBrightness = minBrightness || 30;
    options.maxBrightness = maxBrightness || 80;
    options.maxIterations = maxIterations || 15;
    
    return this.ready.then(() => this._generateValidImage(options, 1));
  }
  
  // Will loop until a image passes the quality check
  _generateValidImage(options, cycleCount) {
    
    this.log('_generateValidImage', cycleCount);
    
    return new Promise((resolve, reject) => {
      
      if (cycleCount > options.maxIterations) return reject('Too many cycles, check your base images or verify that the requested dimensions are not too big.');
      
      const tryAgain = () => this._generateValidImage(options, cycleCount + 1).then(resolve, reject);
      
      const filePath = this.fileList[Math.floor(Math.random() * this.fileCount)];
      const image = gm(filePath)
      .size((err, { width, height }) => {
        if (err) return reject(`Error while reading image's dimensions for file ${filePath}: ${err.message}`);
        
        this.log(filePath);
        
        const newWidth = options.width;
        const newHeight = options.height || newWidth;
        
        if (newWidth > width || newHeight > height) return tryAgain();
        
        const x = Math.floor(Math.random() * (width - newWidth));
        const y = Math.floor(Math.random() * (height - newHeight));
        
        image
        .crop(newWidth, newHeight, x, y)
        .toBuffer((err, buffer) => { // toBuffer allows working on the cropped file
          if (err) return reject(`Error while buffering file ${filePath}: ${err.message}`);
          
          const thumbnail = gm(buffer)
          .identify((err, metadata) => {
            if (err) return reject(`Error while identifying cropped image ${filePath}: ${err.message}`);
            
            const means = [];
            const standardDeviations = [];
            const { minSD, minBrightness, maxBrightness } = options;
            const { Red, Green, Blue } = metadata['Channel Statistics'];
            
            if (!(Red && Green && Blue)) return tryAgain();
            
            [Red, Green, Blue].forEach(channel => {
              means.push(this._extractData(channel.Mean));
              standardDeviations.push(this._extractData(channel['Standard Deviation']));
            });
            
            const [a, b, c] = means;
            const brightness = Math.round(Math.sqrt(0.299 * a * a + 0.587 * b * b + 0.144 * c * c));
            const minOfSD = Math.min.apply(Math, standardDeviations);
            
            this.log('minOfSD', minOfSD);
            this.log('brightness', brightness);
            
            // Quality condition, v2
            if (minOfSD > minSD && brightness > minBrightness && brightness < maxBrightness) resolve({ thumbnail, originalImageName: filePath.split('/').pop() });
            else tryAgain();
          });
        });
      });
    });
  }
  
  
  generateFile(newFilePath, options) {
    
    return new Promise((resolve, reject) => {
      
      this._generateImage(options)
      .then(({ thumbnail, originalImageName }) => {
        thumbnail.write(newFilePath, err => {
          if (err) return reject(`Error while saving new file: ${err.message}`);
          
          resolve({ originalImageName });
        });
      }, reject);
    });
  }
  
  
  generateStream(options) {
    
    return new Promise((resolve, reject) => {
      
      this._generateImage(options)
      .then(({ thumbnail, originalImageName }) => {
        thumbnail.stream((err, stdout, stderr) => {
          if (err) return reject(`Error while streaming new image: ${err.message}`);
          
          resolve({ stdout, stderr, originalImageName });
        });
      }, reject);
    });
  }
}
