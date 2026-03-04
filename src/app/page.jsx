"use client";

import { useEffect, useState } from "react";
import { socket } from "../socket";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const [roomName, setRoomName] = useState("");
  const [roomUserLimit, setRoomUserLimit] = useState(10);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    if (!socket.connected) {
      socket.auth = { username: "anonimo" };
      socket.connect();
    }
    
    socket.on("chat:listRooms", (rooms) => {
      setRooms(rooms);
    });

    socket.on("chat:newRoom", (room) => {
      setRooms((prev) => [...prev, room]);
    });

    socket.on("chat:removeRoom", ({ roomId }) => {
      setRooms((prev) => prev.filter(r => r.roomId !== roomId));
    });

    return () => {
      socket.off("chat:listRooms");
      socket.off("chat:newRoom");
      socket.off("chat:removeRoom");
      socket.off("chat:error");
    }
  }, []);

  function handleJoinRoom(roomId) {
    router.push(`/chat/${roomId}`);
  }

  function handleCreateRoom() {
    if (!roomName.trim()) return;

    let roomId = roomName.toLowerCase().replace(/\s/g, "-") + "-" + Math.random().toString(36).substr(2, 5);

    socket.emit("chat:create", {
      roomId,
      roomName,
      roomUserLimit
    });

    setRoomName("");
    setRoomUserLimit(10);

    router.push(`/chat/${roomId}`);
  }

  return (
    <div className="h-screen p-4 flex flex-col gap-4 items-center justify-center">
        <div>
          <h1 className="text-3xl font-bold mb-4">Digite o nome da sala</h1>
          <div>
            {rooms.length > 0 && (
              <div className="mb-4">
                <h2 className="text-xl font-bold mb-2">Salas disponíveis</h2>
                <ul className="list-disc list-inside">
                  {rooms.map((room) => (
                    <li key={room.roomId}>
                      <button
                        onClick={() => handleJoinRoom(room.roomId)}
                        className="text-blue-500 hover:underline"
                      >
                        {room.roomName} ({room.users.length}/{room.roomUserLimit})
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div>
            <input 
              type="text"
              value={roomName}
              placeholder="Digite o nome da sala"
              onChange={(e) => setRoomName(e.target.value)}
              className="p-2 rounded-lg bg-neutral-700 text-white"
            />
            <input 
              type="number"
              value={roomUserLimit}
              placeholder="Digite o limite de usuários"
              onChange={(e) => setRoomUserLimit(parseInt(e.target.value))}
              max={15}
              min={2}
              className="p-2 rounded-lg bg-neutral-700 text-white"
            />
            <button
              onClick={handleCreateRoom}
              className="p-2 rounded-lg bg-cyan-800 text-white font-bold ml-2"
            >
              Entrar
            </button>
          </div>
        </div>
    </div>
  );
}
