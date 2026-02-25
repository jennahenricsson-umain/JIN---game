import { GameObjects, Scene } from 'phaser';

import { EventBus } from '../EventBus';
import { GESTURE_EVENT, type GesturePayload } from '../gesture/GestureClient';

export class MainMenu extends Scene
{
    logo: GameObjects.Image;
    logoTween: Phaser.Tweens.Tween | null;
    private gestureListener = (payload: GesturePayload) => this.onGesture(payload);

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        this.logo = this.add.image(this.scale.width / 2, this.scale.height / 2, 'logo').setScale(0.1).setDepth(100); // i mitten

        EventBus.on(GESTURE_EVENT, this.gestureListener);
        EventBus.emit('current-scene-ready', this);
    }

    private onGesture(payload: GesturePayload): void {
        if (payload.gesture === 'Thumb_Up' && payload.score >= 0.7) {
            this.changeScene();
        }
    }

    shutdown(): void {
        EventBus.removeListener(GESTURE_EVENT, this.gestureListener);
    }
    
    changeScene ()
    {
        this.scene.start('Game');
    }
}
