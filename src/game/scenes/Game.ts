import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { GESTURE_EVENT, type GesturePayload } from '../gesture/GestureClient';

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameText: Phaser.GameObjects.Text;
    gestureText: Phaser.GameObjects.Text;
    private gestureListener = (payload: GesturePayload) => this.onGesture(payload);

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x00ff00);

        this.background = this.add.image(512, 384, 'background');
        this.background.setAlpha(0.5);

        this.gameText = this.add.text(512, 384, 'Make something fun!\nand share it with us:\nsupport@phaser.io', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        this.gestureText = this.add.text(512, 120, 'Gesture: —', {
            fontFamily: 'Arial Black', fontSize: 24, color: '#ffffff',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(100);

        EventBus.on(GESTURE_EVENT, this.gestureListener);
        EventBus.emit('current-scene-ready', this);
    }

    private onGesture(payload: GesturePayload): void {
        this.gestureText.setText(`Gesture: ${payload.gesture} (${(payload.score * 100).toFixed(0)}%)`);
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
