import { Scene } from 'phaser';

export class PreloadScene extends Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        console.log('PreloadScene: preload - generating textures');

        const graphics = this.add.graphics();
        graphics.fillStyle(0xff0000, 1);
        graphics.fillRect(0, 0, 32, 32);
        graphics.generateTexture('player_placeholder', 32, 32);
        graphics.destroy();
    }

    create() {
        console.log('PreloadScene: create - starting OverworldScene');
        this.scene.start('OverworldScene');
    }
}