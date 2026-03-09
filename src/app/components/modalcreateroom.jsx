"use client"

import { useState } from "react"
import { useRouter } from "next/navigation";

export default function ModalCreateRoom({ socket, handleCancel }) {
  const [roomName, setRoomName] = useState("");
  const [roomLimit, setRoomLimit] = useState(10);

  const router = useRouter()

  function handleCreateRoom(e) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={handleCancel}>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-white mb-4">
          Criar nova sala
        </h2>

        <form onSubmit={handleCreateRoom} className="flex flex-col gap-3">
          <input
            value={roomName}
            placeholder="Nome da sala"
            onChange={(e) => setRoomName(e.target.value)}
            className="p-2 rounded-lg bg-neutral-800 border border-gray-700 text-white"
          />

          <input
            type="number"
            value={roomLimit}
            onChange={(e) => setRoomLimit(parseInt(e.target.value))}
            max={15}
            min={2}
            className="p-2 rounded-lg bg-neutral-800 border border-gray-700 text-white"
          />

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-3 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-semibold"
            >
              Criar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}