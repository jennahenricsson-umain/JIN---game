import { useRef, useState, useEffect, useCallback } from 'react';
import { EventBus } from './game/EventBus';
import { startGestureClient, stopGestureClient, GESTURE_EVENT, CAMERA_READY_EVENT, type GesturePayload } from './game/gesture/GestureClient';
import { MainMenu } from './scenes/MainMenu';
import { Game } from './scenes/Game';
import { GameOver } from './scenes/GameOver';
import { GameUI } from './GameUI';

type Scene = 'mainmenu' | 'game' | 'gameover';

function App() {
    const [scene, setScene] = useState<Scene>('mainmenu');
    const [finalScore, setFinalScore] = useState(0);
    const [lastGesture, setLastGesture] = useState<GesturePayload | null>(null);
    const cameraVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        startGestureClient();
        const onGesture = (payload: unknown) => setLastGesture(payload as GesturePayload);
        const onCameraReady = (stream: unknown) => {
            if (cameraVideoRef.current) cameraVideoRef.current.srcObject = stream as MediaStream;
        };
        EventBus.on(GESTURE_EVENT, onGesture);
        EventBus.on(CAMERA_READY_EVENT, onCameraReady);
        return () => {
            stopGestureClient();
            EventBus.removeListener(GESTURE_EVENT, onGesture);
            EventBus.removeListener(CAMERA_READY_EVENT, onCameraReady);
        };
    }, []);

    // GameUI callbacks — advance or restart via button clicks
    const handleChangeScene = useCallback(() => {
        setScene(s => s === 'mainmenu' ? 'game' : s === 'game' ? 'gameover' : 'mainmenu');
    }, []);

    const handleAddSprite = useCallback(() => {
        // Kept as a no-op placeholder; no Phaser to spawn sprites into
    }, []);

    return (
        <div id="app">
            <div className="camera-background" aria-hidden="true">
                <video
                    ref={cameraVideoRef}
                    className="camera-background-feed"
                    autoPlay
                    playsInline
                    muted
                />
            </div>

            <div className="game-overlay">
                {scene === 'mainmenu' && <MainMenu onStart={() => setScene('game')} />}
                {scene === 'game' && <Game onEnd={(score) => { setFinalScore(score); setScene('gameover'); }} />}
                {scene === 'gameover' && <GameOver score={finalScore} onRestart={() => setScene('mainmenu')} />}
            </div>

            <GameUI
                lastGesture={lastGesture}
                onChangeScene={handleChangeScene}
                onAddSprite={handleAddSprite}
            />
        </div>
    );
}

export default App;
