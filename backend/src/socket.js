// Real-time layer (Socket.IO). One private "room" per user: user:<id>. To send something live to a person,
// emit to their room; every browser tab they have open receives it.
import { Server } from 'socket.io';
import { env } from './config/env.js';
import User from './models/User.js';
import { verifyToken } from './utils/token.js';

let io = null;

export function initSocket(httpServer) {
  io = new Server(httpServer, { cors: { origin: env.clientUrl } });

  // Same rules as the REST API: a valid token for an active user, or no connection.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const payload = verifyToken(token);
      const user = await User.findById(payload.id).select('role isActive');
      if (!user || !user.isActive) return next(new Error('Account unavailable'));
      socket.data.userId = user._id.toString();
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.data.userId}`);
  });
  return io;
}

// Safe to call anywhere. When no socket server exists (for example on Vercel, or in tests) it does nothing.
export function emitToUser(userId, event, payload) {
  if (io) io.to(`user:${userId}`).emit(event, payload);
}

export function closeSocket() {
  if (io) { io.close(); io = null; }
}
