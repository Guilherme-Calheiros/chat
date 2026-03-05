"use client"

import { useState } from "react"
import { useRouter } from "next/navigation";

export default function ModalCreateRoom({ socket, handleCancel }){
    const [roomName, setRoomName] = useState("");
    const [roomLimit, setRoomLimit] = useState(10);

    const router = useRouter()

    function handleCreateRoom(e){
      e.preventDefault();
      if (!roomName.trim()) return;
      let roomId = roomName.toLowerCase().replace(/\s/g, "-") + "-" + Math.random().toString(36).substr(2, 5);
  
      socket.emit("chat:create", {
        roomId,
        roomName,
        roomLimit
      });
  
      setRoomName("");
      setRoomLimit(10);
  
      router.push(`/chat/${roomId}`);
    }

    return (
        <form onSubmit={handleCreateRoom}>
            <input 
              value={roomName}
              placeholder="Digite o nome da sala"
              onChange={(e) => setRoomName(e.target.value)}
              className="p-2 rounded-lg bg-neutral-700 text-white"
            />
            <input 
              type="number"
              value={roomLimit}
              placeholder="Digite o limite de usuários"
              onChange={(e) => setRoomLimit(parseInt(e.target.value))}
              max={15}
              min={2}
              className="p-2 rounded-lg bg-neutral-700 text-white"
            />
            <button
              onClick={handleCancel}
              className="p-2 rounded-lg bg-cyan-800 text-white font-bold ml-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="p-2 rounded-lg bg-cyan-800 text-white font-bold ml-2"
            >
              Criar
            </button>
        </form>
    )
}