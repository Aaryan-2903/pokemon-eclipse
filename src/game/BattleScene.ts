import { Scene, Input } from 'phaser';
import { PokemonInstance, handleLevelUp, getXpForNextLevel } from './PokemonData';
import { TurnManager, TurnAction } from './TurnManager';
import { Items, useItem } from './Items';
import { Moves } from './Moves';
import { EventBus } from './EventBus';
import { PlayerState } from './PlayerData';
import { Trainer } from './TrainerData';
import { GameFeel } from './GameFeel';

export class BattleScene extends Scene {
    private playerMon!: PokemonInstance;
    private enemyMon!: PokemonInstance;
    private playerSprite!: Phaser.GameObjects.Image;
    private enemySprite!: Phaser.GameObjects.Image;

    private messageText!: Phaser.GameObjects.Text;
    private actionMenu!: Phaser.GameObjects.Container;
    private movesMenu!: Phaser.GameObjects.Container;
    private itemsMenu!: Phaser.GameObjects.Container;
    private pokemonSelectMenu!: Phaser.GameObjects.Container;
    
    private enemyHpBar!: Phaser.GameObjects.Rectangle;
    private playerHpBar!: Phaser.GameObjects.Rectangle;
    private enemyHpText!: Phaser.GameObjects.Text;
    private playerHpText!: Phaser.GameObjects.Text;
    private enemyInfoText!: Phaser.GameObjects.Text;
    private playerInfoText!: Phaser.GameObjects.Text;
    private playerXpBar!: Phaser.GameObjects.Rectangle;
    private playerXpText!: Phaser.GameObjects.Text;

    private isProcessingTurn: boolean = false;
    private isTrainerBattle: boolean = false;
    private trainer?: Trainer;
    private enemyTeam: PokemonInstance[] = [];
    private currentEnemyIndex: number = 0;
    private isForcedSwitch: boolean = false; // New member to track forced switches
    private loadingIndicator?: Phaser.GameObjects.Text;
    private loadingIndicatorTimer?: Phaser.Time.TimerEvent;

    constructor() {
        super('BattleScene');
        console.log('BattleScene constructor');
    }

    init(data: { playerMon?: PokemonInstance, enemyMon?: PokemonInstance, trainer?: Trainer }) {
        this.isProcessingTurn = false;
        this.trainer = data.trainer;
        this.isTrainerBattle = !!data.trainer; // Ensure this is set correctly

        if (this.isTrainerBattle && this.trainer) {
            this.enemyTeam = this.trainer.team;
            this.enemyMon = this.enemyTeam[0];
            this.playerMon = PlayerState.pokemonTeam[0];
            this.currentEnemyIndex = 0;
        } else if (data.enemyMon) {
            this.enemyMon = data.enemyMon;
            this.playerMon = PlayerState.pokemonTeam[0];
        } else {
            console.error("BattleScene initiated with invalid data", data);
            this.scene.stop();
        }
    }

    preload() {
        console.log('BattleScene preload()');
        this.loadingIndicatorTimer = this.time.delayedCall(1000, () => {
            this.loadingIndicator = this.add.text(400, 300, 'Loading battle...', {
                fontFamily: 'monospace',
                fontSize: '22px',
                color: '#ffffff',
                backgroundColor: '#000000aa',
                padding: { x: 12, y: 8 }
            }).setOrigin(0.5).setDepth(1000);
        });

        this.load.once('complete', () => {
            this.loadingIndicatorTimer?.remove(false);
            this.loadingIndicatorTimer = undefined;
            this.loadingIndicator?.destroy();
            this.loadingIndicator = undefined;
        });

        // Dynamically load sprites for the current battle
        const teamToLoad = this.isTrainerBattle ? this.enemyTeam : [this.enemyMon];
        teamToLoad.forEach(mon => {
            const enemySpriteKey = `enemy_sprite_${mon.id}`;
            if (!this.textures.exists(enemySpriteKey)) {
                this.load.image(enemySpriteKey, `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${mon.id}.png`);
            }
        });

        const playerSpriteKey = `player_sprite_back_${this.playerMon.id}`;
        if (!this.textures.exists(playerSpriteKey)) {
            this.load.image(playerSpriteKey, `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${this.playerMon.id}.png`);
        }

        if (this.isTrainerBattle && this.trainer && !this.textures.exists(this.trainer.spriteKey)) {
            console.warn(`Trainer sprite ${this.trainer.spriteKey} not preloaded. Ensure it is in PreloadScene.`);
        }
    }

    create() {
        console.log('BattleScene create()');
        this.loadingIndicatorTimer?.remove(false);
        this.loadingIndicatorTimer = undefined;
        this.loadingIndicator?.destroy();
        this.loadingIndicator = undefined;
        this.cameras.main.fadeIn(500, 0, 0, 0);
        GameFeel.startMusic(this, 'battle');

        // Background
        this.add.rectangle(400, 300, 800, 600, 0x4ade80); // Light green terrain

        // Sprites
        if (this.isTrainerBattle && this.trainer) {
            this.add.image(600, 150, this.trainer.spriteKey).setScale(2);
        }
        this.enemySprite = this.add.image(600, 220, `enemy_sprite_${this.enemyMon.id}`).setScale(3); // Wild Pokémon on the right
        this.playerSprite = this.add.image(200, 400, `player_sprite_back_${this.playerMon.id}`).setScale(3); // Player Pokémon on the left

        this.createUI();
        this.updateHpBars(0); // instant initial update

        this.events.on('resume', this.onSceneResume, this);
        this.events.on('shutdown', () => {
            this.events.off('resume', this.onSceneResume, this);
        });

        if (this.isTrainerBattle && this.trainer) {
            this.showMessage(`${this.trainer.name} sent out ${this.enemyMon.name}!`, () => {
                this.showActionMenu();
            });
        } else {
            this.showMessage(`A wild ${this.enemyMon.name} appeared!`, () => {
                this.showActionMenu();
            });
        }

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
            btnBg.on('pointerdown', () => { GameFeel.playSfx('menuConfirm'); callback(); });
            return [btnBg, btnText];
        };

        const runCallback = this.isTrainerBattle ? () => this.showMessage("Can't escape a trainer battle!", () => this.showActionMenu()) : () => this.runAway();
        // Main Action Menu
        this.actionMenu = this.add.container(600, 520);
        this.actionMenu.add([
            ...createBtn(-80, -25, 'FIGHT', () => this.openMovesMenu()),
            ...createBtn(80, -25, 'BAG', () => this.openBagMenu()),
            ...createBtn(-80, 25, 'POKEMON', () => this.openTeamMenu()),
            ...createBtn(80, 25, 'RUN', runCallback)
        ]);
        this.actionMenu.setVisible(false);

        // Moves Menu
        this.movesMenu = this.add.container(600, 520);
        this.movesMenu.setVisible(false);

        // Items Menu
        this.itemsMenu = this.add.container(600, 520);
        this.itemsMenu.setVisible(false);

        this.pokemonSelectMenu = this.add.container(600, 520);
        this.pokemonSelectMenu.setVisible(false);

        // Enemy Status UI (Top Left)
        this.add.rectangle(200, 100, 280, 70, 0xf3f4f6).setStrokeStyle(2, 0x000000);
        this.enemyInfoText = this.add.text(80, 75, `${this.enemyMon.name} Lv${this.enemyMon.level}`, { fontFamily: 'monospace', fontSize: '18px', color: '#000000', fontStyle: 'bold' });
        this.add.rectangle(200, 110, 200, 12, 0x9ca3af); // HP Track
        this.enemyHpBar = this.add.rectangle(100, 110, 200, 12, 0x22c55e).setOrigin(0, 0.5); // HP Fill
        this.enemyHpText = this.add.text(200, 125, '', { fontFamily: 'monospace', fontSize: '12px', color: '#000000' }).setOrigin(0.5);

        // Player Status UI (Bottom Right)
        this.add.rectangle(600, 355, 280, 90, 0xf3f4f6).setStrokeStyle(2, 0x000000);
        this.playerInfoText = this.add.text(480, 325, `${this.playerMon.name} Lv${this.playerMon.level}`, { fontFamily: 'monospace', fontSize: '18px', color: '#000000', fontStyle: 'bold' });
        // HP Bar
        this.add.rectangle(600, 350, 200, 12, 0x9ca3af); // HP Track
        this.playerHpBar = this.add.rectangle(500, 350, 200, 12, 0x22c55e).setOrigin(0, 0.5); // HP Fill
        this.playerHpText = this.add.text(600, 365, '', { fontFamily: 'monospace', fontSize: '12px', color: '#000000' }).setOrigin(0.5);
        // XP Bar
        this.add.rectangle(600, 380, 200, 8, 0x9ca3af); // XP Track
        this.playerXpBar = this.add.rectangle(500, 380, 0, 8, 0x3b82f6).setOrigin(0, 0.5); // XP Fill
        this.playerXpText = this.add.text(600, 392, '', { fontFamily: 'monospace', fontSize: '12px', color: '#000000' }).setOrigin(0.5);
    }

    private updateHpBars(duration: number = 300) {
        const ePercent = Math.max(0, this.enemyMon.currentHp / this.enemyMon.maxHp);
        this.tweens.add({ targets: this.enemyHpBar, width: 200 * ePercent, duration });
        this.enemyHpText.setText(`${this.enemyMon.currentHp} / ${this.enemyMon.maxHp}`);

        const pPercent = Math.max(0, this.playerMon.currentHp / this.playerMon.maxHp);
        this.tweens.add({ targets: this.playerHpBar, width: 200 * pPercent, duration });
        this.playerHpText.setText(`${this.playerMon.currentHp} / ${this.playerMon.maxHp}`);

        const xpForNextLevel = getXpForNextLevel(this.playerMon.level);
        const xpPercent = this.playerMon.xp / xpForNextLevel;
        this.playerXpBar.width = 200 * xpPercent;
        this.playerXpText.setText(`XP: ${this.playerMon.xp} / ${xpForNextLevel}`);
    }

    private showMessage(text: string, onComplete?: () => void) {
        this.actionMenu.setVisible(false);
        this.movesMenu.setVisible(false);
        this.itemsMenu.setVisible(false);
        this.pokemonSelectMenu.setVisible(false);
        this.messageText.setText(text);
        this.time.delayedCall(1200, () => {
            if (onComplete) onComplete();
        });
    }

    private hideAllMenus() {
        this.actionMenu.setVisible(false);
        this.movesMenu.setVisible(false);
        this.itemsMenu.setVisible(false);
        this.pokemonSelectMenu.setVisible(false);
    }

    private showActionMenu() {
        if (this.isProcessingTurn) return;
        this.messageText.setText('What will you do?');
        this.actionMenu.setVisible(true);
        this.movesMenu.setVisible(false);
        this.itemsMenu.setVisible(false);
        this.pokemonSelectMenu.setVisible(false);
    }

    private openMovesMenu() {
        this.messageText.setText('');
        this.actionMenu.setVisible(false);
        this.movesMenu.removeAll(true);

        const move1 = this.playerMon.moves[0];
        const move2 = this.playerMon.moves[1];
        
        if (move1) this.movesMenu.add(this.createMenuButton(-80, -25, Moves[move1].name.toUpperCase(), () => this.executeTurn(move1)));
        if (move2) this.movesMenu.add(this.createMenuButton(80, -25, Moves[move2].name.toUpperCase(), () => this.executeTurn(move2)));
        this.movesMenu.add(this.createMenuButton(0, 25, 'CANCEL', () => { GameFeel.playSfx('menuMove'); this.showActionMenu(); }));

        this.movesMenu.setVisible(true);
        this.itemsMenu.setVisible(false);
    }

    private openBagMenu() {
        this.messageText.setText('');
        this.actionMenu.setVisible(false);
        this.itemsMenu.removeAll(true);

        const usableItems = Object.keys(PlayerState.inventory).filter(id => Items[id]?.canUseInBattle && PlayerState.inventory[id] > 0);

        if (usableItems.length === 0) {
            this.showMessage('Your bag is empty.', () => this.showActionMenu());
            return;
        }

        const positions = [
            { x: -80, y: -25 }, { x: 80, y: -25 },
            { x: -80, y: 25 }, { x: 80, y: 25 }
        ];

        usableItems.slice(0, 4).forEach((itemId, index) => {
            const item = Items[itemId];
            const count = PlayerState.inventory[itemId];
            const pos = positions[index];
            this.itemsMenu.add(this.createMenuButton(pos.x, pos.y, `${item.name} x${count}`, () => this.selectItemInBattle(itemId)));
        });

        if (usableItems.length > 4) {
            // Simple pagination not implemented, just show first 4
        }

        this.itemsMenu.add(this.createMenuButton(0, 75, 'CANCEL', () => { GameFeel.playSfx('menuMove'); this.showActionMenu(); }));
        this.movesMenu.setVisible(false);
        this.itemsMenu.setVisible(true);
    }

    private openTeamMenu() {
        if (this.isProcessingTurn) return;
        this.scene.pause();
        this.scene.launch('TeamScene', { fromScene: 'BattleScene', inBattle: true, forceSwitch: false }); // Pass forceSwitch: false for voluntary switch
    }

    private createMenuButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Container {
        const container = this.add.container(x, y);
        const btnBg = this.add.rectangle(0, 0, 140, 40, 0xe5e7eb).setStrokeStyle(2, 0x000000).setInteractive({ useHandCursor: true });
        const btnText = this.add.text(0, 0, text, { fontFamily: 'monospace', fontSize: '16px', color: '#000000' }).setOrigin(0.5);
        btnBg.on('pointerdown', () => { GameFeel.playSfx('menuConfirm'); callback(); });
        container.add([btnBg, btnText]);
        return container;
    }

    private onSceneResume() {
        // Check if the active pokemon has changed
        const newActivePokemon = PlayerState.pokemonTeam[0];

        if (this.isForcedSwitch) {
            this.isForcedSwitch = false; // Reset the flag

            if (newActivePokemon.currentHp > 0) {
                // A healthy Pokémon was selected, proceed with the swap animation and enemy turn
                this.handlePokemonSwap();
            } else {
                // This means the player was forced to switch but somehow ended up with a fainted Pokémon as active.
                // This should ideally be prevented by TeamScene, but as a fallback, it's game over.
                this.showMessage(`No healthy Pokémon available! You blacked out!`, () => {
                    this.time.delayedCall(1500, () => this.endBattle('loss'));
                });
            }
        } else {
            // This is a normal resume (e.g., from menu or voluntary switch)
            if (this.playerMon.id !== newActivePokemon.id) {
                // Player voluntarily switched Pokémon
                this.handlePokemonSwap();
            } else {
                // Player opened TeamScene but didn't switch, or closed menu
                this.isProcessingTurn = false;
                this.showActionMenu();
            }
        }
    }

    private handlePokemonSwap() {
        const oldPokemonName = this.playerMon.name;
        this.playerMon = PlayerState.pokemonTeam[0];
        const newPokemonName = this.playerMon.name;
        this.isProcessingTurn = true; // Lock controls
        this.showMessage(`${oldPokemonName}, come back! Go, ${newPokemonName}!`, () => {
            const newSpriteKey = `player_sprite_back_${this.playerMon.id}`;
            // Update UI text
            this.playerInfoText.setText(`${this.playerMon.name} Lv${this.playerMon.level}`);
            this.updateHpBars(0);
            const performSwap = () => {
                this.playerSprite.setTexture(newSpriteKey).setAlpha(1).setY(400).setAngle(0);
                this.enemyTurnAfterSwap();
            };
            // Handle sprite update
            if (this.textures.exists(newSpriteKey)) {
                performSwap();
            } else {
                const newSpriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${this.playerMon.id}.png`;
                this.load.image(newSpriteKey, newSpriteUrl);
                this.load.once('complete', performSwap, this);
                this.load.start();
            }
        });
    }

    private executeTurn(moveId: string) {
        if (this.isProcessingTurn) return;
        this.isProcessingTurn = true;
        this.movesMenu.setVisible(false);

        // Fallback to tackle if array errors
        const enemyMoveId = this.enemyMon.moves[Math.floor(Math.random() * this.enemyMon.moves.length)] || 'tackle';
        this.processActions(TurnManager.processTurn(this.playerMon, moveId, this.enemyMon, enemyMoveId));
    }

    private selectItemInBattle(itemId: string) {
        const item = Items[itemId];
        if (!item) return;

        this.hideAllMenus();

        if (itemId === 'Pokeball' || itemId === 'Great Ball') {
            this.attemptCatch(itemId);
        } else if (itemId === 'Revive') {
            this.showFaintedPokemonMenu();
        } else { // Potions, etc.
            this.useItemOnActive(itemId);
        }
    }

    private useItemOnActive(itemId: string) {
        if (this.isProcessingTurn) return;
        this.isProcessingTurn = true;

        const result = useItem(itemId, this.playerMon);
        this.showMessage(result.message, () => {
            if (result.success) {
                GameFeel.playSfx('heal');
                this.updateHpBars();
                this.enemyTurnAfterItemUse();
            } else {
                this.isProcessingTurn = false;
                GameFeel.playSfx('miss');
                this.showActionMenu();
            }
        });
    }

    private showFaintedPokemonMenu() {
        this.pokemonSelectMenu.removeAll(true);
        const fainted = PlayerState.pokemonTeam.filter(p => p && p.currentHp === 0);

        if (fainted.length === 0) {
            this.showMessage('No fainted Pokémon to revive.', () => this.showActionMenu());
            return;
        }

        fainted.forEach((pokemon, index) => {
            const y = -25 + (index * 50);
            this.pokemonSelectMenu.add(this.createMenuButton(0, y, pokemon.name, () => this.useItemOnBenched('Revive', pokemon)));
        });

        this.pokemonSelectMenu.add(this.createMenuButton(0, 75, 'CANCEL', () => { GameFeel.playSfx('menuMove'); this.showActionMenu(); }));
        this.pokemonSelectMenu.setVisible(true);
    }

    private attemptCatch(ballItemId: string) {
        if (this.isProcessingTurn) return;
        this.isProcessingTurn = true;
        this.itemsMenu.setVisible(false);

        if (this.isTrainerBattle) {
            this.showMessage("You can't steal another trainer's Pokémon!", () => {
                GameFeel.playSfx('miss');
                this.isProcessingTurn = false;
                this.showActionMenu();
            });
            return;
        }

        useItem(ballItemId, this.enemyMon); // This will decrement the count

        GameFeel.playSfx('catchThrow');
        this.showMessage(`You threw a ${Items[ballItemId].name}!`, () => {
            // Define base catch rates for early-game Pokémon
            const BASE_CATCH_RATES: Record<string, number> = {
                'Pidgey': 0.60,
                'Rattata': 0.65,
                'Caterpie': 0.75,
                'default': 0.25 // A reasonable default for other wild pokemon
            };

            // Calculate HP-based bonus
            const hpPercent = this.enemyMon.currentHp / this.enemyMon.maxHp;
            let hpBonus = 0;
            if (this.enemyMon.currentHp === 1) {
                hpBonus = 0.50; // +50% for Critical HP (1 HP)
            } else if (hpPercent <= 0.25) {
                hpBonus = 0.35; // +35% for being below 25% HP
            } else if (hpPercent <= 0.50) {
                hpBonus = 0.20; // +20% for being below 50% HP
            }

            const baseRate = BASE_CATCH_RATES[this.enemyMon.name] || BASE_CATCH_RATES['default'];
            const ballMultiplier = (ballItemId === 'Great Ball') ? 1.5 : 1.0;
            const finalCatchChance = Math.min(1.0, (baseRate + hpBonus) * ballMultiplier); // Cap at 100%

            if (Math.random() < finalCatchChance) {
                // --- SUCCESS ---
                if (PlayerState.pokemonTeam.length < 6) {
                    PlayerState.pokemonTeam.push(this.enemyMon);
                    this.showMessage(`Gotcha! ${this.enemyMon.name} was caught!`, () => {
                        // this.sound.play('item_use'); // Success sound
                        GameFeel.playSfx('catchSuccess');
                        this.time.delayedCall(1000, () => this.endBattle('win'));
                    });
                } else {
                    PlayerState.pokemonBox.push(this.enemyMon);
                    this.showMessage(`Gotcha! ${this.enemyMon.name} was caught and sent to the PC Box!`, () => {
                        // this.sound.play('item_use'); // Success sound
                        GameFeel.playSfx('catchSuccess');
                        this.time.delayedCall(1000, () => this.endBattle('win'));
                    });
                }
            } else {
                // --- FAILURE ---
                const failureMessages = ["The Pokemon broke free!", "Almost had it!"];
                const failureMessage = failureMessages[Math.floor(Math.random() * failureMessages.length)];
                this.showMessage(failureMessage, () => {
                    GameFeel.playSfx('miss');
                    // On failure, the enemy gets to attack.
                    const enemyMoveId = this.enemyMon.moves[Math.floor(Math.random() * this.enemyMon.moves.length)] || 'tackle';
                    this.processActions(TurnManager.processEnemyTurn(this.playerMon, this.enemyMon, enemyMoveId));
                });
            }
        });
    }

    private useItemOnBenched(itemId: string, target: PokemonInstance) {
        if (this.isProcessingTurn) return;
        this.isProcessingTurn = true;
        this.hideAllMenus();

        const result = useItem(itemId, target);
        this.showMessage(result.message, () => {
            if (result.success) {
                GameFeel.playSfx('heal');
                // The benched pokemon is revived. The enemy gets their turn.
                this.enemyTurnAfterItemUse();
            } else {
                this.isProcessingTurn = false;
                GameFeel.playSfx('miss');
                this.showActionMenu();
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
            if (action.moveUser) {
                const attacker = action.moveUser === 'player' ? this.playerSprite : this.enemySprite;
                const target = action.moveUser === 'player' ? this.enemySprite : this.playerSprite;
                GameFeel.animateAttack(this, attacker, target, () => undefined);
            }

            if (action.damage !== undefined) {
                this.updateHpBars(300);
                this.playDamageFeedback(action);
            } else if (action.missed && action.target) {
                const targetSprite = action.target === 'enemy' ? this.enemySprite : this.playerSprite;
                GameFeel.miss(this, targetSprite.x, targetSprite.y - 65);
            } else if (action.modifier === 'critical' && action.target) {
                const targetSprite = action.target === 'enemy' ? this.enemySprite : this.playerSprite;
                GameFeel.effectBurst(this, targetSprite.x, targetSprite.y - 30, 0xfacc15, 'CRITICAL');
            } else if (action.modifier === 'super' && action.target) {
                const targetSprite = action.target === 'enemy' ? this.enemySprite : this.playerSprite;
                GameFeel.effectBurst(this, targetSprite.x, targetSprite.y - 30, 0x38bdf8, 'SUPER');
            }

            // VICTORY: Enemy fainted
            if (action.isFaint && action.target === 'enemy') {
                GameFeel.faint(this, this.enemySprite, () => {
                    const xpGained = 20;
                    this.handleXpGain(xpGained);
                });
            }
            // DEFEAT: Player fainted, now showing "blacked out"
            else if (action.isFaint && action.target === 'player') {
                GameFeel.faint(this, this.playerSprite, () => this.handlePlayerPokemonFaint());
            }
            else {
                // If not a game-ending action, continue processing the rest of the turn's actions
                this.processActions(actions);
            }
        });
    }

    private playDamageFeedback(action: TurnAction) {
        if (!action.target || action.damage === undefined) return;

        const targetSprite = action.target === 'enemy' ? this.enemySprite : this.playerSprite;
        const color = action.modifier === 'critical'
            ? '#facc15'
            : action.modifier === 'super'
                ? '#38bdf8'
                : action.modifier === 'not-very'
                    ? '#a7f3d0'
                    : '#ffffff';

        GameFeel.hitReaction(this, targetSprite, action.modifier === 'critical');
        GameFeel.damageNumber(this, targetSprite.x, targetSprite.y - 78, `-${action.damage}`, color);

        if (action.modifier === 'critical') {
            GameFeel.effectBurst(this, targetSprite.x, targetSprite.y - 28, 0xfacc15, 'CRITICAL');
        } else if (action.modifier === 'super') {
            GameFeel.effectBurst(this, targetSprite.x, targetSprite.y - 28, 0x38bdf8, 'SUPER');
        }
    }

    // New method to handle player's Pokémon fainting
    private handlePlayerPokemonFaint() {
        const healthyPokemon = PlayerState.pokemonTeam.filter(p => p && p.currentHp > 0);

        if (healthyPokemon.length > 0) {
            this.isForcedSwitch = true;
            this.showMessage(`${this.playerMon.name} fainted! Choose a replacement.`, () => {
                this.scene.pause();
                this.scene.launch('TeamScene', { fromScene: 'BattleScene', inBattle: true, forceSwitch: true }); // Pass forceSwitch: true
            });
        } else {
            // All Pokémon fainted, game over
            this.showMessage(`All your Pokémon fainted! You blacked out!`, () => {
                this.time.delayedCall(1500, () => this.endBattle('loss'));
            });
        }
    }

    private handleXpGain(xpGained: number) {
        this.showMessage(`${this.playerMon.name} gained ${xpGained} XP!`, () => {
            console.log(`[XP DEBUG] Before: Level ${this.playerMon.level}, XP ${this.playerMon.xp}/${getXpForNextLevel(this.playerMon.level)}`);
            console.log(`[XP DEBUG] XP Gained: ${xpGained}`);

            const oldXp = this.playerMon.xp;
            const oldLevel = this.playerMon.level;
            const xpForOldLevel = getXpForNextLevel(oldLevel);
            const oldXpPercent = oldXp / xpForOldLevel;
    
            this.playerMon.xp += xpGained;
            this.playerMon.totalXp += xpGained;
    
            console.log(`[XP DEBUG] After gain: Total XP is now ${this.playerMon.xp}`);

            const levelUpResult = handleLevelUp(this.playerMon);
    
            if (!levelUpResult.leveledUp) {
                const newXpPercent = this.playerMon.xp / xpForOldLevel;
                this.playerXpText.setText(`XP: ${this.playerMon.xp} / ${xpForOldLevel}`);
                this.tweens.add({
                    targets: this.playerXpBar,
                    width: 200 * newXpPercent,
                    duration: 800,
                    ease: 'Power1',
                    onComplete: () => {
                        this.time.delayedCall(500, () => this.handleEnemyFaint());
                    }
                });
            } else { // Leveled up
                this.tweens.add({
                    targets: this.playerXpBar,
                    width: 200,
                    duration: 800 * (1 - oldXpPercent),
                    ease: 'Power1',
                    onComplete: () => {
                        this.showMessage(levelUpResult.message, () => {
                            this.playerInfoText.setText(`${this.playerMon.name} Lv${this.playerMon.level}`);
                            this.updateHpBars(0); // Snap to new values
    
                            if (levelUpResult.evolution) {
                                this.startEvolutionSequence(this.playerMon, levelUpResult.evolution.to);
                            } else {
                                this.time.delayedCall(1500, () => this.handleEnemyFaint());
                            }
                        });
                    }
                });
            }
        });
    }

    private startEvolutionSequence(pokemon: PokemonInstance, toSpecies: string) {
        this.scene.pause();
        this.scene.launch('EvolutionScene', { pokemon, to: toSpecies, fromScene: 'BattleScene' });

        this.scene.get('EvolutionScene').events.once('evolution-complete', () => {
            this.scene.resume();
            this.playerInfoText.setText(`${this.playerMon.name} Lv${this.playerMon.level}`);
            this.updateHpBars(0);
            
            const newSpriteKey = `player_sprite_back_${this.playerMon.id}`;
            if (!this.textures.exists(newSpriteKey)) {
                this.load.image(newSpriteKey, `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${this.playerMon.id}.png`);
                this.load.once('complete', () => this.playerSprite.setTexture(newSpriteKey).setAlpha(1).setY(400).setAngle(0), this);
                this.load.start();
            } else {
                this.playerSprite.setTexture(newSpriteKey).setAlpha(1).setY(400).setAngle(0);
            }

            this.time.delayedCall(1500, () => this.handleEnemyFaint());
        });
    }

    private handleEnemyFaint() {
        if (this.isTrainerBattle && this.trainer) {
            this.currentEnemyIndex++;
            if (this.currentEnemyIndex < this.enemyTeam.length) {
                this.enemyMon = this.enemyTeam[this.currentEnemyIndex];
                this.showMessage(`${this.trainer.name} is about to send in ${this.enemyMon.name}.`, () => {
                    this.switchEnemyPokemon();
                });
            } else {
                this.showMessage(`${this.trainer.name} is out of usable Pokémon!`, () => {
                    this.endBattle('win');
                });
            }
        } else {
            // Wild battle win
            const moneyGained = this.enemyMon.level * 15;
            PlayerState.money += moneyGained;
            this.showMessage(`You received $${moneyGained} for winning!`, () => {
                this.endBattle('win');
            });
        }
    }

    private switchEnemyPokemon() {
        const newSpriteKey = `enemy_sprite_${this.enemyMon.id}`;
        
        this.enemyInfoText.setText(`${this.enemyMon.name} Lv${this.enemyMon.level}`);
        this.updateHpBars(0);
        this.enemySprite.setAlpha(1).setY(220).setAngle(0);

        const showNextMon = () => {
            this.showMessage(`Go, ${this.enemyMon.name}!`, () => {
                this.isProcessingTurn = false;
                this.showActionMenu();
            });
        };

        if (this.textures.exists(newSpriteKey)) {
            this.enemySprite.setTexture(newSpriteKey).setAlpha(1).setY(220).setAngle(0);
            showNextMon();
        } else {
            this.load.image(newSpriteKey, `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${this.enemyMon.id}.png`);
            this.load.once('complete', () => {
                this.enemySprite.setTexture(newSpriteKey).setAlpha(1).setY(220).setAngle(0);
                showNextMon();
            }, this);
            this.load.start();
        }
    }

    private enemyTurnAfterSwap() {
        // Enemy gets a free turn after a switch
        const enemyMoveId = this.enemyMon.moves[Math.floor(Math.random() * this.enemyMon.moves.length)] || 'tackle';
        this.processActions(TurnManager.processEnemyTurn(this.playerMon, this.enemyMon, enemyMoveId));
    }

    private enemyTurnAfterItemUse() {
        // Enemy gets a free turn after an item is used
        const enemyMoveId = this.enemyMon.moves[Math.floor(Math.random() * this.enemyMon.moves.length)] || 'tackle';
        this.processActions(TurnManager.processEnemyTurn(this.playerMon, this.enemyMon, enemyMoveId));
    }

    private runAway() {
        this.showMessage('Got away safely!', () => this.endBattle('run'));
    }

    private endBattle(result: 'win' | 'loss' | 'run') {
        GameFeel.stopMusic();
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.events.emit('battle-ended', result));
    }
}
