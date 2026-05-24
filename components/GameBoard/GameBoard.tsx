"use client";

import { useState, useEffect } from "react";
import { useGameContext } from "@/context/GameContext";
import { Game, Clue } from "@/types/game";
import { submitClue, onCluesUpdate, updateGameStatus } from "@/services/gameService";
import { useTimer } from "@/hooks/useTimer";
import ChatBox from "@/components/ChatBox/ChatBox";
import { db } from "@/services/firebase";
import { doc, updateDoc } from "firebase/firestore";

interface GameBoardProps {
  gameId: string;
  game: Game;
  onVotePhase: () => void;
}

export default function GameBoard({
  gameId,
  game,
  onVotePhase,
}: GameBoardProps) {
  const { currentPlayerId, currentPlayerName } = useGameContext();
  const [clues, setClues] = useState<Clue[]>([]);
  const [clueInput, setClueInput] = useState("");
  const [hasSubmittedClue, setHasSubmittedClue] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);
  const [timerEnded, setTimerEnded] = useState(false);
  const [votedToSkip, setVotedToSkip] = useState(false);

  const isImpostor = currentPlayerId === game.impostorId;
  const timeLimit = game.settings.clueTimeLimit;
  const { seconds, isRunning } = useTimer(timeLimit, () => {
    setTimerEnded(true);
  });

  // Check if player already voted to skip
  useEffect(() => {
    const currentPlayer = game.players[currentPlayerId!];
    if (currentPlayer?.votedToSkip) {
      setVotedToSkip(true);
    }
  }, [game, currentPlayerId]);

  // Check if majority voted to skip discussion
  useEffect(() => {
    const skipVoteCount = Object.values(game.players).filter(p => p.isAlive && p.votedToSkip).length;
    const alivePlayerCount = Object.values(game.players).filter(p => p.isAlive).length;
    
    // If majority (>50%) voted to skip, move to voting phase
    if (alivePlayerCount > 0 && skipVoteCount > alivePlayerCount / 2) {
      const moveToVoting = async () => {
        try {
          await updateGameStatus(gameId, "voting");
          onVotePhase();
        } catch (err) {
          console.error("Failed to move to voting phase:", err);
        }
      };
      moveToVoting();
    }
  }, [game, gameId, onVotePhase]);

  // Update game status to voting when timer ends
  useEffect(() => {
    if (timerEnded && !isRunning) {
      const updateStatus = async () => {
        try {
          await updateGameStatus(gameId, "voting");
          onVotePhase();
        } catch (err) {
          console.error("Failed to update game status:", err);
        }
      };
      updateStatus();
    }
  }, [timerEnded, isRunning, gameId, onVotePhase]);

  // Subscribe to clues
  useEffect(() => {
    const unsub = onCluesUpdate(gameId, game.currentRound, (updatedClues) => {
      setClues(updatedClues);

      // Check if current player already submitted
      const playerClue = updatedClues.find(
        (clue) => clue.playerId === currentPlayerId
      );
      setHasSubmittedClue(!!playerClue);
    });

    setUnsubscribe(() => unsub);
    return () => unsub();
  }, [gameId, game.currentRound, currentPlayerId]);

  const handleSubmitClue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clueInput.trim() || !currentPlayerName) return;

    setLoading(true);
    setError("");

    try {
      await submitClue(
        gameId,
        currentPlayerId!,
        currentPlayerName,
        clueInput,
        game.currentRound
      );
      setClueInput("");
      setHasSubmittedClue(true);
    } catch (err) {
      setError("Failed to submit clue");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Game Area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Turn Order */}
          {game.turnOrder && game.turnOrder.length > 0 && (
            <div className="bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Turn Order</h3>
              <div className="flex gap-2 flex-wrap">
                {game.turnOrder.map((playerId, index) => {
                  const player = game.players[playerId];
                  const isCurrentTurn = index === game.currentTurnIndex;
                  const isCurrentPlayer = playerId === currentPlayerId;
                  
                  return (
                    <div
                      key={playerId}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        isCurrentTurn
                          ? "bg-yellow-600 text-white ring-2 ring-yellow-400"
                          : "bg-slate-700 text-slate-200 border border-slate-600"
                      } ${isCurrentPlayer ? "ring-2 ring-blue-500" : ""}`}
                      title={isCurrentTurn ? "Currently giving a clue" : ""}
                    >
                      {isCurrentTurn && "→ "}
                      {player?.name || "Unknown"}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Word and Round Info */}
          <div className="bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700">
            <div className="text-center mb-6">
              <div className="text-sm text-slate-400 mb-2">Round {game.currentRound}</div>
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                {isImpostor ? "?" : game.word}
              </div>
              {isImpostor && (
                <div className="text-lg font-semibold text-red-400">
                  You are the Impostor! 🕵️
                </div>
              )}
            </div>

            {/* Timer */}
            <div className="flex items-center justify-center mb-6">
              <div
                className={`text-4xl font-bold font-mono ${
                  seconds > 10 ? "text-blue-400" : "text-red-400"
                }`}
              >
                {String(seconds).padStart(2, "0")}s
              </div>
            </div>

            {/* Players Count */}
            <div className="flex justify-center gap-4 text-sm text-slate-400">
              <span>Players: {Object.keys(game.players).length}</span>
              <span>Alive: {Object.values(game.players).filter(p => p.isAlive).length}</span>
            </div>
          </div>

          {/* Clues Display */}
          <div className="bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">Clues Given</h2>

            <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
              {clues.length === 0 ? (
                <p className="text-slate-400 text-center py-8">
                  No clues yet. Be the first to give one!
                </p>
              ) : (
                clues.map((clue) => (
                  <div
                    key={clue.id}
                    className={`p-4 rounded-lg ${
                      clue.playerId === currentPlayerId
                        ? "bg-blue-900 border-l-4 border-blue-500"
                        : "bg-slate-700 border border-slate-600"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-white">
                        {clue.playerName}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(clue.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-200">{clue.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Clue Input */}
          {!hasSubmittedClue && isRunning && (
            <form onSubmit={handleSubmitClue} className="bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700">
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Your Clue
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={clueInput}
                  onChange={(e) => setClueInput(e.target.value)}
                  placeholder={
                    isImpostor
                      ? "Give a clue without knowing the word..."
                      : "Give a helpful clue"
                  }
                  className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !clueInput.trim()}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:bg-slate-600"
                >
                  {loading ? "..." : "Submit"}
                </button>
              </div>
              {error && <p className="text-red-400 text-sm mt-2 bg-red-950 p-2 rounded border border-red-900">{error}</p>}
            </form>
          )}

          {hasSubmittedClue && (
            <div className="bg-green-900 border border-green-700 rounded-lg p-4">
              <p className="text-green-300 font-semibold">✓ You've submitted your clue</p>
            </div>
          )}

          {/* Skip Discussion Vote */}
          {isRunning && (
            <div className="bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700">
              <p className="text-sm text-slate-300 mb-4">
                Want to move to voting? Vote to skip the discussion phase.
              </p>
              <button
                onClick={async () => {
                  try {
                    await updateDoc(doc(db, "games", gameId, "players", currentPlayerId!), {
                      votedToSkip: true,
                    });
                    // Update local document
                    await updateDoc(doc(db, "games", gameId), {
                      [`players.${currentPlayerId}.votedToSkip`]: true,
                    });
                    setVotedToSkip(true);
                  } catch (err) {
                    console.error("Failed to vote for skip:", err);
                  }
                }}
                disabled={votedToSkip}
                className={`w-full py-2 rounded-lg font-semibold transition ${
                  votedToSkip
                    ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                    : "bg-amber-600 hover:bg-amber-700 text-white"
                }`}
              >
                {votedToSkip ? "✓ You voted to skip" : "Vote to Skip Discussion"}
              </button>
              {Object.values(game.players).filter(p => p.isAlive && p.votedToSkip).length > 0 && (
                <p className="text-xs text-slate-400 mt-2">
                  {Object.values(game.players).filter(p => p.isAlive && p.votedToSkip).length} / {Object.values(game.players).filter(p => p.isAlive).length} players voted to skip
                </p>
              )}
            </div>
          )}

          {!isRunning && (
            <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-4">
              <p className="text-yellow-300 font-semibold">
                Time's up! Moving to voting phase...
              </p>
            </div>
          )}
        </div>

        {/* Chat Sidebar */}
        <div>
          <ChatBox gameId={gameId} />
        </div>
      </div>
    </div>
  );
}
