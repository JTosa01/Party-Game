import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  query,
  where,
  arrayUnion,
  onSnapshot,
  serverTimestamp,
  addDoc,
  Unsubscribe,
  writeBatch,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  Game,
  GameStatus,
  Clue,
  ChatMessage,
  Player,
  GameResult,
} from "@/types/game";

// Generate a random 4-character game code
function generateGameCode(): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

// Create a new game
export async function createGame(
  hostId: string,
  hostName: string,
  settings: Game["settings"]
): Promise<string> {
  let gameId = generateGameCode();
  
  // Ensure the code is unique
  let codeExists = true;
  while (codeExists) {
    const existingGame = await getDoc(doc(db, "games", gameId));
    if (!existingGame.exists()) {
      codeExists = false;
    } else {
      gameId = generateGameCode();
    }
  }

  const gameRef = doc(db, "games", gameId);

  const newGame: Game = {
    id: gameId,
    hostId,
    status: "setup",
    currentRound: 0,
    word: "",
    impostorId: "",
    players: {
      [hostId]: {
        id: hostId,
        name: hostName,
        hasVoted: false,
        voteTarget: null,
        isAlive: true,
        joinedAt: Date.now(),
      },
    },
    settings,
    createdAt: Date.now(),
  };

  await setDoc(gameRef, newGame);
  return gameId;
}

// Join a game
export async function joinGame(
  gameId: string,
  playerId: string,
  playerName: string
): Promise<void> {
  const gameRef = doc(db, "games", gameId);

  await updateDoc(gameRef, {
    [`players.${playerId}`]: {
      id: playerId,
      name: playerName,
      hasVoted: false,
      voteTarget: null,
      isAlive: true,
      joinedAt: Date.now(),
    },
  });
}

// Get game data
export async function getGame(gameId: string): Promise<Game | null> {
  const docSnap = await getDoc(doc(db, "games", gameId));
  return docSnap.exists() ? (docSnap.data() as Game) : null;
}

// Subscribe to game updates (real-time listener)
export function onGameUpdate(
  gameId: string,
  callback: (game: Game | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, "games", gameId), (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as Game);
    } else {
      callback(null);
    }
  });
}

// Start game - assign impostor and word
export async function startGame(gameId: string, word: string): Promise<void> {
  const gameRef = doc(db, "games", gameId);
  const game = await getGame(gameId);

  if (!game) throw new Error("Game not found");

  const playerIds = Object.keys(game.players);
  const randomImpostorId =
    playerIds[Math.floor(Math.random() * playerIds.length)];

  await updateDoc(gameRef, {
    status: "playing",
    word,
    impostorId: randomImpostorId,
    currentRound: 1,
    startedAt: Date.now(),
  });
}

// Submit a clue
export async function submitClue(
  gameId: string,
  playerId: string,
  playerName: string,
  text: string,
  round: number
): Promise<void> {
  const cluesRef = collection(db, "games", gameId, "clues");
  await addDoc(cluesRef, {
    playerId,
    playerName,
    text,
    round,
    timestamp: Date.now(),
  });
}

// Get clues for a round
export async function getCluesForRound(
  gameId: string,
  round: number
): Promise<Clue[]> {
  const cluesRef = collection(db, "games", gameId, "clues");
  const q = query(cluesRef, where("round", "==", round));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as Clue));
}

// Subscribe to clues in real-time
export function onCluesUpdate(
  gameId: string,
  round: number,
  callback: (clues: Clue[]) => void
): Unsubscribe {
  const cluesRef = collection(db, "games", gameId, "clues");
  const q = query(cluesRef, where("round", "==", round));
  return onSnapshot(q, (snapshot) => {
    const clues = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Clue));
    callback(clues);
  });
}

// Submit a vote
export async function submitVote(
  gameId: string,
  voterId: string,
  voteTarget: string
): Promise<void> {
  const gameRef = doc(db, "games", gameId);
  await updateDoc(gameRef, {
    [`players.${voterId}.hasVoted`]: true,
    [`players.${voterId}.voteTarget`]: voteTarget,
  });
}

// Get vote results
export async function getVoteResults(gameId: string): Promise<Record<string, number>> {
  const game = await getGame(gameId);
  if (!game) return {};

  const votes: Record<string, number> = {};
  Object.values(game.players).forEach((player) => {
    if (player.voteTarget) {
      votes[player.voteTarget] = (votes[player.voteTarget] || 0) + 1;
    }
  });

  return votes;
}

// End game and save result
export async function endGame(
  gameId: string,
  result: Omit<GameResult, "gameId">
): Promise<void> {
  const resultsRef = collection(db, "games", gameId, "gameHistory");
  await addDoc(resultsRef, {
    ...result,
    timestamp: Date.now(),
  });

  const gameRef = doc(db, "games", gameId);
  await updateDoc(gameRef, {
    status: "finished",
  });
}

// Add chat message
export async function sendChatMessage(
  gameId: string,
  playerId: string,
  playerName: string,
  message: string
): Promise<void> {
  const chatRef = collection(db, "games", gameId, "chat");
  await addDoc(chatRef, {
    playerId,
    playerName,
    message,
    timestamp: Date.now(),
  });
}

// Subscribe to chat messages
export function onChatUpdate(
  gameId: string,
  callback: (messages: ChatMessage[]) => void
): Unsubscribe {
  const chatRef = collection(db, "games", gameId, "chat");
  const q = query(chatRef, limit(50));
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as ChatMessage))
      .sort((a, b) => a.timestamp - b.timestamp);
    callback(messages);
  });
}

// Reset votes for next round
export async function resetVotes(gameId: string): Promise<void> {
  const gameRef = doc(db, "games", gameId);
  const game = await getGame(gameId);

  if (!game) return;

  const batch = writeBatch(db);

  Object.keys(game.players).forEach((playerId) => {
    batch.update(gameRef, {
      [`players.${playerId}.hasVoted`]: false,
      [`players.${playerId}.voteTarget`]: null,
    });
  });

  batch.update(gameRef, {
    currentRound: game.currentRound + 1,
  });

  await batch.commit();
}

// Update game status
export async function updateGameStatus(
  gameId: string,
  status: GameStatus
): Promise<void> {
  const gameRef = doc(db, "games", gameId);
  await updateDoc(gameRef, { status });
}

// Kick a player from the game (only during setup)
export async function kickPlayer(
  gameId: string,
  playerId: string
): Promise<void> {
  const gameRef = doc(db, "games", gameId);
  const game = await getGame(gameId);

  if (!game) throw new Error("Game not found");

  // Remove the player from the players object
  const updatedPlayers = { ...game.players };
  delete updatedPlayers[playerId];

  await updateDoc(gameRef, {
    players: updatedPlayers,
  });
}

// Update a player's name
export async function updatePlayerName(
  gameId: string,
  playerId: string,
  newName: string
): Promise<void> {
  const gameRef = doc(db, "games", gameId);

  await updateDoc(gameRef, {
    [`players.${playerId}.name`]: newName,
  });
}
