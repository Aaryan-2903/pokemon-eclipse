import { Scene } from 'phaser';

export class BootScene extends Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        console.log('BootScene: preload');
    }

    create() {
        console.log('BootScene: create - starting PreloadScene');
        this.scene.start('PreloadScene');
    }
}