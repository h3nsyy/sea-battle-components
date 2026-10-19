const { PeerServer } = require('peer');

// Render передает порт через переменную окружения PORT
const port = process.env.PORT || 10000;

const server = PeerServer({
  port: port,
  path: '/peerjs', // Этот путь мы укажем в клиенте
  proxied: true // Важно для работы за прокси Render
});

server.on('connection', (client) => {
  console.log('Client connected:', client.getId());
});

server.on('disconnect', (client) => {
  console.log('Client disconnected:', client.getId());
});

console.log(`PeerJS server is running on port ${port}`);
