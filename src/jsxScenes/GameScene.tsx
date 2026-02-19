import type { GesturePayload } from '../game/gesture/GestureClient';

interface GameSceneProps {
  lastGesture: GesturePayload | null;
}

export function GameScene({ lastGesture }: GameSceneProps) {
  return (
    <>
      <p className="scene-text scene-text--game-title">
        Make something fun!<br />and share it with us:<br />support@phaser.io
      </p>
      <p className="scene-text scene-text--game-gesture">
        Gesture: {lastGesture ? `${lastGesture.gesture} (${(lastGesture.score * 100).toFixed(0)}%)` : '—'}
      </p>
    </>
  );
}
