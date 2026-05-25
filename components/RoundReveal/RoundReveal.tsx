"use client";

import { useEffect, useMemo, useState } from "react";
import { Game } from "@/types/game";
import { useGameContext } from "@/context/GameContext";
import {
  confirmRoundCard,
  replaceWordIfSkipMajority,
  startRoundIfEveryoneReady,
  voteToSkipWord,
} from "@/services/gameService";
import { getRandomWordExcept } from "@/services/wordService";

interface RoundRevealProps {
  gameId: string;
  game: Game;
}

export default function RoundReveal({ gameId, game }: RoundRevealProps) {
  const { currentPlayerId } = useGameContext();
  const [loadingAction, setLoadingAction] = useState<"confirm" | "skip" | null>(null);
  const [error, setError] = useState("");

  const currentPlayer = currentPlayerId ? game.players[currentPlayerId] : null;
  const activePlayers = useMemo(
    () => Object.values(game.players).filter((player) => player.isAlive),
    [game.players]
  );
  const readyCount = activePlayers.filter((player) => player.hasConfirmedWord).length;
  const skipCount = activePlayers.filter((player) => player.votedToSkipWord).length;
  const impostorIds = game.impostorIds?.length ? game.impostorIds : [game.impostorId];
  const isImpostor = currentPlayerId ? impostorIds.includes(currentPlayerId) : false;
  const hasConfirmed = !!currentPlayer?.hasConfirmedWord;
  const votedToSkipWord = !!currentPlayer?.votedToSkipWord;

  useEffect(() => {
    if (game.status !== "revealing") return;
    if (activePlayers.length === 0 || skipCount <= activePlayers.length / 2) return;

    replaceWordIfSkipMajority(gameId, getRandomWordExcept(game.word)).catch((err) => {
      console.error("Failed to replace skipped word:", err);
    });
  }, [activePlayers.length, game.status, game.word, gameId, skipCount]);

  useEffect(() => {
    if (game.status !== "revealing") return;
    if (activePlayers.length === 0 || readyCount !== activePlayers.length) return;

    startRoundIfEveryoneReady(gameId).catch((err) => {
      console.error("Failed to start ready round:", err);
    });
  }, [activePlayers.length, game.status, gameId, readyCount]);

  const handleConfirm = async () => {
    if (!currentPlayerId || hasConfirmed || loadingAction) return;

    setLoadingAction("confirm");
    setError("");

    try {
      await confirmRoundCard(gameId, currentPlayerId);
    } catch (err) {
      setError("Failed to confirm your card");
      console.error(err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSkipWord = async () => {
    if (!currentPlayerId || votedToSkipWord || hasConfirmed || loadingAction) return;

    setLoadingAction("skip");
    setError("");

    try {
      await voteToSkipWord(gameId, currentPlayerId);
    } catch (err) {
      setError("Failed to vote to skip the word");
      console.error(err);
    } finally {
      setLoadingAction(null);
    }
  };

  if (!currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-700 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Round is getting ready</h1>
          <p className="text-slate-300">You are not seated in this game.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <div className="bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-700">
          <div className="text-center mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300 mb-3">
              Private Card
            </p>
            <h1 className="text-4xl font-bold text-white">Check Your Role</h1>
          </div>

          <div
            className={`rounded-2xl border p-8 text-center mb-6 ${
              isImpostor
                ? "bg-red-950 border-red-700"
                : "bg-blue-950 border-blue-700"
            }`}
          >
            <p className="text-sm font-semibold text-slate-300 mb-4">
              {isImpostor ? "Your role" : "Your word"}
            </p>
            <div className={`text-5xl font-bold ${isImpostor ? "text-red-300" : "text-blue-300"}`}>
              {isImpostor ? "Impostor" : game.word}
            </div>
            <p className="text-slate-300 mt-5">
              {isImpostor
                ? "Blend in, listen closely, and try to work out the word."
                : "Give clues that help the group without making it too obvious."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Ready</p>
              <p className="text-2xl font-bold text-white">
                {readyCount} / {activePlayers.length}
              </p>
            </div>
            <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Skip Votes</p>
              <p className="text-2xl font-bold text-white">
                {skipCount} / {activePlayers.length}
              </p>
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm mb-4 bg-red-950 p-3 rounded border border-red-900">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleConfirm}
              disabled={hasConfirmed || !!loadingAction}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition disabled:bg-slate-600 disabled:text-slate-300"
            >
              {hasConfirmed
                ? "Confirmed"
                : loadingAction === "confirm"
                ? "Confirming..."
                : "Confirm Card"}
            </button>
            <button
              onClick={handleSkipWord}
              disabled={hasConfirmed || votedToSkipWord || !!loadingAction}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg font-semibold transition disabled:bg-slate-600 disabled:text-slate-300"
            >
              {votedToSkipWord
                ? "Skip Vote Sent"
                : loadingAction === "skip"
                ? "Voting..."
                : "Vote to Skip Word"}
            </button>
          </div>

          {hasConfirmed && (
            <p className="text-green-300 text-center text-sm mt-4">
              Waiting for every player to confirm.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
