import { Scene, Input } from 'phaser';
import { SaveManager } from './SaveManager';
import { EventBus } from './EventBus';

export class MenuScene extends Scene {
    private fromScene!: string;
    private menuItems: Phaser.GameObjects.Text[] = [];
    private selectedIndex: number = 0;
    private selector!: Phaser.GameObjects.Image;
    private saveMessage!: Phaser.GameObjects.Text;
    private menuPanel!: Phaser.GameObjects.Rectangle;

    constructor() {
        super('MenuScene');
    }

    init(data: { fromScene: string }) {
        this.fromScene = data.fromScene;
        this.selectedIndex = 0;
    }

    create() {
        // Dim the background to pause the game visually
        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.5).setOrigin(0);

        const menuWidth = 220;
        const startX = this.cameras.main.width + (menuWidth / 2);

        this.menuPanel = this.add.rectangle(startX, this.cameras.main.height / 2, menuWidth, 450, 0x111827, 0.9).setStrokeStyle(4, 0x4b5563);
        
        const options = [
            { name: 'POKÉMON', action: () => { /* this.sound.play('menu_confirm'); */ this.launchSubScene('TeamScene', { inBattle: false }); } },
            { name: 'BAG', action: () => { /* this.sound.play('menu_confirm'); */ this.launchSubScene('BagScene'); } },
            { name: 'SAVE', action: () => this.saveGame() },
            { name: 'LOAD', action: () => this.loadGame() },
            { name: 'POKÉDEX', action: () => { /* this.sound.play('menu_confirm'); */ this.launchSubScene('PokedexScene'); } },
            { name: 'BADGES', action: () => { /* this.sound.play('menu_confirm'); */ this.launchSubScene('BadgeScene'); } },
            { name: 'SETTINGS', action: () => { /* this.sound.play('menu_confirm'); */ this.launchSubScene('SettingsScene'); } },
            { name: 'QUIT', action: () => { /* this.sound.play('menu_confirm'); */ window.location.href = '/'; } }
        ];

        const startY = (this.cameras.main.height - (options.length * 50)) / 2 + 25;
        const stepY = 50;

        this.menuItems = options.map((option, index) => {
            return this.add.text(startX, startY + index * stepY, option.name, {
                fontFamily: 'monospace',
                fontSize: '20px',
                color: '#ffffff'
            }).setOrigin(0.5);
        });

        this.selector = this.add.image(startX - 100, startY, 'selector_arrow').setScale(1.2);

        this.saveMessage = this.add.text(400, 300, '', {
            fontFamily: 'monospace', fontSize: '24px', color: '#22c55e',
            backgroundColor: '#000000aa', padding: { x: 16, y: 8 }
        }).setOrigin(0.5).setDepth(100).setAlpha(0);

        // Input handling
        this.input.keyboard?.on('keydown-UP', this.moveSelectionUp, this);
        this.input.keyboard?.on('keydown-DOWN', this.moveSelectionDown, this);
        this.input.keyboard?.on('keydown-ENTER', () => options[this.selectedIndex].action(), this);
        this.input.keyboard?.on('keydown-SPACE', () => options[this.selectedIndex].action(), this);
        this.input.keyboard?.on('keydown-E', () => options[this.selectedIndex].action(), this);
        this.input.keyboard?.on('keydown-ESC', this.closeMenu, this);

        this.updateSelector();

        // Animation
        this.tweens.add({
            targets: [this.menuPanel, ...this.menuItems, this.selector],
            x: `-=${menuWidth}`,
            duration: 200,
            ease: 'Power2'
        });
    }

    private moveSelectionUp() {
        // this.sound.play('menu_select', { volume: 0.7 });
        this.selectedIndex = (this.selectedIndex - 1 + this.menuItems.length) % this.menuItems.length;
        this.updateSelector();
    }

    private moveSelectionDown() {
        // this.sound.play('menu_select', { volume: 0.7 });
        this.selectedIndex = (this.selectedIndex + 1) % this.menuItems.length;
        this.updateSelector();
    }

    private updateSelector() {
        if (this.menuItems.length > 0) {
            const y = this.menuItems[this.selectedIndex].y;
            this.selector.setY(y);
            this.menuItems.forEach((item, index) => {
                item.setColor(index === this.selectedIndex ? '#fcd34d' : '#ffffff');
            });
        }
    }

    private launchSubScene(sceneKey: string, data: any = {}) {
        this.scene.launch(sceneKey, { ...data, fromScene: this.scene.key });
        this.scene.pause();
    }

    private saveGame() {
        // this.sound.play('item_use'); // Using a success sound for saving
        EventBus.emit('save-game-from-menu');
        this.showSaveMessage('Game Saved Successfully');
    }

    private loadGame() {
        // this.sound.play('menu_confirm');
        if (SaveManager.hasSaveData()) {
            window.location.reload();
        } else {
            this.showSaveMessage('No save data found.');
        }
    }

    private showSaveMessage(message: string) {
        this.saveMessage.setText(message).setAlpha(1);
        this.tweens.add({ targets: this.saveMessage, alpha: 0, delay: 1500, duration: 500 });
    }

    private closeMenu() {
        this.input.keyboard?.shutdown();
        this.scene.resume(this.fromScene);
        this.scene.stop();
    }
}