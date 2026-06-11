"use client";

import { useState, useEffect } from "react";
import { useGameContext } from "@/context/GameContext";
import { Game, Clue } from "@/types/game";
import {
  submitClue,
  onCluesUpdate,
  updateGameStatus,
  voteToSkipDiscussion,
  sendDevBroadcast,
  clearDevBroadcast,
} from "@/services/gameService";
import { useTimer } from "@/hooks/useTimer";
import { getPlayerWord } from "@/services/wordService";
import ChatBox from "@/components/ChatBox/ChatBox";
import DrawingCanvas from "@/components/DrawingCanvas/DrawingCanvas";
import SharedDrawingCanvas from "@/components/SharedDrawingCanvas/SharedDrawingCanvas";
import { getSharedDrawingColor } from "@/services/sharedDrawingColors";

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
  const [devModeEnabled, setDevModeEnabled] = useState(false);
  const [devTargetId, setDevTargetId] = useState<string | null>(null);
  const [devMessage, setDevMessage] = useState("");
  const [devGifUrl, setDevGifUrl] = useState("");
  const [sendingDevMessage, setSendingDevMessage] = useState(false);
  const [devStatusMessage, setDevStatusMessage] = useState("");

  const impostorIds = game.impostorIds?.length ? game.impostorIds : [game.impostorId];
  const isImpostor = currentPlayerId ? impostorIds.includes(currentPlayerId) : false;
  const showFakeMode = game.settings.gameMode === "impostor_gets_similar_word";
  const visualImpostor = isImpostor && !showFakeMode;
  const isDrawingMode = game.settings.gameMode === "drawing";
  const isSharedDrawingMode = game.settings.gameMode === "shared_drawing";
  const currentPlayer = currentPlayerId ? game.players[currentPlayerId] : null;
  const isCurrentPlayerAlive = !!currentPlayer?.isAlive;
  const timerEnabled = !!game.settings.roundTimerEnabled;
  const timeLimit = (isDrawingMode || isSharedDrawingMode) ? (game.settings.drawTimeLimit || 60) : game.settings.clueTimeLimit;
  const { seconds, isRunning } = useTimer(timeLimit, () => {
    setTimerEnded(true);
  }, timerEnabled);
  const roundIsActive = !timerEnabled || isRunning;
  const aliveTurnOrder = (game.turnOrder || []).filter(
    (playerId) => game.players[playerId]?.isAlive
  );
  const currentDrawingPlayerId =
    isSharedDrawingMode && game.currentTurnIndex !== undefined
      ? aliveTurnOrder[game.currentTurnIndex]
      : null;
  const currentDrawingPlayerName = currentDrawingPlayerId
    ? game.players[currentDrawingPlayerId]?.name || "Unknown"
    : "Someone";
  const currentDrawingColor = getSharedDrawingColor(
    Math.max(0, game.currentTurnIndex ?? 0)
  );

  // Determine if it's the current player's turn in shared drawing mode
  const isCurrentPlayersTurn = 
    isSharedDrawingMode && currentDrawingPlayerId
      ? currentDrawingPlayerId === currentPlayerId
      : true;

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
    if (timerEnabled && timerEnded && !isRunning) {
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
  }, [timerEnabled, timerEnded, isRunning, gameId, onVotePhase]);

  useEffect(() => {
    if (!currentPlayerId) return;

    const storageKey = `devMode:${currentPlayerId}`;
    setDevModeEnabled(localStorage.getItem(storageKey) === "true");

    const handleDevModeUnlocked = (event: Event) => {
      const customEvent = event as CustomEvent<{ playerId?: string }>;
      if (customEvent.detail?.playerId === currentPlayerId) {
        setDevModeEnabled(true);
      }
    };

    window.addEventListener("dev-mode-unlocked", handleDevModeUnlocked);
    return () => window.removeEventListener("dev-mode-unlocked", handleDevModeUnlocked);
  }, [currentPlayerId]);

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


  const handleSubmitSharedDrawing = async (drawingData: string) => {
    if (!currentPlayerName) return;
    if (isSharedDrawingMode && !isCurrentPlayersTurn) {
      setError("It is not your turn to draw yet.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await submitClue(
        gameId,
        currentPlayerId!,
        currentPlayerName,
        null,
        game.currentRound,
        drawingData
      );
      setHasSubmittedClue(true);
    } catch (err) {
      setError("Failed to submit shared drawing");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const handleSubmitDrawing = async (drawingData: string) => {
    if (!currentPlayerName) return;

    setLoading(true);
    setError("");

    try {
      await submitClue(
        gameId,
        currentPlayerId!,
        currentPlayerName,
        null,
        game.currentRound,
        drawingData
      );
      setHasSubmittedClue(true);
    } catch (err) {
      setError("Failed to submit drawing");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDevTarget = (playerId: string) => {
    if (!devModeEnabled || !roundIsActive) return;
    setDevTargetId(playerId);
    setDevMessage("");
    setDevGifUrl("");
    setDevStatusMessage("");
  };

  const handleSendDevMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devTargetId || !devMessage.trim() || !currentPlayerId || !currentPlayerName) return;

    const targetPlayer = game.players[devTargetId];
    if (!targetPlayer) return;

    setSendingDevMessage(true);
    setError("");
    setDevStatusMessage("");

    try {
      await sendDevBroadcast(
        gameId,
        currentPlayerId,
        currentPlayerName,
        targetPlayer.id,
        targetPlayer.name,
        devMessage.trim(),
        devGifUrl || undefined
      );

      setDevStatusMessage(`Message sent to ${targetPlayer.name}.`);
      setDevTargetId(null);
      setDevMessage("");
      setDevGifUrl("");

      window.setTimeout(() => {
        clearDevBroadcast(gameId).catch((err) => {
          console.error("Failed to clear dev broadcast:", err);
        });
      }, 3000);
    } catch (err) {
      setError("Failed to send dev message");
      console.error(err);
    } finally {
      setSendingDevMessage(false);
    }
  };

  const devTarget = devTargetId ? game.players[devTargetId] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Game Area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Turn Order */}
          {game.turnOrder && game.turnOrder.length > 0 && (
            <div className="bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Turn Order</h3>
              {devModeEnabled && roundIsActive && (
                <p className="text-xs text-cyan-300 mb-3">
                  Dev mode enabled. Click a player name to send a page message.
                </p>
              )}
              <div className="flex gap-2 flex-wrap">
                {game.turnOrder.map((playerId, index) => {
                  const player = game.players[playerId];
                  const isCurrentTurn = index === game.currentTurnIndex;
                  const isCurrentPlayer = playerId === currentPlayerId;
                  const canClickDevTarget = devModeEnabled && roundIsActive;
                  
                  return (
                    <div
                      key={playerId}
                      onClick={() => canClickDevTarget && handleSelectDevTarget(playerId)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        isCurrentTurn
                          ? "bg-yellow-600 text-white ring-2 ring-yellow-400"
                          : "bg-slate-700 text-slate-200 border border-slate-600"
                      } ${isCurrentPlayer ? "ring-2 ring-blue-500" : ""} ${
                        canClickDevTarget ? "cursor-pointer hover:border-cyan-400" : ""
                      }`}
                      title={isCurrentTurn ? "Currently giving a clue" : canClickDevTarget ? "Click to send a dev page message" : ""}
                    >
                      {isCurrentTurn && "→ "}
                      {player?.name || "Unknown"}
                    </div>
                  );
                })}
              </div>

              {devTarget && (
                <form
                  onSubmit={handleSendDevMessage}
                  className="mt-4 rounded-2xl border border-cyan-700 bg-cyan-950/20 p-4"
                >
                  <p className="text-sm text-cyan-100 mb-3">
                    Sending a page message to {devTarget.name}.
                  </p>
                  <div className="flex flex-col gap-2 mb-2">
                    <input
                      type="text"
                      value={devMessage}
                      onChange={(e) => setDevMessage(e.target.value)}
                      placeholder="Type the page message"
                      className="w-full px-4 py-2 bg-slate-800 border border-cyan-800 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500"
                      disabled={sendingDevMessage}
                      autoFocus
                    />
                    <input
                      type="url"
                      value={devGifUrl}
                      onChange={(e) => setDevGifUrl(e.target.value)}
                      placeholder="Optional: GIF URL (e.g., https://media.giphy.com/...)"
                      className="w-full px-4 py-2 bg-slate-800 border border-cyan-800 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500"
                      disabled={sendingDevMessage}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={sendingDevMessage || !devMessage.trim()}
                      className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition disabled:bg-slate-600"
                    >
                      {sendingDevMessage ? "Sending..." : "Send"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDevTargetId(null)}
                      disabled={sendingDevMessage}
                      className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition disabled:bg-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                  {devStatusMessage && (
                    <p className="text-xs text-cyan-200 mt-2">{devStatusMessage}</p>
                  )}
                  {error && (
                    <p className="text-xs text-red-400 mt-2">{error}</p>
                  )}
                </form>
              )}
            </div>
          )}

          {/* Word and Round Info */}
          <div className="bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700">
            <div className="text-center mb-6">
              <div className="text-sm text-slate-400 mb-2">Round {game.currentRound}</div>
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                {getPlayerWord(game.word, isImpostor, game.impostorWord)}
              </div>
              {visualImpostor && (
                <div className="text-lg font-semibold text-red-400">
                  You are the Impostor! 🕵️
                </div>
              )}
            </div>

            {/* Timer */}
            <div className="flex items-center justify-center mb-6">
              {timerEnabled ? (
                <div
                  className={`text-4xl font-bold font-mono ${
                    seconds > 10 ? "text-blue-400" : "text-red-400"
                  }`}
                >
                  {String(seconds).padStart(2, "0")}s
                </div>
              ) : (
                <div className="text-sm font-semibold text-slate-300 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2">
                  Timer Off
                </div>
              )}
            </div>

            {/* Players Count */}
            <div className="flex justify-center gap-4 text-sm text-slate-400">
              <span>Players: {Object.keys(game.players).length}</span>
              <span>Alive: {Object.values(game.players).filter(p => p.isAlive).length}</span>
            </div>
          </div>

          {/* Clues Display */}
          {!isSharedDrawingMode && (
          <div className="bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">{isDrawingMode ? "Drawings" : "Clues"} Given</h2>

            <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
              {clues.length === 0 ? (
                <p className="text-slate-400 text-center py-8">
                  No {isDrawingMode ? "drawings" : "clues"} yet. Be the first to give one!
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
                    {clue.drawingData ? (
                      <img
                        src={clue.drawingData}
                        alt={`Drawing by ${clue.playerName}`}
                        className="max-w-full border border-slate-500 rounded bg-white mt-2"
                      />
                    ) : (
                      <p className="text-slate-200">{clue.text}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          )}

          {isSharedDrawingMode && roundIsActive && (
            <div className="bg-slate-800 rounded-2xl shadow-xl p-4 sm:p-6 border border-slate-700">
              <SharedDrawingCanvas
                gameId={gameId}
                round={game.currentRound}
                onSubmit={handleSubmitSharedDrawing}
                isLoading={loading}
                disabled={!isCurrentPlayerAlive || !roundIsActive}
                isCurrentPlayerTurn={isCurrentPlayerAlive && isCurrentPlayersTurn}
                currentDrawerName={currentDrawingPlayerName}
                strokeColor={currentDrawingColor}
              />
              {error && (
                <p className="text-red-400 text-sm mt-3 bg-red-950 p-2 rounded border border-red-900">
                  {error}
                </p>
              )}
            </div>
          )}

          {/* Clue Input */}
          {!isCurrentPlayerAlive && (
            <div className="bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700">
              <p className="text-slate-300 font-semibold">
                You have been voted out. You can keep watching the round.
              </p>
            </div>
          )}

          {isCurrentPlayerAlive && !isSharedDrawingMode && !hasSubmittedClue && roundIsActive && (
            <>
              {isSharedDrawingMode && !isCurrentPlayersTurn ? (
                <div className="bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700">
                  <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
                    <p className="text-blue-300 font-semibold">
                      Waiting for your turn to draw...
                    </p>
                    <p className="text-sm text-blue-200 mt-2">
                      Current player: {game.turnOrder && game.currentTurnIndex !== undefined ? game.players[game.turnOrder[game.currentTurnIndex]]?.name : "Unknown"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700">
                  <label className="block text-sm font-medium text-slate-200 mb-4">
                    {isSharedDrawingMode ? "Your Turn to Draw (on shared canvas)" : isDrawingMode ? "Your Drawing" : "Your Clue"}
                  </label>
                  {isSharedDrawingMode ? (
                    <SharedDrawingCanvas
                      gameId={gameId}
                      round={game.currentRound}
                      onSubmit={handleSubmitSharedDrawing}
                      isLoading={loading}
                      disabled={!roundIsActive}
                      isCurrentPlayerTurn={isCurrentPlayersTurn}
                    />
                  ) : isDrawingMode ? (
                    <DrawingCanvas
                      onSubmit={handleSubmitDrawing}
                      isLoading={loading}
                      disabled={!roundIsActive}
                      roundId={game.currentRound}
                    />
                  ) : (
                    <form onSubmit={handleSubmitClue} className="">
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
                  {error && isDrawingMode && <p className="text-red-400 text-sm mt-2 bg-red-950 p-2 rounded border border-red-900">{error}</p>}
                </div>
              )}
            </>
          )}

          {hasSubmittedClue && (
            <div className="bg-green-900 border border-green-700 rounded-lg p-4">
              <p className="text-green-300 font-semibold">✓ You've submitted your clue</p>
            </div>
          )}

          {/* Skip Discussion Vote */}
          {isCurrentPlayerAlive && roundIsActive && (
            <div className="bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-700">
              <p className="text-sm text-slate-300 mb-4">
                Want to move to voting? Vote to skip the discussion phase.
              </p>
              <button
                onClick={async () => {
                  if (!currentPlayerId) return;

                  try {
                    await voteToSkipDiscussion(gameId, currentPlayerId);
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

          {timerEnabled && !isRunning && (
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
