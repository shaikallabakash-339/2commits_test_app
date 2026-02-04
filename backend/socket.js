const { Server } = require('socket.io');

let io;

module.exports = {
  init: (server) => {
    io = new Server(server, {
      cors: { origin: '*' }
    });

    io.on('connection', (socket) => {
      console.log('[socket] connected', socket.id);

      socket.on('join', (userId) => {
        if (userId) {
          socket.join(userId);
          console.log('[socket] user joined room', userId);
        }
      });

      socket.on('leave', (userId) => {
        if (userId) socket.leave(userId);
      });

      socket.on('disconnect', () => {
        console.log('[socket] disconnected', socket.id);
      });
    });

    return io;
  },
  getIo: () => io
};
