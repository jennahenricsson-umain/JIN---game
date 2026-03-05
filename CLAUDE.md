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

The game is pure React + TypeScript. There is no game engine — game logic lives directly in React components.

```
App.tsx
├── Starts/stops GestureClient on mount/unmount
├── Attaches camera stream to <video> background
└── Renders one scene at a time based on `scene` state:
    ├── <MainMenu onStart />
    ├── <Game onEnd />
    └── <GameOver onRestart />
```

Scene transitions are plain prop callbacks (`onStart`, `onEnd`, `onRestart`). No routing library needed.

### Key files

| File                                | Role                                                         |
| ----------------------------------- | ------------------------------------------------------------ |
| `src/App.tsx`                       | Scene switcher + camera/gesture setup                        |
| `src/scenes/`                       | One file per scene, each is a self-contained React component |
| `src/GameUI.tsx`                    | Debug toolbar (always visible, for testing without gestures) |
| `src/game/gesture/GestureClient.ts` | MediaPipe integration                                        |
| `src/game/EventBus.ts`              | Minimal event bus — only used for gesture and camera events  |

### Gesture system

`GestureClient.ts` runs MediaPipe in the browser (no server). It:

1. Loads the model from `public/gesture_recognizer.task`
2. Accesses the webcam
3. Runs a `requestAnimationFrame` loop calling `recognizeForVideo`
4. Emits `GESTURE_EVENT` with `GesturePayload { gesture, score, landmark[] }` each frame a gesture is detected
5. Emits `CAMERA_READY_EVENT` with the `MediaStream` once the camera is ready

`startGestureClient()` is called in `App.tsx` on mount. `stopGestureClient()` is called on unmount.

Landmark coordinates are normalized (0–1), with x-flipped (`1 - lm.x`) to match the mirrored camera background. Multiply by `window.innerWidth/Height` to get pixel positions. Landmark `[9]` (middle finger MCP) is used as the hand's representative position.

Confidence threshold for all active gestures is `>= 0.7`.

### Gesture listener pattern in scenes

Register listeners in `useEffect` and always return a cleanup function:

```ts
useEffect(() => {
    const handler = (raw: unknown) => {
        const { gesture, score } = raw as GesturePayload;
        if (gesture === "Thumb_Up" && score >= 0.7) doSomething();
    };
    EventBus.on(GESTURE_EVENT, handler);
    return () => EventBus.removeListener(GESTURE_EVENT, handler);
}, [doSomething]);
```

### Canvas landmark drawing

`Game.tsx` uses a `<canvas>` that covers the full screen. It is drawn imperatively via a ref on every gesture frame — not via React state. The canvas pixel dimensions must match the display size:

```ts
const sync = () => {
    if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
    }
};
```

### Adding a new scene

1. Create `src/scenes/MyScene.tsx` as a React component with an `onNext: () => void` prop
2. Add `'myscene'` to the `Scene` type in `App.tsx`
3. Render it in `App.tsx` with `{scene === 'myscene' && <MyScene onNext={...} />}`
4. Point the previous scene's callback to `() => setScene('myscene')`
