## Gesture recognition - JIN game

A hand gesture-controlled game built with React and TypeScript. Gesture recognition runs entirely in the browser via MediaPipe — no server or Python required.

### Setup

1. **Install dependencies:**

    ```bash
    npm install
    ```

2. **Start the game:**
    ```bash
    npm run dev
    ```
    Opens at `http://localhost:8080`. The browser will ask for camera permission on first load.

### How to play

| Gesture       | Action                                       |
| ------------- | -------------------------------------------- |
| 👍 Thumb Up   | Start game / restart after game over         |
| ✌️ Victory    | Match the peace sign target to score a point |
| 👎 Thumb Down | End the current game                         |

### Project structure

| Path                                | Description                                                              |
| ----------------------------------- | ------------------------------------------------------------------------ |
| `src/App.tsx`                       | Root component — camera setup, scene switcher                            |
| `src/scenes/`                       | One React component per game scene (MainMenu, Game, GameOver)            |
| `src/GameUI.tsx`                    | Debug toolbar (gesture badge + manual buttons)                           |
| `src/game/gesture/GestureClient.ts` | MediaPipe integration — webcam + gesture recognition                     |
| `src/game/EventBus.ts`              | Minimal event bus used for gesture and camera events                     |
| `public/assets/`                    | Static images: `star.png`, `peace-white.png`, `Umain-logotype-white.png` |
| `public/gesture_recognizer.task`    | MediaPipe gesture model (served locally)                                 |
| `public/style.css`                  | Global styles                                                            |

### Available commands

| Command             | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start dev server on localhost:8080   |
| `npm run dev-nolog` | Start dev server without log process |
| `npm run build`     | Production build                     |
