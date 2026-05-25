"use client";

import { useState, useEffect } from "react";
import { Game } from "@/types/game";
import {
  submitVote,
  getVoteResults,
  resolveCompletedVote,
} from "@/services/gameService";
import { useGameContext } from "@/context/GameContext";

interface VotingPanelProps {
  gameId: string;
  game: Game;
  onVotingComplete: (votedForId: string) => void;
}

export default function VotingPanel({
  gameId,
  game,
  onVotingComplete,
}: VotingPanelProps) {
  const { currentPlayerId } = useGameContext();
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [voteResults, setVoteResults] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const alivePlayersWithoutCurrent = Object.values(game.players).filter(
    (p) => p.isAlive && p.id !== currentPlayerId
  );
  const currentPlayer = currentPlayerId ? game.players[currentPlayerId] : null;
  const hasVoted = !!currentPlayer?.hasVoted;
  const canVote = !!currentPlayer?.isAlive;

  useEffect(() => {
    // Auto-load vote results periodically
    const interval = setInterval(async () => {
      const results = await getVoteResults(gameId);
      setVoteResults(results);
    }, 1000);

    return () => clearInterval(interval);
  }, [gameId]);

  // Check if all players have voted and resolve the elimination.
  useEffect(() => {
    const checkAllVoted = async () => {
      const alivePlayerCount = Object.values(game.players).filter(p => p.isAlive).length;
      const votedCount = Object.values(game.players).filter(p => p.isAlive && p.hasVoted).length;

      if (alivePlayerCount > 0 && votedCount === alivePlayerCount && votedCount > 0) {
        try {
          await resolveCompletedVote(gameId);
        } catch (err) {
          console.error("Failed to resolve vote:", err);
        }
      }
    };

    checkAllVoted();
  }, [game, gameId]);

  const handleVote = async (targetId: string) => {
    if (!canVote || hasVoted || loading) return;

    setLoading(true);
    setError("");

    try {
      await submitVote(gameId, currentPlayerId!, targetId);
      setSelectedVote(targetId);
      onVotingComplete(targetId);
    } catch (err) {
      setError("Failed to submit vote");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getMostVoted = () => {
    if (Object.keys(voteResults).length === 0) return null;
    return Object.entries(voteResults).sort((a, b) => b[1] - a[1])[0][0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-700">
          <h1 className="text-4xl font-bold text-center text-white mb-2">
            Voting Phase
          </h1>
          <p className="text-center text-slate-300 mb-8">
            Who do you think is the impostor?
          </p>

          {!canVote && (
            <div className="mb-6 bg-slate-700 border border-slate-600 rounded-lg p-4">
              <p className="text-slate-300 text-center">
                You have been voted out and cannot vote.
              </p>
            </div>
          )}

          {/* Vote Results */}
          {Object.keys(voteResults).length > 0 && (
            <div className="mb-8 p-4 bg-slate-700 rounded-lg border border-slate-600">
              <h3 className="font-semibold text-white mb-3">Current Votes</h3>
              <div className="space-y-2">
                {Object.entries(voteResults)
                  .sort((a, b) => b[1] - a[1])
                  .map(([playerId, voteCount]) => {
                    const playerName =
                      playerId === "nobody"
                        ? "Nobody - Another Round"
                        : game.players[playerId]?.name || "Unknown";
                    const isLeading = playerId === getMostVoted();
                    return (
                      <div
                        key={playerId}
                        className={`flex items-center justify-between p-2 rounded ${
                          isLeading ? "bg-red-900 border border-red-700" : "bg-slate-600"
                        }`}
                      >
                        <span className="font-medium text-white">{playerName}</span>
                        <span className="font-bold text-lg text-slate-200">{voteCount}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Players to Vote For */}
          <div className="space-y-3 mb-8">
            {/* Nobody Option */}
            <button
              onClick={() => handleVote("nobody")}
              disabled={!canVote || hasVoted || loading}
              className={`w-full p-4 rounded-lg font-semibold transition border-2 ${
                selectedVote === "nobody"
                  ? "bg-amber-600 text-white border-amber-500"
                  : hasVoted || !canVote
                  ? "bg-slate-700 text-slate-400 cursor-not-allowed border-slate-600"
                  : "bg-slate-700 text-white hover:bg-amber-600 border-amber-600"
              }`}
            >
              Nobody - Another Round
              {selectedVote === "nobody" && " ✓"}
            </button>

            {alivePlayersWithoutCurrent.length === 0 ? (
              <p className="text-slate-400 text-center py-8">
                No other players available to vote for
              </p>
            ) : (
              alivePlayersWithoutCurrent.map((player) => (
                <button
                  key={player.id}
                  onClick={() => handleVote(player.id)}
                  disabled={!canVote || hasVoted || loading}
                  className={`w-full p-4 rounded-lg font-semibold transition ${
                    selectedVote === player.id
                      ? "bg-red-600 text-white border border-red-500"
                      : hasVoted || !canVote
                      ? "bg-slate-700 text-slate-400 cursor-not-allowed border border-slate-600"
                      : "bg-slate-700 text-white hover:bg-red-600 border border-slate-600"
                  }`}
                >
                  {player.name}
                  {selectedVote === player.id && " ✓"}
                </button>
              ))
            )}
          </div>

          {error && <div className="text-red-400 text-center text-sm bg-red-950 p-3 rounded border border-red-900">{error}</div>}

          {hasVoted && (
            <div className="bg-green-900 border border-green-700 rounded-lg p-4">
              <p className="text-green-300 font-semibold text-center">
                ✓ Your vote has been submitted!
              </p>
              <p className="text-green-400 text-sm text-center mt-2">
                Waiting for other players to vote...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
