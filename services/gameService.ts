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
  runTransaction,
  deleteField,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  Game,
  GameStatus,
  Clue,
  ChatMessage,
  Player,
  GameResult,
  GameSettings,
} from "@/types/game";
import { getSimilarWord } from "./wordService";

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

function getImpostorIds(game: Game): string[] {
  return game.impostorIds?.length ? game.impostorIds : game.impostorId ? [game.impostorId] : [];
}

function getGameOutcome(game: Game): "impostors_win" | "regulars_win" | null {
  const impostorIds = new Set(getImpostorIds(game));
  const alivePlayers = Object.values(game.players).filter((player) => player.isAlive);
  const aliveImpostorCount = alivePlayers.filter((player) => impostorIds.has(player.id)).length;
  const aliveRegularCount = alivePlayers.length - aliveImpostorCount;

  if (aliveImpostorCount === 0) return "regulars_win";
  if (aliveRegularCount === 0) return "impostors_win";

  return null;
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

// Start game - assign impostor and word, then wait for players to reveal cards.
export async function startGame(gameId: string, word: string): Promise<void> {
  const gameRef = doc(db, "games", gameId);
  const game = await getGame(gameId);

  if (!game) throw new Error("Game not found");

  const playerIds = Object.keys(game.players);
  if (playerIds.length < 3) {
    throw new Error("At least 3 players are required to start");
  }

  // Shuffle player IDs for turn order (independent from impostor selection)
  const shuffledPlayerIds = [...playerIds].sort(() => Math.random() - 0.5);
  const maxImpostors = playerIds.length - 2;
  const impostorCount = Math.min(
    Math.max(1, game.settings.impostorCount || 1),
    maxImpostors
  );
  
  // Randomly select impostors from all players
  const shuffledForImpostors = [...playerIds].sort(() => Math.random() - 0.5);
  const impostorIds = shuffledForImpostors.slice(0, impostorCount);
  
  const playerUpdates = playerIds.reduce<Record<string, Player>>((players, playerId) => {
    players[playerId] = {
      ...game.players[playerId],
      hasVoted: false,
      voteTarget: null,
      votedToSkip: false,
      hasConfirmedWord: false,
      votedToSkipWord: false,
    };
    return players;
  }, {});

  // Generate fake word for impostors if in "impostor_gets_similar_word" mode
  const impostorWord = game.settings.gameMode === "impostor_gets_similar_word" 
    ? getSimilarWord(word)
    : undefined;

  // Make it unlikely (but not impossible) for the first player in turn order
  // to be an impostor when there are multiple impostors. We'll swap the
  // first player with the first non-impostor most of the time, leaving a
  // small chance (15%) that an impostor still goes first.
  const firstPlayerIsImpostor = impostorIds.includes(shuffledPlayerIds[0]);
  if (impostorCount > 1 && firstPlayerIsImpostor) {
    const allowImpostorFirst = Math.random() < 0.15; // 15% chance
    if (!allowImpostorFirst) {
      const nonImpostorIndex = shuffledPlayerIds.findIndex((id) => !impostorIds.includes(id));
      if (nonImpostorIndex > 0) {
        const tmp = shuffledPlayerIds[0];
        shuffledPlayerIds[0] = shuffledPlayerIds[nonImpostorIndex];
        shuffledPlayerIds[nonImpostorIndex] = tmp;
      }
    }
  }

  await updateDoc(gameRef, {
    status: "revealing",
    word,
    ...(impostorWord && { impostorWord }),
    impostorId: impostorIds[0],
    impostorIds,
    currentRound: 0,
    players: playerUpdates,
    turnOrder: shuffledPlayerIds,
    currentTurnIndex: 0,
  });
}

// Confirm the player's reveal card before the round begins.
export async function confirmRoundCard(
  gameId: string,
  playerId: string
): Promise<void> {
  const gameRef = doc(db, "games", gameId);
  await updateDoc(gameRef, {
    [`players.${playerId}.hasConfirmedWord`]: true,
  });
}

// Vote to replace the word during the reveal phase.
export async function voteToSkipWord(
  gameId: string,
  playerId: string
): Promise<void> {
  const gameRef = doc(db, "games", gameId);
  await updateDoc(gameRef, {
    [`players.${playerId}.votedToSkipWord`]: true,
  });
}

// Vote to skip the discussion phase and move to voting once a majority agrees.
export async function voteToSkipDiscussion(
  gameId: string,
  playerId: string
): Promise<void> {
  const gameRef = doc(db, "games", gameId);
  await updateDoc(gameRef, {
    [`players.${playerId}.votedToSkip`]: true,
  });
}

// Start the round once every active player has confirmed their card.
export async function startRoundIfEveryoneReady(gameId: string): Promise<void> {
  const gameRef = doc(db, "games", gameId);

  await runTransaction(db, async (transaction) => {
    const gameSnap = await transaction.get(gameRef);
    if (!gameSnap.exists()) return;

    const game = gameSnap.data() as Game;
    if (game.status !== "revealing") return;

    const activePlayers = Object.values(game.players).filter((player) => player.isAlive);
    const allReady =
      activePlayers.length > 0 &&
      activePlayers.every((player) => player.hasConfirmedWord);

    if (!allReady) return;

    transaction.update(gameRef, {
      status: "playing",
      currentRound: game.currentRound > 0 ? game.currentRound : 1,
      startedAt: Date.now(),
    });
  });
}

// Replace the reveal word if a majority voted to skip it.
export async function replaceWordIfSkipMajority(
  gameId: string,
  nextWord: string
): Promise<void> {
  const gameRef = doc(db, "games", gameId);

  await runTransaction(db, async (transaction) => {
    const gameSnap = await transaction.get(gameRef);
    if (!gameSnap.exists()) return;

    const game = gameSnap.data() as Game;
    if (game.status !== "revealing") return;

    const activePlayers = Object.values(game.players).filter((player) => player.isAlive);
    const skipVotes = activePlayers.filter((player) => player.votedToSkipWord).length;
    if (activePlayers.length === 0 || skipVotes <= activePlayers.length / 2) return;

    const playerUpdates = Object.fromEntries(
      Object.entries(game.players).map(([playerId, player]) => [
        playerId,
        {
          ...player,
          hasConfirmedWord: false,
          votedToSkipWord: false,
        },
      ])
    );

    // Generate new fake word if in "impostor_gets_similar_word" mode
    const newImpostorWord = game.settings.gameMode === "impostor_gets_similar_word"
      ? getSimilarWord(nextWord)
      : undefined;

    transaction.update(gameRef, {
      word: nextWord,
      ...(newImpostorWord && { impostorWord: newImpostorWord }),
      players: playerUpdates,
    });
  });
}

// Submit a clue (text or drawing)
export async function submitClue(
  gameId: string,
  playerId: string,
  playerName: string,
  text: string | null,
  round: number,
  drawingData?: string, accumulatedCanvasData?: string
): Promise<void> {
  const gameRef = doc(db, "games", gameId);
  const game = await getGame(gameId);

  if (game?.settings.gameMode === "shared_drawing") {
    if (!drawingData) {
      throw new Error("Shared drawing submissions require drawing data");
    }

    await runTransaction(db, async (transaction) => {
      const gameSnap = await transaction.get(gameRef);
      if (!gameSnap.exists()) throw new Error("Game not found");

      const currentGame = gameSnap.data() as Game;
      if (currentGame.status !== "playing") {
        throw new Error("The round is not accepting drawings");
      }
      if (currentGame.settings.gameMode !== "shared_drawing") {
        throw new Error("Game mode changed before drawing was submitted");
      }
      if (currentGame.currentRound !== round) {
        throw new Error("Drawing was submitted for an old round");
      }

      const aliveTurnOrder = (currentGame.turnOrder || []).filter(
        (turnPlayerId) => currentGame.players[turnPlayerId]?.isAlive
      );
      const currentTurnIndex = currentGame.currentTurnIndex ?? 0;
      const currentTurnPlayerId = aliveTurnOrder[currentTurnIndex];

      if (!currentTurnPlayerId || currentTurnPlayerId !== playerId) {
        throw new Error("It is not this player's turn to draw");
      }

      const cluesRef = collection(db, "games", gameId, "clues");
      const clueRef = doc(cluesRef);
      transaction.set(clueRef, {
        playerId,
        playerName,
        round,
        timestamp: Date.now(),
        drawingData,
      });

      const nextTurnIndex = currentTurnIndex + 1;
      transaction.update(gameRef, {
        accumulatedCanvasData: drawingData,
        ...(nextTurnIndex >= aliveTurnOrder.length
          ? { status: "voting" }
          : { currentTurnIndex: nextTurnIndex }),
      });
    });

    return;
  }

  const cluesRef = collection(db, "games", gameId, "clues");
  const clueData: any = {
    playerId,
    playerName,
    round,
    timestamp: Date.now(),
  };

  if (text) {
    clueData.text = text;
  }
  if (drawingData) {
    clueData.drawingData = drawingData;
  }

  await addDoc(cluesRef, clueData);

  if (accumulatedCanvasData) {
    await updateDoc(gameRef, { accumulatedCanvasData });
  }

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

async function deleteCollectionDocs(path: string): Promise<void> {
  const snapshot = await getDocs(collection(db, path));
  if (snapshot.empty) return;

  const batch = writeBatch(db);
  snapshot.docs.forEach((document) => {
    batch.delete(document.ref);
  });
  await batch.commit();
}

// Reset a finished game back to the lobby with only the player who clicked Play Again.
export async function resetGameToLobby(
  gameId: string,
  playerId: string,
  playerName: string
): Promise<void> {
  const gameRef = doc(db, "games", gameId);
  const player: Player = {
    id: playerId,
    name: playerName,
    hasVoted: false,
    voteTarget: null,
    isAlive: true,
    joinedAt: Date.now(),
    votedToSkip: false,
    hasConfirmedWord: false,
    votedToSkipWord: false,
  };

  await updateDoc(gameRef, {
    hostId: playerId,
    status: "setup",
    currentRound: 0,
    word: "",
    impostorWord: deleteField(),
    impostorId: "",
    impostorIds: [],
    players: {
      [playerId]: player,
    },
    startedAt: deleteField(),
    turnOrder: deleteField(),
    currentTurnIndex: deleteField(),
  });

  await Promise.all([
    deleteCollectionDocs(`games/${gameId}/clues`),
    deleteCollectionDocs(`games/${gameId}/chat`),
  ]);
}

// Force end voting and resolve with current votes (for host)
export async function forceEndVoting(gameId: string): Promise<void> {
  const gameRef = doc(db, "games", gameId);

  await runTransaction(db, async (transaction) => {
    const gameSnap = await transaction.get(gameRef);
    if (!gameSnap.exists()) return;

    const game = gameSnap.data() as Game;
    if (game.status !== "voting") return;

    const alivePlayers = Object.values(game.players).filter((player) => player.isAlive);

    const voteCounts: Record<string, number> = {};
    alivePlayers.forEach((player) => {
      if (player.voteTarget) {
        voteCounts[player.voteTarget] = (voteCounts[player.voteTarget] || 0) + 1;
      }
    });

    const mostVotedId = Object.entries(voteCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!mostVotedId) return;

    const eliminatedPlayers = Object.fromEntries(
      Object.entries(game.players).map(([playerId, player]) => [
        playerId,
        {
          ...player,
          ...(playerId === mostVotedId && mostVotedId !== "nobody"
            ? { isAlive: false }
            : {}),
        },
      ])
    ) as Record<string, Player>;

    const nextGame: Game = {
      ...game,
      players: eliminatedPlayers,
    };
    const outcome = getGameOutcome(nextGame);

    if (outcome) {
      transaction.update(gameRef, {
        players: eliminatedPlayers,
        status: "finished",
      });
      return;
    }

    const nextPlayers = Object.fromEntries(
      Object.entries(eliminatedPlayers).map(([playerId, player]) => [
        playerId,
        {
          ...player,
          hasVoted: false,
          voteTarget: null,
          votedToSkip: false,
        },
      ])
    ) as Record<string, Player>;

    transaction.update(gameRef, {
      players: nextPlayers,
      currentRound: game.currentRound + 1,
      accumulatedCanvasData: deleteField(),
      status: "playing",
      turnOrder: (game.turnOrder || []).filter((playerId) => nextPlayers[playerId]?.isAlive),
      currentTurnIndex: 0,
    });
  });
}

export async function resolveCompletedVote(gameId: string): Promise<void> {
  const gameRef = doc(db, "games", gameId);

  await runTransaction(db, async (transaction) => {
    const gameSnap = await transaction.get(gameRef);
    if (!gameSnap.exists()) return;

    const game = gameSnap.data() as Game;
    if (game.status !== "voting") return;

    const alivePlayers = Object.values(game.players).filter((player) => player.isAlive);
    const allVoted =
      alivePlayers.length > 0 &&
      alivePlayers.every((player) => player.hasVoted);

    if (!allVoted) return;

    const voteCounts: Record<string, number> = {};
    alivePlayers.forEach((player) => {
      if (player.voteTarget) {
        voteCounts[player.voteTarget] = (voteCounts[player.voteTarget] || 0) + 1;
      }
    });

    const mostVotedId = Object.entries(voteCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!mostVotedId) return;

    const eliminatedPlayers = Object.fromEntries(
      Object.entries(game.players).map(([playerId, player]) => [
        playerId,
        {
          ...player,
          ...(playerId === mostVotedId && mostVotedId !== "nobody"
            ? { isAlive: false }
            : {}),
        },
      ])
    ) as Record<string, Player>;

    const nextGame: Game = {
      ...game,
      players: eliminatedPlayers,
    };
    const outcome = getGameOutcome(nextGame);

    if (outcome) {
      transaction.update(gameRef, {
        players: eliminatedPlayers,
        status: "finished",
      });
      return;
    }

    const nextPlayers = Object.fromEntries(
      Object.entries(eliminatedPlayers).map(([playerId, player]) => [
        playerId,
        {
          ...player,
          hasVoted: false,
          voteTarget: null,
          votedToSkip: false,
        },
      ])
    ) as Record<string, Player>;

    transaction.update(gameRef, {
      players: nextPlayers,
      currentRound: game.currentRound + 1,
      accumulatedCanvasData: deleteField(),
      status: "playing",
      turnOrder: (game.turnOrder || []).filter((playerId) => nextPlayers[playerId]?.isAlive),
      currentTurnIndex: 0,
    });
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

export async function sendDevBroadcast(
  gameId: string,
  playerId: string,
  playerName: string,
  targetPlayerId: string,
  targetPlayerName: string,
  message: string,
  gifUrl?: string
): Promise<void> {
  const gameRef = doc(db, "games", gameId);
  await updateDoc(gameRef, {
    devBroadcast: {
      message,
      playerId,
      playerName,
      targetPlayerId,
      targetPlayerName,
      timestamp: Date.now(),
      ...(gifUrl && { gifUrl }),
    },
  });
}

export async function clearDevBroadcast(gameId: string): Promise<void> {
  const gameRef = doc(db, "games", gameId);
  await updateDoc(gameRef, {
    devBroadcast: deleteField(),
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
    accumulatedCanvasData: deleteField(),
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

// Update host-configurable game settings while in the lobby.
export async function updateGameSettings(
  gameId: string,
  settings: Partial<GameSettings>
): Promise<void> {
  const gameRef = doc(db, "games", gameId);
  const updates = Object.fromEntries(
    Object.entries(settings).map(([key, value]) => [`settings.${key}`, value])
  );

  await updateDoc(gameRef, updates);
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

// Advance to next turn
export async function advanceTurn(gameId: string): Promise<void> {
  const gameRef = doc(db, "games", gameId);
  const game = await getGame(gameId);

  if (!game || !game.turnOrder) return;

  const nextTurnIndex = (game.currentTurnIndex || 0) + 1;
  const alivePlayers = Object.values(game.players).filter(p => p.isAlive);
  
  // In shared_drawing mode, when all players have taken their turn, move to voting
  if (game.settings.gameMode === "shared_drawing" && nextTurnIndex >= alivePlayers.length) {
    await updateDoc(gameRef, {
      status: "voting",
    });
    return;
  }

  await updateDoc(gameRef, {
    currentTurnIndex: nextTurnIndex,
  });
}
