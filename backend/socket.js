const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

function initSocket(server, app) {
  const io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:5173',
        'http://localhost:3000',
      ],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 60000,
  });

  // Simple JWT handshake auth
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || ((socket.handshake.headers?.authorization || '').split(' ')[1]);
    if (!token) return next(new Error('Authentication error'));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = payload;
      return next();
    } catch (err) {
      return next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const uid = socket.user?.userId;
    if (uid) {
      socket.join(`user:${uid}`);
    }

    socket.on('joinRoom', ({ room }) => {
      if (room) socket.join(room);
    });

    socket.on('leaveRoom', ({ room }) => {
      if (room) socket.leave(room);
    });

    socket.on('disconnect', () => {
      // placeholder for cleanup
    });
  });

  app.set('io', io);
  return io;
}

module.exports = { initSocket };
