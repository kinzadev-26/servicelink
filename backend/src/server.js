import http from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { initSocket } from './socket.js';

async function start() {
  await connectDB();
  // Socket.IO needs the plain HTTP server, so app.listen() is replaced by http.createServer(app).
  const server = http.createServer(app);
  initSocket(server);
  server.listen(env.port, () => {
    console.log(`API and Socket.IO running on port ${env.port} (${env.nodeEnv})`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
