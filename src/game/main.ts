import { BootScene } from './BootScene';
import { PreloadScene } from './PreloadScene';
import { OverworldScene } from './OverworldScene';
import { InteriorScene } from './InteriorScene';
import { Types, Game } from 'phaser';

const config: Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#2d2d2d',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 }, // Top-down RPG, no gravity
            debug: false
        }
    },
    input: {
        gamepad: true // Enable Gamepad API for controller support
    },
    scene: [
        BootScene,
        PreloadScene,
        OverworldScene,
        InteriorScene
    ],
    pixelArt: true // Ensures pixel art scales without blurring
};

const StartGame = (parent: string) => {
    try {
        console.log('Initializing Phaser Game...');
        return new Game({ ...config, parent });
    } catch (error) {
        console.error('Failed to initialize Phaser Game:', error);
        return null;
    }
}

export default StartGame;