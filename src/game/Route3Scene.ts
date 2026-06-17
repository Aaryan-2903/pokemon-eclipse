import { Scene, Input } from 'phaser';
import { EventBus } from './EventBus';
import { Player } from './Player';
import { NPC } from './NPC';
import { DialogueBox } from './DialogueBox';
import { Dialogues, DialogueNode } from './dialogues';
import { QuestTracker } from './QuestTracker';
import { StoryManager, StoryFlag } from './StoryManager';
import { EncounterManager } from './EncounterManager';
import { PokemonInstance, generatePlayerPokemon } from './PokemonData';
import { PlayerState } from './PlayerData';
import { getTrainer, Trainer } from './TrainerData';
import { SaveManager } from './SaveManager';
import { Route3Encounters } from './Route3Encounters';

export class Route3Scene extends Scene {
    private player!: Player;
    private obstacles!: Phaser.Physics.Arcade.StaticGroup;
    private entrances!: Phaser.Physics.Arcade.StaticGroup;
    private itemPickups!: Phaser.Physics.Arcade.StaticGroup;
    private npcZones!: Phaser.Physics.Arcade.StaticGroup;
    private hudText!: Phaser.GameObjects.Text;
    private autoSaveIndicator!: Phaser.GameObjects.Text;
    private tallGrassZones!: Phaser.Physics.Arcade.StaticGroup;
    private interactionText!: Phaser.GameObjects.Text;
    private interactKey!: Phaser.Input.Keyboard.Key;
    private spaceKey!: Phaser.Input.Keyboard.Key;
    private enterKey!: Phaser.Input.Keyboard.Key;
    private escKey!: Phaser.Input.Keyboard.Key;
    private teamKey!: Phaser.Input.Keyboard.Key;
    private badgeKey!: Phaser.Input.Keyboard.Key;
    private currentNPC: string | null = null;
    private dialogueBox!: DialogueBox;
    private questTracker!: QuestTracker;
    private activeDialogue: DialogueNode[] | null = null;
    private activeDialogueKey: string | null = null;
    private currentDialogueIndex: number = 0;
    private spawnEntrance?: string;
    private spawnX?: number;
    private spawnY?: number;
    private encounterManager!: EncounterManager;
    private playerLastPosForEncounter!: Phaser.Math.Vector2;
    private isPausedByMenu: boolean = false;
    private readonly STEP_DISTANCE_FOR_ENCOUNTER_CHECK = 32; // pixels per step

    constructor() {
        super('Route3Scene');
    }

    init(data: any) {
        this.spawnEntrance = data.spawnEntrance;
        this.spawnX = data.spawnX;
        this.spawnY = data.spawnY;
    }

    create() {
        console.log('Route3Scene loaded');

        // --- DEBUG: Ensure player has a Pokémon for testing ---
        if (PlayerState.pokemonTeam.length === 0) {
            console.warn('No player Pokémon found! Creating a default Charmander for testing.');
            const defaultStarter = generatePlayerPokemon('Charmander', 5);
            PlayerState.pokemonTeam.push(defaultStarter);
        }
        // --- END DEBUG ---

        const worldWidth = 4000;
        const worldHeight = 4000;
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

        this.add.tileSprite(worldWidth / 2, worldHeight / 2, worldWidth, worldHeight, 'grass').setDepth(0);

        // Main path
        this.add.tileSprite(worldWidth / 2, worldHeight / 2, 256, worldHeight, 'path').setDepth(1);

        // Tall Grass Patches
        this.tallGrassZones = this.physics.add.staticGroup();
        const addTallGrass = (x: number, y: number, width: number, height: number) => {
            this.add.tileSprite(x, y, width, height, 'tall_grass').setDepth(0.5);
            this.tallGrassZones.create(x, y).setSize(width, height).setVisible(false);
        };
        addTallGrass(1000, 1000, 512, 512);
        addTallGrass(3000, 1500, 768, 512);
        addTallGrass(1500, 3000, 1024, 256);

        this.obstacles = this.physics.add.staticGroup();
        this.entrances = this.physics.add.staticGroup();
        this.npcZones = this.physics.add.staticGroup();
        this.itemPickups = this.physics.add.staticGroup();

        // Environment: Trees and Rocks
        for (let x = 0; x <= worldWidth; x += 64) {
            if (x < 1900 || x > 2100) this.obstacles.create(x, 100, 'tree').setDepth(2); // North Edge
            if (x < 1900 || x > 2100) this.obstacles.create(x, worldHeight - 100, 'tree').setDepth(2); // South Edge
        }
        for (let y = 100; y <= worldHeight - 100; y += 64) {
            this.obstacles.create(100, y, 'tree').setDepth(2); // West Edge
            this.obstacles.create(worldWidth - 100, y, 'tree').setDepth(2); // East Edge
        }
        this.obstacles.create(500, 2000, 'rock').setDepth(2);
        this.obstacles.create(3500, 1000, 'rock').setDepth(2);

        // Signs
        this.obstacles.create(2200, 3800, 'sign').setDepth(2);
        this.add.text(2200, 3770, 'Route 3\nNorth: Veridia City\nSouth: Eclipse Forest', {
            fontFamily: 'monospace', fontSize: '12px', color: '#ffffff',
            backgroundColor: '#000000aa', padding: { x: 4, y: 2 }, align: 'center'
        }).setOrigin(0.5).setDepth(5);

        // NPCs
        const addNPC = (x: number, y: number, key: string, dialogueId: string, label: string, trainerId?: string) => {
            const npc = new NPC(this, x, y, key, dialogueId, trainerId);
            this.obstacles.add(npc); 
            this.npcZones.add(npc.interactionZone);
            this.add.text(x, y - 36, label, { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff', backgroundColor: '#000000aa', padding: { x: 4, y: 2 } }).setOrigin(0.5).setDepth(20);
        };

        // Trainers
        addNPC(2000, 3000, 'npc_youngster', 'route3_youngster_toby', 'Youngster Toby', 'route3_youngster_toby');

        // Regular NPCs
        addNPC(1500, 1500, 'npc_traveler', 'route3_hiker', 'Hiker');
        addNPC(2500, 1000, 'npc_traveler', 'route3_lass', 'Lass');

        // Item Pickups
        this.addItemPickup(1000, 2500, 'Pokeball');
        this.addItemPickup(3000, 500, 'Super Potion');

        // Transitions
        // South to Eclipse Forest
        const forestZone = this.add.zone(worldWidth / 2, worldHeight - 50, 200, 40);
        this.physics.add.existing(forestZone, true);
        forestZone.setData('targetScene', 'EclipseForestScene');
        this.entrances.add(forestZone);

        // North to Veridia City
        const cityZone = this.add.zone(worldWidth / 2, 50, 200, 40);
        this.physics.add.existing(cityZone, true);
        cityZone.setData('targetScene', 'VeridiaCityScene');
        this.entrances.add(cityZone);

        // Player Spawn
        let spawnX = this.spawnX, spawnY = this.spawnY;
        if (spawnX === undefined || spawnY === undefined) {
            spawnX = worldWidth / 2; spawnY = worldHeight - 150; // Default from Eclipse Forest
        }
        this.player = new Player(this, spawnX, spawnY);
        this.playerLastPosForEncounter = new Phaser.Math.Vector2(this.player.x, this.player.y);
        this.physics.add.collider(this.player, this.obstacles);

        // Camera
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(1.5);

        // Systems and UI
        this.encounterManager = new EncounterManager(this);
        this.dialogueBox = new DialogueBox(this);
        this.questTracker = new QuestTracker(this);
        this.hudText = this.add.text(16, 16, '', { fontFamily: 'monospace', fontSize: '14px', color: '#ffffff', backgroundColor: '#00000099', padding: { x: 8, y: 8 }, wordWrap: { width: 250 } }).setScrollFactor(0).setDepth(100);
        this.autoSaveIndicator = this.add.text(this.cameras.main.displayWidth / 2, 16, '', { fontFamily: 'monospace', fontSize: '14px', color: '#22c55e', backgroundColor: '#000000aa', padding: { x: 8, y: 4 } }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(200).setAlpha(0);
        this.interactionText = this.add.text(0, 0, 'Press E to Talk', {
            fontFamily: 'monospace', fontSize: '12px', color: '#000000',
            backgroundColor: '#ffffff', padding: { x: 6, y: 4 }
        }).setOrigin(0.5).setDepth(100).setVisible(false).setScrollFactor(1);

        if (this.input.keyboard) {
            this.interactKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.E);
            this.spaceKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.SPACE);
            this.enterKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.ENTER);
            this.escKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.ESC);
            this.teamKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.T);
            this.badgeKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.B);
        }

        // Story Events
        if (!StoryManager.getInstance().hasFlag(StoryFlag.UNLOCKED_ROUTE3)) {
            // This scene should only be accessible if UNLOCKED_ROUTE3 is true,
            // but as a fallback, if somehow entered, set quest.
            StoryManager.getInstance().setActiveQuest("Travel to Veridia City via Route 3");
            EventBus.emit('quest-updated');
        }

        EventBus.on('save-game-from-menu', this.manualSave, this);
        this.events.on('shutdown', () => { EventBus.off('save-game-from-menu', this.manualSave, this); });
        this.events.on('resume', () => {
            this.isPausedByMenu = false;
            if (!this.activeDialogue) this.player.setMovementEnabled(true);
        });

        EventBus.emit('current-scene-ready', this);
    }

    private addItemPickup(x: number, y: number, itemId: string) {
        const itemSprite = this.itemPickups.create(x, y, 'pokeball_item').setDepth(1);
        itemSprite.setData('itemId', itemId);
        itemSprite.refreshBody();
    }

    private openMenu() {
        this.isPausedByMenu = true;
        this.player.setMovementEnabled(false);
        this.interactionText.setVisible(false);
        this.scene.pause();
        this.scene.launch('MenuScene', { fromScene: this.scene.key });
    }

    private startDialogue(dialogueId: string) {
        if (!Dialogues[dialogueId]) return;
        this.activeDialogueKey = dialogueId;
        this.activeDialogue = Dialogues[dialogueId];
        this.currentDialogueIndex = 0;
        this.player.setMovementEnabled(false);
        this.interactionText.setVisible(false);
        this.showCurrentDialogue();
    }

    private showCurrentDialogue() { 
        if (!this.activeDialogue) return;
        this.dialogueBox.show(this.activeDialogue[this.currentDialogueIndex].speaker, this.activeDialogue[this.currentDialogueIndex].text, this.activeDialogue[this.currentDialogueIndex].portrait); 
    }

    private progressDialogue() { 
        this.currentDialogueIndex++; 
        if (!this.activeDialogue || this.currentDialogueIndex >= this.activeDialogue.length) { 
            this.endDialogue();
        } else { 
            this.showCurrentDialogue(); 
        } 
    }

    private endDialogue() {
        this.dialogueBox.hide();
        this.activeDialogueKey = null;
        this.activeDialogue = null;
        this.player.setMovementEnabled(true);
    }

    private triggerEncounter(enemyMon: PokemonInstance) {
        this.player.setMovementEnabled(false);
        this.cameras.main.flash(300, 255, 255, 255);
        this.time.delayedCall(300, () => {
            this.scene.pause();
            this.scene.launch('BattleScene', { enemyMon });
            this.scene.get('BattleScene').events.once('battle-ended', (result: 'win' | 'loss' | 'run') => {
                this.scene.stop('BattleScene');
                if (result === 'loss') {
                    PlayerState.pokemonTeam.forEach(p => p.currentHp = p.maxHp);
                    this.scene.start('InteriorScene', { entranceId: 'center', parentScene: 'OverworldScene' });
                } else {
                    if (result === 'win') this.autoSave();
                    this.cameras.main.fadeIn(250, 0, 0, 0);
                    this.scene.resume();
                    this.player.setMovementEnabled(true);
                }
            });
        });
    }

    private startTrainerBattle(trainer: Trainer) {
        this.player.setMovementEnabled(false);
        this.interactionText.setVisible(false);
        this.activeDialogue = [{ speaker: trainer.name, text: trainer.preBattleDialogue, portrait: `portrait_${trainer.spriteKey.replace('npc_', '')}` }];
        this.currentDialogueIndex = 0;
        this.showCurrentDialogue();
        const originalProgress = this.progressDialogue.bind(this);
        this.progressDialogue = () => {
            this.progressDialogue = originalProgress;
            this.dialogueBox.hide();
            this.activeDialogue = null;
            this.cameras.main.flash(300, 0, 0, 0);
            this.time.delayedCall(300, () => {
                this.scene.pause();
                this.scene.launch('BattleScene', { trainer });
                this.scene.get('BattleScene').events.once('battle-ended', (result: 'win' | 'loss' | 'run') => {
                    this.scene.stop('BattleScene');
                    this.cameras.main.fadeIn(250, 0, 0, 0);
                    this.scene.resume();
                    if (result === 'win') {
                        PlayerState.defeatedTrainers.add(trainer.id);
                        PlayerState.money += trainer.rewardMoney;
                        this.autoSave();
                        this.startDialogue(`${trainer.id}_defeated`);
                    } else if (result === 'loss') {
                        this.scene.start('InteriorScene', { entranceId: 'center', parentScene: 'OverworldScene' });
                    }
                });
            });
        };
    }

    update(time: number, delta: number) {
        if (this.isPausedByMenu) return;

        if (this.activeDialogue) {
            if (Input.Keyboard.JustDown(this.interactKey) || Input.Keyboard.JustDown(this.spaceKey) || Input.Keyboard.JustDown(this.enterKey)) this.progressDialogue();
            return;
        }

        if (Input.Keyboard.JustDown(this.escKey)) { this.openMenu(); return; }
        if (Input.Keyboard.JustDown(this.teamKey)) { this.scene.pause(); this.scene.launch('TeamScene', { fromScene: this.scene.key, inBattle: false }); return; }
        if (Input.Keyboard.JustDown(this.badgeKey)) { this.scene.pause(); this.scene.launch('BadgeScene', { fromScene: this.scene.key }); return; }

        if (!this.player.canMove()) return;

        this.player.update(time, delta);
        this.hudText.setText(`Location: Route 3\nPosition: X: ${Math.round(this.player.x)}, Y: ${Math.round(this.player.y)}`);

        let transitionScene: string | null = null;
        this.physics.overlap(this.player, this.entrances, (_player, entrance) => { transitionScene = (entrance as Phaser.GameObjects.GameObject).getData('targetScene'); });
        if (transitionScene) {
            this.autoSave();
            this.scene.start(transitionScene, { spawnEntrance: 'route3' });
            return;
        }

        this.physics.overlap(this.player, this.itemPickups, (_player, itemPickupObj) => {
            const itemPickup = itemPickupObj as Phaser.GameObjects.GameObject;
            const itemId = itemPickup.getData('itemId') as string;
            if (itemId) {
                PlayerState.inventory[itemId] = (PlayerState.inventory[itemId] || 0) + 1;
                this.startDialogue(`found_${itemId.toLowerCase()}`);
                itemPickup.destroy();
            }
        });

        this.currentNPC = null;
        let currentTrainerId: string | null = null;
        this.physics.overlap(this.player, this.npcZones, (_player, zone) => { const go = zone as Phaser.GameObjects.GameObject; this.currentNPC = go.getData('dialogueId'); currentTrainerId = go.getData('trainerId'); });

        let interactionMessage = '';
        if (this.currentNPC) {
            if (currentTrainerId && !PlayerState.defeatedTrainers.has(currentTrainerId)) interactionMessage = 'Press E to Battle';
            else interactionMessage = 'Press E to Talk';
        }

        if (interactionMessage) {
            this.interactionText.setText(interactionMessage).setPosition(this.player.x, this.player.y - 56).setVisible(true);
            if (Input.Keyboard.JustDown(this.interactKey)) {
                const trainer = currentTrainerId ? getTrainer(currentTrainerId) : null;
                if (trainer && !PlayerState.defeatedTrainers.has(trainer.id)) this.startTrainerBattle(trainer);
                else this.startDialogue(currentTrainerId && PlayerState.defeatedTrainers.has(currentTrainerId) ? `${currentTrainerId}_defeated` : this.currentNPC!);
            }
        } else {
            this.interactionText.setVisible(false);
        }

        let inTallGrass = false;
        this.physics.overlap(this.player, this.tallGrassZones, () => { inTallGrass = true; });

        if (inTallGrass && this.player.isMoving()) {
            const distance = this.playerLastPosForEncounter.distance({ x: this.player.x, y: this.player.y });
            if (distance >= this.STEP_DISTANCE_FOR_ENCOUNTER_CHECK) {
                this.playerLastPosForEncounter.set(this.player.x, this.player.y);
                const encounter = this.encounterManager.checkEncounter('Route3Scene');
                if (encounter) this.triggerEncounter(encounter);
            }
        } else {
            this.playerLastPosForEncounter.set(this.player.x, this.player.y);
        }
    }

    private manualSave() { SaveManager.save(this, this.player.x, this.player.y); }
    private autoSave() { SaveManager.save(this, this.player.x, this.player.y); this.showAutoSaveIndicator('Autosaving...'); }
    private showAutoSaveIndicator(text: string) {
        this.autoSaveIndicator.setText(text);
        this.autoSaveIndicator.setAlpha(1);
        this.tweens.killTweensOf(this.autoSaveIndicator);
        this.tweens.add({ targets: this.autoSaveIndicator, alpha: 0, delay: 1500, duration: 500, ease: 'Power2' });
    }
}