import { Scene, Input } from 'phaser';
import { PlayerState } from './PlayerData';
import { PokemonInstance, getXpForNextLevel } from './PokemonData';
import { Moves } from './Moves';

export class TeamScene extends Scene {
    private fromScene!: string;
    private inBattle!: boolean;
    private pokemonCards: Phaser.GameObjects.Container[] = [];
    private summaryContainer!: Phaser.GameObjects.Container;
    private selectedPokemonIndex: number = 0;
    private forceSwitch!: boolean; // Declare forceSwitch property
    private messageText!: Phaser.GameObjects.Text; // Added for messages

    constructor() {
        super('TeamScene');
    }

    init(data: { fromScene: string, inBattle: boolean, forceSwitch?: boolean }) {
        this.fromScene = data.fromScene;
        this.inBattle = data.inBattle; // Assign inBattle from data
        this.forceSwitch = data.forceSwitch || false; // Initialize new member
        this.selectedPokemonIndex = 0;
    }

    preload() {
        // Preload all team sprites
        PlayerState.pokemonTeam.forEach(pokemon => {
            if (pokemon) {
                const frontSpriteKey = `pokemon_sprite_front_${pokemon.id}`;
                if (!this.textures.exists(frontSpriteKey)) {
                    this.load.image(frontSpriteKey, `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`);
                }
                // Also load the larger artwork for the summary view
                const artSpriteKey = `pokemon_art_${pokemon.id}`;
                if (!this.textures.exists(artSpriteKey)) {
                    this.load.image(artSpriteKey, `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`);
                }
            }
        });
    }

    create() {
        console.log('TeamScene loaded. Player party:', JSON.stringify(PlayerState.pokemonTeam));
        console.log(`Found ${PlayerState.pokemonTeam.length} Pokemon in the party.`);

        // Dim background
        this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);

        // Main panel
        this.add.rectangle(400, 300, 780, 550, 0x111827).setStrokeStyle(4, 0x4b5563);
        this.add.text(400, 50, 'Your Pokémon Team', { fontFamily: 'monospace', fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
        this.messageText = this.add.text(400, 520, '', { fontFamily: 'monospace', fontSize: '16px', color: '#fcd34d' }).setOrigin(0.5); // Added message text

        // Close button
        const closeButton = this.add.text(760, 50, 'X', { fontFamily: 'monospace', fontSize: '24px', color: '#ef4444', backgroundColor: '#374151', padding: { x: 8, y: 4 }})
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });
        
        const doClose = () => {
            // When a switch is forced, prevent closing if the player hasn't chosen a healthy replacement.
            if (this.forceSwitch && PlayerState.pokemonTeam[0]?.currentHp === 0) {
                this.showMessage('You must choose a healthy Pokémon!');
                return;
            }
            /* this.sound.play('menu_select', { volume: 0.7 }); */
            this.closeScene();
        };
        closeButton.on('pointerdown', doClose);
        if (this.input.keyboard) {
            this.input.keyboard.once('keydown-ESC', doClose);
        }

        // Separator line
        this.add.line(0, 0, 350, 80, 350, 570, 0x4b5563).setOrigin(0);

        this.renderTeamList();
        this.renderSummary(this.selectedPokemonIndex);
    }

    private renderTeamList() {
        this.pokemonCards.forEach(card => card.destroy());
        this.pokemonCards = [];

        console.log(`[TeamScene] Rendering cards for ${PlayerState.pokemonTeam.length} Pokémon.`);

        for (let i = 0; i < 6; i++) {
            const pokemon = PlayerState.pokemonTeam[i];
            const card = this.createPokemonCard(pokemon, i);
            this.pokemonCards.push(card);
        }
    }

    private createPokemonCard(pokemon: PokemonInstance | undefined, index: number): Phaser.GameObjects.Container {
        const yPos = 90 + (index * 80);
        const card = this.add.container(180, yPos);

        if (!pokemon) {
            const cardBg = this.add.rectangle(0, 0, 320, 70, 0x1f2937).setStrokeStyle(2, 0x4b5563);
            const emptyText = this.add.text(0, 0, '- Empty -', { fontFamily: 'monospace', fontSize: '16px', color: '#6b7280' }).setOrigin(0.5);
            card.add([cardBg, emptyText]);
            return card;
        }

        const isFainted = pokemon.currentHp === 0;
        const isSelected = index === this.selectedPokemonIndex;

        // Card background
        const bgColor = isSelected ? 0x374151 : 0x1f2937;
        const cardBg = this.add.rectangle(0, 0, 320, 70, bgColor).setStrokeStyle(2, 0x4b5563);
        cardBg.setInteractive({ useHandCursor: true });
        cardBg.on('pointerdown', () => {
            // if (this.selectedPokemonIndex !== index) this.sound.play('menu_select', { volume: 0.7 });
            if (this.forceSwitch && isFainted) {
                this.showMessage('You cannot choose a fainted Pokémon!');
            } else this.selectedPokemonIndex = index;
            this.renderTeamList();
            this.renderSummary(index);
        });
        
        // Sprite, Name, Level, HP, Type
        const sprite = this.add.image(-130, 0, `pokemon_sprite_front_${pokemon.id}`).setScale(1.2);
        const nameText = this.add.text(-80, -22, pokemon.name, { fontFamily: 'monospace', fontSize: '16px', color: '#ffffff' }).setOrigin(0, 0.5);
        const levelText = this.add.text(80, -22, `Lv ${pokemon.level}`, { fontFamily: 'monospace', fontSize: '14px', color: '#9ca3af' }).setOrigin(1, 0.5);

        // HP Bar
        const hpPercent = pokemon.maxHp > 0 ? pokemon.currentHp / pokemon.maxHp : 0;
        const hpColor = hpPercent > 0.5 ? 0x22c55e : hpPercent > 0.2 ? 0xfbbf24 : 0xef4444;
        this.add.rectangle(-80, 2, 170, 8, 0x4b5563).setOrigin(0, 0.5); // HP Track
        const hpFill = this.add.rectangle(-80, 2, 170 * hpPercent, 8, hpColor).setOrigin(0, 0.5);

        // XP Bar
        const xpForNextLevel = getXpForNextLevel(pokemon.level);
        const xpPercent = pokemon.xp / xpForNextLevel;
        this.add.rectangle(-80, 13, 170, 6, 0x4b5563).setOrigin(0, 0.5); // XP Track
        const xpFill = this.add.rectangle(-80, 13, 170 * xpPercent, 6, 0x3b82f6).setOrigin(0, 0.5);
        
        // Type display
        const typeText = this.add.text(-80, 26, `Type: ${pokemon.types.join('/')}`, { fontFamily: 'monospace', fontSize: '12px', color: '#9ca3af' }).setOrigin(0, 0.5);

        card.add([cardBg, sprite, nameText, levelText, hpFill, xpFill, typeText]);

        if (isFainted) {
            card.setAlpha(0.6);
            const faintedText = this.add.text(0, 0, 'FAINTED', { fontFamily: 'monospace', fontSize: '18px', color: '#ef4444', fontStyle: 'bold' }).setOrigin(0.5).setAngle(-10);
            card.add(faintedText);
        }

        return card;
    }

    private renderSummary(index: number) {
        if (this.summaryContainer) {
            this.summaryContainer.destroy();
        }
        this.summaryContainer = this.add.container(565, 320);

        const pokemon = PlayerState.pokemonTeam[index];
        if (!pokemon) {
            const emptyText = this.add.text(0, 0, 'Select a Pokémon to see details.', { fontFamily: 'monospace', fontSize: '16px', color: '#9ca3af', align: 'center', wordWrap: { width: 380 } }).setOrigin(0.5);
            this.summaryContainer.add(emptyText);
            return;
        }

        // Big artwork
        const art = this.add.image(0, -90, `pokemon_art_${pokemon.id}`).setScale(0.5);
        
        // Name & Level
        const nameText = this.add.text(0, 40, `${pokemon.name} - Lv ${pokemon.level}`, { fontFamily: 'monospace', fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);
        
        // HP Bar
        const hpPercent = pokemon.maxHp > 0 ? pokemon.currentHp / pokemon.maxHp : 0;
        const hpColor = hpPercent > 0.5 ? 0x22c55e : hpPercent > 0.2 ? 0xfbbf24 : 0xef4444;
        this.add.rectangle(0, 80, 250, 16, 0x4b5563).setOrigin(0.5); // HP Track
        const hpFill = this.add.rectangle(-125, 80, 250 * hpPercent, 16, hpColor).setOrigin(0, 0.5);
        const hpText = this.add.text(0, 80, `${pokemon.currentHp} / ${pokemon.maxHp}`, { fontFamily: 'monospace', fontSize: '14px', color: '#ffffff' }).setOrigin(0.5);

        // XP Bar
        const xpForNextLevel = getXpForNextLevel(pokemon.level);
        const xpPercent = pokemon.xp / xpForNextLevel;
        this.add.rectangle(0, 105, 250, 12, 0x4b5563).setOrigin(0.5); // XP Track
        const xpFill = this.add.rectangle(-125, 105, 250 * xpPercent, 12, 0x3b82f6).setOrigin(0, 0.5);
        const xpText = this.add.text(0, 105, `XP: ${pokemon.xp} / ${xpForNextLevel}`, { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' }).setOrigin(0.5);

        // Stats
        const statsY = 130;
        const statsText = `Type: ${pokemon.types.join('/')}\n\nAttack: ${pokemon.attack}\nDefense: ${pokemon.defense}\nSpeed: ${pokemon.speed}`;
        const stats = this.add.text(-100, statsY, statsText, { fontFamily: 'monospace', fontSize: '16px', color: '#ffffff', lineSpacing: 8 }).setOrigin(0, 0);

        // Moves
        const movesY = 130;
        let movesText = 'Moves:\n\n';
        pokemon.moves.forEach(moveId => {
            const move = Moves[moveId];
            if (move) movesText += `- ${move.name}\n`;
        });
        const moves = this.add.text(50, movesY, movesText, { fontFamily: 'monospace', fontSize: '16px', color: '#ffffff', lineSpacing: 8 }).setOrigin(0, 0);

        this.summaryContainer.add([art, nameText, hpFill, hpText, xpFill, xpText, stats, moves]);

        // Action Buttons
        const isFainted = pokemon.currentHp === 0;
        const isActive = index === 0;

        if (!isActive && !isFainted) {
            const makeActiveBtn = this.add.text(0, 240, 'Make Active', { fontFamily: 'monospace', fontSize: '18px', color: '#000000', backgroundColor: '#a3e635', padding: { x: 16, y: 8 }})
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });
            
            makeActiveBtn.on('pointerdown', () => {
                if (isFainted) {
                    this.showMessage('You cannot choose a fainted Pokémon!');
                } else {
                    // this.sound.play('menu_confirm');
                    this.makePokemonActive(index);
                }
            });
            this.summaryContainer.add(makeActiveBtn);
        } else if (isActive && this.forceSwitch && isFainted) { // If current active is fainted and it's a forced switch
            const makeActiveBtn = this.add.text(0, 240, 'Make Active', { fontFamily: 'monospace', fontSize: '18px', color: '#000000', backgroundColor: '#ef4444', padding: { x: 16, y: 8 }})
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });
            makeActiveBtn.setText('Cannot Use (Fainted)').setBackgroundColor('#ef4444').disableInteractive();
            this.summaryContainer.add(makeActiveBtn);
        }
    }

    private makePokemonActive(index: number) {
        if (index === 0 || PlayerState.pokemonTeam[index].currentHp === 0) {
            return;
        }

        if (this.inBattle) {
            // In battle, swap with the first pokemon and close the scene
            [PlayerState.pokemonTeam[0], PlayerState.pokemonTeam[index]] = 
                [PlayerState.pokemonTeam[index], PlayerState.pokemonTeam[0]];
            this.closeScene();
        } else {
            // Outside battle, move the selected pokemon to the front of the array
            const selectedPokemon = PlayerState.pokemonTeam.splice(index, 1)[0];
            PlayerState.pokemonTeam.unshift(selectedPokemon);
            
            // Re-render everything to reflect the change
            this.selectedPokemonIndex = 0;
            this.renderTeamList();
            this.renderSummary(0);
        }
    }

    private showMessage(text: string) {
        this.messageText.setText(text);
        this.time.delayedCall(1500, () => this.messageText.setText(''));
    }

    private closeScene() {
        if (this.input.keyboard) {
            this.input.keyboard.off('keydown-ESC');
        }
        this.scene.stop();
        this.scene.resume(this.fromScene);
    }
}