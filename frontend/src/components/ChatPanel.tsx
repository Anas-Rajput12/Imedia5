"use client";

import { useState } from "react";

export default function ChatPanel() {

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");

  async function sendMessage() {

    if (!input) return;

    const userMessage = {
      role: "user",
      content: input
    };

    setMessages(prev => [...prev, userMessage]);

    setInput("");

    const res = await fetch("/api/explain", {
      method: "POST",
      body: JSON.stringify({ text: input }),
    });

    const data = await res.json();

    const aiMessage = {
      role: "assistant",
      content: data.explanation
    };

    setMessages(prev => [...prev, aiMessage]);
  }

  return (
    <div className="flex flex-col h-full">

      <div className="flex-1 overflow-y-auto">

        {messages.map((msg, i) => (
          <div key={i}>
            <b>{msg.role}:</b> {msg.content}
          </div>
        ))}

      </div>

      <div className="flex gap-2">

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="border flex-1 p-2"
        />

        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4"
        >
          Send
        </button>

      </div>

    </div>
  );
}