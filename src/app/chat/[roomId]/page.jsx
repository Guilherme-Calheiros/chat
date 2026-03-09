"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { socket } from "../../../socket";
import Chat from "../../components/chat";
import { useUsername } from "@/app/context/UsernameProvider";

export default function ChatRoom() {
    const { roomId } = useParams();
    const { username } = useUsername();
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        if (!username || !roomId) return;

        socket.emit("chat:join", { roomId });

        const handler = (msg) => setMessages((prev) => [...prev, msg]);
        socket.on("chat:newMessage", handler);

        return () => {
            socket.off("chat:newMessage", handler);
            setMessages([]);
        };
    }, [roomId]);

    return (
        <div className="h-screen flex items-center justify-center bg-gray-950">
            <Chat socket={socket} messages={messages} roomId={roomId} />
        </div>
    );
}