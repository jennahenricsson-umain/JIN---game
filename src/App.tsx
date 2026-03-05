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

    //The light grey border points around the screen, from Issys sketch
    const renderPoints = () => {
    return (
        <div className="pointer-events-none">
            <img className="absolute top-4 left-4 size-4" src="/assets/Ellipse.svg" alt="Points Icon" />
            <img className="absolute top-4 size-4" src="/assets/Ellipse.svg" alt="Points Icon" />
            <img className="absolute top-4 right-4 size-4" src="/assets/Ellipse.svg" alt="Points Icon" />
            <img className="absolute bottom-4 size-4" src="/assets/Ellipse.svg" alt="Points Icon" />
            <img className="absolute left-4 size-4" src="/assets/Ellipse.svg" alt="Points Icon" />
            <img className="absolute right-4 size-4" src="/assets/Ellipse.svg" alt="Points Icon" />
            <img className="absolute left-4 bottom-4 size-4" src="/assets/Ellipse.svg" alt="Points Icon" />
    </div>
    
    )
}


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
                {renderPoints()}
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
