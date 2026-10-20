'use strict';
const http = require('http');
const express = require('express');
const { ExpressPeerServer } = require('peer');

const log = (...a) => console.log(`${new Date().toISOString()} [SERVER]`, ...a);
const port = Number(process.env.PORT) || 10000;
const ipOf = (c) => { const s = c.getSocket && c.getSocket(); return (s && (s.remoteAddress || (s._socket && s._socket.remoteAddress))) || 'unknown'; };

log(`Server starting on port ${port}...`);

const app = express();
app.set('trust proxy', true);

// Healthcheck: Render и клиент (будильник) дергают GET /
app.get('/', (req, res) => {
  log(`Healthcheck GET / from ${req.ip}`);
  res.status(200).type('text/plain').send('PeerJS Server is running');
});

const server = http.createServer(app);
const peerServer = ExpressPeerServer(server, { path: '/peerjs', proxied: true, allow_discovery: false });
app.use(peerServer);

peerServer.on('connection', (client) => log(`Client connected: id=${client.getId()}, ip=${ipOf(client)}`));
peerServer.on('disconnect', (client) => log(`Client disconnected: id=${client.getId()}`));
peerServer.on('message', (client, msg) => log(`Message ${msg.type}: ${client.getId()} -> ${msg.dst || '-'}`));
peerServer.on('error', (err) => log(`Error: ${err.message}`));
server.on('error', (err) => log(`Error: ${err.message}`));
process.on('uncaughtException', (err) => log(`Error: uncaughtException ${err.stack || err.message}`));
process.on('unhandledRejection', (err) => log(`Error: unhandledRejection ${err && err.message}`));
process.on('SIGTERM', () => { log('SIGTERM received, shutting down'); server.close(() => process.exit(0)); });

server.listen(port, '0.0.0.0', () => log(`Listening on 0.0.0.0:${port}, peer path=/peerjs`));

// Необязательный самопинг (Render задаёт RENDER_EXTERNAL_URL). Гарантии от сна на free-плане нет —
// надёжнее внешний пингер (UptimeRobot) на https://<сервис>.onrender.com/
if (process.env.RENDER_EXTERNAL_URL) {
  setInterval(() => {
    fetch(process.env.RENDER_EXTERNAL_URL).then((r) => log(`Self-ping -> ${r.status}`)).catch((e) => log(`Error: self-ping ${e.message}`));
  }, 10 * 60 * 1000);
}
