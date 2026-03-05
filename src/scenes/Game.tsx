import { useCallback, useEffect, useRef, useState } from "react";
import { EventBus } from "../game/EventBus";
import {
    GESTURE_EVENT,
    getVideoSize,
    type GesturePayload,
} from "../game/gesture/GestureClient";

interface GameProps {
    onEnd: (finalScore: number) => void;
}

interface Star {
    id: number;
    x: number;
    y: number;
    duration: number;
}

function randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Convert a normalized landmark coordinate (0–1) to screen pixels,
// applying the same object-fit: cover transform the video element uses.
function landmarkToScreen(nx: number, ny: number): { x: number; y: number } {
    const { width: videoW, height: videoH } = getVideoSize();
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const scale = Math.max(screenW / videoW, screenH / videoH);
    const offsetX = (videoW * scale - screenW) / 2;
    const offsetY = (videoH * scale - screenH) / 2;
    return {
        x: nx * videoW * scale - offsetX,
        y: ny * videoH * scale - offsetY,
    };
}

export function Game({ onEnd }: GameProps) {
    const [counter, setCounter] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [peacePos, setPeacePos] = useState({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
    });
    const [stars, setStars] = useState<Star[]>([]);
    const [lastGesture, setLastGesture] = useState<GesturePayload | null>(null);

    const peacePosRef = useRef(peacePos);
    const matchStartRef = useRef(Date.now());
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const starIdRef = useRef(0);
    const counterRef = useRef(0);
    const gestureRef = useRef<GesturePayload | null>(null);
    const onEndRef = useRef(onEnd);
    useEffect(() => {
        onEndRef.current = onEnd;
    });

    // Gesture handler: store latest payload + draw landmarks on canvas
    const handleGesture = useCallback((raw: unknown) => {
        const payload = raw as GesturePayload;
        gestureRef.current = payload;
        setLastGesture(payload);

        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "#8803fc";
                for (const lm of payload.landmark) {
                    // Use cover-corrected screen coordinates so dots align with video
                    const { x, y } = landmarkToScreen(lm.x, lm.y);
                    ctx.beginPath();
                    ctx.arc(x, y, 5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }, []);

    useEffect(() => {
        EventBus.on(GESTURE_EVENT, handleGesture);
        return () => EventBus.removeListener(GESTURE_EVENT, handleGesture);
    }, [handleGesture]);

    // Game loop: runs at a fixed rate independent of gesture events
    useEffect(() => {
        const tick = () => {
            const margin = 120;
            const W = window.innerWidth;
            const H = window.innerHeight;
            const now = Date.now();
            const el = now - matchStartRef.current;
            setElapsed(el);

            // End game after 10 seconds BUT it goes down by a second for every successful sign
            if (el / 1000 >= (10 - counterRef.current)) {
                onEndRef.current(counterRef.current);
                return;
            }

            const payload = gestureRef.current;
            if (!payload) return;

            const { gesture, score, landmark } = payload;

            if (gesture === "Thumb_Down" && score >= 0.7) {
                onEndRef.current(counterRef.current);
                return;
            }

            if (gesture === "Victory" && score >= 0.7) {
                // Use the same cover-corrected position for hit detection
                const { x: handX, y: handY } = landmarkToScreen(
                    landmark[9].x,
                    landmark[9].y,
                );
                const { x: peaceX, y: peaceY } = peacePosRef.current;

                if (Math.hypot(handX - peaceX, handY - peaceY) < 100) {
                    matchStartRef.current = now;
                    counterRef.current += 1;
                    setCounter(counterRef.current);

                    const id = ++starIdRef.current;
                    const duration = 500 + Math.random() * 1000;
                    setStars((prev) => [
                        ...prev,
                        { id, x: peaceX, y: peaceY, duration },
                    ]);

                    const newPos = {
                        x: randomBetween(margin, W - margin),
                        y: randomBetween(margin, H - margin),
                    };
                    peacePosRef.current = newPos;
                    setPeacePos(newPos);
                }
            }
        };

        const id = setInterval(tick, 100);
        return () => clearInterval(id);
    }, []); // no deps — reads everything via refs

    // Keep canvas pixel dimensions in sync with screen size
    useEffect(() => {
        const sync = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
            }
        };
        sync();
        window.addEventListener("resize", sync);
        return () => window.removeEventListener("resize", sync);
    }, []);

    const removeStar = (id: number) =>
        setStars((prev) => prev.filter((s) => s.id !== id));

    

    return (
        <div className="scene scene--game">
            <canvas ref={canvasRef} className="landmark-canvas" />

            <img
                src="/assets/victory_JIN.png"
                className="peace-target animate-wiggle"
                style={{ left: peacePos.x, top: peacePos.y }}
                alt=""
            />

            {stars.map((star) => (
                <img
                    key={star.id}
                    src="/assets/star.png"
                    className="star"
                    style={{
                        left: star.x,
                        top: star.y,
                        ["--duration" as string]: `${star.duration}ms`,
                    }}
                    alt=""
                    onAnimationEnd={() => removeStar(star.id)}
                />
            ))}

            <p className="scene-text scene-text--game-gesture">
                Gesture:{" "}
                {lastGesture
                    ? `${lastGesture.gesture} (${(lastGesture.score * 100).toFixed(0)}%)`
                    : "—"}
            </p>
            <p className="scene-text scene-text--game-score">
                Score: {counter}
            </p>
            <p className="scene-text scene-text--game-timer">
                Time: {((10 - counterRef.current) - elapsed / 1000).toFixed(1)}s
            </p>
        </div>
    );
}
