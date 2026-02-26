import type { GesturePayload } from '../game/gesture/GestureClient';

interface GameSceneProps {
  lastGesture: GesturePayload | null;
}

export function GameScene({ lastGesture }: GameSceneProps) {
  return (
    <>
      <p className="scene-text scene-text--game-title">
        Do a peace sign for Victory!<br />Thumbs up to play again.<br />and Thumbs down to end the game.
      </p>
      <p className="scene-text scene-text--game-gesture">
        Gesture: {lastGesture ? `${lastGesture.gesture} (${(lastGesture.score * 100).toFixed(0)}%)` : '—'}
      </p>
    </>
  );
}
