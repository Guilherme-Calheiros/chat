"use client"

import React from "react";
import { useState } from "react";
import { useUsername } from "../context/UsernameProvider";

export default function UserForm(){
    const [inputUsername, setInputUsername] = useState("");
    const { setUsername } = useUsername();

    function handleUsernameSubmit(e){
        e.preventDefault();
        if (!inputUsername.trim()) return;
        setUsername(inputUsername);
    }

    return(
        <form onSubmit={handleUsernameSubmit} className="flex gap-4">
            <input
                id="username"
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
                placeholder="Escolha seu username"
                className="p-2 flex-1 bg-gray-700 text-white rounded"
            />
            <button type="submit" className="p-2 hover:cursor-pointer rounded-lg bg-cyan-800 text-white font-bold">
                Entrar
            </button>
        </form>
    )
}