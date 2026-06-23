import { Scene, Input } from 'phaser';
import { PlayerState } from './PlayerData';
import { Items } from './Items';
import { Dialogues } from './dialogues';

const LORE_ITEM_IDS = [
    'Observatory Journal Page #1',
    'Observatory Journal Page #2',
    'Crumbled Note',
];

export class JournalScene extends Scene {
    private fromScene!: string;
    private listItems: Phaser.GameObjects.Text[] = [];
    private descriptionText!: Phaser.GameObjects.Text;
    private selectedItemIndex: number = 0;
    private collectedLoreItems: string[] = [];

    constructor() {
        super('JournalScene');
    }

    init(data: { fromScene: string }) {
        this.fromScene = data.fromScene;
        this.selectedItemIndex = 0;
    }

    create() {
        this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);
        this.add.rectangle(400, 300, 780, 550, 0x111827).setStrokeStyle(4, 0x4b5563);
        this.add.text(400, 50, 'Journal', { fontFamily: 'monospace', fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);

        this.add.line(0, 0, 400, 80, 400, 570, 0x4b5563).setOrigin(0);

        this.descriptionText = this.add.text(420, 100, '', { fontFamily: 'monospace', fontSize: '16px', color: '#ffffff', wordWrap: { width: 340 } }).setOrigin(0);

        const closeButton = this.add.text(760, 50, 'X', { fontFamily: 'monospace', fontSize: '24px', color: '#ef4444', backgroundColor: '#374151', padding: { x: 8, y: 4 }})
            .setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        closeButton.on('pointerdown', () => this.closeScene());
        this.input.keyboard?.on('keydown-ESC', this.closeScene, this);
        this.input.keyboard?.on('keydown-UP', this.moveSelectionUp, this);
        this.input.keyboard?.on('keydown-DOWN', this.moveSelectionDown, this);

        this.renderItemList();
    }

    private renderItemList() {
        this.listItems.forEach(item => item.destroy());
        this.listItems = [];

        this.collectedLoreItems = LORE_ITEM_IDS.filter(id => PlayerState.inventory[id] > 0);
        this.selectedItemIndex = Phaser.Math.Clamp(this.selectedItemIndex, 0, this.collectedLoreItems.length - 1);

        if (this.collectedLoreItems.length === 0) {
            this.descriptionText.setText('You haven\'t found any journal pages or notes yet.');
            return;
        }

        this.collectedLoreItems.forEach((itemId, index) => {
            const item = Items[itemId];
            const text = this.add.text(30, 100 + index * 30, item.name, { fontFamily: 'monospace', fontSize: '18px' });
            this.listItems.push(text);
        });
        this.updateHighlight();
    }

    private moveSelectionUp() {
        if (this.collectedLoreItems.length > 0) {
            this.selectedItemIndex = (this.selectedItemIndex - 1 + this.collectedLoreItems.length) % this.collectedLoreItems.length;
            this.updateHighlight();
        }
    }

    private moveSelectionDown() {
        if (this.collectedLoreItems.length > 0) {
            this.selectedItemIndex = (this.selectedItemIndex + 1) % this.collectedLoreItems.length;
            this.updateHighlight();
        }
    }

    private updateHighlight() {
        this.listItems.forEach((text, index) => text.setColor(index === this.selectedItemIndex ? '#fcd34d' : '#ffffff'));
        if (this.collectedLoreItems.length > 0) {
            const itemId = this.collectedLoreItems[this.selectedItemIndex];
            const dialogueKey = `found_${itemId.toLowerCase().replace(/ /g, '_').replace(/#/g, '')}`;
            const dialogue = Dialogues[dialogueKey];
            if (dialogue && dialogue[0]) {
                // Extract the text after the newline, which is the actual content.
                const content = dialogue[0].text.split('\n')[1] || 'No content found.';
                this.descriptionText.setText(content);
            } else {
                this.descriptionText.setText('Could not read this item.');
            }
        }
    }

    private closeScene() {
        this.input.keyboard?.off('keydown-ESC');
        this.input.keyboard?.off('keydown-UP');
        this.input.keyboard?.off('keydown-DOWN');
        this.scene.stop();
        this.scene.resume(this.fromScene);
    }
}