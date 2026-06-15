import { Scene } from 'phaser';
import { EventBus } from './EventBus';

export class EncounterScene extends Scene {
    private pokemonName!: string;
    private pokemonLevel!: number;

    constructor() {
        super('EncounterScene');
    }

    init(data: { pokemonName: string; pokemonLevel: number }) {
        this.pokemonName = data.pokemonName;
        this.pokemonLevel = data.pokemonLevel;
    }

    create() {
        this.cameras.main.setBackgroundColor('#000000');

        // Transition effect
        this.cameras.main.fadeIn(500, 0, 0, 0);

        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        // Placeholder for the wild Pokémon sprite
        this.add.image(centerX, centerY - 50, 'pokemon_placeholder').setScale(2);

        // Display Pokémon info
        this.add.text(centerX, centerY + 50, `A wild ${this.pokemonName} (Lvl ${this.pokemonLevel}) appeared!`, {
            fontFamily: 'monospace',
            fontSize: '24px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Back button to return to the previous scene
        const backButton = this.add.text(centerX, centerY + 150, 'Run Away', {
            fontFamily: 'monospace',
            fontSize: '20px',
            color: '#000000',
            backgroundColor: '#ffffff',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        backButton.on('pointerdown', () => {
            this.cameras.main.fadeOut(250, 0, 0, 0, (_camera: Phaser.Cameras.Scene2D.Camera, progress: number) => {
                if (progress === 1) {
                    this.scene.stop('EncounterScene');
                    this.scene.resume('Route1Scene');
                }
            });
        });

        EventBus.emit('current-scene-ready', this);
    }
}