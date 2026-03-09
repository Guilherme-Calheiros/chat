'use client';

import { useEffect, useRef, useState } from "react";

export default function Chat({socket, messages, roomId}) {
    const [message, setMessage] = useState("");
    const messagesEndRef = useRef(null);

    const enviarMensagem = () => {
        if (!message.trim()) return;

        let data = {
            roomId: roomId,
            text: message,
        }

        socket.emit("chat:newMessage", data);
        setMessage("");
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="bg-gray-800 p-4 rounded-2xl w-11/12 h-10/12 md:w-6/12 md:h-4/5 flex flex-col gap-4">
            <h1 className="text-3xl font-bold text-center">Webchat</h1>
            <div id="messages" className="flex-1 overflow-y-auto bg-gray-900 p-4 rounded-lg">
                {messages.map((msg, index) => {
                    if (msg.from === "system") {
                        return (
                        <div key={index} className="text-center text-gray-400 text-sm my-2">
                            {msg.text}
                        </div>
                        );
                    }
                    const isMe = msg.socketId === socket.id;

                    return (
                        <div key={index} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`p-2 rounded-lg flex flex-col ${isMe ? "rounded-tr-none bg-cyan-800" : "rounded-tl-none bg-gray-700"} mb-2 text-white w-fit`}>
                            <span className="text-xs text-neutral-400 mr-2">{isMe ? "Você" : msg.from}</span>
                            <p>{msg.text}</p>
                        </div>
                        </div>
                    )
                })}

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
                    className="p-2 rounded-lg bg-cyan-800 text-white font-bold"
                >
                    Enviar
                </button>
            </div>
        </div>
    );
}