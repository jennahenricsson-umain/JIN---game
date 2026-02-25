import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { GESTURE_EVENT, type GesturePayload } from '../gesture/GestureClient';

export class GameOver extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameOverText : Phaser.GameObjects.Text;
    restartText: Phaser.GameObjects.Text;
    private gestureListener = (payload: GesturePayload) => this.onGesture(payload);

    constructor ()
    {
        super('GameOver');
    }

    create ()
    {
        this.camera = this.cameras.main
        this.camera.setBackgroundColor(0xff0000);

        this.background = this.add.image(512, 384, 'background');
        this.background.setAlpha(0.5);

        this.gameOverText = this.add.text(512, 300, 'Yey you, game done', {
            fontFamily: 'Arial Black', fontSize: 64, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        this.restartText = this.add.text(512, 450, '👍 Thumbs Up to Restart', {
            fontFamily: 'Arial Black', fontSize: 32, color: '#ffff00',
            stroke: '#000000', strokeThickness: 4,
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
        this.scene.start('MainMenu');
    }
}
