"use client";

import { useState } from "react";
import { Game } from "@/types/game";
import { getVoteResults, endGame } from "@/services/gameService";
import { useGameContext } from "@/context/GameContext";

interface ResultsScreenProps {
  gameId: string;
  game: Game;
  onPlayAgain: () => void;
  onExit: () => void;
}

export default function ResultsScreen({
  gameId,
  game,
  onPlayAgain,
  onExit,
}: ResultsScreenProps) {
  const { currentPlayerId, currentPlayerName } = useGameContext();
  const [impostorGuess, setImpostorGuess] = useState("");
  const [guessSubmitted, setGuessSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const isImpostor = currentPlayerId === game.impostorId;
  const impostorName = game.players[game.impostorId]?.name || "Unknown";

  // Get the player with most votes
  const voteResults: Record<string, number> = {};
  Object.values(game.players).forEach((player) => {
    if (player.voteTarget) {
      voteResults[player.voteTarget] = (voteResults[player.voteTarget] || 0) + 1;
    }
  });

  const mostVotedId = Object.entries(voteResults).sort((a, b) => b[1] - a[1])[0]?.[0];
  const mostVotedName = mostVotedId === "nobody" ? "Nobody" : (game.players[mostVotedId]?.name || "Unknown");
  const wasImpostorOuted = mostVotedId === game.impostorId && mostVotedId !== "nobody";

  const handleSubmitGuess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!impostorGuess.trim() || !isImpostor) return;

    setLoading(true);

    try {
      const guessedCorrectly = impostorGuess.toLowerCase() === game.word.toLowerCase();

      await endGame(gameId, {
        impostorId: game.impostorId,
        impostorName,
        impostorGuess,
        wasOuted: wasImpostorOuted,
        finalWord: game.word,
        votedForId: mostVotedId || game.impostorId,
        votedForName: mostVotedName,
        duration: game.startedAt ? Date.now() - game.startedAt : 0,
        timestamp: Date.now(),
      });

      setGuessSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-700">
          {/* Result Header */}
          <div className="text-center mb-8">
            <div className="text-5xl font-bold mb-4">
              {mostVotedId === "nobody" 
                ? "🔄 Another Round!" 
                : wasImpostorOuted 
                ? "🎉 Impostor Found!" 
                : "😱 Impostor Escaped!"}
            </div>
          </div>

          {/* Game Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {mostVotedId !== "nobody" && (
              <>
                <div className="bg-purple-900 border border-purple-700 rounded-lg p-4">
                  <p className="text-slate-400 text-sm">Impostor</p>
                  <p className="text-xl font-bold text-purple-300">{impostorName}</p>
                </div>
                <div className="bg-red-900 border border-red-700 rounded-lg p-4">
                  <p className="text-slate-400 text-sm">Most Voted</p>
                  <p className="text-xl font-bold text-red-300">{mostVotedName}</p>
                </div>
              </>
            )}
            {mostVotedId === "nobody" && (
              <div className="bg-amber-900 border border-amber-700 rounded-lg p-4 col-span-2">
                <p className="text-slate-400 text-sm mb-2">The group voted for another round</p>
                <p className="text-lg font-bold text-amber-300">Continuing to Round {game.currentRound + 1}...</p>
              </div>
            )}
            {mostVotedId !== "nobody" && (!isImpostor || guessSubmitted) && (
              <div className="bg-blue-900 border border-blue-700 rounded-lg p-4 col-span-2">
                <p className="text-slate-400 text-sm">The Word Was</p>
                <p className="text-3xl font-bold text-blue-300">{game.word}</p>
              </div>
            )}
          </div>

          {/* Impostor Guess Section */}
          {isImpostor && !guessSubmitted && mostVotedId !== "nobody" && (
            <form onSubmit={handleSubmitGuess} className="mb-8 p-4 bg-slate-700 border border-yellow-700 rounded-lg">
              <h3 className="font-bold text-white mb-4">
                {wasImpostorOuted
                  ? "You were outed! Try to guess the word:"
                  : "You escaped! But can you guess the word?"}
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={impostorGuess}
                  onChange={(e) => setImpostorGuess(e.target.value)}
                  placeholder="Enter your guess..."
                  className="flex-1 px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-yellow-500"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !impostorGuess.trim()}
                  className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition disabled:bg-slate-600"
                >
                  {loading ? "Submitting..." : "Guess"}
                </button>
              </div>
            </form>
          )}

          {guessSubmitted && isImpostor && (
            <div className="mb-8 p-4 bg-green-900 border border-green-700 rounded-lg">
              <p className="text-green-300 font-semibold">✓ Guess submitted!</p>
            </div>
          )}

          {/* Vote Breakdown */}
          <div className="mb-8">
            <h3 className="font-bold text-white mb-4">Vote Results</h3>
            <div className="space-y-2">
              {Object.entries(voteResults)
                .sort((a, b) => b[1] - a[1])
                .map(([playerId, voteCount]) => {
                  const playerName = playerId === "nobody" ? "Nobody - Another Round" : (game.players[playerId]?.name || "Unknown");
                  const isNobody = playerId === "nobody";
                  return (
                    <div key={playerId} className={`flex items-center justify-between p-3 rounded-lg border ${
                      isNobody 
                        ? "bg-amber-900 border-amber-700" 
                        : "bg-slate-700 border-slate-600"
                    }`}>
                      <span className={isNobody ? "text-amber-200" : "text-white"}>{playerName}</span>
                      <span className={`font-bold ${isNobody ? "text-amber-200" : "text-slate-200"}`}>{voteCount} vote{voteCount > 1 ? "s" : ""}</span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onPlayAgain}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
            >
              Play Again
            </button>
            <button
              onClick={onExit}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-semibold transition border border-slate-600"
            >
              Exit Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
