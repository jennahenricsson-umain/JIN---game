import { EventBus } from '../EventBus';
import { GameObjects, Scene } from 'phaser';
import { GESTURE_EVENT, type GesturePayload } from '../gesture/GestureClient';

export class Game extends Scene
{
    image: GameObjects.Image;
    gesturepoints: GameObjects.Graphics;
    counter: number = 0;
    private peaceX: number;
    private peaceY: number;
    private gestureListener = (payload: GesturePayload) => this.onGesture(payload);

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        EventBus.on(GESTURE_EVENT, this.gestureListener);
        EventBus.emit('current-scene-ready', this);

        this.peaceX = this.scale.width / 2;
        this.peaceY = this.scale.height / 2;
        this.image = this.add.image(this.peaceX, this.peaceY, 'peace').setDepth(100);
        this.gesturepoints = this.add.graphics({ fillStyle: { color: 0x8803fc } }).setDepth(50);
    }   

    private onGesture(payload: GesturePayload): void {
        const handX = payload.landmark[9].x * this.scale.width; // Random punkt mitt på handen, borde bytas till något meddelvärde
        const handY = payload.landmark[9].y * this.scale.height;
        this.gesturepoints.clear();

        for (const landmark of payload.landmark) {
            const x = landmark.x * this.scale.width;
            const y = landmark.y * this.scale.height;
            this.gesturepoints.fillCircle(x, y, 5);
        }

        if (payload.gesture === 'Victory' && payload.score >= 0.7 && Phaser.Math.Distance.Between(handX, handY, this.peaceX, this.peaceY) < 50) {
            this.counter += 1;
            EventBus.emit('counter-updated', this.counter);
            const x = Phaser.Math.Between(64, this.scale.width - 64);
            const y = Phaser.Math.Between(64, this.scale.height - 64);
            const star = this.add.sprite(x, y, 'star').setDepth(50);
            this.tweens.add({ targets: star, duration: 500 + Math.random() * 1000, alpha: 0, yoyo: true, repeat: -1 });
            this.image.destroy();
            this.peaceX = Phaser.Math.Between(64, this.scale.width - 64);
            this.peaceY = Phaser.Math.Between(64, this.scale.height - 64);
            this.image = this.add.image(this.peaceX, this.peaceY, 'peace').setDepth(100);
        }

        if (payload.gesture === 'Thumb_Down' && payload.score >= 0.7) {
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
