import { Scene, Input } from 'phaser';
import { PlayerState } from './PlayerData';
import { PokemonInstance } from './PokemonData';

export class TeamScene extends Scene {
    private fromScene!: string;
    private inBattle!: boolean;
    private pokemonCards: Phaser.GameObjects.Container[] = [];

    constructor() {
        super('TeamScene');
    }

    init(data: { fromScene: string, inBattle: boolean }) {
        this.fromScene = data.fromScene;
        this.inBattle = data.inBattle;
    }

    preload() {
        PlayerState.pokemonTeam.forEach(pokemon => {
            if (pokemon) {
                const spriteKey = `pokemon_sprite_front_${pokemon.id}`;
                if (!this.textures.exists(spriteKey)) {
                    const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
                    this.load.image(spriteKey, spriteUrl);
                }
            }
        });
    }

    create() {
        // Dim background
        this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);

        // Main panel
        this.add.rectangle(400, 300, 700, 500, 0x111827).setStrokeStyle(4, 0x4b5563);
        this.add.text(400, 75, 'Your Pokémon Team', { fontFamily: 'monospace', fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);

        // Close button
        const closeButton = this.add.text(720, 75, 'X', { fontFamily: 'monospace', fontSize: '24px', color: '#ef4444', backgroundColor: '#374151', padding: { x: 8, y: 4 }})
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });
        
        closeButton.on('pointerdown', () => this.closeScene());
        if (this.input.keyboard) {
            this.input.keyboard.once('keydown-ESC', () => this.closeScene());
        }

        this.renderTeam();
    }

    private renderTeam() {
        // Clear existing cards
        this.pokemonCards.forEach(card => card.destroy());
        this.pokemonCards = [];

        PlayerState.pokemonTeam.forEach((pokemon, index) => {
            if (pokemon) {
                const card = this.createPokemonCard(pokemon, index);
                this.pokemonCards.push(card);
            }
        });
    }

    private createPokemonCard(pokemon: PokemonInstance, index: number): Phaser.GameObjects.Container {
        const yPos = 140 + (index * 75);
        const card = this.add.container(400, yPos);

        const isFainted = pokemon.currentHp === 0;
        const isActive = index === 0;

        // Card background
        const bgColor = isActive ? 0x374151 : 0x1f2937;
        const cardBg = this.add.rectangle(0, 0, 650, 65, bgColor).setStrokeStyle(2, 0x4b5563);
        if (!isFainted && !isActive) {
            cardBg.setInteractive({ useHandCursor: true });
            cardBg.on('pointerdown', () => this.selectPokemon(index));
        }
        
        // Sprite
        const sprite = this.add.image(-280, 0, `pokemon_sprite_front_${pokemon.id}`).setScale(1.5);

        // Info
        const nameText = this.add.text(-210, -18, `${pokemon.name} ${isActive ? '(Active)' : ''}`, { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' }).setOrigin(0, 0.5);
        const levelText = this.add.text(-210, 12, `Lv ${pokemon.level}`, { fontFamily: 'monospace', fontSize: '14px', color: '#9ca3af' }).setOrigin(0, 0.5);

        // HP Bar
        const hpPercent = pokemon.maxHp > 0 ? pokemon.currentHp / pokemon.maxHp : 0;
        const hpColor = hpPercent > 0.5 ? 0x22c55e : hpPercent > 0.2 ? 0xfbbf24 : 0xef4444;
        const hpTrack = this.add.rectangle(150, 0, 200, 12, 0x4b5563); // HP Track
        const hpFill = this.add.rectangle(50, 0, 200 * hpPercent, 12, hpColor).setOrigin(0, 0.5); // HP Fill
        const hpText = this.add.text(150, 20, `${pokemon.currentHp} / ${pokemon.maxHp}`, { fontFamily: 'monospace', fontSize: '14px', color: '#ffffff' }).setOrigin(0.5);

        card.add([cardBg, sprite, nameText, levelText, hpTrack, hpFill, hpText]);

        if (isFainted) {
            card.setAlpha(0.5);
            const faintedText = this.add.text(0, 0, 'FAINTED', { fontFamily: 'monospace', fontSize: '20px', color: '#ef4444', fontStyle: 'bold' }).setOrigin(0.5).setAngle(-15);
            card.add(faintedText);
        }

        return card;
    }

    private selectPokemon(index: number) {
        if (index === 0 || PlayerState.pokemonTeam[index].currentHp === 0) {
            return; // Can't swap with self or fainted pokemon
        }

        // In battle, you can only switch to a non-fainted pokemon.
        // If you switch, it consumes your turn.
        if (this.inBattle && PlayerState.pokemonTeam.length > 1) {
            const selectedPokemon = PlayerState.pokemonTeam[index];
            PlayerState.pokemonTeam[index] = PlayerState.pokemonTeam[0];
            PlayerState.pokemonTeam[0] = selectedPokemon;
            this.closeScene();
        } else if (!this.inBattle) {
            // Outside of battle, you can reorder freely.
            const selectedPokemon = PlayerState.pokemonTeam.splice(index, 1)[0];
            PlayerState.pokemonTeam.unshift(selectedPokemon);
            this.renderTeam(); // Re-render to show the new active pokemon
        }
    }

    private closeScene() {
        if (this.input.keyboard) {
            this.input.keyboard.off('keydown-ESC');
        }
        this.scene.stop();
        this.scene.resume(this.fromScene);
    }
}