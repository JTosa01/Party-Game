# Firebase Firestore Setup Guide

## Quick Setup Steps

### 1. Go to Firebase Console
- Visit: https://console.firebase.google.com
- Select your project: `party-game-5afa9`

### 2. Create Firestore Database
- Click **Firestore Database** in left sidebar
- Click **Create Database**
- Choose **Start in test mode** (for development)
- Select region: `us-central1`
- Click **Create**

### 3. Set Security Rules
Once Firestore is created:
- Go to **Firestore Database** → **Rules** tab
- Replace all content with the rules below
- Click **Publish**

### 4. Copy and Paste These Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow anyone to create games and write their own data for now
    match /games/{gameId} {
      allow create: if request.auth != null || true;
      allow read: if true;
      allow update: if true;
      
      // Clues subcollection
      match /clues/{document=**} {
        allow read, write: if true;
      }
      
      // Chat subcollection
      match /chat/{document=**} {
        allow read, write: if true;
      }
      
      // Game history subcollection
      match /gameHistory/{document=**} {
        allow read, write: if true;
      }
    }
    
    // Word lists
    match /wordLists/{document=**} {
      allow read: if true;
      allow create, write: if true;
    }
  }
}
```

### 5. Test Your App
- Refresh your app in the browser
- Try creating a game again

## ⚠️ Security Note
These test rules allow **anyone** to read/write. Before deploying to production, replace with proper authentication rules.

## Troubleshooting

**Still seeing "permission-denied" errors?**
1. Check browser console (F12 → Console tab) for detailed errors
2. Make sure Firestore Database is created (not just enabled)
3. Make sure rules are **published** (green checkmark)
4. Try clearing browser cache and refreshing

**Check Firestore Data**
- Go to Firebase Console → Firestore Database → Data tab
- You should see a `games` collection with your created games
