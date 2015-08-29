import fs from 'fs';
import sharp from 'sharp';

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
    
    this.baseDir = baseDir.endsWith('/') ? baseDir : baseDir + '/';
    this.fileList = [];
    this.fileCount = 0;
    this.ready = new Promise(resolve => {
      
      fs.readdir(baseDir, (err, files) => {
        if (err) throw new Error('cannot read given baseDir', baseDir);
        
        const extensionRegexp = /(?:\.([^.]+))?$/;
        const validExtensionsRegexp = /png|jpe?g|webp|tiff|gif/i;
        const statsPromises = [];
        
        files.forEach(file => statsPromises.push(new Promise(resolve => {
          
          const filePath = this.baseDir + file;
          
          fs.stat(filePath, (err, stats) => {
            if (err) throwError('error while reading', filePath);
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
  
  generateFile(newFilePath, options) {
    return new Promise((resolve, reject) => {
      
      const validationErrors = this._validate(options);
      if (validationErrors) return reject(validationErrors.join('; '));
      
    });
  }
  
  generateStream(options) {
    return new Promise((resolve, reject) => {
      
      const validationErrors = this._validate(options);
      if (validationErrors) return reject(validationErrors.join('; '));
      
    });
  }
}
