"use client";

import { useState } from "react";
import { useGameContext } from "@/context/GameContext";
import { useAuth } from "@/context/AuthContext";
import { createGame, joinGame } from "@/services/gameService";
import { getRandomWord } from "@/services/wordService";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const { setCurrentPlayer } = useGameContext();
  const { userId, loading: authLoading, error: authError } = useAuth();
  const [view, setView] = useState<"home" | "create" | "join">("home");
  const [playerName, setPlayerName] = useState("");
  const [gameCode, setGameCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!userId) {
      setError("Authentication failed. Please refresh the page.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const defaultSettings = {
        roundLimit: 3,
        roundTimerEnabled: false,
        clueTimeLimit: 60,
        impostorCount: 1,
        gameMode: "standard" as const,
        wordListId: "default",
      };

      const gameId = await createGame(userId, playerName, defaultSettings);
      setCurrentPlayer(userId, playerName);
      localStorage.setItem("gameId", gameId);

      router.push(`/game/${gameId}`);
    } catch (err: any) {
      const errorMessage = err?.message || String(err);
      console.error("Create game error:", err);
      
      if (errorMessage.includes("permission-denied")) {
        setError("Firebase not set up. See SETUP.md for Firestore configuration.");
      } else if (errorMessage.includes("network")) {
        setError("Network error. Check your internet connection.");
      } else {
        setError(`Error: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !gameCode.trim()) {
      setError("Please enter your name and game code");
      return;
    }
    if (!userId) {
      setError("Authentication failed. Please refresh the page.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await joinGame(gameCode, userId, playerName);
      setCurrentPlayer(userId, playerName);
      localStorage.setItem("gameId", gameCode);

      router.push(`/game/${gameCode}`);
    } catch (err) {
      setError("Failed to join game. Please check the game code.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-3 sm:p-4">
        <div className="bg-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full border border-slate-700 text-center">
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-3 sm:p-4">
        <div className="bg-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full border border-slate-700">
          <div className="text-red-400 text-sm bg-red-950 p-3 rounded-lg border border-red-900">
            Auth Error: {authError}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full border border-slate-700">
        {view === "home" && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                Impostor
              </h1>
              <p className="text-slate-300">
                Find the impostor among your friends!
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <button
                onClick={() => setView("create")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 sm:py-3 rounded-lg font-semibold transition duration-200 shadow-lg min-h-12 text-base sm:text-base"
              >
                Create Game
              </button>
              <button
                onClick={() => setView("join")}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-3 sm:py-3 rounded-lg font-semibold transition duration-200 shadow-lg min-h-12 text-base sm:text-base"
              >
                Join Game
              </button>
            </div>
          </>
        )}

        {view === "create" && (
          <>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">
              Create Game
            </h2>
            <form onSubmit={handleCreateGame} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 sm:py-2 bg-slate-700 border border-slate-600 rounded-lg text-base sm:text-sm text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-12 sm:min-h-10"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="text-red-400 text-sm bg-red-950 p-3 rounded-lg border border-red-900">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 sm:py-3 rounded-lg font-semibold transition duration-200 disabled:bg-slate-600 min-h-12 text-base"
              >
                {loading ? "Creating..." : "Create Game"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setView("home");
                  setError("");
                }}
                className="w-full text-blue-400 hover:bg-slate-700 py-3 sm:py-3 rounded-lg font-semibold transition min-h-12"
              >
                Back
              </button>
            </form>
          </>
        )}

        {view === "join" && (
          <>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">
              Join Game
            </h2>
            <form onSubmit={handleJoinGame} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 sm:py-2 bg-slate-700 border border-slate-600 rounded-lg text-base sm:text-sm text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent min-h-12 sm:min-h-10"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Game Code
                </label>
                <input
                  type="text"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value)}
                  placeholder="Enter game code"
                  className="w-full px-4 py-3 sm:py-2 bg-slate-700 border border-slate-600 rounded-lg text-base sm:text-sm text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent min-h-12 sm:min-h-10 uppercase"
                  disabled={loading}
                  maxLength={4}
                />
              </div>

              {error && (
                <div className="text-red-400 text-sm bg-red-950 p-3 rounded-lg border border-red-900">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-3 sm:py-3 rounded-lg font-semibold transition duration-200 disabled:bg-slate-600 min-h-12 text-base"
              >
                {loading ? "Joining..." : "Join Game"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setView("home");
                  setError("");
                }}
                className="w-full text-cyan-400 hover:bg-slate-700 py-3 sm:py-3 rounded-lg font-semibold transition min-h-12"
              >
                Back
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
