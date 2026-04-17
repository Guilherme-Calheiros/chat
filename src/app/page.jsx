"use client";

import { useEffect, useState } from "react";
import { socket } from "../socket";
import UserForm from "./components/userform";
import ModalCreateRoom from "./components/modalcreateroom";
import { useRouter } from "next/navigation";
import { useUsername } from "./context/UsernameProvider";
import { useRooms } from "./context/RoomProvider";

export default function Home() {
  const { rooms, setRooms } = useRooms();
  const { username, setUsername } = useUsername();
  const [modalCreateRoom, setModalCreateRoom] = useState(false)

  const router = useRouter()

  useEffect(() => {
    socket.on("chat:listRooms", (rooms) => {
      console.log("Recebendo lista de salas:", rooms);
      setRooms(rooms);
    });
    socket.on("chat:error", ({ message }) => alert(message));
    socket.on("chat:allowed", ({ roomId }) => {
      router.push(`/chat/${roomId}`);
    });

    return () => {
      socket.off("chat:listRooms");
      socket.off("chat:newRoom");
      socket.off("chat:removeRoom");
      socket.off("chat:error");
      socket.off("chat:allowed");
    }
  }, []);

  function handleJoinRoom(roomId) {
    socket.emit("chat:checkRoom", { roomId });
  }
  
  console.log(rooms)

  function handleDisconnect(){
    socket.disconnect()
    setUsername('')
    localStorage.removeItem("chat_username");
  }

  function handleModal(){
    if(!username){
      alert("Você precisa ter um username para criar uma sala")
      return
    }
    setModalCreateRoom(true)
  }

  const visibleRooms = rooms.filter(room => room.users.length > 0);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-center gap-2 mb-5">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Web<span className="text-cyan-500">Chat</span></h1>
          </div>
          <div>
            {username ? (
              <div>
                <div className="flex justify-between w-full">
                  <div className="inline-flex items-center gap-2 bg-cyan-950 border border-cyan-800 text-cyan-400 text-sm font-semibold rounded-full px-4 py-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    {username}
                  </div>
                  <button onClick={handleDisconnect} className="p-2 hover:cursor-pointer rounded-lg bg-cyan-800 text-white font-bold">
                        Sair
                  </button>
                </div>
                <button className="p-4 hover:cursor-pointer hover:bg-cyan-900 rounded-lg bg-cyan-800 text-white font-bold w-full my-5" onClick={handleModal}>
                  + Nova Sala
                </button>
                {modalCreateRoom && (
                  <ModalCreateRoom handleCancel={() => setModalCreateRoom(false)} socket={socket}/>
                )}
                <hr className="border-gray-800 my-6" />
                {visibleRooms.length > 0 ? (
                  <ul className="flex flex-col gap-2">
                    {visibleRooms.map((room) => {
                      const ratio = room.users.length / room.roomUserLimit;
                      const isFull = ratio >= 1;

                      const barColor = isFull
                        ? "bg-red-500"
                        : ratio >= 0.75
                        ? "bg-yellow-400"
                        : "bg-emerald-400";

                      const capacityColor = isFull ? "text-red-400" : "text-gray-500";

                      return (
                        <li key={room.roomId}>
                          <button
                            onClick={() => !isFull && handleJoinRoom(room.roomId)}
                            disabled={isFull}
                            className="w-full flex items-center justify-between bg-gray-800/50 hover:bg-cyan-950/60 border border-gray-700/50 hover:border-cyan-800 rounded-xl px-4 py-3 transition-all duration-150 hover:translate-x-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:bg-gray-800/50 disabled:hover:border-gray-700/50 group"
                          >
                            <span className="text-sm font-semibold text-gray-100">
                              {room.roomName}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className={`font-mono text-xs ${capacityColor}`}>
                                {room.users.length}/{room.roomUserLimit}
                              </span>
                              <div className="w-9 h-1 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                                  style={{ width: `${Math.min(ratio, 1) * 100}%` }}
                                />
                              </div>
                              <span className="text-gray-600 group-hover:text-cyan-400 transition-all text-sm">
                                ›
                              </span>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="text-center py-8 text-gray-600">
                    <p className="text-sm leading-relaxed">
                      Nenhuma sala ativa ainda.
                      <br />
                      Crie uma para começar!
                    </p>
                  </div>
                )}
            </div>
            ) : (
              <div className="flex-1">
                <UserForm />
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
