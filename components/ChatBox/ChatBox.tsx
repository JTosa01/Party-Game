"use client";

import { useState, useEffect } from "react";
import { ChatMessage } from "@/types/game";
import { sendChatMessage, onChatUpdate } from "@/services/gameService";
import { useGameContext } from "@/context/GameContext";

interface ChatBoxProps {
  gameId: string;
}

export default function ChatBox({ gameId }: ChatBoxProps) {
  const { currentPlayerId, currentPlayerName } = useGameContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  // Subscribe to chat messages
  useEffect(() => {
    const unsub = onChatUpdate(gameId, (updatedMessages) => {
      setMessages(updatedMessages);
    });

    setUnsubscribe(() => unsub);
    return () => unsub();
  }, [gameId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !currentPlayerName) return;

    const normalizedMessage = messageInput.trim().toLowerCase();
    if (normalizedMessage === "dev_mode") {
      if (currentPlayerId) {
        localStorage.setItem(`devMode:${currentPlayerId}`, "true");
        window.dispatchEvent(
          new CustomEvent("dev-mode-unlocked", {
            detail: { playerId: currentPlayerId },
          })
        );
        setStatusMessage(
          "Dev mode unlocked! Click a player in the lobby to send a page message."
        );
      } else {
        setStatusMessage(
          "Unable to unlock dev mode: missing player ID. Refresh the page and try again."
        );
      }

      setMessageInput("");
      return;
    }

    setLoading(true);

    try {
      await sendChatMessage(
        gameId,
        currentPlayerId!,
        currentPlayerName,
        messageInput
      );
      setMessageInput("");
      setStatusMessage("");
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-2xl shadow-xl p-4 h-full flex flex-col border border-slate-700">
      <h3 className="font-bold text-white mb-4">Chat</h3>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-96">
        {messages.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">
            No messages yet
          </p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex flex-col">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold text-white">
                  {msg.playerName}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-sm text-slate-300">{msg.message}</p>
            </div>
          ))
        )}
      </div>

      {statusMessage && (
        <p className="text-xs text-cyan-300 mb-3">{statusMessage}</p>
      )}

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={messageInput}
          onChange={(e) => {
            setMessageInput(e.target.value);
            setStatusMessage("");
          }}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !messageInput.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition disabled:bg-slate-600"
        >
          Send
        </button>
      </form>
    </div>
  );
}
