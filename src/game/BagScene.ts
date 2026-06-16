import { Scene, Input } from 'phaser';
import { PlayerState } from './PlayerData';
import { Items, useItem } from './Items';
import { PokemonInstance } from './PokemonData';

type BagState = 'LIST_ITEMS' | 'SELECT_POKEMON';

export class BagScene extends Scene {
    private fromScene!: string;
    private state: BagState = 'LIST_ITEMS';

    private itemList: Phaser.GameObjects.Text[] = [];
    private pokemonList: Phaser.GameObjects.Text[] = [];
    private descriptionText!: Phaser.GameObjects.Text;
    private messageText!: Phaser.GameObjects.Text;

    private selectedItemIndex: number = 0;
    private selectedPokemonIndex: number = 0;
    private inventory: string[] = [];

    constructor() {
        super('BagScene');
    }

    init(data: { fromScene: string }) {
        this.fromScene = data.fromScene;
        this.state = 'LIST_ITEMS';
        this.selectedItemIndex = 0;
        this.selectedPokemonIndex = 0;
    }

    create() {
        this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);
        this.add.rectangle(400, 300, 780, 550, 0x111827).setStrokeStyle(4, 0x4b5563);
        this.add.text(400, 50, 'Bag', { fontFamily: 'monospace', fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);

        this.add.line(0, 0, 400, 80, 400, 570, 0x4b5563).setOrigin(0);

        this.descriptionText = this.add.text(420, 100, '', { fontFamily: 'monospace', fontSize: '16px', color: '#ffffff', wordWrap: { width: 340 } }).setOrigin(0);
        this.messageText = this.add.text(400, 520, '', { fontFamily: 'monospace', fontSize: '16px', color: '#fcd34d' }).setOrigin(0.5);

        const closeButton = this.add.text(760, 50, 'X', { fontFamily: 'monospace', fontSize: '24px', color: '#ef4444', backgroundColor: '#374151', padding: { x: 8, y: 4 }})
            .setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        closeButton.on('pointerdown', () => this.closeScene());
        this.input.keyboard?.on('keydown-ESC', this.handleEscape, this);
        this.input.keyboard?.on('keydown-UP', this.moveSelectionUp, this);
        this.input.keyboard?.on('keydown-DOWN', this.moveSelectionDown, this);
        this.input.keyboard?.on('keydown-ENTER', this.confirmSelection, this);
        this.input.keyboard?.on('keydown-SPACE', this.confirmSelection, this);

        this.updateView();
    }

    private handleEscape() {
        if (this.state === 'SELECT_POKEMON') {
            // this.sound.play('menu_select', { volume: 0.7 });
            this.state = 'LIST_ITEMS';
            this.updateView();
        } else {
            this.closeScene();
        }
    }

    private updateView() {
        this.clearLists();
        if (this.state === 'LIST_ITEMS') {
            this.renderItemList();
        } else {
            this.renderPokemonList();
        }
    }

    private renderItemList() {
        this.inventory = Object.keys(PlayerState.inventory).filter(id => Items[id]?.canUseOutsideBattle);
        this.selectedItemIndex = Phaser.Math.Clamp(this.selectedItemIndex, 0, this.inventory.length - 1);

        if (this.inventory.length === 0) {
            this.descriptionText.setText('Your bag is empty.');
            return;
        }

        this.inventory.forEach((itemId, index) => {
            const item = Items[itemId];
            const count = PlayerState.inventory[itemId];
            const text = this.add.text(30, 100 + index * 30, `${item.name} x${count}`, { fontFamily: 'monospace', fontSize: '18px' });
            this.itemList.push(text);
        });
        this.updateHighlight();
    }

    private renderPokemonList() {
        this.selectedPokemonIndex = Phaser.Math.Clamp(this.selectedPokemonIndex, 0, PlayerState.pokemonTeam.length - 1);

        PlayerState.pokemonTeam.forEach((pokemon, index) => {
            const text = this.add.text(30, 100 + index * 30, `${pokemon.name} - HP: ${pokemon.currentHp}/${pokemon.maxHp}`, { fontFamily: 'monospace', fontSize: '18px' });
            this.pokemonList.push(text);
        });
        this.updateHighlight();
    }

    private moveSelectionUp() {
        if (this.state === 'LIST_ITEMS' && this.inventory.length > 0) {
            // this.sound.play('menu_select', { volume: 0.7 });
            this.selectedItemIndex = (this.selectedItemIndex - 1 + this.inventory.length) % this.inventory.length;
        } else if (this.state === 'SELECT_POKEMON' && PlayerState.pokemonTeam.length > 0) {
            // this.sound.play('menu_select', { volume: 0.7 });
            this.selectedPokemonIndex = (this.selectedPokemonIndex - 1 + PlayerState.pokemonTeam.length) % PlayerState.pokemonTeam.length;
        }
        this.updateHighlight();
    }

    private moveSelectionDown() {
        if (this.state === 'LIST_ITEMS' && this.inventory.length > 0) {
            // this.sound.play('menu_select', { volume: 0.7 });
            this.selectedItemIndex = (this.selectedItemIndex + 1) % this.inventory.length;
        } else if (this.state === 'SELECT_POKEMON' && PlayerState.pokemonTeam.length > 0) {
            // this.sound.play('menu_select', { volume: 0.7 });
            this.selectedPokemonIndex = (this.selectedPokemonIndex + 1) % PlayerState.pokemonTeam.length;
        }
        this.updateHighlight();
    }

    private confirmSelection() {
        if (this.state === 'LIST_ITEMS') {
            if (this.inventory.length > 0) {
                // this.sound.play('menu_confirm');
                this.state = 'SELECT_POKEMON';
                this.updateView();
            }
        } else { // SELECT_POKEMON
            if (PlayerState.pokemonTeam.length > 0) {
                const itemId = this.inventory[this.selectedItemIndex];
                const target = PlayerState.pokemonTeam[this.selectedPokemonIndex];
                const result = useItem(itemId, target);
                
                this.showMessage(result.message);

                // if (result.success) {
                //     this.sound.play('item_use');
                // } else {
                //     this.sound.play('item_error');
                // }

                if (result.success) {
                    this.state = 'LIST_ITEMS';
                    this.time.delayedCall(1200, () => this.updateView());
                }
            }
        }
    }

    private updateHighlight() {
        if (this.state === 'LIST_ITEMS') {
            this.itemList.forEach((text, index) => text.setColor(index === this.selectedItemIndex ? '#fcd34d' : '#ffffff'));
            if (this.inventory.length > 0) {
                const item = Items[this.inventory[this.selectedItemIndex]];
                this.descriptionText.setText(item.description);
            }
        } else {
            this.pokemonList.forEach((text, index) => text.setColor(index === this.selectedPokemonIndex ? '#fcd34d' : '#ffffff'));
            if (this.inventory.length > 0 && PlayerState.pokemonTeam.length > 0) {
                const item = Items[this.inventory[this.selectedItemIndex]];
                const pokemon = PlayerState.pokemonTeam[this.selectedPokemonIndex];
                this.descriptionText.setText(`Use ${item.name} on ${pokemon.name}?`);
            }
        }
    }

    private showMessage(text: string) {
        this.messageText.setText(text);
        this.time.delayedCall(1500, () => this.messageText.setText(''));
    }

    private clearLists() {
        this.itemList.forEach(item => item.destroy());
        this.pokemonList.forEach(item => item.destroy());
        this.itemList = [];
        this.pokemonList = [];
    }

    private closeScene() {
        this.input.keyboard?.off('keydown-ESC');
        this.input.keyboard?.off('keydown-UP');
        this.input.keyboard?.off('keydown-DOWN');
        this.input.keyboard?.off('keydown-ENTER');
        this.input.keyboard?.off('keydown-SPACE');
        this.scene.stop();
        this.scene.resume(this.fromScene);
    }
}