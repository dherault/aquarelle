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
      path: '/img/{subfolder}/{file}',
      handler: (request, reply) => reply.file(`images/${request.params.subfolder}/${request.params.file}`),
    },
    {
      method: 'GET',
      path: '/',
      handler: (request, reply) => {
        
        const response = reply.response().hold();
        response.source = 'Hello world';
        
        const pictureGenerator = new Aquarelle('./images/base');
        
        const params = {
          width: 40,
          height: 40,
        };
        
        const output = './images/generated/' + uuid.v1() + '.png';
        
        pictureGenerator.generateFile(output, params).then(
          () => response.send(),
          err => {
            response.source = err;
            response.send();
          }
        );
      },
    },
  ]);
});

server.start(() => console.log(`Make it rain! API server started at ${server.info.uri}`));
