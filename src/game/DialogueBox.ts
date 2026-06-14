import { Scene } from 'phaser';

export class DialogueBox extends Phaser.GameObjects.Container {
    private box: Phaser.GameObjects.Rectangle;
    private nameText: Phaser.GameObjects.Text;
    private messageText: Phaser.GameObjects.Text;
    private hintText: Phaser.GameObjects.Text;

    constructor(scene: Scene) {
        super(scene, 0, 0);

        this.box = scene.add.rectangle(0, 0, 600, 120, 0x000000, 0.8).setStrokeStyle(4, 0xffffff);
        this.nameText = scene.add.text(-280, -50, '', {
            fontFamily: 'monospace', fontSize: '18px', color: '#fcd34d', fontStyle: 'bold'
        });
        this.messageText = scene.add.text(-280, -20, '', {
            fontFamily: 'monospace', fontSize: '16px', color: '#ffffff', wordWrap: { width: 560 }
        });
        this.hintText = scene.add.text(140, 40, 'Press E to continue | ESC to exit', {
            fontFamily: 'monospace', fontSize: '12px', color: '#9ca3af'
        });

        this.add([this.box, this.nameText, this.messageText, this.hintText]);
        this.setScrollFactor(0); // Fix to screen coordinates
        this.setDepth(200);
        this.setVisible(false);

        // Position at the bottom of the viewport
        this.setPosition(400, 500);
        scene.add.existing(this);
    }

    public show(speaker: string, text: string) {
        this.nameText.setText(speaker);
        this.messageText.setText(text);
        this.setVisible(true);
    }

    public hide() {
        this.setVisible(false);
    }
}