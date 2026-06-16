import { Scene, Input } from 'phaser';

export class SettingsScene extends Scene {
    private fromScene!: string;

    constructor() {
        super('SettingsScene');
    }

    init(data: { fromScene: string }) {
        this.fromScene = data.fromScene;
    }

    create() {
        this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);
        this.add.rectangle(400, 300, 600, 400, 0x111827).setStrokeStyle(4, 0x4b5563);
        this.add.text(400, 150, 'Settings', { fontFamily: 'monospace', fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);

        // Master Volume
        this.add.text(250, 250, 'Volume:', { fontFamily: 'monospace', fontSize: '20px', color: '#ffffff' }).setOrigin(0.5, 0.5);
        this.add.rectangle(450, 250, 200, 4, 0x4b5563); // Slider track
        const volumeKnob = this.add.rectangle(350 + (this.sound.volume * 200), 250, 10, 30, 0xffffff).setInteractive();

        this.input.setDraggable(volumeKnob);
        volumeKnob.on('drag', (pointer: Phaser.Input.Pointer, dragX: number) => {
            const newX = Phaser.Math.Clamp(dragX, 350, 550);
            volumeKnob.x = newX;
            const newVolume = (newX - 350) / 200;
            // if (this.sound.context.state === 'running') this.sound.play('menu_select', { volume: 0.5 });
            this.sound.setVolume(newVolume);
        });

        // Fullscreen
        const fullscreenButton = this.add.text(400, 320, 'Toggle Fullscreen', { fontFamily: 'monospace', fontSize: '20px', color: '#000000', backgroundColor: '#ffffff', padding: { x: 16, y: 8 }})
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });
        fullscreenButton.on('pointerdown', () => {
            // this.sound.play('menu_confirm');
            if (this.scale.isFullscreen) {
                this.scale.stopFullscreen();
            } else {
                this.scale.startFullscreen();
            }
        });

        // Close button
        const closeButton = this.add.text(400, 450, 'Back', { fontFamily: 'monospace', fontSize: '20px', color: '#000000', backgroundColor: '#ffffff', padding: { x: 16, y: 8 }})
            .setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        const doClose = () => { /* this.sound.play('menu_select', { volume: 0.7 }); */ this.closeScene(); };
        closeButton.on('pointerdown', doClose);
        this.input.keyboard?.once('keydown-ESC', doClose);
    }

    private closeScene() {
        this.scene.stop();
        this.scene.resume(this.fromScene);
    }
}