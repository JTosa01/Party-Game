# Impostor Game - Web App

A real-time multiplayer game where players try to identify the impostor among their group based on clues.

## 📁 Project Structure

```
my-app/
├── app/
│   ├── page.tsx                    # Home page
│   ├── layout.tsx                  # Root layout with GameProvider
│   ├── globals.css                 # Global styles
│   └── game/
│       └── [gameId]/
│           └── page.tsx            # Dynamic game page
├── components/
│   ├── Home/                       # Home/landing page
│   ├── GameLobby/                  # Lobby with players and settings
│   ├── GameBoard/                  # Main gameplay area
│   ├── VotingPanel/                # Voting interface
│   ├── ResultsScreen/              # Game results
│   ├── ChatBox/                    # In-game chat
│   └── index.ts                    # Component exports
├── services/
│   ├── firebase.ts                 # Firebase configuration
│   ├── gameService.ts              # Game logic operations
│   ├── wordService.ts              # Word list management
│   └── index.ts                    # Service exports
├── context/
│   └── GameContext.tsx             # Global game state
├── hooks/
│   └── useTimer.ts                 # Timer hook
├── types/
│   ├── game.ts                     # TypeScript interfaces
│   └── index.ts                    # Type exports
└── firebase.config.ts              # Firebase config backup
```

## 🎮 Game Flow

1. **Home** - Create or join a game
2. **Lobby** - Wait for players, set word (host only)
3. **Playing** - Players give clues (impostor doesn't know the word)
4. **Voting** - Vote on who is the impostor
5. **Results** - Show winner, impostor can guess the word

## 🚀 Getting Started

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## 🔥 Firebase Setup

### 1. Create Firestore Collections

The app uses these collections:
- `games/` - Game instances with subcollections for clues, chat, gameHistory
- `wordLists/` - Custom word lists (optional)
- `users/` - User statistics (optional)

### 2. Set Firestore Rules

Add these security rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Games: Allow read/write if user is in the game
    match /games/{gameId} {
      allow create: if request.auth != null;
      allow read, update: if resource.data.players[request.auth.uid] != null;
      
      // Clues subcollection
      match /clues/{document=**} {
        allow read, write: if get(/databases/$(database)/documents/games/$(gameId)).data.players[request.auth.uid] != null;
      }
      
      // Chat subcollection
      match /chat/{document=**} {
        allow read, write: if get(/databases/$(database)/documents/games/$(gameId)).data.players[request.auth.uid] != null;
      }
      
      // Game history subcollection
      match /gameHistory/{document=**} {
        allow read, write: if get(/databases/$(database)/documents/games/$(gameId)).data.players[request.auth.uid] != null;
      }
    }
    
    // Word lists
    match /wordLists/{document=**} {
      allow read: if resource.data.isPublic == true;
      allow create, write: if request.auth != null;
    }
  }
}
```

### 3. Optional: User Authentication

Currently the app uses anonymous IDs. To add proper auth:

```typescript
// In services/firebase.ts
import { signInAnonymously } from 'firebase/auth';

await signInAnonymously(auth);
```

## 🎯 Key Components

### GameContext
Manages global state: current game, clues, chat, player info

```typescript
const { game, clues, setGame, currentPlayerId } = useGameContext();
```

### Game Service
Core operations for game lifecycle

```typescript
// Create game
const gameId = await createGame(playerId, playerName, settings);

// Subscribe to updates
const unsubscribe = onGameUpdate(gameId, (game) => {
  // Handle game updates
});
```

### Real-time Updates
All updates use Firestore listeners for real-time sync across players

## 📝 Game Modes (Future)

Currently supports: `standard`

Future modes:
- `impostor_gets_similar_word` - Impostor gets a related word
- `impostor_gets_nothing` - Impostor has no word (current)

## 🛠 Next Steps

1. **Test locally** - Run `npm run dev` and test game flow
2. **Deploy to Firebase** - `npm run build` then deploy
3. **Add Authentication** - Implement proper user auth
4. **Add Features**:
   - Game statistics and leaderboards
   - Custom word lists UI
   - Different game modes
   - Sound effects/notifications
   - Mobile optimization

## 📱 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## 🐛 Debugging

Check Firebase console for:
- Firestore data viewer
- Security rules violations
- Function logs

Enable Firestore emulator for local development (commented in `firebase.ts`)
