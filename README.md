# JIN — Gesture Game

A game controlled entirely by hand gestures via webcam, built with MediaPipe.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:5173`

---

## How to play

The webcam feed is displayed full-screen in the background. MediaPipe tracks your hand in real time and the game reacts to which gesture you're making and where your palm is on screen.

**Game flow:** Main Menu → Onboarding (tutorial) → Play → Game Over → repeat

**Scoring:** Match the gesture shown on screen and move your hand close to the target. Each match scores a point and adds time to the clock.

**Gestures:** Open_Palm, Thumb_Up, Pointing_Up, ILoveYou, Victory, Closed_Fist, Thumb_Down (quits)

---

## Multiplayer

Wave your hand on the **right side** of the screen at the main menu to start multiplayer. Wave on the **left** for single player.

In multiplayer the screen is divided in two — P1 plays on the left, P2 on the right. Both players complete the onboarding tutorial independently before the shared timer starts. The game ends when the shared timer runs out or either player shows Thumb_Down.

---

## Gesture detection architecture

### Single player

One `GestureRecognizer` instance (Recognizer 1) runs on the full video frame every frame.

### Multiplayer — two recognizers with cropped canvases

The key challenge: MediaPipe processes whatever image you give it entirely. If you gave both recognizers the full video they would both see both players' hands and you couldn't tell whose is whose.

The solution is to **crop the raw video frame** before feeding it to each recognizer:

```
Raw webcam frame (mirrored in the browser)
┌─────────────────────┬─────────────────────┐
│  LEFT half of raw   │  RIGHT half of raw  │
│  → P2's screen side │  → P1's screen side │
└─────────────────────┴─────────────────────┘
           ↓                       ↓
      cropCanvas2             cropCanvas1
      (off-screen)            (off-screen)
           ↓                       ↓
      Recognizer 2            Recognizer 1
      sees P2 only            sees P1 only
```

> The raw video is mirrored for display (`scaleX(-1)` in CSS), so the right half of the *raw* footage appears on the *left* side of the screen — that is P1's area.

Each crop canvas is an off-screen `<canvas>` that is never displayed, only used as an input buffer for MediaPipe.

Each recognizer is configured with `numHands: 2`, meaning each player can use **both hands** independently. Because each recognizer only ever sees its own player's half of the screen there is no ambiguity about which hands belong to whom, even when each player uses two hands.

Recognizer 2 is **lazily initialised** — only created when the player picks multiplayer, so the second ML model is never loaded into GPU memory during single-player sessions. Returning to single player calls `disableMultiplayer()` which closes Recognizer 2 and frees that memory.

### Coordinate mapping

MediaPipe returns landmark positions normalised to `[0, 1]` within the image it was given. Since each recognizer received a cropped half-frame, those coordinates need remapping to the correct half of the screen:

| Mode | Formula |
|---|---|
| Single player | `screenX = (1 - lmX) * vw * scale - offsetX` |
| Multiplayer P1 | `screenX = (0.5 - 0.5 * lmX) * vw * scale - offsetX` |
| Multiplayer P2 | `screenX = (1 - 0.5 * lmX) * vw * scale - offsetX` |

### API

```js
getGesture(playerIndex, handIndex)      // { gesture, score, handedness }
getHandPosition(playerIndex, handIndex) // { x, y }

// Both parameters default to 0 — existing single-player call sites need no changes
getGesture()     // P1, hand 1
getGesture(0, 1) // P1, hand 2
getGesture(1, 0) // P2, hand 1
getGesture(1, 1) // P2, hand 2
```

`handedness` is `'Left'`, `'Right'`, or `''` when no hand is detected.

---

## File structure

```
index.html              — HTML, styles, DOM structure
js/
  main.js               — game loop, state machine, scene orchestration
  gestures.js           — MediaPipe setup, crop canvases, coordinate mapping
  firebase.js           — score saving and leaderboard subscription
  scenes/
    menu.js             — main menu, single/multiplayer mode selection
    onboarding.js       — tutorial (3-gesture sequence)
    gameplay.js         — target spawning, match detection, scoring
    gameover.js         — scoreboard, play again / return to menu
public/
  assets/               — gesture images, sprites
  gesture_recognizer.task — MediaPipe model file
MULTIPLAYER_PLAN.md     — full architectural design document
```

---

## Tech

- [MediaPipe Tasks Vision](https://developers.google.com/mediapipe) — hand gesture recognition
- [Firebase Realtime Database](https://firebase.google.com) — leaderboard and analytics
- [Vite](https://vitejs.dev) — dev server and build tool
