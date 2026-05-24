"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGameContext } from "@/context/GameContext";
import { getGame, onGameUpdate, joinGame } from "@/services/gameService";
import { Game } from "@/types/game";
import GameLobby from "@/components/GameLobby/GameLobby";
import GameBoard from "@/components/GameBoard/GameBoard";
import VotingPanel from "@/components/VotingPanel/VotingPanel";
import ResultsScreen from "@/components/ResultsScreen/ResultsScreen";
import JoinGameModal from "@/components/JoinGameModal/JoinGameModal";

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;
  const { game, setGame, currentPlayerId, currentPlayerName, setCurrentPlayer } = useGameContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);
  const [autoJoinAttempted, setAutoJoinAttempted] = useState(false);

  // Auto-join if player has name in localStorage but not in game yet
  useEffect(() => {
    if (!gameId || !game || autoJoinAttempted) return;

    const hasPlayerInGame = currentPlayerId && game.players[currentPlayerId];

    // If player has a name but isn't in the game yet, auto-join them
    if (
      currentPlayerName &&
      !hasPlayerInGame &&
      game.status === "setup"
    ) {
      const playerId = currentPlayerId || `player_${Date.now()}`;
      joinGame(gameId, playerId, currentPlayerName)
        .then(() => {
          if (!currentPlayerId) {
            setCurrentPlayer(playerId, currentPlayerName);
          }
          setAutoJoinAttempted(true);
        })
        .catch((err) => {
          console.error("Auto-join failed:", err);
          setAutoJoinAttempted(true);
        });
    } else {
      setAutoJoinAttempted(true);
    }
  }, [gameId, game, currentPlayerId, currentPlayerName, autoJoinAttempted, setCurrentPlayer]);

  // Subscribe to game updates
  useEffect(() => {
    if (!gameId) return;

    setLoading(true);

    const unsub = onGameUpdate(gameId, (updatedGame) => {
      if (updatedGame) {
        setGame(updatedGame);
        setLoading(false);
      } else {
        setError("Game not found");
        setLoading(false);
      }
    });

    setUnsubscribe(() => unsub);
    return () => unsub();
  }, [gameId, setGame]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading game...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
        <div className="text-white text-center">
          <p>Loading game...</p>
        </div>
      </div>
    );
  }

  const handlePlayAgain = async () => {
    // Reset game state and go back to lobby
    router.push("/");
  };

  const handleExit = async () => {
    router.push("/");
  };

  const isPlayerInGame = currentPlayerId && game.players[currentPlayerId];

  // Show join modal if in setup phase and player not in game yet
  if (game.status === "setup" && !isPlayerInGame) {
    return <JoinGameModal gameId={gameId} game={game} />;
  }

  // Render based on game status
  if (game.status === "setup") {
    return <GameLobby gameId={gameId} />;
  }

  if (game.status === "playing") {
    return (
      <GameBoard
        gameId={gameId}
        game={game}
        onVotePhase={() => {
          // Game will auto-update when status changes via listener
        }}
      />
    );
  }

  if (game.status === "voting") {
    return (
      <VotingPanel
        gameId={gameId}
        game={game}
        onVotingComplete={() => {
          // Voting logic handled in component
        }}
      />
    );
  }

  if (game.status === "finished") {
    return (
      <ResultsScreen
        gameId={gameId}
        game={game}
        onPlayAgain={handlePlayAgain}
        onExit={handleExit}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
      <div className="text-white text-center">
        <p>Unknown game state</p>
      </div>
    </div>
  );
}
