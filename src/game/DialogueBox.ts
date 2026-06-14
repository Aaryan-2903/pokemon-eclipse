import { Scene } from 'phaser';

export class DialogueBox extends Phaser.GameObjects.Container {
    private box: Phaser.GameObjects.Rectangle;
    private portraitBox: Phaser.GameObjects.Rectangle;
    private portraitImage: Phaser.GameObjects.Image;
    private nameText: Phaser.GameObjects.Text;
    private messageText: Phaser.GameObjects.Text;
    private hintText: Phaser.GameObjects.Text;

    constructor(scene: Scene) {
        super(scene, 0, 0);

        // Dialogue background
        this.box = scene.add.rectangle(0, 0, 600, 120, 0x000000, 0.8).setStrokeStyle(4, 0xffffff);
        
        // Portrait background
        this.portraitBox = scene.add.rectangle(-240, 0, 96, 96, 0x000000, 0.8).setStrokeStyle(2, 0xffffff);
        this.portraitImage = scene.add.image(-240, 0, 'portrait_nova'); // placeholder, updated in show()

        this.nameText = scene.add.text(-170, -45, '', {
            fontFamily: 'monospace', fontSize: '18px', color: '#fcd34d', fontStyle: 'bold'
        });
        this.messageText = scene.add.text(-170, -15, '', {
            fontFamily: 'monospace', fontSize: '16px', color: '#ffffff', wordWrap: { width: 450 }, lineSpacing: 4
        });
        this.hintText = scene.add.text(60, 40, 'Press SPACE or ENTER to continue', {
            fontFamily: 'monospace', fontSize: '12px', color: '#9ca3af'
        });

        this.add([this.box, this.portraitBox, this.portraitImage, this.nameText, this.messageText, this.hintText]);
        this.setScrollFactor(0); // Fix to screen coordinates
        this.setDepth(200);
        this.setVisible(false);

        // Position at the bottom of the viewport
        this.setPosition(400, 500);
        scene.add.existing(this);
    }

    public show(speaker: string, text: string, portrait?: string) {
        this.nameText.setText(speaker);
        this.messageText.setText(text);
        
        if (portrait) {
            this.portraitImage.setTexture(portrait);
            this.portraitImage.setVisible(true);
            this.portraitBox.setVisible(true);
        } else {
            this.portraitImage.setVisible(false);
            this.portraitBox.setVisible(false);
        }
        
        this.setVisible(true);
    }

    public hide() {
        this.setVisible(false);
    }
}