# JIN - Gesture Game

Hand gesture-controlled game. Runs entirely in the browser via MediaPipe.

## Run

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`

## Structure

```
index.html              # Main HTML + styles
js/
  ├── main.js           # Entry point & orchestration
  ├── gestures.js       # MediaPipe integration
  └── scenes/
      ├── menu.js       # Main menu scene
      ├── gameplay.js   # Game scene
      └── gameover.js   # Game over scene
public/
  ├── assets/           # Images
  └── gesture_recognizer.task  # MediaPipe model
```

## How to Play

- 👍 Thumb Up: Start/restart
- ✌️ Victory: Match target to score
- 👎 Thumb Down: End game

## Adding New Scenes

1. Create `js/scenes/newscene.js`
2. Export a render function
3. Import and use in `js/main.js`
