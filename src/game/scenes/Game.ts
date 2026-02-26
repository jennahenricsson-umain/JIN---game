import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { GESTURE_EVENT, type GesturePayload } from '../gesture/GestureClient';

interface GestureTarget {
    gesture: string;
    x: number;
    y: number;
    sprite: Phaser.GameObjects.Text;
}

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    scoreText: Phaser.GameObjects.Text;
    timerText: Phaser.GameObjects.Text;
    gestureText: Phaser.GameObjects.Text;
    handIndicator: Phaser.GameObjects.Circle;
    private gestureListener = (payload: GesturePayload) => this.onGesture(payload);
    private currentTarget: GestureTarget | null = null;
    private startTime = 0;
    private readonly MATCH_DISTANCE = 150; //detta var 150 innan
    private lastMatchTime = 0;
    private readonly MATCH_COOLDOWN = 500; // ms between matches
    private readonly SEQUENCE = [
        { gesture: 'Thumb_Up', x: 300, y: 300 },
        { gesture: 'Victory', x: 700, y: 400 },
        { gesture: 'Open_Palm', x: 500, y: 200 },
        { gesture: 'Thumb_Down', x: 800, y: 600 },
    ];
    private sequenceIndex = 0;

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        // Reset game state
        this.sequenceIndex = 0;
        this.lastMatchTime = 0;
        this.currentTarget = null;

        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x1a1a2e);

        this.background = this.add.image(512, 384, 'background');
        this.background.setAlpha(0.3);

        this.scoreText = this.add.text(20, 20, `Progress: ${this.sequenceIndex + 1}/${this.SEQUENCE.length}`, {
            fontFamily: 'Arial Black', fontSize: 32, color: '#ffffff',
            stroke: '#000000', strokeThickness: 4
        }).setDepth(100);

        this.timerText = this.add.text(this.scale.width - 20, 20, 'Time: 0.0s', {
            fontFamily: 'Arial Black', fontSize: 32, color: '#ffffff',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(1, 0).setDepth(100);

        this.gestureText = this.add.text(512, 50, 'Match the gesture at the target!', {
            fontFamily: 'Arial Black', fontSize: 24, color: '#ffff00',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(100);

        this.handIndicator = this.add.circle(0, 0, 30, 0x00ff00, 0.5).setDepth(99);

        this.startTime = Date.now();

        EventBus.on(GESTURE_EVENT, this.gestureListener);
        EventBus.emit('current-scene-ready', this);
        
        this.spawnTarget();
    }

    private spawnTarget(): void {
        if (this.currentTarget) {
            this.currentTarget.sprite.destroy();
        }

        if (this.sequenceIndex >= this.SEQUENCE.length) {
            this.gestureText.setText('🎉 Sequence Complete!');
            this.time.delayedCall(2000, () => this.scene.start('GameOver'));
            return;
        }

        const { gesture, x, y } = this.SEQUENCE[this.sequenceIndex];

        // Map gesture names to emojis (replace with images later)
        const gestureEmoji: Record<string, string> = {
            'Thumb_Up': '👍',
            'Thumb_Down': '👎',
            'Victory': '✌️',
            'Open_Palm': '✋'
        };

        const sprite = this.add.text(x, y, gestureEmoji[gesture] || '❓', {
            fontSize: '120px',
            padding: { top: 20, bottom: 20 }
        }).setOrigin(0.5).setDepth(50);

        this.tweens.add({
            targets: sprite,
            scale: { from: 1, to: 1.2 },
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        this.currentTarget = { gesture, x, y, sprite };
    }

    private onGesture(payload: GesturePayload): void {
        const handX = payload.x * this.scale.width;
        const handY = payload.y * this.scale.height;
        this.handIndicator.setPosition(handX, handY);

        if (!this.currentTarget) return;

        const distance = Phaser.Math.Distance.Between(
            handX, handY,
            this.currentTarget.x, this.currentTarget.y
        );
        
        const gestureMatch = payload.gesture === this.currentTarget.gesture;
        const scoreOk = payload.score >= 0.55;  // Lowered from 0.7 to 0.6
        const distanceOk = distance < this.MATCH_DISTANCE;
        
        this.gestureText.setText(
            `Target: ${this.currentTarget.gesture}\n` +
            `Detected: ${payload.gesture} (${(payload.score * 100).toFixed(0)}%)\n` +
            `Dist: ${distance.toFixed(0)}/${this.MATCH_DISTANCE} | G:${gestureMatch} S:${scoreOk} D:${distanceOk}`
        );

        // Must match BOTH gesture and position
        if (gestureMatch && scoreOk && distanceOk) {
            const now = Date.now();
            const timeSince = now - this.lastMatchTime;
            
            console.log('MATCH!', { timeSince, cooldown: this.MATCH_COOLDOWN });
            
            // Check cooldown
            if (timeSince < this.MATCH_COOLDOWN) {
                console.log('Blocked by cooldown');
                return;
            }
            
            console.log('SUCCESS!');
            this.lastMatchTime = now;
            this.sequenceIndex++;
            this.scoreText.setText(`Progress: ${this.sequenceIndex + 1}/${this.SEQUENCE.length}`);
            this.cameras.main.flash(200, 0, 255, 0);
            this.spawnTarget();
        }
    }

    update(): void {
        // Update timer every frame
        const elapsed = (Date.now() - this.startTime) / 1000;
        this.timerText.setText(`Time: ${elapsed.toFixed(1)}s`);
    }

    shutdown(): void {
        EventBus.removeListener(GESTURE_EVENT, this.gestureListener);
    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }
}
