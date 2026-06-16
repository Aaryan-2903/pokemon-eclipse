import { Scene, Input } from 'phaser';

export class BagScene extends Scene {
    private fromScene!: string;

    constructor() {
        super('BagScene');
    }

    init(data: { fromScene: string }) {
        this.fromScene = data.fromScene;
    }

    create() {
        this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);
        this.add.rectangle(400, 300, 600, 400, 0x111827).setStrokeStyle(4, 0x4b5563);
        this.add.text(400, 300, 'Bag - Coming Soon!', { fontFamily: 'monospace', fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);

        const closeButton = this.add.text(400, 450, 'Close', { fontFamily: 'monospace', fontSize: '20px', color: '#000000', backgroundColor: '#ffffff', padding: { x: 16, y: 8 }})
            .setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        closeButton.on('pointerdown', () => this.closeScene());
        this.input.keyboard?.once('keydown-ESC', () => this.closeScene());
    }

    private closeScene() {
        this.scene.stop();
        this.scene.resume(this.fromScene);
    }
}