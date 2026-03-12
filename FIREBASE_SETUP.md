# Firebase Realtime Database Setup

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Follow the setup wizard

## 2. Enable Realtime Database

1. In Firebase Console, go to "Realtime Database"
2. Click "Create Database"
3. Choose location (e.g., us-central1)
4. Start in **test mode** (for development)

## 3. Get Configuration

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click "Web" icon (</>) to add web app
4. Register app with nickname "JIN Game"
5. Copy the `firebaseConfig` object

## 4. Update Configuration Files

Replace the config in **TWO files**:

### File 1: `js/firebase.js`
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",  // Important!
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### File 2: `analytics.html`
Same config as above (around line 75)

## 5. Set Database Rules (Optional - for production)

In Firebase Console > Realtime Database > Rules:

```json
{
  "rules": {
    "sessions": {
      ".read": true,
      ".write": true
    },
    "games": {
      ".read": true,
      ".write": true,
      ".indexOn": ["score", "timestamp"]
    },
    "metrics": {
      ".read": true,
      ".write": true
    }
  }
}
```

## 6. Test It

1. Run: `python3 -m http.server 8080`
2. Open: `http://localhost:8080`
3. Play a game
4. Check Firebase Console > Realtime Database to see data

## 7. View Analytics

Open: `http://localhost:8080/analytics.html`

## Data Structure

```
firebase-realtime-db/
├── sessions/
│   └── {sessionId}/
│       ├── startTime
│       ├── endTime
│       ├── gamesPlayed
│       ├── totalScore
│       └── active
├── games/
│   └── {gameId}/
│       ├── sessionId
│       ├── score
│       ├── duration
│       ├── timestamp
│       ├── gestureAttempts
│       ├── successfulMatches
│       └── accuracy
└── metrics/
    └── {sessionId}/
        └── {metricId}/
            ├── eventType
            ├── timestamp
            └── data...
```

## Tracked Metrics

- **Session**: Start/end time, games played, total score
- **Game**: Score, duration, accuracy, gesture attempts
- **Events**: game_started, target_matched, game_ended
- **Real-time**: Hand position, gesture confidence

## Troubleshooting

- **CORS errors**: Make sure you're using `http://localhost`, not `file://`
- **Permission denied**: Check database rules in Firebase Console
- **No data**: Check browser console for errors
- **Wrong databaseURL**: Must include `-default-rtdb` in the URL
