// Import React hooks for state management and side effects
import { useRef, useState, useEffect } from 'react';
// Import Phaser game component and its TypeScript interface
import { IRefPhaserGame, PhaserGame } from './PhaserGame';
// Import MainMenu scene type for type casting
import { MainMenu } from './game/scenes/MainMenu';
// Import EventBus for communication between React and Phaser
import { EventBus } from './game/EventBus';
// Import gesture-related constants and types
import { GESTURE_EVENT, GESTURE_SERVER_URL, type GesturePayload } from './game/gesture/GestureClient';

// Main React component that wraps the Phaser game
function App()
{
    // State: controls whether sprite movement button is enabled (only in MainMenu)
    const [canMoveSprite, setCanMoveSprite] = useState(true);

    // Ref: holds reference to Phaser game instance and current scene
    const phaserRef = useRef<IRefPhaserGame | null>(null);
    
    // State: tracks sprite position for display (legacy feature, not used in gesture game)
    const [spritePosition, setSpritePosition] = useState({ x: 0, y: 0 });

    // State: stores the most recent gesture detected by the Python server
    const [lastGesture, setLastGesture] = useState<GesturePayload | null>(null);
    
    // State: tracks if camera feed failed to load
    const [cameraError, setCameraError] = useState(false);
    
    // Effect: subscribe to gesture events when component mounts
    useEffect(() => {
        // Callback: update lastGesture state when gesture is detected
        const onGesture = (payload: GesturePayload) => setLastGesture(payload);
        // Subscribe to gesture events from EventBus
        EventBus.on(GESTURE_EVENT, onGesture);
        // Cleanup: unsubscribe when component unmounts
        return () => { EventBus.removeListener(GESTURE_EVENT, onGesture); };
    }, []); // Empty dependency array = run once on mount

    // Function: manually change scene (button handler, not used in gesture game)
    const changeScene = () => {
        // Check if Phaser game reference exists
        if(phaserRef.current)
        {     
            // Get current scene and cast to MainMenu type
            const scene = phaserRef.current.scene as MainMenu;
            
            // If scene exists, call its changeScene method
            if (scene)
            {
                scene.changeScene();
            }
        }
    }

    // Function: toggle sprite movement animation (legacy feature, not used in gesture game)
    const moveSprite = () => {
        // Check if Phaser game reference exists
        if(phaserRef.current)
        {
            // Get current scene and cast to MainMenu type
            const scene = phaserRef.current.scene as MainMenu;

            // Only works if currently in MainMenu scene
            if (scene && scene.scene.key === 'MainMenu')
            {
                // Call moveLogo with callback to update sprite position state
                scene.moveLogo(({ x, y }) => {
                    // Update React state with new sprite position
                    setSpritePosition({ x, y });
                });
            }
        }
    }

    // Callback: invoked by PhaserGame when scene changes
    const currentScene = (scene: Phaser.Scene) => {
        // Enable/disable sprite movement button based on current scene
        // (disabled in MainMenu, enabled in other scenes)
        setCanMoveSprite(scene.scene.key !== 'MainMenu');
    }

    // Construct URL for camera video feed from Python server
    const videoUrl = `${GESTURE_SERVER_URL.replace(/\/$/, '')}/video`;

    // Render UI
    return (
        // Main container
        <div id="app">
            {/* Phaser game canvas component */}
            <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
            
            {/* Camera preview panel (shows webcam feed with gesture overlay) */}
            <div className="camera-preview">
                {/* Header text */}
                <div className="camera-preview-header">Camera (gesture feedback)</div>
                
                {/* Video feed image from Python server's /video endpoint */}
                <img
                    src={videoUrl}
                    alt="Camera feed"
                    className="camera-feed"
                    onError={() => setCameraError(true)}  // Set error state if image fails to load
                    onLoad={() => setCameraError(false)}   // Clear error state when image loads
                />
                
                {/* Error message if camera feed fails */}
                {cameraError && (
                    <div className="camera-error">
                        Start the gesture server: <code>cd &quot;gesture base&quot; &amp;&amp; python server.py</code>
                    </div>
                )}
                
                {/* Display last detected gesture and confidence score */}
                <div className="last-gesture">
                    {lastGesture
                        ? `${lastGesture.gesture} (${(lastGesture.score * 100).toFixed(0)}%)`  // Show gesture name and score
                        : '—'}  // Show dash if no gesture detected
                </div>
            </div>
            
            {/* Debug controls panel (legacy features, not used in gesture game) */}
            <div>
                {/* Button to manually change scene */}
                <div>
                    <button className="button" onClick={changeScene}>Change Scene</button>
                </div>
                
                {/* Button to toggle sprite movement animation */}
                <div>
                    <button disabled={canMoveSprite} className="button" onClick={moveSprite}>Toggle Movement</button>
                </div>
                
                {/* Display current sprite position */}
                <div className="spritePosition">Sprite Position:
                    <pre>{`{\n  x: ${spritePosition.x}\n  y: ${spritePosition.y}\n}`}</pre>
                </div>
            </div>
        </div>
    )
}

// Export component as default
export default App
