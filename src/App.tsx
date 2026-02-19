import { useRef, useState, useEffect } from 'react';
import { IRefPhaserGame, PhaserGame } from './PhaserGame';
import { MainMenu } from './game/scenes/MainMenu';
import { EventBus } from './game/EventBus';
import { GESTURE_EVENT, GESTURE_SERVER_URL, type GesturePayload } from './game/gesture/GestureClient';

function App()
{
    // The sprite can only be moved in the MainMenu Scene
    const [canMoveSprite, setCanMoveSprite] = useState(true);
    // Current Phaser scene key so we can render scene text in JSX
    const [currentSceneKey, setCurrentSceneKey] = useState<string | null>(null);

    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);
    const [spritePosition, setSpritePosition] = useState({ x: 0, y: 0 });

    // Camera preview + last gesture for feedback
    const [lastGesture, setLastGesture] = useState<GesturePayload | null>(null);
    const [cameraError, setCameraError] = useState(false);
    useEffect(() => {
        const onGesture = (payload: GesturePayload) => setLastGesture(payload);
        EventBus.on(GESTURE_EVENT, onGesture);
        return () => { EventBus.removeListener(GESTURE_EVENT, onGesture); };
    }, []);

    const changeScene = () => {

        if(phaserRef.current)
        {     
            const scene = phaserRef.current.scene as MainMenu;
            
            if (scene)
            {
                scene.changeScene();
            }
        }
    }

    const moveSprite = () => {

        if(phaserRef.current)
        {

            const scene = phaserRef.current.scene as MainMenu;

            if (scene && scene.scene.key === 'MainMenu')
            {
                // Get the update logo position
                scene.moveLogo(({ x, y }) => {

                    setSpritePosition({ x, y });

                });
            }
        }

    }

    const addSprite = () => {

        if (phaserRef.current)
        {
            const scene = phaserRef.current.scene;

            if (scene)
            {
                // Add more stars
                const x = Phaser.Math.Between(64, scene.scale.width - 64);
                const y = Phaser.Math.Between(64, scene.scale.height - 64);
    
                //  `add.sprite` is a Phaser GameObjectFactory method and it returns a Sprite Game Object instance
                const star = scene.add.sprite(x, y, 'star');
    
                //  ... which you can then act upon. Here we create a Phaser Tween to fade the star sprite in and out.
                //  You could, of course, do this from within the Phaser Scene code, but this is just an example
                //  showing that Phaser objects and systems can be acted upon from outside of Phaser itself.
                scene.add.tween({
                    targets: star,
                    duration: 500 + Math.random() * 1000,
                    alpha: 0,
                    yoyo: true,
                    repeat: -1
                });
            }
        }
    }



    const videoUrl = `${GESTURE_SERVER_URL.replace(/\/$/, '')}/video`;

    return (
        <div id="app">
            <div className="camera-background" aria-hidden="true">
                <img
                    src={videoUrl}
                    alt="Video Feed from Camera"
                    className="camera-background-feed"
                    onError={() => setCameraError(true)}
                    onLoad={() => setCameraError(false)}
                />
                {cameraError && (
                    <div className="camera-error-overlay">
                        Start the gesture server: <code>cd gesture_base &amp;&amp; python3 server.py</code>
                    </div>
                )}
            </div>

            <div className="game-ui">
                <div className="last-gesture-badge">
                    {lastGesture
                        ? `${lastGesture.gesture} (${(lastGesture.score * 100).toFixed(0)}%)`
                        : '—'}
                </div>
                <div>
                    <button className="button" onClick={changeScene}>Change Scene</button>
                </div>
                <div>
                    <button disabled={canMoveSprite} className="button" onClick={moveSprite}>Toggle Movement</button>
                </div>
                <div className="spritePosition">Sprite Position:
                    <pre>{`{\n  x: ${spritePosition.x}\n  y: ${spritePosition.y}\n}`}</pre>
                </div>
                <div>
                    <button className="button" onClick={addSprite}>Add New Sprite</button>
                </div>
            </div>
        </div>
    );
}

export default App
