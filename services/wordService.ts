import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { WordList } from "@/types/game";

export interface CategorizedWord {
  word: string;
  category: string;
  similar: string[]; // Similar words to show impostor
}

// Comprehensive word list with categories and similar words
const CATEGORIZED_WORDS: CategorizedWord[] = [
  // Animals
  { word: "Elephant", category: "Animals", similar: ["Rhinoceros", "Hippopotamus", "Giraffe"] },
  { word: "Penguin", category: "Animals", similar: ["Puffin", "Albatross", "Ostrich"] },
  { word: "Spider", category: "Animals", similar: ["Scorpion", "Tarantula", "Crab"] },
  { word: "Butterfly", category: "Animals", similar: ["Moth", "Dragonfly", "Bee"] },
  { word: "Lion", category: "Animals", similar: ["Tiger", "Leopard", "Cougar"] },
  { word: "Whale", category: "Animals", similar: ["Dolphin", "Shark", "Seal"] },
  
  // Technology
  { word: "Computer", category: "Technology", similar: ["Laptop", "Tablet", "Desktop"] },
  { word: "Telescope", category: "Technology", similar: ["Microscope", "Binoculars", "Periscope"] },
  { word: "Rocket", category: "Technology", similar: ["Spaceship", "Satellite", "Missile"] },
  { word: "Robot", category: "Technology", similar: ["Android", "Cyborg", "Automaton"] },
  
  // Nature & Geography
  { word: "Ocean", category: "Nature", similar: ["Sea", "Lake", "River"] },
  { word: "Volcano", category: "Nature", similar: ["Mountain", "Peak", "Ridge"] },
  { word: "Waterfall", category: "Nature", similar: ["Rapids", "Stream", "Spring"] },
  { word: "Jungle", category: "Nature", similar: ["Forest", "Rainforest", "Woods"] },
  { word: "Desert", category: "Nature", similar: ["Savanna", "Dunes", "Wasteland"] },
  { word: "Mountain", category: "Nature", similar: ["Peak", "Hill", "Ridge"] },
  { word: "Arctic", category: "Nature", similar: ["Antarctic", "Tundra", "Iceberg"] },
  { word: "Galaxy", category: "Nature", similar: ["Universe", "Cosmos", "Nebula"] },
  
  // Weather
  { word: "Lightning", category: "Weather", similar: ["Thunder", "Thunderbolt", "Bolt"] },
  { word: "Hurricane", category: "Weather", similar: ["Tornado", "Typhoon", "Cyclone"] },
  { word: "Tornado", category: "Weather", similar: ["Whirlwind", "Twister", "Vortex"] },
  { word: "Avalanche", category: "Weather", similar: ["Landslide", "Rockslide", "Collapse"] },
  { word: "Earthquake", category: "Weather", similar: ["Tremor", "Quake", "Aftershock"] },
  { word: "Thunder", category: "Weather", similar: ["Lightning", "Thunderbolt", "Storm"] },
  
  // Objects & Structures
  { word: "Castle", category: "Structures", similar: ["Palace", "Fortress", "Tower"] },
  { word: "Pyramid", category: "Structures", similar: ["Monument", "Obelisk", "Ziggurat"] },
  { word: "Bridge", category: "Structures", similar: ["Arch", "Aqueduct", "Viaduct"] },
  { word: "Diamond", category: "Objects", similar: ["Gemstone", "Crystal", "Jewel"] },
  { word: "Piano", category: "Objects", similar: ["Organ", "Keyboard", "Synthesizer"] },
  { word: "Bicycle", category: "Objects", similar: ["Tricycle", "Motorcycle", "Scooter"] },
  
  // Celestial & Space
  { word: "Sunset", category: "Nature", similar: ["Sunrise", "Dusk", "Dawn"] },
  { word: "Dinosaur", category: "Animals", similar: ["Reptile", "Dragon", "Beast"] },
  
  // Additional varied words
  { word: "Phoenix", category: "Mythology", similar: ["Dragon", "Griffin", "Chimera"] },
  { word: "Labyrinth", category: "Structures", similar: ["Maze", "Tunnel", "Catacomb"] },
  { word: "Hourglass", category: "Objects", similar: ["Sundial", "Clock", "Timer"] },
  { word: "Compass", category: "Objects", similar: ["Sextant", "Astrolabe", "Navigator"] },
  { word: "Lighthouse", category: "Structures", similar: ["Beacon", "Watchtower", "Signal"] },
  { word: "Pirate", category: "Occupations", similar: ["Buccaneer", "Corsair", "Privateer"] },
  { word: "Astronaut", category: "Occupations", similar: ["Cosmonaut", "Pilot", "Explorer"] },
  { word: "Volcano", category: "Nature", similar: ["Geysers", "Crater", "Magma"] },
  { word: "Mirage", category: "Nature", similar: ["Illusion", "Phantom", "Vision"] },
  { word: "Meteor", category: "Nature", similar: ["Comet", "Asteroid", "Meteorite"] },
  { word: "Iceberg", category: "Nature", similar: ["Glacier", "Ice floe", "Frozen"] },
  { word: "Quicksand", category: "Nature", similar: ["Bog", "Swamp", "Marsh"] },
];

// Get a random word from the categorized list
export function getRandomWord(): string {
  return CATEGORIZED_WORDS[Math.floor(Math.random() * CATEGORIZED_WORDS.length)].word;
}

/**
 * Get a similar word for the impostor based on the actual word
 * Used in "impostor_gets_similar_word" game mode
 */
export function getSimilarWord(actualWord: string): string {
  const wordData = CATEGORIZED_WORDS.find(
    (w) => w.word.toLowerCase() === actualWord.toLowerCase()
  );
  
  if (!wordData || !wordData.similar || wordData.similar.length === 0) {
    // Fallback: return a random word from the same category if available
    const sameCategory = CATEGORIZED_WORDS.filter(
      (w) => w.category === wordData?.category && w.word !== actualWord
    );
    
    if (sameCategory.length > 0) {
      return sameCategory[Math.floor(Math.random() * sameCategory.length)].word;
    }
    
    // Ultimate fallback: return any random word
    return getRandomWord();
  }
  
  // Return a random similar word
  return wordData.similar[Math.floor(Math.random() * wordData.similar.length)];
}

/**
 * Get the word that a player should see
 * For impostors in "impostor_gets_similar_word" mode, returns the fake word
 * For others, returns the actual word
 */
export function getPlayerWord(
  actualWord: string,
  isImpostor: boolean,
  impostorWord?: string
): string {
  if (isImpostor && impostorWord) {
    return impostorWord;
  }
  return actualWord;
}

// Get a random word, avoiding the current word when possible.
export function getRandomWordExcept(currentWord: string): string {
  const availableWords = CATEGORIZED_WORDS.filter(
    (wordData) => wordData.word.toLowerCase() !== currentWord.toLowerCase()
  );

  const wordPool = availableWords.length > 0 ? availableWords : CATEGORIZED_WORDS;
  return wordPool[Math.floor(Math.random() * wordPool.length)].word;
}

// Get all public word lists
export async function getPublicWordLists(): Promise<WordList[]> {
  const wordListsRef = collection(db, "wordLists");
  const q = query(wordListsRef, where("isPublic", "==", true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as WordList));
}

// Create a custom word list
export async function createWordList(
  userId: string,
  name: string,
  words: string[],
  isPublic: boolean = false
): Promise<string> {
  const wordListRef = doc(collection(db, "wordLists"));
  const wordListId = wordListRef.id;

  const newWordList: WordList = {
    id: wordListId,
    name,
    createdBy: userId,
    isPublic,
    words,
    createdAt: Date.now(),
  };

  await setDoc(wordListRef, newWordList);
  return wordListId;
}

// Get a specific word list
export async function getWordList(wordListId: string): Promise<WordList | null> {
  const docSnap = await getDoc(doc(db, "wordLists", wordListId));
  return docSnap.exists() ? (docSnap.data() as WordList) : null;
}

// Get random word from a word list
export async function getRandomWordFromList(wordListId: string): Promise<string> {
  const wordList = await getWordList(wordListId);
  if (!wordList) return getRandomWord();
  return wordList.words[Math.floor(Math.random() * wordList.words.length)];
}
