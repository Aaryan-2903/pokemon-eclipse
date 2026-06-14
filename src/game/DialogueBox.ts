import { Scene } from 'phaser';

export class DialogueBox extends Phaser.GameObjects.Container {
    private box: Phaser.GameObjects.Rectangle;
    private portraitBox: Phaser.GameObjects.Rectangle;
    private portraitImage: Phaser.GameObjects.Image;
    private nameText: Phaser.GameObjects.Text;
    private messageText: Phaser.GameObjects.Text;
    private hintText: Phaser.GameObjects.Text;
    private FINAL_Y: number;
    private START_Y: number;

    constructor(scene: Scene) {
        super(scene, 0, 0);

        // Counteract camera zoom to ensure 1:1 UI scaling (prevents overlapping and blowing up)
        const zoom = scene.cameras.main.zoom || 1;
        this.setScale(1 / zoom);

        // Calculate exact Y coordinates compensating for Phaser's zoom origin shift
        const centerY = 300; // Physical center of the 600px canvas
        const targetScreenY = 520; // 600 - 60 (half box height) - 20 (padding)
        const offScreenY = 680;

        this.FINAL_Y = centerY + ((targetScreenY - centerY) / zoom);
        this.START_Y = centerY + ((offScreenY - centerY) / zoom);

        // Dialogue background (~20% of 600px height)
        this.box = scene.add.rectangle(0, 0, 760, 120, 0x000000, 0.85).setStrokeStyle(4, 0xffffff);
        
        // Portrait background
        this.portraitBox = scene.add.rectangle(-310, 0, 96, 96, 0x000000, 0.8).setStrokeStyle(2, 0xffffff);
        this.portraitImage = scene.add.image(-310, 0, 'portrait_nova'); // placeholder, updated in show()

        this.nameText = scene.add.text(-240, -45, '', {
            fontFamily: 'monospace', fontSize: '18px', color: '#fcd34d', fontStyle: 'bold'
        });
        this.messageText = scene.add.text(-240, -15, '', {
            fontFamily: 'monospace', fontSize: '16px', color: '#ffffff', wordWrap: { width: 580 }, lineSpacing: 6
        });
        this.hintText = scene.add.text(360, 40, 'Press SPACE or ENTER to continue', {
            fontFamily: 'monospace', fontSize: '12px', color: '#9ca3af'
        }).setOrigin(1, 0); // Anchor to the bottom-right corner of the dialogue box

        this.add([this.box, this.portraitBox, this.portraitImage, this.nameText, this.messageText, this.hintText]);
        this.setScrollFactor(0); // Fix to screen coordinates
        this.setDepth(200);
        this.setVisible(false);

        // Initial setup for animation
        this.setPosition(400, this.START_Y);
        this.setAlpha(0);
        scene.add.existing(this);
    }

    public show(speaker: string, text: string, portrait?: string) {
        this.scene.tweens.killTweensOf(this); // Safely cancel previous animation
        
        this.nameText.setText(speaker);
        this.messageText.setText(text);
        
        if (portrait) {
            this.portraitImage.setTexture(portrait);
            this.portraitImage.setVisible(true);
            this.portraitBox.setVisible(true);
            
            // Slide text to accommodate portrait
            this.nameText.setX(-240);
            this.messageText.setX(-240);
            this.messageText.setStyle({ wordWrap: { width: 580 } });
        } else {
            this.portraitImage.setVisible(false);
            this.portraitBox.setVisible(false);
            
            // Take up full width when no portrait is provided
            this.nameText.setX(-350);
            this.messageText.setX(-350);
            this.messageText.setStyle({ wordWrap: { width: 690 } });
        }
        
        // If the box is not currently active, play the enter animation
        if (!this.visible) {
            this.setAlpha(0);
            this.setY(this.START_Y);
            this.setVisible(true);
            
            this.scene.tweens.add({
                targets: this,
                alpha: 1,
                y: this.FINAL_Y,
                duration: 250,
                ease: 'Power2'
            });
        } else {
            // Ensure it snaps to active dimensions if updating while fully open
            this.setAlpha(1);
            this.setY(this.FINAL_Y);
        }
    }

    public hide() {
        this.scene.tweens.killTweensOf(this);
        
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            y: this.START_Y,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                this.setVisible(false);
            }
        });
    }
}