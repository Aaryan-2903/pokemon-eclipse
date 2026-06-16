import { Scene, Input } from 'phaser';
import { PlayerState } from './PlayerData';
import { Items } from './Items';

type ShopState = 'LIST_ITEMS' | 'SELECT_QUANTITY';

export class ShopScene extends Scene {
    private fromScene!: string;
    private state: ShopState = 'LIST_ITEMS';

    private itemList: Phaser.GameObjects.Text[] = [];
    private descriptionText!: Phaser.GameObjects.Text;
    private moneyText!: Phaser.GameObjects.Text;
    private messageText!: Phaser.GameObjects.Text;
    private quantityContainer!: Phaser.GameObjects.Container;
    private quantityText!: Phaser.GameObjects.Text;

    private selectedItemIndex: number = 0;
    private selectedQuantity: number = 1;
    private itemsForSale: string[] = [];

    constructor() {
        super('ShopScene');
    }

    init(data: { fromScene: string }) {
        this.fromScene = data.fromScene;
        this.state = 'LIST_ITEMS';
        this.selectedItemIndex = 0;
        this.selectedQuantity = 1;
    }

    create() {
        this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);
        this.add.rectangle(400, 300, 780, 550, 0x111827).setStrokeStyle(4, 0x4b5563);
        this.add.text(400, 50, 'Poké Mart', { fontFamily: 'monospace', fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);

        this.add.line(0, 0, 400, 80, 400, 570, 0x4b5563).setOrigin(0);

        this.descriptionText = this.add.text(420, 150, '', { fontFamily: 'monospace', fontSize: '16px', color: '#ffffff', wordWrap: { width: 340 } }).setOrigin(0);
        this.moneyText = this.add.text(420, 100, `Money: $${PlayerState.money}`, { fontFamily: 'monospace', fontSize: '18px', color: '#fcd34d' });
        this.messageText = this.add.text(400, 520, '', { fontFamily: 'monospace', fontSize: '16px', color: '#fcd34d' }).setOrigin(0.5);

        const closeButton = this.add.text(760, 50, 'X', { fontFamily: 'monospace', fontSize: '24px', color: '#ef4444', backgroundColor: '#374151', padding: { x: 8, y: 4 }})
            .setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        closeButton.on('pointerdown', () => this.closeScene());
        this.input.keyboard?.on('keydown-ESC', this.handleEscape, this);
        this.input.keyboard?.on('keydown-UP', this.moveSelection, -1);
        this.input.keyboard?.on('keydown-DOWN', this.moveSelection, 1);
        this.input.keyboard?.on('keydown-ENTER', this.confirmSelection, this);
        this.input.keyboard?.on('keydown-SPACE', this.confirmSelection, this);

        this.createQuantitySelector();
        this.updateView();
    }

    private handleEscape() {
        if (this.state === 'SELECT_QUANTITY') {
            this.state = 'LIST_ITEMS';
            this.updateView();
        } else {
            this.closeScene();
        }
    }

    private updateView() {
        this.moneyText.setText(`Money: $${PlayerState.money}`);
        this.quantityContainer.setVisible(this.state === 'SELECT_QUANTITY');
        this.itemList.forEach(item => item.destroy());

        if (this.state === 'LIST_ITEMS') {
            this.renderItemList();
        }
    }

    private renderItemList() {
        this.itemsForSale = ['Potion', 'Super Potion', 'Revive', 'Pokeball'];
        this.selectedItemIndex = Phaser.Math.Clamp(this.selectedItemIndex, 0, this.itemsForSale.length - 1);

        this.itemsForSale.forEach((itemId, index) => {
            const item = Items[itemId];
            const text = this.add.text(30, 100 + index * 30, `${item.name} - $${item.price}`, { fontFamily: 'monospace', fontSize: '18px' });
            this.itemList.push(text);
        });
        this.updateHighlight();
    }

    private moveSelection(amount: number) {
        if (this.state === 'LIST_ITEMS') {
            this.selectedItemIndex = Phaser.Math.Clamp(this.selectedItemIndex + amount, 0, this.itemsForSale.length - 1);
        } else { // SELECT_QUANTITY
            this.selectedQuantity = Math.max(1, this.selectedQuantity + amount);
            this.updateQuantityText();
        }
        this.updateHighlight();
    }

    private confirmSelection() {
        if (this.state === 'LIST_ITEMS') {
            this.state = 'SELECT_QUANTITY';
            this.selectedQuantity = 1;
            this.updateQuantityText();
            this.updateView();
        } else { // SELECT_QUANTITY
            this.purchaseItem();
        }
    }

    private purchaseItem() {
        const itemId = this.itemsForSale[this.selectedItemIndex];
        const item = Items[itemId];
        const totalCost = item.price * this.selectedQuantity;

        if (PlayerState.money < totalCost) {
            this.showMessage('Not enough money.');
            return;
        }

        PlayerState.money -= totalCost;
        PlayerState.inventory[itemId] = (PlayerState.inventory[itemId] || 0) + this.selectedQuantity;

        this.showMessage(`Purchased ${this.selectedQuantity}x ${item.name}.`);
        this.state = 'LIST_ITEMS';
        this.time.delayedCall(1200, () => this.updateView());
    }

    private updateHighlight() {
        this.itemList.forEach((text, index) => text.setColor(index === this.selectedItemIndex ? '#fcd34d' : '#ffffff'));
        if (this.itemsForSale.length > 0) {
            const item = Items[this.itemsForSale[this.selectedItemIndex]];
            this.descriptionText.setText(item.description);
        }
    }

    private createQuantitySelector() {
        this.quantityContainer = this.add.container(580, 300);
        const bg = this.add.rectangle(0, 0, 250, 150, 0x374151).setStrokeStyle(2, 0x4b5563);
        const title = this.add.text(0, -50, 'How many?', { fontFamily: 'monospace', fontSize: '18px' }).setOrigin(0.5);
        this.quantityText = this.add.text(0, 0, '1', { fontFamily: 'monospace', fontSize: '24px' }).setOrigin(0.5);
        const instructions = this.add.text(0, 50, 'Enter: Confirm\nESC: Cancel', { fontFamily: 'monospace', fontSize: '12px', align: 'center' }).setOrigin(0.5);
        
        this.quantityContainer.add([bg, title, this.quantityText, instructions]);
        this.quantityContainer.setVisible(false);
    }

    private updateQuantityText() {
        const itemId = this.itemsForSale[this.selectedItemIndex];
        const item = Items[itemId];
        const totalCost = item.price * this.selectedQuantity;
        this.quantityText.setText(`${this.selectedQuantity}\n(Total: $${totalCost})`);
    }

    private showMessage(text: string) {
        this.messageText.setText(text);
        this.time.delayedCall(1500, () => this.messageText.setText(''));
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