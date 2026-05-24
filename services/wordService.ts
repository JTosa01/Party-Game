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

// Default word list for quick start
const DEFAULT_WORDS = [
  "Computer",
  "Elephant",
  "Rocket",
  "Ocean",
  "Piano",
  "Volcano",
  "Spider",
  "Telescope",
  "Bicycle",
  "Butterfly",
  "Lightning",
  "Waterfall",
  "Pyramid",
  "Penguin",
  "Hurricane",
  "Castle",
  "Diamond",
  "Telescope",
  "Dinosaur",
  "Sunset",
  "Galaxy",
  "Forest",
  "Mountain",
  "Desert",
  "Jungle",
  "Arctic",
  "Tornado",
  "Avalanche",
  "Earthquake",
  "Thunder",
];

// Get a random word from default list
export function getRandomWord(): string {
  return DEFAULT_WORDS[Math.floor(Math.random() * DEFAULT_WORDS.length)];
}

// Get a random default word, avoiding the current word when possible.
export function getRandomWordExcept(currentWord: string): string {
  const availableWords = DEFAULT_WORDS.filter(
    (word) => word.toLowerCase() !== currentWord.toLowerCase()
  );

  const wordPool = availableWords.length > 0 ? availableWords : DEFAULT_WORDS;
  return wordPool[Math.floor(Math.random() * wordPool.length)];
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
