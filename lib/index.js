'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _gm = require('gm');

var _gm2 = _interopRequireDefault(_gm);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

var Aquarelle = function () {
  function Aquarelle(baseDir, verbose) {
    var _this = this;

    _classCallCheck(this, Aquarelle);

    this.log = function () {
      var _console;

      return verbose ? (_console = console).log.apply(_console, arguments) : false;
    };
    this.log('\nInitializing Aquarelle...');

    if (typeof baseDir !== 'string') throw new Error('Aquarelle - missing baseDir arg in constructor');

    this.fileList = [];
    this.fileCount = 0;
    this.dataExtractionRegexp = /\((.*)\)$/;
    this.baseDir = baseDir.endsWith('/') ? baseDir : baseDir + '/';

    // Loops through every file in baseDir to find images
    this.ready = new Promise(function (resolve, reject) {

      _fs2.default.readdir(baseDir, function (err, files) {
        if (err) return reject('Cannot read given baseDir', _this.baseDir);

        var statsPromises = [];
        var extensionRegexp = /(?:\.([^.]+))?$/;
        var validExtensionsRegexp = /png|jpe?g|webp|tiff|gif/i;

        files.forEach(function (file) {
          return statsPromises.push(new Promise(function (resolve, reject) {
            var filePath = _this.baseDir + file;

            _fs2.default.stat(filePath, function (err, stats) {
              if (err) return reject('Error while reading file', filePath);
              if (stats && stats.isFile()) {

                var extension = extensionRegexp.exec(file)[1];
                if (extension && validExtensionsRegexp.test(extension)) _this.fileList.push(filePath);
              }
              resolve();
            });
          }));
        });

        Promise.all(statsPromises).then(function () {
          var n = _this.fileList.length;
          _this.fileCount = n;

          if (n) {
            _this.log('Ready! ' + n + ' valid images found.');
            resolve();
          } else reject('No valid image found in', _this.baseDir);
        });
      });
    });
  }

  _createClass(Aquarelle, [{
    key: '_extractData',
    value: function _extractData(data) {
      // Data from GM looks like 'rbg (frac)'. We only need the frac part * 100.
      return parseFloat(data.match(this.dataExtractionRegexp)[1], 10) * 100;
    }

    // Validates options, applies defaults and waits for baseDir scan to be over before calling the main loop
    // Returns a valid thumbnail

  }, {
    key: '_generateImage',
    value: function _generateImage(options) {
      var _this2 = this;

      var errors = [];
      var width = options.width;
      var height = options.height;
      var minBrightness = options.minBrightness;
      var maxBrightness = options.maxBrightness;
      var minSD = options.minSD;
      var maxIterations = options.maxIterations;

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

      return this.ready.then(function () {
        return _this2._generateValidImage(options, 1);
      });
    }

    // Will loop until a image passes the quality check

  }, {
    key: '_generateValidImage',
    value: function _generateValidImage(options, cycleCount) {
      var _this3 = this;

      this.log('_generateValidImage', cycleCount);

      return new Promise(function (resolve, reject) {

        if (cycleCount > options.maxIterations) return reject('Too many cycles, check your base images or verify that the requested dimensions are not too big.');

        var tryAgain = function tryAgain() {
          return _this3._generateValidImage(options, cycleCount + 1).then(resolve, reject);
        };

        var filePath = _this3.fileList[Math.floor(Math.random() * _this3.fileCount)];
        var image = (0, _gm2.default)(filePath).size(function (err, _ref) {
          var width = _ref.width;
          var height = _ref.height;

          if (err) return reject('Error while reading image\'s dimensions for file ' + filePath + ': ' + err.message);

          _this3.log(filePath);

          var newWidth = options.width;
          var newHeight = options.height || newWidth;

          if (newWidth > width || newHeight > height) return tryAgain();

          var x = Math.floor(Math.random() * (width - newWidth));
          var y = Math.floor(Math.random() * (height - newHeight));

          image.crop(newWidth, newHeight, x, y).toBuffer(function (err, buffer) {
            // toBuffer allows working on the cropped file
            if (err) return reject('Error while buffering file ' + filePath + ': ' + err.message);

            var thumbnail = (0, _gm2.default)(buffer).identify(function (err, metadata) {
              if (err) return reject('Error while identifying cropped image ' + filePath + ': ' + err.message);

              var means = [];
              var standardDeviations = [];
              var minSD = options.minSD;
              var minBrightness = options.minBrightness;
              var maxBrightness = options.maxBrightness;
              var _metadata$ChannelSta = metadata['Channel Statistics'];
              var Red = _metadata$ChannelSta.Red;
              var Green = _metadata$ChannelSta.Green;
              var Blue = _metadata$ChannelSta.Blue;

              if (!(Red && Green && Blue)) return tryAgain();

              [Red, Green, Blue].forEach(function (channel) {
                means.push(_this3._extractData(channel.Mean));
                standardDeviations.push(_this3._extractData(channel['Standard Deviation']));
              });

              var a = means[0];
              var b = means[1];
              var c = means[2];

              var brightness = Math.round(Math.sqrt(0.299 * a * a + 0.587 * b * b + 0.144 * c * c));
              var minOfSD = Math.min.apply(Math, standardDeviations);

              _this3.log('minOfSD', minOfSD);
              _this3.log('brightness', brightness);

              // Quality condition, v2
              if (minOfSD > minSD && brightness > minBrightness && brightness < maxBrightness) resolve({ thumbnail: thumbnail, originalImageName: filePath.split('/').pop() });else tryAgain();
            });
          });
        });
      });
    }
  }, {
    key: 'generateFile',
    value: function generateFile(newFilePath, options) {
      var _this4 = this;

      return new Promise(function (resolve, reject) {

        _this4._generateImage(options).then(function (_ref2) {
          var thumbnail = _ref2.thumbnail;
          var originalImageName = _ref2.originalImageName;

          thumbnail.write(newFilePath, function (err) {
            if (err) return reject('Error while saving new file: ' + err.message);

            resolve({ originalImageName: originalImageName });
          });
        }, reject);
      });
    }
  }, {
    key: 'generateStream',
    value: function generateStream(options) {
      var _this5 = this;

      return new Promise(function (resolve, reject) {

        _this5._generateImage(options).then(function (_ref3) {
          var thumbnail = _ref3.thumbnail;
          var originalImageName = _ref3.originalImageName;

          thumbnail.stream(function (err, stdout, stderr) {
            if (err) return reject('Error while streaming new image: ' + err.message);

            resolve({ stdout: stdout, stderr: stderr, originalImageName: originalImageName });
          });
        }, reject);
      });
    }
  }]);

  return Aquarelle;
}();

exports.default = Aquarelle;