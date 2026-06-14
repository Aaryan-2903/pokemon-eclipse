import { Scene } from 'phaser';

export class PreloadScene extends Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        console.log('PreloadScene: preload - generating textures');

        const graphics = this.add.graphics();
        
        // Generate a better placeholder for the trainer
        graphics.fillStyle(0x3b82f6, 1); // Blue jacket
        graphics.fillRoundedRect(0, 16, 32, 32, 8); // Body
        graphics.fillStyle(0xfcd34d, 1); // Skin tone
        graphics.fillCircle(16, 12, 12); // Head
        
        graphics.generateTexture('trainer_placeholder', 32, 48);
        graphics.destroy();
    }

    create() {
        console.log('PreloadScene: create - starting OverworldScene');
        this.scene.start('OverworldScene');
    }
}