import { useEffect } from "react";
import { EventBus } from "../game/EventBus";
import {
    GESTURE_EVENT,
    type GesturePayload,
} from "../game/gesture/GestureClient";

interface MainMenuProps {
    onStart: () => void;
}

export function MainMenu({ onStart }: MainMenuProps) {
    useEffect(() => {
        const handler = (payload: unknown) => {
            const { gesture, score } = payload as GesturePayload;
            if (gesture === "Thumb_Up" && score >= 0.7) onStart();
        };
        EventBus.on(GESTURE_EVENT, handler);
        return () => EventBus.removeListener(GESTURE_EVENT, handler);
    }, [onStart]);

    return (
        <div className="scene scene--main-menu">
            <img
                src="/assets/Umain-logotype-white.png"
                className="main-menu-logo"
                alt="Logo"
            />
            <p className="scene-text scene-text--main-menu">
                Main Menu
                <br />
                (Thumbs Up to start)
            </p>
        </div>
    );
}
