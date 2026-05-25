export type GameStatus = "setup" | "revealing" | "playing" | "voting" | "finished";
export type GameMode = "standard" | "impostor_gets_similar_word" | "impostor_gets_nothing";

export interface Player {
  id: string;
  name: string;
  hasVoted: boolean;
  voteTarget: string | null;
  isAlive: boolean;
  joinedAt: number;
  votedToSkip?: boolean;
  hasConfirmedWord?: boolean;
  votedToSkipWord?: boolean;
}

export interface Clue {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  round: number;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
}

export interface GameSettings {
  roundLimit: number;
  roundTimerEnabled: boolean;
  clueTimeLimit: number; // seconds
  impostorCount: number;
  gameMode: GameMode;
  wordListId: string;
}

export interface Game {
  id: string;
  hostId: string;
  status: GameStatus;
  currentRound: number;
  word: string;
  impostorId: string;
  impostorIds?: string[];
  players: Record<string, Player>;
  settings: GameSettings;
  createdAt: number;
  startedAt?: number;
  turnOrder?: string[]; // Array of player IDs in turn order
  currentTurnIndex?: number; // Index of current player in turn order
  devBroadcast?: {
    message: string;
    playerId: string;
    playerName: string;
    targetPlayerId: string;
    targetPlayerName: string;
    timestamp: number;
  };
}

export interface GameResult {
  gameId: string;
  impostorId: string;
  impostorName: string;
  impostorIds?: string[];
  impostorNames?: string;
  impostorGuess: string | null;
  wasOuted: boolean;
  finalWord: string;
  votedForId: string;
  votedForName: string;
  duration: number; // seconds
  timestamp: number;
}

export interface WordList {
  id: string;
  name: string;
  createdBy: string;
  isPublic: boolean;
  words: string[];
  createdAt: number;
}

export interface UserStats {
  totalGames: number;
  winsAsImpostor: number;
  winsAsRegular: number;
  lastPlayedAt: number;
}
