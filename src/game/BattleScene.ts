import { Scene } from 'phaser';
import { PokemonInstance, handleLevelUp } from './PokemonData';
import { TurnManager, TurnAction } from './TurnManager';
import { Moves } from './Moves';
import { EventBus } from './EventBus';
import { PlayerState } from './PlayerData';

export class BattleScene extends Scene {
    private playerMon!: PokemonInstance;
    private enemyMon!: PokemonInstance;

    private messageText!: Phaser.GameObjects.Text;
    private actionMenu!: Phaser.GameObjects.Container;
    private movesMenu!: Phaser.GameObjects.Container;
    private itemsMenu!: Phaser.GameObjects.Container;
    
    private enemyHpBar!: Phaser.GameObjects.Rectangle;
    private playerHpBar!: Phaser.GameObjects.Rectangle;
    private enemyHpText!: Phaser.GameObjects.Text;
    private playerHpText!: Phaser.GameObjects.Text;
    private playerInfoText!: Phaser.GameObjects.Text;

    private isProcessingTurn: boolean = false;

    constructor() {
        super('BattleScene');
        console.log('BattleScene constructor');
    }

    init(data: { playerMon: PokemonInstance, enemyMon: PokemonInstance }) {
        this.playerMon = data.playerMon;
        this.enemyMon = data.enemyMon;
        this.isProcessingTurn = false;
    }

    preload() {
        console.log('BattleScene preload()');
        // Dynamically load sprites for the current battle
        const enemySpriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${this.enemyMon.id}.png`;
        const playerSpriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${this.playerMon.id}.png`;
        this.load.image('enemy_sprite', enemySpriteUrl);
        this.load.image('player_sprite', playerSpriteUrl);
    }

    create() {
        console.log('BattleScene create()');
        this.cameras.main.fadeIn(500, 0, 0, 0);
        
        // Background
        this.add.rectangle(400, 300, 800, 600, 0x4ade80); // Light green terrain

        // Placeholder Sprites
        this.add.image(600, 220, 'enemy_sprite').setScale(3); // Wild Pokémon on the right
        this.add.image(200, 400, 'player_sprite').setScale(3); // Player Pokémon on the left

        this.createUI();
        this.updateHpBars(0); // instant initial update

        this.showMessage(`A wild ${this.enemyMon.name} appeared!`, () => {
            this.showActionMenu();
        });

        EventBus.emit('current-scene-ready', this);
        console.log('BattleScene fully loaded');
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
            ...createBtn(80, -25, 'BAG', () => this.showItemsMenu()),
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

        // Items Menu
        this.itemsMenu = this.add.container(600, 520);
        const pokeballCount = PlayerState.inventory['Pokeball'] || 0;
        if (pokeballCount > 0) {
            this.itemsMenu.add([...createBtn(-80, -25, `POKEBALL (${pokeballCount})`, () => this.attemptCatch())]);
        }
        this.itemsMenu.add([...createBtn(0, 25, 'CANCEL', () => this.showActionMenu())]);
        this.itemsMenu.setVisible(false);

        // Enemy Status UI (Top Left)
        this.add.rectangle(200, 100, 280, 70, 0xf3f4f6).setStrokeStyle(2, 0x000000);
        this.add.text(80, 75, `${this.enemyMon.name} Lv${this.enemyMon.level}`, { fontFamily: 'monospace', fontSize: '18px', color: '#000000', fontStyle: 'bold' });
        this.add.rectangle(200, 110, 200, 12, 0x9ca3af); // HP Track
        this.enemyHpBar = this.add.rectangle(100, 110, 200, 12, 0x22c55e).setOrigin(0, 0.5); // HP Fill
        this.enemyHpText = this.add.text(200, 125, '', { fontFamily: 'monospace', fontSize: '12px', color: '#000000' }).setOrigin(0.5);

        // Player Status UI (Bottom Right)
        this.add.rectangle(600, 350, 280, 70, 0xf3f4f6).setStrokeStyle(2, 0x000000);
        this.playerInfoText = this.add.text(480, 325, `${this.playerMon.name} Lv${this.playerMon.level}`, { fontFamily: 'monospace', fontSize: '18px', color: '#000000', fontStyle: 'bold' });
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
        this.itemsMenu.setVisible(false);
        this.messageText.setText(text);
        this.time.delayedCall(1200, () => {
            if (onComplete) onComplete();
        });
    }

    private showActionMenu() {
        if (this.isProcessingTurn) return;
        this.messageText.setText('What will you do?');
        this.actionMenu.setVisible(true);
        this.movesMenu.setVisible(false);
        this.itemsMenu.setVisible(false);
    }

    private showMovesMenu() {
        this.messageText.setText('');
        this.actionMenu.setVisible(false);
        this.movesMenu.setVisible(true);
        this.itemsMenu.setVisible(false);
    }

    private showItemsMenu() {
        this.messageText.setText('');
        this.actionMenu.setVisible(false);
        this.movesMenu.setVisible(false);
        this.itemsMenu.setVisible(true);
    }

    private executeTurn(moveId: string) {
        if (this.isProcessingTurn) return;
        this.isProcessingTurn = true;
        this.movesMenu.setVisible(false);

        // Fallback to tackle if array errors
        const enemyMoveId = this.enemyMon.moves[Math.floor(Math.random() * this.enemyMon.moves.length)] || 'tackle';
        this.processActions(TurnManager.processTurn(this.playerMon, moveId, this.enemyMon, enemyMoveId));
    }

    private attemptCatch() {
        if (this.isProcessingTurn) return;
        this.isProcessingTurn = true;
        this.itemsMenu.setVisible(false);

        PlayerState.inventory['Pokeball']--;

        this.showMessage(`You threw a Pokeball!`, () => {
            // Simple catch formula: higher chance at lower HP.
            // Base 10% chance, up to 60% at 1 HP.
            const catchChance = (1 - (this.enemyMon.currentHp / this.enemyMon.maxHp)) * 0.5 + 0.1;

            if (Math.random() < catchChance) {
                // --- SUCCESS ---
                PlayerState.pokemonTeam.push(this.enemyMon);
                this.showMessage(`Gotcha! ${this.enemyMon.name} was caught!`, () => {
                    this.time.delayedCall(1000, () => this.endBattle('win'));
                });
            } else {
                // --- FAILURE ---
                this.showMessage(`Oh no! The Pokemon broke free!`, () => {
                    // On failure, the enemy gets to attack.
                    const enemyMoveId = this.enemyMon.moves[Math.floor(Math.random() * this.enemyMon.moves.length)] || 'tackle';
                    const enemyActions = TurnManager.processEnemyTurn(this.playerMon, this.enemyMon, enemyMoveId);
                    this.processActions(enemyActions);
                });
            }
        });
    }

    private processActions(actions: TurnAction[]) {
        if (actions.length === 0) {
            this.isProcessingTurn = false;
            this.showActionMenu();
            return;
        }
        const action = actions.shift()!;
        
        this.showMessage(action.message, () => {
            if (action.damage !== undefined) {
                this.updateHpBars(300);
            }

            // VICTORY: Enemy fainted
            if (action.isFaint && action.target === 'enemy') {
                const xpGained = 20;
                this.playerMon.xp += xpGained;
                this.playerMon.totalXp += xpGained;

                this.showMessage(`${this.playerMon.name} gained ${xpGained} XP!`, () => {
                    const levelUpResult = handleLevelUp(this.playerMon);
                    if (levelUpResult.leveledUp) {
                        this.showMessage(levelUpResult.message, () => {
                            this.playerInfoText.setText(`${this.playerMon.name} Lv${this.playerMon.level}`);
                            this.updateHpBars(0);
                            this.time.delayedCall(1500, () => this.endBattle('win'));
                        });
                    } else {
                        this.time.delayedCall(1500, () => this.endBattle('win'));
                    }
                });
                return; // End of turn processing
            }

            // DEFEAT: Player fainted, now showing "blacked out"
            if (action.isGameOver) {
                this.time.delayedCall(1500, () => this.endBattle('loss'));
                return; // End of turn processing
            }

            // If not a game-ending action, continue processing the rest of the turn's actions
            this.processActions(actions);
        });
    }

    private runAway() {
        this.showMessage('Got away safely!', () => this.endBattle('run'));
    }

    private endBattle(result: 'win' | 'loss' | 'run') {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.events.emit('battle-ended', result));
    }
}