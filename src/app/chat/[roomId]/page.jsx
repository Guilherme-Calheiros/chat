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
    const [users, setUsers] = useState([]);
    const [roomOwner, setRoomOwner] = useState(null);

    useEffect(() => {
        if (!username || !roomId) return;

        socket.emit("chat:join", { roomId });

        const handler = (msg) => setMessages((prev) => [...prev, msg]);
        socket.on("chat:newMessage", handler);

        socket.on("chat:history", (messages) => {
            setMessages(messages);
        });

        socket.on("chat:users", (data) => {
            setUsers(data.users);
            setRoomOwner(data.roomOwner);
        });

        return () => {
            socket.off("chat:newMessage", handler);
            socket.off("chat:users", (data) => {
                setUsers(data.users);
                setRoomOwner(data.roomOwner);
            });

            setMessages([]);
        };
    }, [roomId]);

    return (
        <div className="h-screen flex items-center justify-center bg-gray-950">
            <Chat socket={socket} messages={messages} roomId={roomId} users={users} roomOwner={roomOwner} />
        </div>
    );
}