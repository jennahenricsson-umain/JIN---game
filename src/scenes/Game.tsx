import { useCallback, useEffect, useRef, useState } from 'react';
import { EventBus } from '../game/EventBus';
import { GESTURE_EVENT, type GesturePayload } from '../game/gesture/GestureClient';

interface GameProps {
    onEnd: () => void;
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

export function Game({ onEnd }: GameProps) {
    const margin = 64;
    const W = window.innerWidth;
    const H = window.innerHeight;

    const [counter, setCounter] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [peacePos, setPeacePos] = useState({ x: W / 2, y: H / 2 });
    const [stars, setStars] = useState<Star[]>([]);
    const [lastGesture, setLastGesture] = useState<GesturePayload | null>(null);

    // Ref mirrors peacePos so the gesture handler always reads the latest value
    // without needing to re-register on every position change
    const peacePosRef = useRef(peacePos);
    const matchStartRef = useRef(Date.now());
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const starIdRef = useRef(0);

    const handleGesture = useCallback((raw: unknown) => {
        const payload = raw as GesturePayload;
        const { gesture, score, landmark } = payload;

        // Draw hand landmarks
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#8803fc';
                for (const lm of landmark) {
                    const x = lm.x * canvas.width;
                    const y = lm.y * canvas.height;
                    ctx.beginPath();
                    ctx.arc(x, y, 5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        setLastGesture(payload);
        setElapsed(Date.now() - matchStartRef.current);

        const handX = landmark[9].x * W;
        const handY = landmark[9].y * H;
        const { x: peaceX, y: peaceY } = peacePosRef.current;

        if (gesture === 'Victory' && score >= 0.7 && Math.hypot(handX - peaceX, handY - peaceY) < 50) {
            matchStartRef.current = Date.now();
            setCounter(c => c + 1);

            // Spawn star at old peace position
            const id = ++starIdRef.current;
            const duration = 500 + Math.random() * 1000;
            setStars(prev => [...prev, { id, x: peaceX, y: peaceY, duration }]);

            // Move peace to a new random position
            const newPos = { x: randomBetween(margin, W - margin), y: randomBetween(margin, H - margin) };
            peacePosRef.current = newPos;
            setPeacePos(newPos);
        }

        if (gesture === 'Thumb_Down' && score >= 0.7) {
            onEnd();
        }
    }, [W, H, onEnd]);

    useEffect(() => {
        EventBus.on(GESTURE_EVENT, handleGesture);
        return () => EventBus.removeListener(GESTURE_EVENT, handleGesture);
    }, [handleGesture]);

    // Keep canvas pixel dimensions in sync with window size
    useEffect(() => {
        const sync = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
            }
        };
        sync();
        window.addEventListener('resize', sync);
        return () => window.removeEventListener('resize', sync);
    }, []);

    const removeStar = (id: number) => setStars(prev => prev.filter(s => s.id !== id));

    return (
        <div className="scene scene--game">
            <canvas ref={canvasRef} className="landmark-canvas" />

            <img
                src="/assets/peace-white.png"
                className="peace-target"
                style={{ left: peacePos.x, top: peacePos.y }}
                alt=""
            />

            {stars.map(star => (
                <img
                    key={star.id}
                    src="/assets/star.png"
                    className="star"
                    style={{
                        left: star.x,
                        top: star.y,
                        ['--duration' as string]: `${star.duration}ms`,
                    }}
                    alt=""
                    onAnimationEnd={() => removeStar(star.id)}
                />
            ))}

            <p className="scene-text scene-text--game-gesture">
                Gesture: {lastGesture ? `${lastGesture.gesture} (${(lastGesture.score * 100).toFixed(0)}%)` : '—'}
            </p>
            <p className="scene-text scene-text--game-score">
                Score: {counter}
            </p>
            <p className="scene-text scene-text--game-timer">
                Time: {(elapsed / 1000).toFixed(1)}s
            </p>
        </div>
    );
}
