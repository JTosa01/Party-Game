"use client";

import React, { createContext, useState, useCallback, useEffect } from "react";
import { Game, Clue, ChatMessage, GameResult } from "@/types/game";

interface GameContextType {
  game: Game | null;
  clues: Clue[];
  chatMessages: ChatMessage[];
  currentPlayerId: string | null;
  currentPlayerName: string | null;
  setGame: (game: Game | null) => void;
  setClues: (clues: Clue[]) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  setCurrentPlayer: (id: string, name: string) => void;
  clearGame: () => void;
}

export const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [game, setGame] = useState<Game | null>(null);
  const [clues, setClues] = useState<Clue[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [currentPlayerName, setCurrentPlayerName] = useState<string | null>(null);

  const setCurrentPlayer = useCallback((id: string, name: string) => {
    setCurrentPlayerId(id);
    setCurrentPlayerName(name);
    localStorage.setItem("playerName", name);
  }, []);

  const clearGame = useCallback(() => {
    setGame(null);
    setClues([]);
    setChatMessages([]);
    localStorage.removeItem("gameId");
  }, []);

  // Restore player name from localStorage on mount
  useEffect(() => {
    const savedPlayerName = localStorage.getItem("playerName");
    if (savedPlayerName) {
      setCurrentPlayerName(savedPlayerName);
    }
  }, []);

  const value: GameContextType = {
    game,
    clues,
    chatMessages,
    currentPlayerId,
    currentPlayerName,
    setGame,
    setClues,
    setChatMessages,
    setCurrentPlayer,
    clearGame,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameContext() {
  const context = React.useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGameContext must be used within a GameProvider");
  }
  return context;
}
