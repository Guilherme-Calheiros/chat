import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handler = app.getRequestHandler();

let rooms = new Map();

function getVisibleRooms() {
  return Array.from(rooms.values()).filter(room => !room.isPrivate);
}


app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer);
  
  function updateRoomsList() {
    io.sockets.sockets.forEach((s) => {
      s.emit("chat:listRooms", getVisibleRooms(s.userId));
    });
  }

  function updateOwner(room){
    if(room.users.length === 0) return;

    room.roomOwner = room.users[0].userId;

    room.users = room.users.map(user => ({
      ...user,
      isOwner: user.userId === room.roomOwner
    }));
  }

  io.use((socket, next) => {
    const { username, userId} = socket.handshake.auth;
    if (!username || !userId) {
      return next(new Error("invalid_user"));
    }
    socket.username = username;
    socket.userId = userId;
    next();
  });

  io.on('connection', (socket) => {

    socket.emit("chat:listRooms", getVisibleRooms());

    socket.onAny((event, ...args) => {
      console.log(event, args);
    });

    socket.on("chat:getRooms", () => {
        socket.emit("chat:listRooms", getVisibleRooms());
    });

    socket.on("chat:create", (data) => {
      const { roomId, roomName, roomUserLimit, isPrivate } = data;
      if(!roomName || typeof roomName !== "string") {
        return;
      }

      const newRoom = {
        roomId,
        roomName,
        roomUserLimit: roomUserLimit || 10,
        roomOwner: socket.userId,
        isPrivate: isPrivate || false,
        users: [],
        messages: []
      }

      rooms.set(roomId, newRoom);
      updateRoomsList();
    });

    socket.on("chat:delete", async ({ roomId }) => {
      const room = rooms.get(roomId);
      if (room && room.roomOwner === socket.userId) {
        rooms.delete(roomId);
        updateRoomsList();
      }
    });

    socket.on("chat:checkRoom", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) {
        socket.emit("chat:error", { message: "Sala não encontrada" });
        return;
      }

      if (room.users.length >= room.roomUserLimit) {
        socket.emit("chat:error", { message: "Sala cheia" });
        return;
      }
      
      socket.emit("chat:allowed", { roomId });
    });

    socket.on("chat:join", async ({ roomId }) => {
      const room = rooms.get(roomId);

      if (!room) {
        socket.emit("chat:error", { message: "Sala não encontrada" });
        return;
      }

      if (room.users.length >= room.roomUserLimit) {
        socket.emit("chat:error", { message: "Sala cheia" });
        return;
      }

      socket.join(roomId);

      socket.emit("chat:history", room.messages);

      const systemMessage = { 
        socketId: socket.id,
        from: "system",
        text: `${socket.username} entrou`,
        timestamp: new Date().toISOString(),
        system: true
      };

      const existingUser = room.users.find(u => u.userId === socket.userId);

      if (!existingUser) {
        room.users.push({
          userId: socket.userId,
          username: socket.username,
          isOwner: room.roomOwner === socket.userId
        });

        socket.to(roomId).emit("chat:newMessage", systemMessage);
      }

      socket.emit("chat:users", {users: room.users, roomOwner: room.roomOwner});
      socket.to(roomId).emit("chat:users", {users: room.users, roomOwner: room.roomOwner});

      updateRoomsList();
    });

    socket.on("chat:leave", async ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      socket.leave(roomId);

      room.users = room.users.filter(u => u.userId !== socket.userId);

      const systemMessage = { 
        socketId: socket.id,
        from: "system",
        text: `${socket.username} saiu`,
        timestamp: new Date().toISOString(),
        system: true
      };

      socket.to(roomId).emit("chat:newMessage", systemMessage);
      if (room.users.length === 0) {
        rooms.delete(roomId);
      } else {
        if (room.roomOwner === socket.userId) {
          updateOwner(room);
        }
        io.to(roomId).emit("chat:users", {users: room.users, roomOwner: room.roomOwner});
      }

      updateRoomsList();
      socket.emit("chat:leftRoom", { roomId });
    });

    socket.on("chat:newMessage", ({ roomId, text }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const isUserInRoom = room.users.some(u => u.userId === socket.userId);
      if (!isUserInRoom) return;

      const message = {
        socketId: socket.id,
        userId: socket.userId,
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
        const wasInRoom = room.users.some(u => u.userId === socket.userId);

        if (!wasInRoom) continue;

        room.users = room.users.filter(u => u.userId !== socket.userId);

        const systemMessage = {
          socketId: socket.id,
          from: "system",
          text: `${socket.username} saiu`,
          timestamp: new Date().toISOString(),
          system: true
        };

        if(room.roomOwner === socket.userId){
          updateOwner(room);
        }
        
        io.to(room.roomId).emit("chat:newMessage", systemMessage);
        io.to(room.roomId).emit("chat:users", {users: room.users, roomOwner: room.roomOwner});
        if (room.users.length === 0) {
          rooms.delete(room.roomId);
          updateRoomsList();
        }
      }
    });

    socket.on("chat:kick", ({ roomId, userId }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      if (room.roomOwner !== socket.userId) return;

      const user = room.users.find(u => u.userId === userId);
      if (!user) return;

      room.users = room.users.filter(u => u.userId !== userId);
      io.to(roomId).emit("chat:users", {users: room.users, roomOwner: room.roomOwner});
      io.sockets.sockets.forEach((s) => {
        if (s.userId === userId) {
          s.leave(roomId);
          s.emit("chat:kicked", { roomId });
        }
      });
    });

    socket.on("chat:changeRoomOwner", ({ roomId, newOwnerId }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      if (room.roomOwner !== socket.userId) return;

      room.roomOwner = newOwnerId;
      io.to(roomId).emit("chat:users", {users: room.users, roomOwner: room.roomOwner});
    });

  });

  httpServer.listen(3000, () => {
    console.log('> Server listening on http://localhost:3000');
  });
});