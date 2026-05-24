"use client";

import { useState } from "react";
import { useGameContext } from "@/context/GameContext";
import { joinGame } from "@/services/gameService";
import { Game } from "@/types/game";

interface JoinGameModalProps {
  gameId: string;
  game: Game;
}

export default function JoinGameModal({ gameId, game }: JoinGameModalProps) {
  const { currentPlayerName, setCurrentPlayer } = useGameContext();
  const [playerName, setPlayerName] = useState(currentPlayerName || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const playerId = `player_${Date.now()}`;
      await joinGame(gameId, playerId, playerName);
      setCurrentPlayer(playerId, playerName);
      // Game will update via real-time listener
    } catch (err: any) {
      const errorMessage = err?.message || String(err);
      console.error("Join game error:", err);

      if (errorMessage.includes("not-found")) {
        setError("Game not found.");
      } else if (errorMessage.includes("permission-denied")) {
        setError("Permission denied. Check Firebase settings.");
      } else {
        setError(`Error: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const playerCount = Object.keys(game.players).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-slate-700">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">Impostor</h1>
          <p className="text-slate-300">Join this game to play</p>
        </div>

        <div className="bg-slate-700 border border-blue-600 rounded-lg p-4 mb-6">
          <p className="text-sm text-slate-400 mb-1">Game Code</p>
          <p className="text-3xl font-bold text-blue-300 tracking-widest text-center">
            {gameId}
          </p>
        </div>

        <div className="bg-slate-700 border border-slate-600 rounded-lg p-4 mb-6">
          <p className="text-sm text-slate-400 mb-1">Players waiting</p>
          <p className="text-2xl font-bold text-white">{playerCount}</p>
        </div>

        <form onSubmit={handleJoinGame} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
              autoFocus
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-950 p-3 rounded border border-red-900">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !playerName.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition disabled:bg-slate-600"
          >
            {loading ? "Joining..." : "Join Game"}
          </button>
        </form>

        <button
          onClick={() => window.location.href = "/"}
          className="w-full text-blue-400 hover:bg-slate-700 py-2 rounded-lg font-semibold transition mt-2"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
