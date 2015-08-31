import fs from 'fs';
import gm from 'gm';

function log(...msg) {
  if (1) console.log(...msg);
}

// function throwError(...msg) {
//   throw new Error('Aquarelle -', ...msg);
// }

// function getAverage(array) {
//   let sum = 0;
//   array.forEach(item => sum += item);
//   return sum / array.length;
// }

// function getStandardDeviation(array) {
//   let sum = 0;
//   const average = getAverage(array);
//   array.forEach(item => {
//     const dif = item - average;
//     sum += dif * dif;
//   });
//   return Math.sqrt(sum / array.length);
// }

// function rgbToHsl (r, g, b) { // with 0 to 1 values

//   const max = Math.max(r, g, b);
//   const min = Math.min(r, g, b);
//   let h, s, l = (max + min) / 2;

//   if (max === min) h = s = 0; // achromatic
//   else {
//     let d = max - min;
//     s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
//     switch (max) {
//       case r: h = (g - b) / d + (g < b ? 6 : 0); break;
//       case g: h = (b - r) / d + 2; break;
//       case b: h = (r - g) / d + 4; break;
//     }
//     h /= 6;
//   }
  
//   return [h, s, l];
// }

export default class Aquarelle {
  
  constructor(baseDir) {
    
    log('\nInitializing Aquarelle...');
    if (typeof baseDir !== 'string') throw new Error('Aquarelle - missing baseDir arg in constructor');
    
    this.fileList = [];
    this.fileCount = 0;
    this.dataExtractionRegexp = /\((.*)\)$/;
    this.baseDir = baseDir.endsWith('/') ? baseDir : baseDir + '/';
    // this.dataKeys = ['Minimum', 'Maximum', 'Mean', 'Standard Deviation'];
    this.dataKeys = ['Mean', 'Standard Deviation'];
    
    this.ready = new Promise((resolve, reject) => {
      
      fs.readdir(baseDir, (err, files) => {
        if (err) return reject('Cannot read given baseDir', this.baseDir);
        
        const extensionRegexp = /(?:\.([^.]+))?$/;
        const validExtensionsRegexp = /png|jpe?g|webp|tiff|gif/i;
        const statsPromises = [];
        
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
  
  
  _validate(options) {
    
    const { width, height } = options;
    const errors = [];
    if (!width || typeof width !== 'number' || !isFinite(width)) errors.push('Invalid width: ' + width);
    if (height && (typeof width !== 'number' || !isFinite(width))) errors.push('Invalid height: ' + height);
    
    return errors.length ? errors : undefined;
  }
  
  
  _generateOnePicture(options, cycleCount) {
    
    log('_generateOnePicture', cycleCount);
    
    return new Promise((resolve, reject) => {
      
      if (cycleCount > 15) return reject('Too many cycles, check your base images');
      
      const filePath = this.fileList[Math.floor(Math.random() * this.fileCount)];
      const image = gm(filePath)
      .size((err, { width, height }) => {
        if (err) return reject(`Error while reading image's dimensions for file ${filePath}: ${err.message}`);
        
        log(filePath);
        // log(width, height);
        
        const newWidth = options.width;
        const newHeight = options.height;
        
        if (newWidth > width || newHeight > height) return reject(`Given dimensions (${newWidth}x${newHeight}) are larger than original file's (${width}x${height}) - ${filePath}`);
        
        const x = Math.floor(Math.random() * (width - newWidth));
        const y = Math.floor(Math.random() * (height - newHeight));
        
        image
        .crop(newWidth, newHeight, x, y)
        .toBuffer((err, buffer) => {
          if (err) return reject(`Error while buffering file ${filePath}: ${err.message}`);
          
          const thumbnail = gm(buffer)
          .identify((err, metadata) => {
            if (err) return reject(`Error while identifying cropped image ${filePath}: ${err.message}`);
            
            let minSD = 0;
            let brightness = 0;
            const { Red, Green, Blue } = metadata['Channel Statistics'];
            
            if (Red && Green && Blue) {
              
              const data = {};
              this.dataKeys.forEach(key => {
                data[key] = [];
                [Red, Green, Blue].forEach(channel => {
                  data[key].push((parseFloat(channel[key].match(this.dataExtractionRegexp)[1], 10) * 100));
                });
              });
              
              // log(data);
              
              // const meanRatios = [];
              // for (let i = 0; i < 3; i++) {
              //   const min = data.Minimum[i];
              //   meanRatios[i] = (100 * (data.Mean[i] - min) / (data.Maximum[i] - min));
              // }
              
              // log();
              // log(meanRatios);
              
              // const SDOfSDs = getStandardDeviation(data['Standard Deviation']);
              // const SDOfMRs = getStandardDeviation(meanRatios);
              // const stupid = Math.round(SDOfSDs * SDOfMRs * 1000);
              
              // const meanOfMeanRatios = (meanRatios[0] + meanRatios[1] + meanRatios[2]) / 3;
              // log(meanOfMeanRatios);
              // log(rgbToHsl.apply(this, data['Standard Deviation'].map(sd => sd / 100))[2]);
              
              // const meanRatios255 = meanRatios.map(r => r * 2.55);
              // const weights = [0.299, 0.587, 0.144];
              // const weighted = meanRatios.map((r, i) => r * r * weights[i]);
              // const sortOfBrightness = Math.round(Math.sqrt(weighted[0] + weighted[1] + weighted[2])) ;
              
              const [a, b, c] = data.Mean;
              brightness = Math.round(Math.sqrt(0.299 * a * a + 0.587 * b * b + 0.144 * c * c));
              
              // log('SDOfSDs', SDOfSDs.toFixed(2));
              // log('SDOfMRs', SDOfMRs.toFixed(2));
              // log('brightness:', brightness);
              // log('stupid:', stupid);
              // log(brightness > 30 && brightness < 80 ? 'ok' : 'fail' );
              
              minSD = Math.min.apply(Math, data['Standard Deviation']);
            }
            
            // algorithm, v2
            if (minSD > 10 && brightness > 30 && brightness < 80) resolve(thumbnail); 
            else this._generateOnePicture(options, cycleCount + 1).then(
              thumbnail => resolve(thumbnail),
              err => reject(err)
            );
          });
        });
      });
    });
  }
  
  
  generateFile(newFilePath, options) {
    
    return new Promise((resolve, reject) => {
      
      const validationErrors = this._validate(options);
      if (validationErrors) return reject(validationErrors.join('; '));
      
      this.ready.then(
        () => this._generateOnePicture(options, 1).then(
          thumbnail => thumbnail.write(newFilePath, err => {
            if (err) return reject(`Error while saving new file: ${err.message}`);
            
            resolve();
          }),
          err => reject(err)
        ),
        err => reject(err)
      );
    });
  }
  
  
  generateStream(options) {
    
    return new Promise((resolve, reject) => {
      
      const validationErrors = this._validate(options);
      if (validationErrors) return reject(validationErrors.join('; '));
      
      this.ready.then(() => {
        
      });
    });
  }
}
