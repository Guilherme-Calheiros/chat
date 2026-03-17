import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handler = app.getRequestHandler();

let rooms = new Map();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer);

  io.use((socket, next) => {
    const { username, userID} = socket.handshake.auth;
    if (!username || !userID) {
      return next(new Error("invalid_user"));
    }
    socket.username = username;
    socket.userID = userID;
    next();
  });

  io.on('connection', (socket) => {

    socket.emit("chat:listRooms", Array.from(rooms.values()));

    socket.onAny((event, ...args) => {
      console.log(event, args);
    });

    socket.on("chat:create", (data) => {
      const { roomId, roomName, roomUserLimit } = data;
      if(!roomName || typeof roomName !== "string") {
        return;
      }

      const newRoom = {
        roomId,
        roomName,
        roomUserLimit: roomUserLimit || 10,
        roomOwner: socket.userID,
        users: [],
        messages: []
      }

      rooms.set(roomId, newRoom);
      io.emit("chat:newRoom", newRoom);
    });

    socket.on("chat:delete", async ({ roomId }) => {
      const room = rooms.get(roomId);
      if (room && room.roomOwner === socket.userID) {
        rooms.delete(roomId);
        io.emit("chat:removeRoom", { roomId });
      }
    });

    socket.on("chat:join", async ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      socket.join(roomId);

      socket.emit("chat:history", room.messages);

      const systemMessage = { 
        socketId: socket.id,
        from: "system",
        text: `${socket.username} entrou`,
        timestamp: new Date().toISOString(),
        system: true
      };

      const existingUser = room.users.find(u => u.userID === socket.userID);

      if (!existingUser) {
        room.users.push({
          userID: socket.userID,
          username: socket.username
        });

        socket.to(roomId).emit("chat:newMessage", systemMessage);
      }

      socket.emit("chat:users", room.users);
      socket.to(roomId).emit("chat:users", room.users);

      io.emit("chat:listRooms", Array.from(rooms.values()));
    });

    socket.on("chat:leave", async ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      socket.leave(roomId);

      room.users = room.users.filter(u => u.userID !== socket.userID);

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

      const isUserInRoom = room.users.some(u => u.userID === socket.userID);
      if (!isUserInRoom) return;

      const message = {
        socketId: socket.id,
        userID: socket.userID,
        from: socket.username,
        text,
        timestamp: new Date().toISOString()
      };

      room.messages.push(message);
      if (room.messages.length > 100) {
        room.messages.shift();
      }

      io.to(roomId).emit("chat:newMessage", message);
    });

    socket.on("disconnect", async () => {
      for (const room of rooms.values()) {
        const wasInRoom = room.users.some(u => u.userID === socket.userID);

        if (!wasInRoom) continue;

        room.users = room.users.filter(u => u.userID !== socket.userID);

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