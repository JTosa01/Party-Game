export type GameStatus = "setup" | "playing" | "voting" | "finished";
export type GameMode = "standard" | "impostor_gets_similar_word" | "impostor_gets_nothing";

export interface Player {
  id: string;
  name: string;
  hasVoted: boolean;
  voteTarget: string | null;
  isAlive: boolean;
  joinedAt: number;
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
  clueTimeLimit: number; // seconds
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
  players: Record<string, Player>;
  settings: GameSettings;
  createdAt: number;
  startedAt?: number;
}

export interface GameResult {
  gameId: string;
  impostorId: string;
  impostorName: string;
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
