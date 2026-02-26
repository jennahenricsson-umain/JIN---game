import type { GesturePayload } from '../game/gesture/GestureClient';

interface GameSceneProps {
  lastGesture: GesturePayload | null;
  counter: number;
}

export function GameScene({ lastGesture, counter }: GameSceneProps) {
  return (
    <>
      <p className="scene-text scene-text--game-title">
        
      </p>
      <p className="scene-text scene-text--game-gesture">
        Gesture: {lastGesture ? `${lastGesture.gesture} (${(lastGesture.score * 100).toFixed(0)}%)` : '—'}
      </p>
      <p className="scene-text scene-text--game-score">
        Score: {counter}
      </p>
    </>
  );
}
