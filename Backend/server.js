const http = require('http');
const app = require('./app');

// Normalisation du port
const normalizePort = val => {
  const port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
};



const port = normalizePort(process.env.PORT || '5001');
app.set('port', port);

// Gestion des erreurs
const errorHandler = error => {
  if (error.syscall !== 'listen') throw error;
  const bind = typeof port === 'string' ? 'pipe ' + port : 'port ' + port;
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' nécessite des privilèges élevés.');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' est déjà utilisé.');
      process.exit(1);
      break;
    default:
      throw error;
  }
};

const server = http.createServer(app);

server.on('error', errorHandler);
server.on('listening', () => {
  const address = server.address();
  const bind = typeof address === 'string' ? 'pipe ' + address : 'port ' + port;
  console.log('Serveur démarré sur ' + bind);
});

server.listen(port);