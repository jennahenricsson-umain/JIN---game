import { useEffect } from "react";
import { EventBus } from "../game/EventBus";
import {
    GESTURE_EVENT,
    type GesturePayload,
} from "../game/gesture/GestureClient";

interface GameOverProps {
    score: number;
    onRestart: () => void;
}

export function GameOver({ score, onRestart }: GameOverProps) {
    useEffect(() => {
        const handler = (payload: unknown) => {
            const { gesture, score } = payload as GesturePayload;
            if (gesture === "Thumb_Up" && score >= 0.7) onRestart();
        };
        EventBus.on(GESTURE_EVENT, handler);
        return () => EventBus.removeListener(GESTURE_EVENT, handler);
    }, [onRestart]);

    return (
        <div className="scene scene--game-over">
            <p className="scene-text scene-text--game-score">Score: {score}</p>
            <p className="scene-text scene-text--game-over">Game Over</p>
            <p className="scene-text scene-text--game-over-hint">
                (Thumbs Up to play again)
            </p>
        </div>
    );
}
