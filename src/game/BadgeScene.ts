import { Scene, Input } from 'phaser';
import { PlayerState } from './PlayerData';

interface BadgeInfo {
    name: string;
    texture: string;
    description: string;
}

const BADGE_DATA: BadgeInfo[] = [
    { name: 'Sky Badge', texture: 'badge_sky', description: 'Awarded for defeating Gym Leader Aurora.' },
    // Add other 7 badges here in the future
];

export class BadgeScene extends Scene {
    private fromScene!: string;

    constructor() {
        super('BadgeScene');
    }

    init(data: { fromScene: string }) {
        this.fromScene = data.fromScene;
    }

    create() {
        // Dim background
        this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);

        // Main panel
        this.add.rectangle(400, 300, 600, 400, 0x111827).setStrokeStyle(4, 0x4b5563);
        this.add.text(400, 125, 'Collected Badges', { fontFamily: 'monospace', fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);

        // Close button
        const closeButton = this.add.text(670, 125, 'X', { fontFamily: 'monospace', fontSize: '24px', color: '#ef4444', backgroundColor: '#374151', padding: { x: 8, y: 4 }})
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });
        
        closeButton.on('pointerdown', () => this.closeScene());
        if (this.input.keyboard) {
            this.input.keyboard.once('keydown-ESC', () => this.closeScene());
            this.input.keyboard.once('keydown-B', () => this.closeScene());
        }

        // Display badges
        const startX = 250;
        const startY = 200;
        const spacingX = 100;
        const spacingY = 100;
        const badgesPerRow = 4;

        BADGE_DATA.forEach((badge, index) => {
            const x = startX + (index % badgesPerRow) * spacingX;
            const y = startY + Math.floor(index / badgesPerRow) * spacingY;

            const hasBadge = PlayerState.badges.has(badge.name);
            
            const badgeImage = this.add.image(x, y, badge.texture).setScale(2);
            
            if (hasBadge) {
                badgeImage.setTint(0xffffff); // Full color
            } else {
                badgeImage.setTint(0x333333); // Grayscale/darkened
            }
        });
    }

    private closeScene() {
        if (this.input.keyboard) {
            this.input.keyboard.off('keydown-ESC');
            this.input.keyboard.off('keydown-B');
        }
        this.scene.stop();
        this.scene.resume(this.fromScene);
    }
}