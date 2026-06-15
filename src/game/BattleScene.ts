import { Scene } from 'phaser';
import { PokemonInstance } from './PokemonData';
import { TurnManager, TurnAction } from './TurnManager';
import { Moves } from './Moves';
import { EventBus } from './EventBus';

export class BattleScene extends Scene {
    private playerMon!: PokemonInstance;
    private enemyMon!: PokemonInstance;

    private messageText!: Phaser.GameObjects.Text;
    private actionMenu!: Phaser.GameObjects.Container;
    private movesMenu!: Phaser.GameObjects.Container;
    
    private enemyHpBar!: Phaser.GameObjects.Rectangle;
    private playerHpBar!: Phaser.GameObjects.Rectangle;
    private enemyHpText!: Phaser.GameObjects.Text;
    private playerHpText!: Phaser.GameObjects.Text;

    private isProcessingTurn: boolean = false;

    constructor() {
        super('BattleScene');
    }

    init(data: { playerMon: PokemonInstance, enemyMon: PokemonInstance }) {
        this.playerMon = data.playerMon;
        this.enemyMon = data.enemyMon;
        this.isProcessingTurn = false;
    }

    create() {
        this.cameras.main.fadeIn(500, 0, 0, 0);
        
        // Background
        this.add.rectangle(400, 300, 800, 600, 0x4ade80); // Light green terrain

        // Placeholder Sprites
        this.add.image(600, 200, 'pokemon_placeholder').setScale(2).setTint(0xef4444); // Enemy
        this.add.image(200, 400, 'pokemon_placeholder').setScale(2).setTint(0x3b82f6); // Player

        this.createUI();
        this.updateHpBars(0); // instant initial update

        this.showMessage(`A wild ${this.enemyMon.name} appeared!`, () => {
            this.showActionMenu();
        });

        EventBus.emit('current-scene-ready', this);
    }

    private createUI() {
        // Bottom Dialog Box
        this.add.rectangle(400, 520, 760, 120, 0xffffff).setStrokeStyle(4, 0x000000);
        this.messageText = this.add.text(40, 480, '', {
            fontFamily: 'monospace', fontSize: '20px', color: '#000000', wordWrap: { width: 700 }
        });

        // Reusable Button Generator
        const createBtn = (x: number, y: number, text: string, callback: () => void) => {
            const btnBg = this.add.rectangle(x, y, 140, 40, 0xe5e7eb).setStrokeStyle(2, 0x000000).setInteractive({ useHandCursor: true });
            const btnText = this.add.text(x, y, text, { fontFamily: 'monospace', fontSize: '18px', color: '#000000' }).setOrigin(0.5);
            btnBg.on('pointerdown', callback);
            return [btnBg, btnText];
        };

        // Main Action Menu
        this.actionMenu = this.add.container(600, 520);
        this.actionMenu.add([
            ...createBtn(-80, -25, 'FIGHT', () => this.showMovesMenu()),
            ...createBtn(80, -25, 'BAG', () => this.showMessage('Your bag is empty!', () => this.showActionMenu())),
            ...createBtn(-80, 25, 'POKEMON', () => this.showMessage('No other Pokemon!', () => this.showActionMenu())),
            ...createBtn(80, 25, 'RUN', () => this.runAway())
        ]);
        this.actionMenu.setVisible(false);

        // Moves Menu
        this.movesMenu = this.add.container(600, 520);
        const move1 = this.playerMon.moves[0];
        const move2 = this.playerMon.moves[1];
        
        if (move1) this.movesMenu.add([...createBtn(-80, -25, Moves[move1].name.toUpperCase(), () => this.executeTurn(move1))]);
        if (move2) this.movesMenu.add([...createBtn(80, -25, Moves[move2].name.toUpperCase(), () => this.executeTurn(move2))]);
        this.movesMenu.add([...createBtn(0, 25, 'CANCEL', () => this.showActionMenu())]);
        this.movesMenu.setVisible(false);

        // Enemy Status UI (Top Left)
        this.add.rectangle(200, 100, 280, 70, 0xf3f4f6).setStrokeStyle(2, 0x000000);
        this.add.text(80, 75, `${this.enemyMon.name} Lv${this.enemyMon.level}`, { fontFamily: 'monospace', fontSize: '18px', color: '#000000', fontStyle: 'bold' });
        this.add.rectangle(200, 110, 200, 12, 0x9ca3af); // HP Track
        this.enemyHpBar = this.add.rectangle(100, 110, 200, 12, 0x22c55e).setOrigin(0, 0.5); // HP Fill
        this.enemyHpText = this.add.text(200, 125, '', { fontFamily: 'monospace', fontSize: '12px', color: '#000000' }).setOrigin(0.5);

        // Player Status UI (Bottom Right)
        this.add.rectangle(600, 350, 280, 70, 0xf3f4f6).setStrokeStyle(2, 0x000000);
        this.add.text(480, 325, `${this.playerMon.name} Lv${this.playerMon.level}`, { fontFamily: 'monospace', fontSize: '18px', color: '#000000', fontStyle: 'bold' });
        this.add.rectangle(600, 360, 200, 12, 0x9ca3af); // HP Track
        this.playerHpBar = this.add.rectangle(500, 360, 200, 12, 0x22c55e).setOrigin(0, 0.5); // HP Fill
        this.playerHpText = this.add.text(600, 375, '', { fontFamily: 'monospace', fontSize: '12px', color: '#000000' }).setOrigin(0.5);
    }

    private updateHpBars(duration: number = 300) {
        const ePercent = Math.max(0, this.enemyMon.currentHp / this.enemyMon.maxHp);
        this.tweens.add({ targets: this.enemyHpBar, width: 200 * ePercent, duration });
        this.enemyHpText.setText(`${this.enemyMon.currentHp} / ${this.enemyMon.maxHp}`);

        const pPercent = Math.max(0, this.playerMon.currentHp / this.playerMon.maxHp);
        this.tweens.add({ targets: this.playerHpBar, width: 200 * pPercent, duration });
        this.playerHpText.setText(`${this.playerMon.currentHp} / ${this.playerMon.maxHp}`);
    }

    private showMessage(text: string, onComplete?: () => void) {
        this.actionMenu.setVisible(false);
        this.movesMenu.setVisible(false);
        this.messageText.setText(text);
        this.time.delayedCall(1200, () => {
            if (onComplete) onComplete();
        });
    }

    private showActionMenu() {
        this.messageText.setText('What will you do?');
        this.actionMenu.setVisible(true);
        this.movesMenu.setVisible(false);
    }

    private showMovesMenu() {
        this.messageText.setText('');
        this.actionMenu.setVisible(false);
        this.movesMenu.setVisible(true);
    }

    private runAway() {
        this.showMessage('Got away safely!', () => this.endBattle());
    }

    private executeTurn(moveId: string) {
        if (this.isProcessingTurn) return;
        this.isProcessingTurn = true;
        this.movesMenu.setVisible(false);

        // Fallback to tackle if array errors
        const enemyMoveId = this.enemyMon.moves[Math.floor(Math.random() * this.enemyMon.moves.length)] || 'tackle';
        this.processActions(TurnManager.processTurn(this.playerMon, moveId, this.enemyMon, enemyMoveId));
    }

    private processActions(actions: TurnAction[]) {
        if (actions.length === 0) { this.isProcessingTurn = false; this.showActionMenu(); return; }
        const action = actions.shift()!;
        
        this.showMessage(action.message, () => {
            if (action.damage !== undefined) this.updateHpBars(300);
            if (action.isFaint) this.time.delayedCall(1000, () => this.endBattle());
            else this.processActions(actions);
        });
    }

    private endBattle() {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.events.emit('battle-ended'));
    }
}