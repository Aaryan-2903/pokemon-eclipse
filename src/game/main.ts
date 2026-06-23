import { BootScene } from './BootScene';
import { PreloadScene } from './PreloadScene';
import { OverworldScene } from './OverworldScene';
import { InteriorScene } from './InteriorScene';
import { Route1Scene } from './Route1Scene';
import { Route2Scene } from './Route2Scene';
import { Route3Scene } from './Route3Scene';
import { VeridiaCityScene } from './VeridiaCityScene';
import { EclipseForestScene } from './EclipseForestScene';
import { LunarCityScene } from './LunarCityScene';
import { BattleScene } from './BattleScene';
import { MenuScene } from './MenuScene';
import { PokedexScene } from './PokedexScene';
import { ShopScene } from './ShopScene';
import { BagScene } from './BagScene';
import { SettingsScene } from './SettingsScene';
import { TeamScene } from './TeamScene';
import { EvolutionScene } from './EvolutionScene';
import { BadgeScene } from './BadgeScene';
import { Types, Game } from 'phaser';

const config: Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    dom: {
        createContainer: true
    },
    backgroundColor: '#2d2d2d',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
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
        InteriorScene,
        Route1Scene,
        Route2Scene,
        VeridiaCityScene,
        EclipseForestScene,
        LunarCityScene,
        BattleScene,
        MenuScene,
        PokedexScene,
        ShopScene,
        BagScene,
        SettingsScene,
        TeamScene,
        EvolutionScene,
        BadgeScene,
        Route3Scene
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