"use client";

import { useEffect, useState } from "react";
import { socket } from "../socket";

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState("N/A");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if(socket.connected) {
      onConnect();
    }

    function onConnect(){
      setIsConnected(true);
      setTransport(socket.io.engine.transport.name);

      socket.io.engine.on("upgrade", (transport) => {
        setTransport(transport.name);
      });
    }

    function onDisconnect(){
      setIsConnected(false);
      setTransport("N/A");
    }

    function onNewMessage(data) {
      const {from, text, timestamp} = data;
      setMessages(prev => [...prev, {from, text, timestamp}]);
    }

    function onPong(){
      console.log("pong received");
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("newMessage", onNewMessage);

    socket.on("pong", onPong);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("newMessage", onNewMessage);
      socket.off("pong", onPong);
    };

  }, [])

  const enviarMensagem = () => {
    if(message.trim() !== "") {
      socket.emit("sendMessage", message);
      setMessage("");
    }
  };

  return (
    <div className="h-screen p-4 flex flex-col gap-4 items-center justify-center">
      <div className="bg-neutral-800 p-4 rounded-2xl w-11/12 h-10/12 md:w-6/12 md:h-4/5 flex flex-col gap-4">
        <h1 className="text-3xl font-bold text-center">Webchat</h1>
        <div id="messages" className="flex-1 overflow-y-auto bg-neutral-900 p-4 rounded-lg">
          {messages.map((msg, index) => {
            const isMe = msg.from === socket.id;

            return (
              <div key={index} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`p-2 rounded-lg ${isMe ? "rounded-tr-none bg-cyan-800" : "rounded-tl-none bg-neutral-700"} mb-2 text-white w-fit`}>
                  {msg.text}
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={message}
            placeholder="Digite sua mensagem..."
            className="flex-1 p-2 rounded-lg bg-neutral-700 text-white" 
            onChange={(e) => {
              setMessage(e.target.value);
            }}
          />
          <button onClick={enviarMensagem} className="p-2 rounded-lg bg-cyan-800 text-white font-bold">Enviar</button>
        </div>
      </div>
    </div>
  );
}
