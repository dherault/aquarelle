import fs from 'fs';
import gm from 'gm';

function log(...msg) {
  if (1) console.log(...msg);
}

function throwError(...msg) {
  throw new Error('Aquarelle -', ...msg);
}

export default class Aquarelle {
  
  constructor(baseDir) {
    
    log('Initializing Aquarelle...');
    if (typeof baseDir !== 'string') throwError('missing baseDir arg in constructor');
    
    this.fileList = [];
    this.fileCount = 0;
    this.baseDir = baseDir.endsWith('/') ? baseDir : baseDir + '/';
    this.dataKeys = ['Minimum', 'Maximum', 'Mean', 'Standard Deviation'];
    
    this.ready = new Promise(resolve => {
      
      fs.readdir(baseDir, (err, files) => {
        if (err) throwError('cannot read given baseDir', this.baseDir);
        
        const extensionRegexp = /(?:\.([^.]+))?$/;
        const validExtensionsRegexp = /png|jpe?g|webp|tiff|gif/i;
        const statsPromises = [];
        
        files.forEach(file => statsPromises.push(new Promise(resolve => {
          
          const filePath = this.baseDir + file;
          
          fs.stat(filePath, (err, stats) => {
            if (err) throwError('error while reading file', filePath);
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
          
          if (!n) throwError('no valid image found in', this.baseDir);
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
      
      if (cycleCount > 10) return reject('Too many cycles, check your base images');
      
      const filePath = this.fileList[Math.floor(Math.random() * this.fileCount)];
      const image = gm(filePath)
      .size((err, { width, height }) => {
        if (err) return reject(`Error while reading image's dimensions for file ${filePath}: ${err.message}`);
        
        log(filePath);
        log(width, height);
        
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
            
            const { Red, Green, Blue } = metadata['Channel Statistics'];
            
            if (!Red || !Green || !Blue) return reject('Could not find all three RBG channels');
            
            const data = {};
            const extractionRegexp = /\((.*)\)$/;
            this.dataKeys.forEach(key => {
              data[key] = [];
              [Red, Green, Blue].forEach(channel => {
                data[key].push(parseFloat(channel[key].match(extractionRegexp)[1], 10) * 100);
              });
            });
            
            log(data);
            
            const minSD = Math.min.apply(Math, data['Standard Deviation']);
            
            if (minSD > 10) resolve(thumbnail); // algorithm, v1 (that easy)
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
      
      this.ready.then(() => {
        log('\ngenerateFile');
        
        this._generateOnePicture(options, 1).then(
          thumbnail => thumbnail.write(newFilePath, err => {
            if (err) return reject(`Error while saving new file: ${err.message}`);
            
            resolve();
          }),
          err => reject(err)
        );
      });
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
