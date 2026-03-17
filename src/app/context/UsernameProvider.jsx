"use client"

import { createContext, useContext, useState, useEffect } from "react";
import { socket } from "../../socket";

const UsernameContext = createContext();

export function UsernameProvider({ children }) {
  const [username, setUsername] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("chat_username");
    }
    return null;
  });

  const [userID] = useState(() => {
    if (typeof window !== "undefined") {
      let id = localStorage.getItem("chat_user_id");
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("chat_user_id", id);
      }
      return id;
    }
    return null;
  })

  useEffect(() => {
    if (!username) return;

    localStorage.setItem("chat_username", username);

    socket.auth = {
      username,
      userID
    };
    if (!socket.connected) {
      socket.connect();
    }
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