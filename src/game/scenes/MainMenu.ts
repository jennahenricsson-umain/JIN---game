import { GameObjects, Scene } from 'phaser';

import { EventBus } from '../EventBus';
import { GESTURE_EVENT, type GesturePayload } from '../gesture/GestureClient';

export class MainMenu extends Scene
{
    background: GameObjects.Image;
    title: GameObjects.Text;
    private gestureListener = (payload: GesturePayload) => this.onGesture(payload);

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        this.background = this.add.image(512, 384, 'background');

        this.title = this.add.text(512, 384, '👍 Thumbs Up to Start', {
            fontFamily: 'Arial Black', fontSize: 48, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

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
