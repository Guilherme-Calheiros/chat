import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer);

  io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('disconnect', () => {
      console.log('user disconnected');
    });

    socket.on('ping', () => {
      console.log('ping received');
      socket.emit('pong');
    });

    socket.on('sendMessage', (message) => {
      io.emit('newMessage', {from: socket.id, text: message, timestamp: new Date().toISOString()});
    })
    
  });

  httpServer.listen(3000, () => {
    console.log('> Server listening on http://localhost:3000');
  });
});