import Hapi from 'hapi';
import uuid from 'uuid';
import inert from 'inert';
import Aquarelle from '../aquarelle';

const port = 8080; // Change this if you want to
const server = new Hapi.Server();
server.connection({ port });

server.register(inert, err => {
  if (err) throw err; 
  
  server.route([
    {
      method: 'GET',
      path: '/images/{subfolder}/{file}',
      handler: (request, reply) => reply.file(`images/${request.params.subfolder}/${request.params.file}`),
    },
    {
      method: 'GET',
      path: '/',
      handler: (request, reply) => {
        
        const response = reply.response().hold();
        
        const pictureGenerator = new Aquarelle('./images/base');
        
        const params = {
          width: 40,
          height: 40,
        };
        
        const output = '/images/generated/' + uuid.v1() + '.png';
        const outputPath = '.' + output;
        try {
          pictureGenerator.generateFile(outputPath, params).then(
            () => {
              response.source = '<html><body>' +
                `<img src="${output}" />` +
                '</body></html>';
              response.send();
            },
            err => {
              response.source = err;
              response.send();
            }
          );
        } catch (err) {
          console.error(err);
        }
      },
    },
  ]);
});

server.start(() => console.log(`Make it rain! API server started at ${server.info.uri}`));
