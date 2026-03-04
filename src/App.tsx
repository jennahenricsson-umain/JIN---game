import { useRef, useState, useEffect } from "react";
import { IRefPhaserGame, PhaserGame } from "./PhaserGame";
import { MainMenu } from "./game/scenes/MainMenu";
import { EventBus } from "./game/EventBus";
import {
    GESTURE_EVENT,
    CAMERA_READY_EVENT,
    type GesturePayload,
} from "./game/gesture/GestureClient";
import { MainMenuScene, GameScene, GameOverScene, GameUI } from "./jsxScenes";

function App() {
    // Current Phaser scene key so we can render scene text in JSX
    const [currentSceneKey, setCurrentSceneKey] = useState<string | null>(null);

    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    // Camera preview + last gesture for feedback
    const [lastGesture, setLastGesture] = useState<GesturePayload | null>(null);
    const cameraVideoRef = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        const onGesture = (payload: GesturePayload) => setLastGesture(payload);
        EventBus.on(GESTURE_EVENT, onGesture);
        const onCameraReady = (stream: MediaStream) => {
            if (cameraVideoRef.current) {
                cameraVideoRef.current.srcObject = stream;
            }
        };
        EventBus.on(CAMERA_READY_EVENT, onCameraReady);
        return () => {
            EventBus.removeListener(GESTURE_EVENT, onGesture);
            EventBus.removeListener(CAMERA_READY_EVENT, onCameraReady);
        };
    }, []);

    const changeScene = () => {
        if (phaserRef.current) {
            const scene = phaserRef.current.scene as MainMenu;

            if (scene) {
                scene.changeScene();
            }
        }
    };

    const addSprite = () => {
        if (phaserRef.current) {
            const scene = phaserRef.current.scene;

            if (scene) {
                // Add more stars
                const x = Phaser.Math.Between(64, scene.scale.width - 64);
                const y = Phaser.Math.Between(64, scene.scale.height - 64);

                //  `add.sprite` is a Phaser GameObjectFactory method and it returns a Sprite Game Object instance
                const star = scene.add.sprite(x, y, "star");

                //  ... which you can then act upon. Here we create a Phaser Tween to fade the star sprite in and out.
                //  You could, of course, do this from within the Phaser Scene code, but this is just an example
                //  showing that Phaser objects and systems can be acted upon from outside of Phaser itself.
                scene.add.tween({
                    targets: star,
                    duration: 500 + Math.random() * 1000,
                    alpha: 0,
                    yoyo: true,
                    repeat: -1,
                });
            }
        }
    };

    // Event emitted from the PhaserGame component
    const currentScene = (scene: Phaser.Scene) => {
        setCurrentSceneKey(scene.scene.key);
    };

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
                <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
                <div className="scene-text-overlay" aria-live="polite">
                    {currentSceneKey === "MainMenu" && <MainMenuScene />}
                    {currentSceneKey === "Game" && (
                        <GameScene lastGesture={lastGesture} />
                    )}
                    {currentSceneKey === "GameOver" && <GameOverScene />}
                </div>
            </div>
            <GameUI
                lastGesture={lastGesture}
                onChangeScene={changeScene}
                onAddSprite={addSprite}
            />
        </div>
    );
}

export default App;
