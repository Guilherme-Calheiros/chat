"use client"

import React from "react";
import { useState } from "react";

export default function UserForm({ onSetUsername }){
    const [inputUsername, setInputUsername] = useState("")

    function handleUsernameSubmit(e){
        e.preventDefault();
        if (!inputUsername.trim()) return;
        onSetUsername(inputUsername);
    }

    return(
        <form onSubmit={handleUsernameSubmit}>
            <input
                id="username"
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
                placeholder="Escolha seu username"
                className="p-2 bg-neutral-700 text-white rounded"
            />
        </form>
    )
}