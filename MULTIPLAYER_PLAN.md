# Multiplayer Mode — Architecture Plan

## Goal

Add an optional split-screen two-player mode selectable from the main menu, while keeping the single-player experience as is today. When the game ends, both players revert to a shared full-screen scoreboard.

---

## Key Architectural Decisions

### 1. Two separate GestureRecognizer instances (not `numHands: 2`)

MediaPipe processes the entire video frame it receives. To give each player true isolation we **crop the raw video frame** before feeding it to each recognizer:

- **Recognizer 1 (P1)** receives the **right half** of the raw video → maps to the **left half of the mirrored screen**
- **Recognizer 2 (P2)** receives the **left half** of the raw video → maps to the **right half of the mirrored screen**

Each recognizer is configured with `numHands: 1` today. When two-hands-per-player support is needed later, simply change each to `numHands: 2` independently — no position-sorting logic required.

**Why not `numHands: 2` on one recognizer?**
Sorting N hands by screen position works for two hands but becomes ambiguous when each player uses two hands (`numHands: 4`). Isolated crop canvases scale cleanly regardless of hand count per player.

**Coordinate mapping from crop canvas → screen:**

```
P1 (right half of raw video → left half of screen):
  screenX = (0.5 - 0.5 * lm.x) * videoW * scale - offsetX

P2 (left half of raw video → right half of screen):
  screenX = (1 - 0.5 * lm.x) * videoW * scale - offsetX
```

---

### 2. Lazy initialisation of Recognizer 2

Recognizer 1 is always created at startup (used for single-player and menu navigation). Recognizer 2 is only created when the player picks multiplayer from the menu — this avoids loading a second ML model into GPU memory during single-player sessions.

Importantly, when multiplayer is enabled, **Recognizer 1's input also changes** — it switches from the full `<video>` element to `cropCanvas1` (its designated half). So in multiplayer mode both recognizers are only ever processing their own half of the frame. The lazy init quote refers specifically to the period before multiplayer is selected, during which only the full-frame Recognizer 1 exists.

The MediaPipe `FilesetResolver` (WASM download) is cached from the first init call and reused for the second recognizer.

If the player navigates back to the menu and picks single-player again, a `disableMultiplayer()` function should call `recognizer2.close()` and reset it to `null` to free GPU memory.

---

### 3. Mode selection in the main menu

During the menu the game is still in single-player detection mode (full-frame, Recognizer 1 only). The player signals their choice by showing open palm (waving) on the left or right side of the screen:

- **Left side of screen** → Single Player
- **Right side of screen** → Multiplayer

---

### 4. Two independent game instances (factory function)

Rather than threading a `mode` flag through all game logic, each player's game is a **self-contained instance** created by a factory function:

```js
function createGame(canvasEl, overlayEl, particlesEl, gestureIndex, onScore) { ... }

const p1 = createGame(canvas1, overlay1, particles1, 0, () => extendTimer());
const p2 = createGame(canvas2, overlay2, particles2, 1, () => extendTimer());
```

Each instance owns:
- Its own overlay div for local score display
- Its own particles div for targets and star animations
- Its own target state (position, gesture, sprite, lastMatchTime)

Note: the two-recognizer isolation is achieved through **off-screen crop canvases** (never visible, used only as input buffers for MediaPipe), not through having two visible canvases. Both players' hand dots are drawn onto the single existing `<canvas id="landmarks">` which stays full-width throughout.

`gameplay.js` needs **no multiplayer awareness** — it just uses `canvas.width` naturally, which happens to be half the screen width in multiplayer.

---

### 5. Shared controller overlay (timer + game-over)

A third full-width overlay sits on top of both game canvases and is owned by `main.js`:

```
┌─────────────────────────────────────┐  ← shared overlay (timer, game-over)
│  ⏱ 12.3s          Thumb_Down = quit │
├──────────────────┬──────────────────┤
│  P1 canvas       │  P2 canvas       │  ← game instances (score, targets, stars)
│  Score: 3        │  Score: 5        │
├──────────────────┴──────────────────┤
│  <video> full-width (shared camera) │
└─────────────────────────────────────┘
```

**Responsibility split:**

| Concern | Owner |
|---|---|
| Timer | Shared controller |
| "Game over" signal | Shared controller → broadcasts to both instances |
| Per-player score display | Each game instance |
| Targets, stars, animations | Each game instance |
| Scoreboard / game-over screen | Shared controller, full-screen |

---

### 6. Synchronised end and full-screen revert

Both game instances run until the shared timer hits zero. On game over:

1. Both half-canvas wrappers are **hidden** (one CSS class toggle)
2. The layout reverts to **full-screen**
3. The existing `renderGameOver` / scoreboard runs as in single-player
4. Both scores get passed to the scoreboard and appear in the player color to distinguish which is which. 

There is only ever **one rendered canvas** — `<canvas id="landmarks">` — which stays full-width throughout and draws both players' hand dots across the full screen. During multiplayer there are also two **off-screen** crop canvases alive in memory (`cropCanvas1`, `cropCanvas2`), but these are invisible input buffers fed to each recognizer, not rendered to the screen.

---

## Implementation Instructions

### `gestures.js`
- [ ] Keep a module-level `resolver` variable and cache it inside `initGestures()` so it can be reused later
- [ ] Create two off-screen crop canvases (`cropCanvas1`, `cropCanvas2`) — these are never added to the DOM
- [ ] `initGestures(videoEl)` — initialises Recognizer 1 only (`numHands: 1`), sets up `cropCanvas1`, starts the webcam
- [ ] `enableMultiplayer()` — lazily creates Recognizer 2 using the cached resolver, sets up `cropCanvas2`, sets `multiplayerMode = true`
- [ ] `disableMultiplayer()` — calls `recognizer2.close()`, resets it to `null`, sets `multiplayerMode = false` so Recognizer 1 switches back to full-video input
- [ ] `detectGesture(canvas, ctx)` — if `multiplayerMode` is false, run Recognizer 1 on the full `<video>`; if true, crop the right half of the video into `cropCanvas1` for R1 and the left half into `cropCanvas2` for R2, then run both
- [ ] Use the following coordinate formulas when mapping landmark positions to screen pixels:
  ```
  Single player / full video:
    screenX = (1 - lm.x) * videoW * scale - offsetX

  P1 crop (right half of raw video → left half of screen):
    screenX = (0.5 - 0.5 * lm.x) * videoW * scale - offsetX

  P2 crop (left half of raw video → right half of screen):
    screenX = (1 - 0.5 * lm.x) * videoW * scale - offsetX
  ```
- [ ] Draw P1 landmarks in one colour and P2 in another on the shared full-width `<canvas id="landmarks">`
- [ ] Export `getGesture(playerIndex = 0)` and `getHandPosition(playerIndex = 0)` — defaulting to 0 keeps all existing single-player call sites unchanged

---

### `index.html`
- [ ] Add a P1 overlay div and a P2 overlay div (for local score display), hidden by default
- [ ] Add a P1 particles div and a P2 particles div (for targets and stars), hidden by default
- [ ] Add a shared controller overlay div that sits on top of everything (for the timer and game-over screen)
- [ ] Keep the existing `<canvas id="landmarks">` and `<video>` elements full-width and unchanged

---

### `css`
- [ ] In multiplayer mode apply a side-by-side layout: P1 overlay + particles on the left half, P2 on the right half
- [ ] Add a CSS class (e.g. `.multiplayer`) that triggers the split layout, toggled by `main.js`
- [ ] Make sure reverting to single-player (removing the class) restores the full-screen layout cleanly

---

### `onboarding.js`
- [ ] Refactor into a `createOnboarding(overlayEl, particlesEl, gestureIndex)` factory — same pattern as `createGame` — so the same three-step flow runs as two parallel instances in multiplayer, each on their own half
- [ ] `spawnFixedTarget(stepIndex)` inside the factory should position targets within the correct screen half using `gestureIndex` (0 = left half, 1 = right half), using the same relative spacing as today
- [ ] Each instance tracks its own `onboardingState` (0–3) independently
- [ ] When a player completes all three steps before the other, replace their overlay content with a **"Waiting for other player…"** message and stop advancing their state
- [ ] Each factory instance returns `{ done }` each frame; `main.js` only transitions to `'play'` when both instances return `done: true`

---

### `gameplay.js`
- [ ] Refactor into a `createGame(overlayEl, particlesEl, gestureIndex, onScore)` factory function that returns a self-contained game instance with its own state (targetX, targetY, targetGesture, lastMatchTime, targetSprite)
- [ ] `spawnTarget()` inside the factory should constrain targets to the correct screen half based on `gestureIndex` (0 = left half, 1 = right half)
- [ ] When a match is made, call the `onScore` callback instead of directly resetting `gameStartTime` — the shared controller owns the timer
- [ ] `gameplay.js` should have **no awareness of `gameMode`** — it just runs game logic for whichever half it was given

---

### `main.js`
- [ ] Own the shared timer (`gameStartTime`)
- [ ] `startMultiplayer()` — async, awaits `enableMultiplayer()`, then transitions to the onboarding
- [ ] In the `'play'` state, run both game instances each frame in multiplayer; run only P1 in single-player
- [ ] On game over, hide both player overlays and particles divs and show the shared full-screen game-over screen
- [ ] Pass `score1` and `score2` to `renderGameOver()`
- [ ] When returning to the menu after a multiplayer game, call `disableMultiplayer()` to free GPU memory

---

### `menu.js`
- [ ] Display instructions for both choices (left = single player, right = multiplayer)
- [ ] Return `'single'`, `'multi'`, or `null` based on whether a Thumb_Up is detected and which side of the screen it is on (`handX < window.innerWidth / 2`)

---

### `gameover.js`
- [ ] Accept an optional second score so multiplayer results can show P1 and P2 scores separately before the shared leaderboard
- [ ] Fall back to the existing single-score display when only one score is passed

---

### Final checks
- [ ] Verify coordinate mapping is correct on different screen aspect ratios
- [ ] Confirm that single-player mode is completely unaffected — Recognizer 2 should never be created, crop canvases should never be used
