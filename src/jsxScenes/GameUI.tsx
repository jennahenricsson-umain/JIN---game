import type { GesturePayload } from "../game/gesture/GestureClient";

interface GameUIProps {
    lastGesture: GesturePayload | null;
    onChangeScene: () => void;
    onAddSprite: () => void;
}

export function GameUI({
    lastGesture,
    onChangeScene,
    onAddSprite,
}: GameUIProps) {
    return (
        <div className="game-ui">
            <div className="last-gesture-badge">
                {lastGesture
                    ? `${lastGesture.gesture} (${(lastGesture.score * 100).toFixed(0)}%)`
                    : "—"}
            </div>
            <div>
                <button
                    type="button"
                    className="button"
                    onClick={onChangeScene}
                >
                    Change Scene
                </button>
            </div>
            <div>
                <button type="button" className="button" onClick={onAddSprite}>
                    Add New Sprite
                </button>
            </div>
        </div>
    );
}

