import fs from 'fs';
import path from 'path';
import Hapi from 'hapi';
import inert from 'inert';
import uuid from 'uuid';
import Aquarelle from '../src';

const port = 3000; // Change port here!
const server = new Hapi.Server();

const baseDir = path.join(__dirname, 'public/base');
const saveDir = path.join(__dirname, 'public/generated');
const imageGenerator = new Aquarelle(baseDir, true); // Second arg is verbosity

server.connection({ port });
server.register(inert, err => {

  if (err) throw err;
  
  server.route({
    method: 'GET',
    path: '/public/{param*}',
    handler: {
      directory: {
        path: './public',
        listing: true,
        index: false // won't return index.html on 'get /public' but a listing of the directory
      }
    }
  });
  
  server.route({
    method: 'GET',
    path: '/stream/{width}',
    handler: (request, reply) => {
      
      const response = reply.response().hold();
      
      imageGenerator.generateStream({ width: request.params.width })
      .then(({ stdout, stderr, originalImageName }) => {
        
        const imageName = generateName();
        const writeStream = fs.createWriteStream(saveDir + '/' + imageName);
        
        writeStream.on('finish', () => {
          response.source = generateHTMLSuccess('/public/generated/' + imageName, '/public/base/' + originalImageName);
          response.send();
        });
        
        stdout.pipe(writeStream);
      })
      .catch(err => {
        response.source = generateHTMLError(err);
        response.send();
      });
    }
  });
  
  server.route({
    method: 'GET',
    path: '/file/{width}',
    handler: (request, reply) => {
      
      const response = reply.response().hold();
      const imageName = generateName();
      
      imageGenerator.generateFile(saveDir + '/' + imageName, { width: request.params.width })
      .then(({ originalImageName }) => {
        response.source = generateHTMLSuccess('/public/generated/' + imageName, '/public/base/' + originalImageName);
        response.send();
      })
      .catch(err => {
        response.source = generateHTMLError(err);
        response.send();
      });
    }
  });
  
  server.route({
    method: 'GET',
    path: '/',
    handler: (request, reply) => reply('Try to call "/file/100" or "/stream/50"')
  });
  
  
  server.start(err => {
    if (err) throw err;
    console.log('Aquarelle example listening on port', port);
  });
});

function generateHTMLSuccess(src1, src2) {
  return `<html>
    <head>
      <meta charset="UTF-8">
      <title>Aquarelle</title>
    </head>
    <body>
      <div>
        <div>Generated image:</div>
        <img src="${src1}" />
      </div>
      <br />
      <div>
        <div>Base image:</div>
        <img src="${src2}" />
      <div>
    </body>
  </html>`;
}

function generateHTMLError(message) {
  return `<html>
    <head>
      <meta charset="UTF-8">
      <title>Aquarelle</title>
    </head>
    <body>
      <span>Error: </span>
      <span>${message}</span>
    </body>
  </html>`;
}

function generateName() {
  return uuid.v4() + '.png';
}
