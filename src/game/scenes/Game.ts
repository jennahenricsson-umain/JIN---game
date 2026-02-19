import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { GESTURE_EVENT, type GesturePayload } from '../gesture/GestureClient';

export class Game extends Scene
{
    private gestureListener = (payload: GesturePayload) => this.onGesture(payload);

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.cameras.main.setBackgroundColor(0x00000000);
        EventBus.on(GESTURE_EVENT, this.gestureListener);
        EventBus.emit('current-scene-ready', this);
    }

    private onGesture(payload: GesturePayload): void {
        if (payload.gesture === 'Thumbs_Up' && payload.score >= 0.7) {
            const x = Phaser.Math.Between(64, this.scale.width - 64);
            const y = Phaser.Math.Between(64, this.scale.height - 64);
            const star = this.add.sprite(x, y, 'star').setDepth(50);
            this.tweens.add({ targets: star, duration: 500 + Math.random() * 1000, alpha: 0, yoyo: true, repeat: -1 });
        }
        if (payload.gesture === 'Thumbs_Down' && payload.score >= 0.7) {
            this.scene.start('GameOver');
        }
    }

    shutdown(): void {
        EventBus.removeListener(GESTURE_EVENT, this.gestureListener);
    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }
}
