"use client";

import { useEffect, useState } from "react";
import { socket } from "../socket";
import UserForm from "./components/userform";
import ModalCreateRoom from "./components/modalcreateroom";
import { useRouter } from "next/navigation";
import { useUsername } from "./context/UsernameProvider";

export default function Home() {
  const [rooms, setRooms] = useState([]);
  const { username, setUsername } = useUsername();
  const [modalCreateRoom, setModalCreateRoom] = useState(false)

  const router = useRouter()

  useEffect(() => {

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
    }
  }, []);

  function handleJoinRoom(roomId) {
    router.push(`/chat/${roomId}`);
  }

  function handleSetUsername(name){
    setUsername(name)
  }

  function handleModal(){
    if(!username){
      alert("Você precisa ter um username para criar uma sala")
      return
    }

    setModalCreateRoom(true)
  }

  return (
    <div className="h-screen p-4 flex flex-col gap-4 items-center justify-center">
        <div>
          <h1 className="text-3xl font-bold mb-4 text-center">Web Chat</h1>
          {username ? (
            <div>
              <p>{username}</p>
            </div>
          ) : (
            <UserForm onSetUsername={handleSetUsername}/>
          )}
          <button onClick={handleModal}>
            Criar Sala
          </button>
          {modalCreateRoom && (
            <ModalCreateRoom handleCancel={() => setModalCreateRoom(false)} socket={socket}/>
          )}
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
        </div>
    </div>
  );
}
