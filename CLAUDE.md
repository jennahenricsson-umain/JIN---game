# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server on localhost:8080 (also starts a log process)
npm run dev-nolog    # Start dev server without log process
npm run build        # Production build
```

There are no automated tests in this project.

Linting is configured via ESLint but there is no lint script in package.json — run manually with `npx eslint src/`.

## Architecture

The game is built on two parallel layers that communicate exclusively through a global EventBus (`src/game/EventBus.ts`, a Phaser `Events.EventEmitter` instance):

- **Phaser layer** (`src/game/scenes/`) — game logic, sprites, physics, tweens
- **React layer** (`src/jsxScenes/`, `src/App.tsx`) — text overlays, HUD, UI state

### Scene flow

```
Boot → Preloader → MainMenu → Game → GameOver → MainMenu (loop)
```

Assets loaded in `Preloader.ts` from `public/assets/`: `star.png`, `Umain-logotype-white.png`, `peace-white.png`.

### Phaser ↔ React communication

**Phaser → React:** Phaser scenes emit events on `EventBus`. `App.tsx` listens and stores values in `useState`. Props flow down to JSX scene components.

```ts
// In a Phaser scene:
EventBus.emit('some-event', value);

// In App.tsx:
const [value, setValue] = useState(...);
EventBus.on('some-event', (v) => setValue(v));
// Pass as prop to the JSX scene component
```

Current events: `gesture-recognized`, `camera-stream-ready`, `current-scene-ready`, `counter-updated`, `timer-updated`.

**React → Phaser:** `PhaserGame.tsx` exposes the current Phaser scene instance via a `forwardRef`. `App.tsx` holds this ref and can call methods directly on the scene object.

### Gesture system

`GestureClient.ts` runs MediaPipe in the browser (no server). It:
1. Loads the model from `public/gesture_recognizer.task`
2. Accesses the webcam
3. Runs a `requestAnimationFrame` loop calling `recognizeForVideo`
4. Emits `GESTURE_EVENT` with `GesturePayload { gesture, score, landmark[] }` each frame a gesture is detected
5. Emits `CAMERA_READY_EVENT` with the `MediaStream` once the camera is ready

`startGestureClient()` is called in `Boot.ts`. `stopGestureClient()` is called in `PhaserGame.tsx` on unmount.

Landmark coordinates are normalized (0–1), with x-flipped (`1 - lm.x`) to match the mirrored camera background. Multiply by `this.scale.width/height` to get pixel positions. Landmark `[9]` (middle finger MCP) is used as the hand's representative position in `Game.ts`.

Confidence threshold for all active gestures is `>= 0.7`.

### Scene gesture listener pattern

Phaser does **not** automatically call a user-defined `shutdown()` method. Always clean up EventBus listeners by hooking into the Phaser scene event system in `create()`:

```ts
EventBus.on(GESTURE_EVENT, this.gestureListener);
this.events.once('shutdown', () => {
    EventBus.removeListener(GESTURE_EVENT, this.gestureListener);
});
```

The `gestureListener` must be defined as a class field arrow function (not a method) so the reference is stable for `removeListener`:

```ts
private gestureListener = (payload: GesturePayload) => this.onGesture(payload);
```

### Adding a new Phaser scene

1. Create the scene class in `src/game/scenes/`, emit `'current-scene-ready'` in `create()`
2. Register it in `src/game/main.ts` scene array
3. Create a matching TSX component in `src/jsxScenes/`, export from `src/jsxScenes/index.ts`
4. Render it conditionally in `App.tsx` based on `currentSceneKey`
