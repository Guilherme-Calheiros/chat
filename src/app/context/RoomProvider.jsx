"use client"

import { createContext, useContext, useState, useEffect } from "react";
import { socket } from "../../socket";

const RoomContext = createContext();

export function RoomProvider({ children }) {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    socket.on("chat:listRooms", (rooms) => setRooms(rooms));

    return () => {
      socket.off("chat:listRooms");
    };
  }, []);

  return (
    <RoomContext.Provider value={{ rooms, setRooms }}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRooms() {
  return useContext(RoomContext);
}