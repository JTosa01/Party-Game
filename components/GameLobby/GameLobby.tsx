"use client";

import { useState, useEffect } from "react";
import { useGameContext } from "@/context/GameContext";
import {
  startGame,
  onGameUpdate,
  kickPlayer,
  updateGameSettings,
  updatePlayerName,
} from "@/services/gameService";
import { getRandomWord } from "@/services/wordService";
import { Game } from "@/types/game";

interface GameLobbyProps {
  gameId: string;
}

export default function GameLobby({ gameId }: GameLobbyProps) {
  const { game, currentPlayerId, setGame } = useGameContext();
  const [gameData, setGameData] = useState<Game | null>(null);
  const [selectedWord, setSelectedWord] = useState(getRandomWord());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);
  const [showWord, setShowWord] = useState(false);
  const [kickingPlayer, setKickingPlayer] = useState<string | null>(null);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [updatingName, setUpdatingName] = useState(false);

  useEffect(() => {
    // Subscribe to real-time updates
    const unsub = onGameUpdate(gameId, (updatedGame) => {
      if (updatedGame) {
        setGameData(updatedGame);
        setGame(updatedGame);
      }
    });

    setUnsubscribe(() => unsub);

    return () => unsub();
  }, [gameId, setGame]);

  const isHost = currentPlayerId === gameData?.hostId;
  const playerCount = gameData ? Object.keys(gameData.players).length : 0;
  const maxImpostorCount = playerCount >= 3 ? playerCount - 2 : 1;

  const handleStartGame = async () => {
    if (!isHost) return;

    setLoading(true);
    setError("");

    try {
      await startGame(gameId, selectedWord);
      // Game state will update via real-time listener
    } catch (err) {
      setError("Failed to start game");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKickPlayer = async (playerId: string) => {
    if (!isHost) return;

    setKickingPlayer(playerId);
    try {
      await kickPlayer(gameId, playerId);
    } catch (err) {
      setError("Failed to kick player");
      console.error(err);
    } finally {
      setKickingPlayer(null);
    }
  };

  const handleStartEditingName = (playerId: string, currentName: string) => {
    setEditingPlayerId(playerId);
    setEditingName(currentName);
  };

  const handleSaveName = async (playerId: string) => {
    if (!editingName.trim()) {
      setEditingPlayerId(null);
      return;
    }

    setUpdatingName(true);
    try {
      await updatePlayerName(gameId, playerId, editingName);
      setEditingPlayerId(null);
    } catch (err) {
      setError("Failed to update name");
      console.error(err);
    } finally {
      setUpdatingName(false);
    }
  };

  const handleCancelEditName = () => {
    setEditingPlayerId(null);
    setEditingName("");
  };

  const handleTimerEnabledChange = async (enabled: boolean) => {
    if (!isHost) return;

    try {
      await updateGameSettings(gameId, { roundTimerEnabled: enabled });
    } catch (err) {
      setError("Failed to update timer setting");
      console.error(err);
    }
  };

  const handleTimerSecondsChange = async (value: string) => {
    if (!isHost) return;

    const seconds = Number(value);
    if (!Number.isFinite(seconds)) return;

    try {
      await updateGameSettings(gameId, {
        clueTimeLimit: Math.min(600, Math.max(10, seconds)),
      });
    } catch (err) {
      setError("Failed to update timer length");
      console.error(err);
    }
  };

  const handleImpostorCountChange = async (value: string) => {
    if (!isHost) return;

    const count = Number(value);
    if (!Number.isFinite(count)) return;

    try {
      await updateGameSettings(gameId, {
        impostorCount: Math.min(maxImpostorCount, Math.max(1, count)),
      });
    } catch (err) {
      setError("Failed to update impostor count");
      console.error(err);
    }
  };

  if (!gameData) {
    return <div className="flex items-center justify-center min-h-screen text-slate-200">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Game Info */}
        <div className="bg-slate-800 rounded-2xl shadow-xl p-6 mb-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white">Game Lobby</h1>
            <div className="bg-blue-900 px-4 py-2 rounded-lg border border-blue-700">
              <code className="text-blue-300 font-mono font-bold">{gameId}</code>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-slate-400 text-sm">Host</p>
              <p className="text-lg font-semibold text-white">
                {gameData.players[gameData.hostId]?.name || "Unknown"}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Players</p>
              <p className="text-lg font-semibold text-white">
                {playerCount}
              </p>
            </div>
          </div>

          {/* Players List */}
          <div className="mb-6">
            <h3 className="font-semibold text-white mb-3">Players Joined</h3>
            <div className="space-y-2">
              {Object.values(gameData.players).map((player) => (
                <div
                  key={player.id}
                  className="flex items-center gap-2 p-3 bg-slate-700 rounded-lg border border-slate-600"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  
                  {/* Name Display or Edit */}
                  {editingPlayerId === player.id ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Enter new name"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveName(player.id)}
                        disabled={updatingName}
                        className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition disabled:bg-slate-600"
                      >
                        {updatingName ? "..." : "Save"}
                      </button>
                      <button
                        onClick={handleCancelEditName}
                        disabled={updatingName}
                        className="px-2 py-1 bg-slate-600 hover:bg-slate-500 text-white text-xs rounded transition disabled:bg-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span
                        className={`font-medium text-white flex-1 ${
                          player.id === currentPlayerId ? "cursor-pointer hover:text-blue-300" : ""
                        }`}
                        onClick={() => {
                          if (player.id === currentPlayerId) {
                            handleStartEditingName(player.id, player.name);
                          }
                        }}
                        title={player.id === currentPlayerId ? "Click to edit your name" : ""}
                      >
                        {player.name}
                      </span>
                      {player.id === gameData.hostId && (
                        <span className="text-xs bg-cyan-900 text-cyan-200 px-2 py-1 rounded border border-cyan-700">
                          Host
                        </span>
                      )}
                      {isHost && player.id !== gameData.hostId && (
                        <button
                          onClick={() => handleKickPlayer(player.id)}
                          disabled={kickingPlayer === player.id}
                          className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition disabled:bg-slate-600"
                          title="Kick player"
                        >
                          {kickingPlayer === player.id ? "..." : "Kick"}
                        </button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Start Game Section - Only for Host */}
          {isHost && (
            <div className="border-t border-slate-700 pt-6">
              <h3 className="font-semibold text-white mb-4">Game Settings</h3>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-slate-200">
                    Word to Guess
                  </label>
                  <button
                    onClick={() => setShowWord(!showWord)}
                    className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1 rounded transition border border-slate-600"
                  >
                    {showWord ? "Hide" : "Show"}
                  </button>
                </div>

                {showWord && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={selectedWord}
                      onChange={(e) => setSelectedWord(e.target.value)}
                      className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter or select a word"
                    />
                    <button
                      onClick={() => setSelectedWord(getRandomWord())}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition border border-slate-600"
                    >
                      Random
                    </button>
                  </div>
                )}

                {!showWord && (
                  <div className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-400 text-sm">
                    Word is hidden. Click "Show" to view or change it.
                  </div>
                )}
              </div>

              <div className="mb-4 rounded-lg border border-slate-600 bg-slate-700 p-4">
                <label
                  htmlFor="impostor-count"
                  className="block text-sm font-medium text-slate-200 mb-2"
                >
                  Impostors
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="impostor-count"
                    type="number"
                    min={1}
                    max={maxImpostorCount}
                    value={Math.min(
                      maxImpostorCount,
                      Math.max(1, gameData.settings.impostorCount || 1)
                    )}
                    onChange={(e) => handleImpostorCountChange(e.target.value)}
                    className="w-28 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-300">
                    max {maxImpostorCount}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  At least two non-impostors are required.
                </p>
              </div>

              <div className="mb-4 rounded-lg border border-slate-600 bg-slate-700 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <label
                      htmlFor="round-timer-enabled"
                      className="block text-sm font-medium text-slate-200"
                    >
                      Round Timer
                    </label>
                    <p className="text-xs text-slate-400">
                      Automatically move to voting when time runs out.
                    </p>
                  </div>
                  <input
                    id="round-timer-enabled"
                    type="checkbox"
                    checked={!!gameData.settings.roundTimerEnabled}
                    onChange={(e) => handleTimerEnabledChange(e.target.checked)}
                    className="h-5 w-5 rounded border-slate-500 bg-slate-800 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <div className="mt-4">
                  <label
                    htmlFor="round-timer-seconds"
                    className="block text-sm font-medium text-slate-200 mb-2"
                  >
                    Timer Length
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      id="round-timer-seconds"
                      type="number"
                      min={10}
                      max={600}
                      step={5}
                      value={gameData.settings.clueTimeLimit}
                      onChange={(e) => handleTimerSecondsChange(e.target.value)}
                      disabled={!gameData.settings.roundTimerEnabled}
                      className="w-28 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 disabled:text-slate-500"
                    />
                    <span className="text-sm text-slate-300">seconds</span>
                  </div>
                </div>
              </div>

              {error && <div className="text-red-400 text-sm mb-4 bg-red-950 p-3 rounded border border-red-900">{error}</div>}

              <button
                onClick={handleStartGame}
                disabled={loading || playerCount < 3}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition disabled:bg-slate-600"
              >
                {loading ? "Starting..." : `Start Game (${playerCount} players)`}
              </button>

              {playerCount < 3 && (
                <p className="text-yellow-400 text-sm mt-2">
                  Need at least 3 players to start with impostors
                </p>
              )}
            </div>
          )}

          {!isHost && (
            <div className="bg-slate-700 border border-blue-600 rounded-lg p-4">
              <p className="text-blue-300">
                Waiting for the host to start the game...
              </p>
            </div>
          )}
        </div>

        {/* Game Code Display */}
        <div className="bg-slate-800 rounded-2xl shadow-xl p-6 text-center border border-slate-700">
          <p className="text-slate-400 text-sm mb-4">Share this code with friends:</p>
          <div className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent tracking-widest">{gameId}</div>
        </div>
      </div>
    </div>
  );
}
