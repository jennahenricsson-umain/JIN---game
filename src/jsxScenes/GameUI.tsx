import type { GesturePayload } from '../game/gesture/GestureClient';

interface GameUIProps {
  lastGesture: GesturePayload | null;
  canMoveSprite: boolean;
  spritePosition: { x: number; y: number };
  onChangeScene: () => void;
  onMoveSprite: () => void;
  onAddSprite: () => void;
}

export function GameUI({
  lastGesture,
  canMoveSprite,
  spritePosition,
  onChangeScene,
  onMoveSprite,
  onAddSprite,
}: GameUIProps) {
  return (
    <div className="game-ui">
      <div className="last-gesture-badge">
        {lastGesture
          ? `${lastGesture.gesture} (${(lastGesture.score * 100).toFixed(0)}%)`
          : '—'}
      </div>
      <div>
        <button type="button" className="button" onClick={onChangeScene}>
          Change Scene
        </button>
      </div>
      <div>
        <button
          type="button"
          disabled={canMoveSprite}
          className="button"
          onClick={onMoveSprite}
        >
          Toggle Movement
        </button>
      </div>
      <div className="spritePosition">
        Sprite Position:
        <pre>{`{\n  x: ${spritePosition.x}\n  y: ${spritePosition.y}\n}`}</pre>
      </div>
      <div>
        <button type="button" className="button" onClick={onAddSprite}>
          Add New Sprite
        </button>
      </div>
    </div>
  );
}
