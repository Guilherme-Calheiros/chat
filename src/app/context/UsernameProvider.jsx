"use client"

import { createContext, useContext, useState, useEffect } from "react";
import { socket } from "../../socket";

const UsernameContext = createContext();

export function UsernameProvider({ children }) {
  const [username, setUsername] = useState(null);

  useEffect(() => {
    if (!username) return;

    socket.auth = { username };
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, [username]);

  return (
    <UsernameContext.Provider value={{ username, setUsername }}>
      {children}
    </UsernameContext.Provider>
  );
}

export function useUsername() {
  return useContext(UsernameContext);
}