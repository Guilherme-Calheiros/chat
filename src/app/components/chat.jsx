'use client';

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FaBan, FaCrown, FaShare, FaSignOutAlt } from "react-icons/fa";

export default function Chat({socket, messages, roomId, users, roomOwner}) {
    const [message, setMessage] = useState("");
    const [showScrollDown, setShowScrollDown] = useState(false);
    const messagesEndRef = useRef(null);
    const containerRef = useRef(null);
    const wasAtBottomRef = useRef(true);
    const [openUserMenu, setOpenUserMenu] = useState(null);

    const router = useRouter()

    const enviarMensagem = () => {
        if (!message.trim()) return;

        let data = {
            roomId: roomId,
            text: message,
        }

        socket.emit("chat:newMessage", data);
        setMessage("");
    };

    const isUserAtBottom = () => {
        const el = containerRef.current;
        if (!el) return false;

        return el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    };

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        wasAtBottomRef.current = isUserAtBottom();
    }, [messages]);

    useEffect(() => {
        if (wasAtBottomRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            setShowScrollDown(false);
        } else {
            setShowScrollDown(true);
        }
    }, [messages]);

    useEffect(() => {
        socket.on("chat:leftRoom", () => {
            router.push("/");
        });

        socket.on("chat:kicked", ({ roomId }) => {
            alert("Você foi expulso da sala" + (roomId ? ` ${roomId}` : "") + " pelo dono.");
            router.push("/");
        });

        const el = containerRef.current;
        if (!el) return;

        const handleScroll = () => {
            if (isUserAtBottom()) {
                setShowScrollDown(false);
            }
        };

        el.addEventListener("scroll", handleScroll);

        function handleClick() {
            setOpenUserMenu(null);
        }
        window.addEventListener("click", handleClick);

        return () => {
            socket.off("chat:leftRoom");
            el.removeEventListener("scroll", handleScroll);
            window.removeEventListener("click", handleClick)
        }
    }, []);

    function handleLeave(){
        socket.emit("chat:leave", { roomId });
    }

    function handleInvite() {
        const inviteLink = `${window.location.origin}/chat/${roomId}`;
        navigator.clipboard.writeText(inviteLink);

        alert("Link de convite copiado para a área de transferência!");
    }

    function handleKick(userId) {
        socket.emit("chat:kick", { roomId, userId });
    }

    console.log(messages)
    console.log(socket)

    return (
        <div className="bg-gray-800 p-4 rounded-2xl w-11/12 h-10/12 md:w-6/12 md:h-4/5 flex flex-col gap-4 relative">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 hover:cursor-pointer p-2" onClick={handleInvite}>
                <FaShare />
            </button>
            <h1 className="text-3xl font-bold text-center">Webchat</h1>
            <div className="flex h-full gap-4">
                <div className="w-1/4 flex flex-col gap-4">
                    <div className="bg-gray-900 flex-1 flex rounded-lg">
                        <ul className="flex-1 p-2 rounded-lg overflow-y-auto">
                            {users.map((user) => (
                                <li key={user.userId} className="text-white p-1 rounded font-bold flex flex-row items-center gap-1 mb-1 relative">
                                    <div>
                                        {user.username} 
                                        <span className="ml-1 text-xs text-gray-500">{user.userId === socket.auth.userId && "(você)"}</span>
                                    </div>
                                    {user.userId === roomOwner && <span className="ml-2 text-xs text-yellow-400"><FaCrown /></span>}
                                    {roomOwner === socket.auth.userId && user.userId !== socket.auth.userId && (
                                        <div className="ml-auto">
                                            <button className="flex items-center justify-center p-2 text-gray-500 hover:text-gray-200 cursor-pointer" onClick={(e) => { 
                                                e.stopPropagation();
                                                setOpenUserMenu(user.userId)
                                            } }>
                                                ...
                                            </button>

                                            {openUserMenu === user.userId && (
                                                <div className="absolute top-full right-0 mt-1 bg-gray-800 rounded shadow-lg z-50 min-w-32">
                                                    <button
                                                        className="block w-full text-left p-2 text-gray-300 hover:bg-gray-600"
                                                        onClick={() => handleKick(user.userId)}
                                                    >
                                                        Expulsar
                                                    </button>
                                                </div>
                                            )}

                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <button className="p-2 flex items-center gap-2 justify-center rounded-lg bg-red-500 hover:bg-red-600 text-white hover:cursor-pointer" onClick={handleLeave}>
                        <FaSignOutAlt />
                        Sair
                    </button>
                </div>
                <div className="flex-1 h-full flex flex-col gap-4">
                    <div id="messages" className="flex-1 overflow-y-auto bg-gray-900 p-4 rounded-lg" ref={containerRef}>
                        {messages.map((msg, index) => {
                            if (msg.from === "system") {
                                return (
                                <div key={index} className="text-center text-gray-400 text-sm my-2">
                                    {msg.text}
                                </div>
                                );
                            }
                            const isMe = msg.userId === socket.auth.userId;

                            const previosMsg = messages[index - 1];
                            const showUsername = !previosMsg || previosMsg.userId !== msg.userId;

                            return (
                                <div key={index} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                    <div className={`p-2 rounded-lg flex flex-col ${isMe ? "rounded-tr-none bg-cyan-800" : "rounded-tl-none bg-gray-700"} mb-2 text-white w-fit`}>
                                        {showUsername && <span className="text-xs text-neutral-400 mr-2">{isMe ? "" : msg.from}</span>}
                                        <p>{msg.text}</p>
                                    </div>
                                </div>
                            )
                        })}
                        {showScrollDown && (
                            <button
                                onClick={() => {
                                    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                                    setShowScrollDown(false);
                                }}
                                className="fixed bottom-24 right-10 bg-cyan-700 text-white px-3 py-2 rounded-full shadow-lg"
                            >
                                ↓ Novas mensagens
                            </button>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="flex gap-2 w-full">
                        <textarea
                            value={message}
                            onChange={(e) => {
                                setMessage(e.target.value);
                                e.target.style.height = "auto";
                                e.target.style.height = e.target.scrollHeight + "px";
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    e.target.style.height = "auto";
                                    enviarMensagem();
                                }
                            }}
                            placeholder="Digite sua mensagem..."
                            className="flex-1 min-w-0 p-2 rounded-lg bg-gray-700 text-white resize-none overflow-hidden"
                            rows={1}
                        />
                        <button 
                            onClick={enviarMensagem}
                            disabled={!message.trim()}
                            className="p-2 rounded-lg bg-cyan-800 hover:bg-cyan-600 text-white font-bold hover:cursor-pointer"
                        >
                            Enviar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}