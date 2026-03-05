import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handler = app.getRequestHandler();

let rooms = new Map();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer, {
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutos
      skipMiddlewares: true,
    },
  });

  io.use((socket, next) => {
    const username = socket.handshake.auth.username;
    if (!username) {
      return next(new Error("invalid_username"));
    }
    socket.username = username;
    next();
  });

  io.on('connection', (socket) => {

    socket.emit("chat:listRooms", Array.from(rooms.values()));

    socket.on("chat:create", (data) => {
      const { roomId, roomName, roomUserLimit } = data;
      if(!roomName || typeof roomName !== "string") {
        return;
      }

      const newRoom = {
        roomId,
        roomName,
        roomUserLimit: roomUserLimit || 10,
        roomOwner: socket.username,
        users: []
      }

      rooms.set(roomId, newRoom);
      io.emit("chat:newRoom", newRoom);
    });

    socket.on("chat:delete", async ({ roomId }) => {
      const room = rooms.get(roomId);
      if (room && room.roomOwner === socket.username) {
        rooms.delete(roomId);
        io.emit("chat:removeRoom", { roomId });
      }
    });

    socket.on("chat:join", async ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      // melhorar essa validação porque não está funcionando direito
      // if (room.users.length >= room.roomUserLimit) {
      //   return next(new Error("room_full"));
      // }

      socket.join(roomId);

      const systemMessage = { 
        socketId: socket.id,
        from: "system",
        text: `${socket.username} entrou`,
        timestamp: new Date().toISOString(),
        system: true
      };

      const alreadyInRoom = room.users.some(u => u.userID === socket.id);
      if (alreadyInRoom) return;

      room.users.push({ userID: socket.id, username: socket.username });

      socket.to(roomId).emit("chat:newMessage", systemMessage);
      io.emit("chat:listRooms", Array.from(rooms.values()));
      io.to(roomId).emit("chat:users", room.users);
    });

    socket.on("chat:leave", async ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      socket.leave(roomId);

      room.users = room.users.filter(u => u.userID !== socket.id);

      const systemMessage = { 
        socketId: socket.id,
        from: "system",
        text: `${socket.username} saiu`,
        timestamp: new Date().toISOString(),
        system: true
      };

      socket.to(roomId).emit("chat:newMessage", systemMessage);
      io.to(roomId).emit("chat:users", room.users);
      if (room.users.length === 0) {
        rooms.delete(roomId);
        io.emit("chat:removeRoom", { roomId: roomId });
      }
    });

    socket.on("chat:newMessage", ({ roomId, text }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const isUserInRoom = room.users.some(u => u.userID === socket.id);
      if (!isUserInRoom) return;

      const message = {
        socketId: socket.id,
        from: socket.username,
        text,
        timestamp: new Date().toISOString()
      };

      io.to(roomId).emit("chat:newMessage", message);
    });

    socket.on("disconnect", async () => {
      for (const room of rooms.values()) {
        const wasInRoom = room.users.some(u => u.userID === socket.id);

        if (!wasInRoom) continue;

        room.users = room.users.filter(u => u.userID !== socket.id);

        const systemMessage = {
          socketId: socket.id,
          from: "system",
          text: `${socket.username} saiu`,
          timestamp: new Date().toISOString(),
          system: true
        };

        
        io.to(room.roomId).emit("chat:newMessage", systemMessage);
        io.to(room.roomId).emit("chat:users", room.users);
        if (room.users.length === 0) {
          rooms.delete(room.roomId);
          io.emit("chat:removeRoom", { roomId: room.roomId });
        }
      }
    });

  });

  httpServer.listen(3000, () => {
    console.log('> Server listening on http://localhost:3000');
  });
});