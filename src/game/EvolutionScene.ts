import { Scene } from 'phaser';
import { PokemonInstance, evolvePokemon, POKEMON_SPECIES_ID_MAP } from './PokemonData';
import { GameFeel } from './GameFeel';

export class EvolutionScene extends Scene {
    private pokemon!: PokemonInstance;
    private toSpecies!: string;
    private fromScene!: string;

    constructor() {
        super('EvolutionScene');
    }

    init(data: { pokemon: PokemonInstance, to: string, fromScene: string }) {
        this.pokemon = data.pokemon;
        this.toSpecies = data.to;
        this.fromScene = data.fromScene;
    }

    preload() {
        const toId = POKEMON_SPECIES_ID_MAP[this.toSpecies];
        if (toId) {
            const spriteKey = `pokemon_sprite_front_${toId}`;
            if (!this.textures.exists(spriteKey)) {
                this.load.image(spriteKey, `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${toId}.png`);
            }
        }
    }

    create() {
        this.cameras.main.setBackgroundColor('#000000');
        GameFeel.playSfx('evolve');
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        const messageText = this.add.text(centerX, 100, `What? ${this.pokemon.name} is evolving!`, {
            fontFamily: 'monospace', fontSize: '24px', color: '#ffffff', align: 'center'
        }).setOrigin(0.5);

        const sprite = this.add.image(centerX, centerY, `pokemon_sprite_front_${this.pokemon.id}`).setScale(4);
        const oldName = this.pokemon.name;
        const halo = this.add.circle(centerX, centerY, 72, 0xffffff, 0.08).setStrokeStyle(4, 0x93c5fd, 0.9);

        this.tweens.add({
            targets: halo,
            scale: 2.1,
            alpha: 0.18,
            angle: 360,
            duration: 900,
            repeat: -1,
            yoyo: true,
            ease: 'Sine.easeInOut'
        });

        this.tweens.add({
            targets: sprite,
            alpha: 0.15,
            scale: 4.8,
            angle: 8,
            duration: 160,
            ease: 'Power1',
            yoyo: true,
            repeat: 9,
            onComplete: () => {
                evolvePokemon(this.pokemon, this.toSpecies);

                const newSpriteKey = `pokemon_sprite_front_${this.pokemon.id}`;
                sprite.setTexture(newSpriteKey).setAlpha(1).setScale(4.2).setAngle(0);
                GameFeel.effectBurst(this, centerX, centerY, 0xfacc15);
                this.cameras.main.flash(450, 255, 255, 255);

                messageText.setText(`Congratulations! Your ${oldName} evolved into ${this.pokemon.name}!`);

                this.tweens.add({
                    targets: sprite,
                    scale: 4,
                    duration: 350,
                    ease: 'Back.easeOut'
                });

                this.time.delayedCall(2500, () => {
                    this.events.emit('evolution-complete');
                    this.scene.stop();
                    this.scene.resume(this.fromScene);
                });
            }
        });
    }
}
