import { Scene } from 'phaser';
import { PokemonInstance, evolvePokemon, POKEMON_SPECIES_ID_MAP } from './PokemonData';

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
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        const messageText = this.add.text(centerX, 100, `What? ${this.pokemon.name} is evolving!`, {
            fontFamily: 'monospace', fontSize: '24px', color: '#ffffff', align: 'center'
        }).setOrigin(0.5);

        const sprite = this.add.image(centerX, centerY, `pokemon_sprite_front_${this.pokemon.id}`).setScale(4);
        const oldName = this.pokemon.name;

        this.tweens.add({
            targets: sprite,
            alpha: 0,
            duration: 200,
            ease: 'Power1',
            yoyo: true,
            repeat: 5,
            onComplete: () => {
                evolvePokemon(this.pokemon, this.toSpecies);

                const newSpriteKey = `pokemon_sprite_front_${this.pokemon.id}`;
                sprite.setTexture(newSpriteKey).setAlpha(1);

                messageText.setText(`Congratulations! Your ${oldName} evolved into ${this.pokemon.name}!`);

                this.time.delayedCall(2500, () => {
                    this.events.emit('evolution-complete');
                    this.scene.stop();
                    this.scene.resume(this.fromScene);
                });
            }
        });
    }
}