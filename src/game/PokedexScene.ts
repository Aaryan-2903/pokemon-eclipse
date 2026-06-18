import { Scene, Input } from 'phaser';
import { PlayerState } from './PlayerData';
import { AllPokemon, PokedexEntry } from './PokedexData';

export class PokedexScene extends Scene {
    private fromScene!: string;
    private entries: PokedexEntry[] = AllPokemon;
    private listItems: Phaser.GameObjects.Container[] = [];
    private scrollContainer!: Phaser.GameObjects.Container;
    private scrollY: number = 0;

    constructor() {
        super('PokedexScene');
    }

    init(data: { fromScene: string }) {
        this.fromScene = data.fromScene;
        // Update caught list from team and box before showing
        PlayerState.pokemonTeam.forEach(p => p && PlayerState.pokedex.caught.add(p.name));
        PlayerState.pokemonBox.forEach(p => p && PlayerState.pokedex.caught.add(p.name));
    }

    preload() {
        this.entries.forEach(pokemon => {
            const isCaught = PlayerState.pokedex.caught.has(pokemon.name);
            const isSeen = PlayerState.pokedex.seen.has(pokemon.name);
            if (isCaught || isSeen) {
                const spriteKey = `pokemon_sprite_front_${pokemon.id}`;
                if (!this.textures.exists(spriteKey)) {
                    this.load.image(spriteKey, `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`);
                }
            }
        });
    }

    create() {
        this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);
        this.add.rectangle(400, 300, 780, 550, 0x111827).setStrokeStyle(4, 0x4b5563);
        this.add.text(400, 50, 'Pokédex', { fontFamily: 'monospace', fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);

        const closeButton = this.add.text(760, 50, 'X', { fontFamily: 'monospace', fontSize: '24px', color: '#ef4444', backgroundColor: '#374151', padding: { x: 8, y: 4 }})
            .setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        closeButton.on('pointerdown', () => this.closeScene());
        this.input.keyboard?.on('keydown-ESC', () => this.closeScene());

        const listHeight = 440;
        this.scrollContainer = this.add.container(400, 80 + listHeight / 2);
        const maskShape = this.make.graphics();
        maskShape.fillStyle(0xffffff);
        maskShape.beginPath();
        maskShape.fillRect(20, 80, 760, listHeight);
        const mask = maskShape.createGeometryMask();
        this.scrollContainer.setMask(mask);

        this.renderList();

        this.input.on('wheel', (pointer: Input.Pointer, gameObjects: Phaser.GameObjects.GameObject[], deltaX: number, deltaY: number) => {
            this.scrollY += deltaY * 0.5;
            const maxScroll = Math.max(0, this.entries.length * 60 - listHeight);
            this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, maxScroll);
            this.scrollContainer.y = (80 + listHeight / 2) - this.scrollY;
        });
    }

    private renderList() {
        this.listItems.forEach(item => item.destroy());
        this.listItems = [];

        this.entries.forEach((pokemon, index) => {
            const yPos = -200 + index * 60;
            const listItem = this.createListItem(pokemon, yPos);
            this.scrollContainer.add(listItem);
            this.listItems.push(listItem);
        });
    }

    private createListItem(pokemon: PokedexEntry, y: number): Phaser.GameObjects.Container {
        const container = this.add.container(0, y);
        const bg = this.add.rectangle(0, 0, 740, 50, 0x1f2937).setStrokeStyle(1, 0x4b5563);
        
        const isCaught = PlayerState.pokedex.caught.has(pokemon.name);
        const isSeen = PlayerState.pokedex.seen.has(pokemon.name);

        let idText, nameText, typeText, levelText, statusText;

        idText = this.add.text(-350, 0, `${pokemon.id.toString().padStart(3, '0')}`, { fontFamily: 'monospace', fontSize: '16px' }).setOrigin(0, 0.5);

        if (isCaught) {
            const sprite = this.add.image(-280, 0, `pokemon_sprite_front_${pokemon.id}`).setScale(0.75);
            nameText = this.add.text(-230, 0, pokemon.name, { fontFamily: 'monospace', fontSize: '16px' }).setOrigin(0, 0.5);
            typeText = this.add.text(-50, 0, pokemon.types.join('/'), { fontFamily: 'monospace', fontSize: '16px' }).setOrigin(0, 0.5);
            levelText = this.add.text(100, 0, pokemon.levelRange ? `${pokemon.levelRange[0]}-${pokemon.levelRange[1]}` : 'N/A', { fontFamily: 'monospace', fontSize: '16px' }).setOrigin(0, 0.5);
            statusText = this.add.text(250, 0, 'Caught', { fontFamily: 'monospace', fontSize: '16px', color: '#22c55e' }).setOrigin(0, 0.5);
            container.add([bg, idText, sprite, nameText, typeText, levelText, statusText]);
        } else if (isSeen) {
            const spriteKey = `pokemon_sprite_front_${pokemon.id}`;
            if (this.textures.exists(spriteKey)) {
                const sprite = this.add.image(-280, 0, spriteKey).setScale(0.75).setTint(0x000000);
                container.add(sprite);
            }
            nameText = this.add.text(-230, 0, '?????', { fontFamily: 'monospace', fontSize: '16px' }).setOrigin(0, 0.5);
            typeText = this.add.text(-50, 0, '??/??', { fontFamily: 'monospace', fontSize: '16px' }).setOrigin(0, 0.5);
            levelText = this.add.text(100, 0, '??-??', { fontFamily: 'monospace', fontSize: '16px' }).setOrigin(0, 0.5);
            statusText = this.add.text(250, 0, 'Seen', { fontFamily: 'monospace', fontSize: '16px', color: '#facc15' }).setOrigin(0, 0.5);
            container.add([bg, idText, nameText, typeText, levelText, statusText]);
        } else {
            nameText = this.add.text(-230, 0, '----------', { fontFamily: 'monospace', fontSize: '16px', color: '#6b7280' }).setOrigin(0, 0.5);
            container.add([bg, idText, nameText]);
        }
        
        return container;
    }

    private closeScene() {
        this.scene.stop();
        this.scene.resume(this.fromScene);
    }
}