import fs from 'fs';
import gm from 'gm';

// Use this to enable/disable logging
function log(...msg) {
  if (0) console.log(...msg);
}

export default class Aquarelle {
  
  constructor(baseDir) {
    
    log('\nInitializing Aquarelle...');
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
        
        files.forEach(file => statsPromises.push(new Promise(resolve => {
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
          
          if (!n) reject('No valid image found in', this.baseDir);
          else {
            log(`Ready! ${n} valid images found.`);
            resolve();
          }
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
  _generateAGoodPicture(options) {
    
    return new Promise((resolve, reject) => {
      
      const errors = [];
      const isNotANumber = n => typeof n !== 'number' || !isFinite(n);
      const { width, height, minBrightness, maxBrightness, minSD, maxIterations } = options;
      
      if (minSD && isNotANumber(minSD)) errors.push('Invalid minSD: ' + minSD);
      if (!width || isNotANumber(width)) errors.push('Invalid width: ' + width);
      if (height && isNotANumber(height)) errors.push('Invalid height: ' + height);
      if (minBrightness && isNotANumber(minBrightness)) errors.push('Invalid minBrightness: ' + minBrightness);
      if (maxBrightness && isNotANumber(maxBrightness)) errors.push('Invalid maxBrightness: ' + maxBrightness);
      if (maxIterations && isNotANumber(maxIterations)) errors.push('Invalid maxIterations: ' + maxIterations);
      
      if (errors.length) return reject(errors.join('; '));
      
      options.minSD = minSD || 10;
      options.minBrightness = minBrightness || 30;
      options.maxBrightness = maxBrightness || 80;
      options.maxIterations = maxIterations || 15;
      
      this.ready.then(
        () => this._generateOnePicture(options, 1).then(resolve, reject),
        reject
      );
    });
  }
  
  // Will loop until a picture passes the quality check
  _generateOnePicture(options, cycleCount) {
    
    log('_generateOnePicture', cycleCount);
    
    return new Promise((resolve, reject) => {
      
      if (cycleCount > options.maxIterations) return reject('Too many cycles, check your base images');
      
      const filePath = this.fileList[Math.floor(Math.random() * this.fileCount)];
      const image = gm(filePath)
      .size((err, { width, height }) => {
        if (err) return reject(`Error while reading image's dimensions for file ${filePath}: ${err.message}`);
        
        log(filePath);
        
        const newWidth = options.width;
        const newHeight = options.height || newWidth;
        
        if (newWidth > width || newHeight > height) return reject(`Given dimensions (${newWidth}x${newHeight}) are larger than original file's (${width}x${height}) - ${filePath}`);
        
        const x = Math.floor(Math.random() * (width - newWidth));
        const y = Math.floor(Math.random() * (height - newHeight));
        
        image
        .crop(newWidth, newHeight, x, y)
        .toBuffer((err, buffer) => { // toBuffer allows working on the cropped file
          if (err) return reject(`Error while buffering file ${filePath}: ${err.message}`);
          
          const thumbnail = gm(buffer)
          .identify((err, metadata) => {
            if (err) return reject(`Error while identifying cropped image ${filePath}: ${err.message}`);
            
            let minOfSD = 0;
            let brightness = 0;
            const { minSD, minBrightness, maxBrightness } = options;
            const { Red, Green, Blue } = metadata['Channel Statistics'];
            
            if (Red && Green && Blue) {
              
              const means = [];
              const standardDeviations = [];
              [Red, Green, Blue].forEach(channel => {
                means.push(this._extractData(channel.Mean));
                standardDeviations.push(this._extractData(channel['Standard Deviation']));
              });
              
              const [a, b, c] = means;
              brightness = Math.round(Math.sqrt(0.299 * a * a + 0.587 * b * b + 0.144 * c * c));
              minOfSD = Math.min.apply(Math, standardDeviations);
            }
            
            // Quality condition, v2
            if (minOfSD > minSD && brightness > minBrightness && brightness < maxBrightness) resolve(thumbnail); 
            else this._generateOnePicture(options, cycleCount + 1).then(resolve, reject);
          });
        });
      });
    });
  }
  
  
  generateFile(newFilePath, options) {
    
    return new Promise((resolve, reject) => {
      
      this._generateAGoodPicture(options).then(
        thumbnail => thumbnail.write(newFilePath, err => {
          if (err) return reject(`Error while saving new file: ${err.message}`);
          
          resolve();
        }),
        reject
      );
    });
  }
  
  
  generateStream(options) {
    
    return new Promise((resolve, reject) => {
      
      this._generateAGoodPicture(options).then(
        thumbnail => thumbnail.stream((err, stdout, stderr) => {
          if (err) return reject(`Error while streaming new picture: ${err.message}`);
          
          resolve({stdout, stderr});
        }),
        reject
      );
    });
  }
}
