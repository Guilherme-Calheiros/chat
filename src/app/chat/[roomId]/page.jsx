"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { socket } from "../../../socket";
import Chat from "../../components/chat";

export default function ChatRoom() {
    const { roomId } = useParams();
    const [inputUsername, setInputUsername] = useState("");
    const [username, setUsername] = useState("");
    const [messages, setMessages] = useState([]);

    // useEffect(() => {
    //     const saved = localStorage.getItem("username");
    //     if (saved) setUsername(saved);
    // }, []);

    useEffect(() => {
        if (!username || !roomId) return;

        socket.disconnect();
        socket.auth = { username };
        socket.connect();

        const joinRoom = () => {
            socket.emit("chat:join", { roomId });
        };

        if (socket.connected) {
            joinRoom();
        } else {
            socket.once("connect", joinRoom);
        }

        const handler = (msg) => {
            setMessages((prev) => [...prev, msg]);
        };

        socket.on("chat:newMessage", handler);

        return () => {
            socket.emit("chat:leave", { roomId });
            socket.off("chat:newMessage", handler);
        };
    }, [username, roomId]);

    useEffect(() => {
        setMessages([]);
    }, [roomId]);

    const handleUsernameSubmit = () => {
        if (!inputUsername.trim()) return;
        setUsername(inputUsername);
        // localStorage.setItem("username", inputUsername);
    };

    if (!username) {
        return (
            <div className="h-screen flex items-center justify-center">
                <input
                    placeholder="Seu nome"
                    value={inputUsername}
                    onChange={(e) => setInputUsername(e.target.value)}
                    className="p-2 bg-neutral-700 text-white rounded"
                />

                <button
                    onClick={() => {
                        handleUsernameSubmit();
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            handleUsernameSubmit();
                        }
                    }}
                    className="ml-2 p-2 bg-cyan-800 text-white rounded hover:bg-cyan-700"
                >
                    Entrar
                </button>
            </div>
        );
    }

    return (
        <div className="h-screen flex items-center justify-center">
            <Chat socket={socket} messages={messages} roomId={roomId} />
        </div>
    );
}