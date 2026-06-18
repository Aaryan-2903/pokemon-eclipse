import { Scene, Input } from 'phaser';
import { EventBus } from './EventBus';
import { Player } from './Player';
import { NPC } from './NPC';
import { DialogueBox } from './DialogueBox';
import { Dialogues, DialogueNode } from './dialogues';
import { QuestTracker } from './QuestTracker';
import { StoryManager, StoryFlag } from './StoryManager';
import { Route1Data } from './RouteData';
import { EncounterManager } from './EncounterManager';
import { generatePlayerPokemon, PokemonInstance } from './PokemonData';
import { PlayerState } from './PlayerData';
import { getTrainer, Trainer } from './TrainerData';
import { SaveManager } from './SaveManager';
import { GameFeel } from './GameFeel';

export class Route1Scene extends Scene {
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
    private currentDialogueIndex: number = 0;
    private spawnEntrance?: string;
    private spawnX?: number;
    private spawnY?: number;
    private encounterManager!: EncounterManager;
    private rivalTriggerZone!: Phaser.GameObjects.Zone;
    private playerLastPosForEncounter!: Phaser.Math.Vector2;
    private isPausedByMenu: boolean = false;
    private readonly STEP_DISTANCE_FOR_ENCOUNTER_CHECK = 32; // pixels per step

    constructor() {
        super('Route1Scene');
    }

    init(data: any) {
        console.log('[Route1Scene] init/start', data);
        this.spawnEntrance = data.spawnEntrance;
        this.spawnX = data.spawnX;
        this.spawnY = data.spawnY;
    }

    create() {
        console.log('[Route1Scene] create start');
        GameFeel.startMusic(this, 'route');

        // --- DEBUG: Ensure player has a Pokémon for testing ---
        if (PlayerState.pokemonTeam.length === 0) {
            console.warn('No player Pokémon found! Creating a default Charmander for testing.');
            const defaultStarter = generatePlayerPokemon('Charmander', 5);
            PlayerState.pokemonTeam.push(defaultStarter);
        }
        // --- END DEBUG ---

        console.log('[Route1Scene] current player Pokemon on load:', PlayerState.pokemonTeam[0]);

        console.log(`[Route1Scene] loading route data: ${Route1Data.name}`);
        this.verifyRequiredTextures();

        // Redesigned Route 1: 4x larger and explorable
        const worldWidth = 5000;
        const worldHeight = 5000;
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

        // Grass Background
        this.add.tileSprite(worldWidth / 2, worldHeight / 2, worldWidth, worldHeight, 'grass').setDepth(0);

        // Redesigned Paths
        this.add.tileSprite(2500, 4500, 256, 1000, 'path').setDepth(1); // South path
        this.add.tileSprite(2500, 3750, 1000, 256, 'path').setDepth(1); // Fork
        this.add.tileSprite(2000, 2500, 256, 2500, 'path').setDepth(1); // West path
        this.add.tileSprite(3000, 2500, 256, 2500, 'path').setDepth(1); // East path
        this.add.tileSprite(2500, 1250, 1000, 256, 'path').setDepth(1); // Rejoin
        this.add.tileSprite(2500, 600, 256, 1200, 'path').setDepth(1); // North path

        // Redesigned Tall Grass Areas
        this.tallGrassZones = this.physics.add.staticGroup();
        const addTallGrass = (x: number, y: number, width: number, height: number) => {
            this.add.tileSprite(x, y, width, height, 'tall_grass').setDepth(0.5);
            this.tallGrassZones.create(x, y).setSize(width, height).setVisible(false);
        };
        addTallGrass(1500, 3500, 1024, 1024); // Large west field
        addTallGrass(3500, 3500, 1024, 1024); // Large east field
        addTallGrass(2500, 2000, 2048, 512); // Central grass patch
        addTallGrass(1000, 1000, 512, 512); // Hidden north-west patch

        this.obstacles = this.physics.add.staticGroup();
        this.entrances = this.physics.add.staticGroup();
        this.npcZones = this.physics.add.staticGroup();
        this.itemPickups = this.physics.add.staticGroup();

        // Environment: Route Boundaries (Trees)
        for (let x = 0; x <= worldWidth; x += 64) {
            if (x < 2400 || x > 2600) {
                this.obstacles.create(x, 100, 'tree').setDepth(2); // North Edge
                this.obstacles.create(x, worldHeight - 100, 'tree').setDepth(2); // South Edge
            }
        }
        for (let y = 100; y <= worldHeight - 100; y += 64) {
            this.obstacles.create(100, y, 'tree').setDepth(2); // West Edge
            this.obstacles.create(worldWidth - 100, y, 'tree').setDepth(2); // East Edge
        }

        // Scenery, fences, rocks
        this.obstacles.create(2200, 3750, 'fence').setDepth(2);
        this.obstacles.create(2800, 3750, 'fence').setDepth(2);
        this.obstacles.create(1000, 2000, 'rock').setDepth(2);
        this.obstacles.create(4000, 1500, 'rock').setDepth(2);
        this.obstacles.create(4200, 1600, 'rock').setDepth(2);

        // Water hazard area
        this.add.tileSprite(3800, 1000, 512, 256, 'water').setDepth(0.5);
        const pondZone = this.add.zone(3800, 1000, 512, 256);
        this.physics.add.existing(pondZone, true);
        this.obstacles.add(pondZone);

        // Route signs
        this.obstacles.create(2700, 4800, 'sign').setDepth(2);
        this.add.text(2700, 4770, 'Route 1\nNorth: Lunar City\nSouth: Eclipse Town', {
            fontFamily: 'monospace', fontSize: '12px', color: '#ffffff',
            backgroundColor: '#000000aa', padding: { x: 4, y: 2 }, align: 'center'
        }).setOrigin(0.5).setDepth(5);

        const addSign = (x: number, y: number, dialogueId: string) => {
            const sign = new NPC(this, x, y, 'sign', dialogueId);
            this.obstacles.add(sign);
            this.npcZones.add(sign.interactionZone);
        };
        addSign(2200, 3850, 'route1_sign_west');
        addSign(2800, 3850, 'route1_sign_east');

        // NPCs
        const addNPC = (x: number, y: number, key: string, dialogueId: string, label: string, trainerId?: string) => {
            const npc = new NPC(this, x, y, key, dialogueId, trainerId);
            this.obstacles.add(npc); 
            this.npcZones.add(npc.interactionZone);
            this.add.text(x, y - 36, label, {
                fontFamily: 'monospace', fontSize: '12px', color: '#ffffff',
                backgroundColor: '#000000aa', padding: { x: 4, y: 2 }
            }).setOrigin(0.5).setDepth(20);
        };

        // Add Trainers
        addNPC(2500, 4200, 'npc_youngster', 'route1_youngster', 'Youngster Joey', 'route1_joey'); // First trainer
        addNPC(2000, 3000, 'npc_bugcatcher', 'route1_bugcatcher', 'Bug Catcher Tim', 'route1_tim'); // West path
        addNPC(3000, 3000, 'npc_traveler', 'route1_lass', 'Lass Chloe', 'route1_lass'); // East path
        addNPC(2000, 1500, 'npc_traveler', 'route1_hiker', 'Hiker Mike', 'route1_hiker_mike'); // West path, stronger

        // Rival battle is now a triggered event, not a static NPC
        // addNPC(2500, 800, 'npc_kai', 'kai_intro', 'Rival Kai', 'route1_kai'); // Near the end

        // Add regular NPCs
        addNPC(1000, 3500, 'npc_youngster', 'route1_kid', 'Kid');
        addNPC(4000, 3500, 'npc_bugcatcher', 'route1_collector', 'Collector');
        addNPC(1000, 1500, 'npc_traveler', 'route1_scientist', 'Scientist');
        addNPC(4000, 800, 'npc_traveler', 'route1_veteran', 'Veteran Trainer');

        // Add Item Pickups
        this.addItemPickup(1200, 4500, 'Potion'); // Hidden in trees south-west
        this.addItemPickup(4500, 1200, 'Pokeball'); // Hidden in a dead-end east
        this.addItemPickup(500, 500, 'Potion'); // Hidden in north-west corner

        // Map Transition: Return to Eclipse Town
        const townZone = this.add.zone(2500, worldHeight - 50, 200, 40);
        this.physics.add.existing(townZone, true);
        townZone.setData('targetScene', 'OverworldScene');
        this.entrances.add(townZone);

        // Map Transition: North to Lunar City
        const lunarCityZone = this.add.zone(2500, 50, 200, 40);
        this.physics.add.existing(lunarCityZone, true);
        lunarCityZone.setData('targetScene', 'LunarCityScene');
        this.entrances.add(lunarCityZone);

        // Rival Battle Trigger Zone
        this.rivalTriggerZone = this.add.zone(2500, 900, 256, 40);
        this.physics.add.existing(this.rivalTriggerZone, true);

        // Spawn location logic
        let spawnX = this.spawnX, spawnY = this.spawnY;
        if (spawnX === undefined || spawnY === undefined) {
            spawnX = 2500; spawnY = worldHeight - 150; // default
            if (this.spawnEntrance === 'town') { 
                spawnX = 2500; 
                spawnY = worldHeight - 150; 
            } else if (this.spawnEntrance === 'lunar_city') {
                spawnX = 2500;
                spawnY = 100;
            }
        }

        this.player = new Player(this, spawnX, spawnY);
        this.playerLastPosForEncounter = new Phaser.Math.Vector2(this.player.x, this.player.y);

        // Camera Setup
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(1.5);
        this.physics.add.collider(this.player, this.obstacles);

        // Encounter System
        this.encounterManager = new EncounterManager(this);

        // UI & Quest System Trigger
        this.dialogueBox = new DialogueBox(this);
        this.questTracker = new QuestTracker(this);
        this.hudText = this.add.text(16, 16, '', {
            fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
            backgroundColor: '#00000099', padding: { x: 8, y: 8 },
            wordWrap: { width: 250 }
        }).setScrollFactor(0).setDepth(100);

        // Autosave indicator
        this.autoSaveIndicator = this.add.text(this.cameras.main.displayWidth / 2, 16, '', {
            fontFamily: 'monospace', fontSize: '14px', color: '#22c55e',
            backgroundColor: '#000000aa', padding: { x: 8, y: 4 }
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(200).setAlpha(0);

        EventBus.on('save-game-from-menu', this.manualSave, this);
        this.events.on('shutdown', () => {
            console.log('[Route1Scene] shutdown');
            // Clean up listeners and DOM elements to prevent memory leaks
            EventBus.off('save-game-from-menu', this.manualSave, this);
        });

        this.events.on('resume', () => {
            this.isPausedByMenu = false;
            // When the scene resumes from a paused state (e.g., closing the menu), re-enable player movement.
            if (!this.activeDialogue) {
                this.player.setMovementEnabled(true);
            }
        });

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

        // Story Progression
        if (!StoryManager.getInstance().hasFlag(StoryFlag.HAS_ENTERED_ROUTE_1)) {
            StoryManager.getInstance().setFlag(StoryFlag.HAS_ENTERED_ROUTE_1);
            StoryManager.getInstance().setActiveQuest("Explore Route 1");
            EventBus.emit('quest-updated');
            
            this.time.delayedCall(500, () => {
                this.dialogueBox.show('System', 'Quest Complete: Travel to Route 1\nNew Quest: Explore Route 1');
                this.activeDialogue = [{ speaker: 'System', text: 'Quest Complete: Travel to Route 1\nNew Quest: Explore Route 1' }];
                this.currentDialogueIndex = 0;
                this.player.setMovementEnabled(false);
            });
        }

        EventBus.emit('current-scene-ready', this);
        console.log('[Route1Scene] create complete');
    }

    private verifyRequiredTextures() {
        const requiredTextures = [
            'grass',
            'path',
            'tall_grass',
            'tree',
            'fence',
            'rock',
            'water',
            'sign',
            'pokeball_item',
            'npc_youngster',
            'npc_bugcatcher',
            'npc_traveler',
            'npc_kai',
            'player_texture',
            'selector_arrow'
        ];

        const missingTextures = requiredTextures.filter(key => !this.textures.exists(key));
        if (missingTextures.length > 0) {
            console.error('[Route1Scene] missing required textures:', missingTextures);
        } else {
            console.log('[Route1Scene] required textures verified');
        }
    }

    private addItemPickup(x: number, y: number, itemId: string) {
        const itemSprite = this.itemPickups.create(x, y, 'pokeball_item').setDepth(1);
        itemSprite.setData('itemId', itemId);
        itemSprite.refreshBody();
    }

    private openMenu() {
        this.isPausedByMenu = true;
        // Explicitly disable player movement before pausing the scene to prevent background input.
        this.player.setMovementEnabled(false);
        this.interactionText.setVisible(false); // Hide interaction prompts
        this.scene.pause();
        this.scene.launch('MenuScene', { fromScene: this.scene.key });
    }

    private startDialogue(dialogueId: string) {
        if (!Dialogues[dialogueId]) return;
        this.activeDialogue = Dialogues[dialogueId];
        this.currentDialogueIndex = 0;
        this.player.setMovementEnabled(false);
        this.interactionText.setVisible(false);
        this.showCurrentDialogue();
    }

    // Reuse Dialogue functions (abbreviated here, identical to OverworldScene)
    private showCurrentDialogue() { 
        if (!this.activeDialogue) return;
        this.dialogueBox.show(this.activeDialogue[this.currentDialogueIndex].speaker, this.activeDialogue[this.currentDialogueIndex].text, this.activeDialogue[this.currentDialogueIndex].portrait); 
    }
    private progressDialogue() { this.currentDialogueIndex++; if (!this.activeDialogue || this.currentDialogueIndex >= this.activeDialogue.length) { this.activeDialogue = null; this.dialogueBox.hide(); this.player.setMovementEnabled(true); } else { this.showCurrentDialogue(); } }

    private triggerEncounter(enemyMon: PokemonInstance) {
        console.log('Encounter triggered!');
        PlayerState.pokedex.seen.add(enemyMon.name);
        this.player.setMovementEnabled(false);

        // 1. Screen flash effect
        this.cameras.main.flash(300, 255, 255, 255);

        // 2. Transition to encounter scene
        this.time.delayedCall(300, () => {
            console.log('About to start BattleScene...');
            this.scene.pause();
            
            if (PlayerState.pokemonTeam.length === 0) {
                console.error("Battle triggered without a player Pokémon.");
                this.scene.resume(); // Abort battle and resume route
                this.player.setMovementEnabled(true);
                return;
            }

            this.scene.launch('BattleScene', {
                enemyMon
            });

            // 3. Resume this scene when the encounter is over
            this.scene.get('BattleScene').events.once('battle-ended', (result: 'win' | 'loss' | 'run') => {
                console.log(`Battle ended with result: ${result}`);
                this.scene.stop('BattleScene');
                if (result === 'loss') {
                    PlayerState.pokemonTeam.forEach(p => p.currentHp = p.maxHp); // Heal party
                    this.scene.start('InteriorScene', { entranceId: 'home' });
                } else {
                    if (result === 'win') { // This also covers catching, as it ends in a 'win'
                        this.autoSave();
                    }
                    this.cameras.main.fadeIn(250, 0, 0, 0);
                    this.scene.resume(); // Explicitly resume the scene
                    this.player.setMovementEnabled(true);
                }
            });
        });
    }

    private startTrainerBattle(trainer: Trainer, onBattleEnd?: (result: 'win' | 'loss' | 'run') => void) {
        this.player.setMovementEnabled(false);
        trainer.team.forEach(p => PlayerState.pokedex.seen.add(p.name));
        this.interactionText.setVisible(false);
    
        // Show pre-battle dialogue
        this.activeDialogue = [{ speaker: trainer.name, text: trainer.preBattleDialogue, portrait: `portrait_${trainer.spriteKey.replace('npc_', '')}` }];
        this.currentDialogueIndex = 0;
        this.showCurrentDialogue();
    
        // Temporarily override progressDialogue to launch the battle after the dialogue finishes
        const originalProgress = this.progressDialogue.bind(this);
        this.progressDialogue = () => {
            this.progressDialogue = originalProgress; // Restore original function
            this.dialogueBox.hide();
            this.activeDialogue = null;
    
            this.cameras.main.flash(300, 0, 0, 0);
            this.time.delayedCall(300, () => {
                this.scene.pause();
                this.scene.launch('BattleScene', { trainer });
    
                this.scene.get('BattleScene').events.once('battle-ended', (result: 'win' | 'loss' | 'run') => {
                    console.log(`Trainer battle ended with result: ${result}`);
                    this.scene.stop('BattleScene');
                    this.cameras.main.fadeIn(250, 0, 0, 0);

                    if (onBattleEnd) {
                        onBattleEnd(result);
                    }

                    this.scene.resume();
                    
                    if (result === 'win') {
                        PlayerState.defeatedTrainers.add(trainer.id);
                        PlayerState.money += trainer.rewardMoney;
                        this.autoSave(); // Auto-save after winning
                        this.startDialogue(`${trainer.id}_defeated`);
                        // Post-battle dialogue will re-enable player movement
                    } else if (result === 'loss') {
                        // On loss, send player to the nearest Pokemon Center (Eclipse Town)
                        this.scene.start('InteriorScene', { entranceId: 'center', parentScene: 'OverworldScene' });
                    }
                });
            });
        };
    }

    private triggerRivalBattle() {
        if (PlayerState.defeatedTrainers.has('route1_kai') || !this.player.canMove()) {
            if (this.rivalTriggerZone.active) this.rivalTriggerZone.destroy();
            return;
        }
    
        this.player.setMovementEnabled(false);
        if (this.rivalTriggerZone.active) this.rivalTriggerZone.destroy();
    
        const rivalNPC = this.add.sprite(this.player.x, this.player.y - 200, 'npc_kai');
        rivalNPC.setDepth(10);
        rivalNPC.setAlpha(0);
    
        this.tweens.add({
            targets: rivalNPC,
            y: this.player.y - 64,
            alpha: 1,
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                const trainer = getTrainer('route1_kai');
                if (trainer) {
                    this.startTrainerBattle(trainer, (result) => {
                        if (result === 'win') {
                            this.tweens.add({
                                targets: rivalNPC,
                                alpha: 0,
                                y: rivalNPC.y - 50,
                                duration: 500,
                                onComplete: () => rivalNPC.destroy()
                            });
                        } else {
                            rivalNPC.destroy();
                        }
                    });
                }
            }
        });
    }

    update(time: number, delta: number) {
        // If the menu is open, do not process any game logic for this scene.
        if (this.isPausedByMenu) {
            return;
        }

        if (this.activeDialogue) {
            if (Input.Keyboard.JustDown(this.interactKey) || Input.Keyboard.JustDown(this.spaceKey) || Input.Keyboard.JustDown(this.enterKey)) this.progressDialogue();
            return;
        }

        if (Input.Keyboard.JustDown(this.escKey)) {
            this.openMenu();
            return;
        }

        if (Input.Keyboard.JustDown(this.teamKey)) {
            this.scene.pause();
            this.scene.launch('TeamScene', { fromScene: this.scene.key, inBattle: false });
            return;
        }

        if (Input.Keyboard.JustDown(this.badgeKey)) {
            this.scene.pause();
            this.scene.launch('BadgeScene', { fromScene: this.scene.key });
            return;
        }

        if (!this.player.canMove()) return;

        this.player.update(time, delta);
        this.hudText.setText(`Location: Route 1\nPosition: X: ${Math.round(this.player.x)}, Y: ${Math.round(this.player.y)}`);

        let transitionScene: string | null = null;
        this.physics.overlap(this.player, this.entrances, (_player, entrance) => { transitionScene = (entrance as Phaser.GameObjects.GameObject).getData('targetScene'); });
        if (transitionScene) { 
            console.log(`[Route1Scene] transition requested -> ${transitionScene}`);
            this.autoSave();
            GameFeel.fadeToScene(this, transitionScene, { spawnEntrance: transitionScene === 'OverworldScene' ? 'route1' : 'lunar_city' }); 
            return; 
        }

        if (this.rivalTriggerZone.active) {
            this.physics.overlap(this.player, this.rivalTriggerZone, this.triggerRivalBattle, undefined, this);
        }

        // Item Pickup Logic
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
        this.physics.overlap(this.player, this.npcZones, (_player, zone) => { 
            const go = zone as Phaser.GameObjects.GameObject;
            this.currentNPC = go.getData('dialogueId');
            currentTrainerId = go.getData('trainerId');
        });

        let interactionMessage = '';
        if (this.currentNPC) {
            if (currentTrainerId && !PlayerState.defeatedTrainers.has(currentTrainerId)) {
                interactionMessage = 'Press E to Battle';
            } else {
                interactionMessage = 'Press E to Talk';
            }
        }

        if (interactionMessage) {
            this.interactionText.setText(interactionMessage).setPosition(this.player.x, this.player.y - 56).setVisible(true);
            if (Input.Keyboard.JustDown(this.interactKey)) {
                const trainer = currentTrainerId ? getTrainer(currentTrainerId) : null;
                if (trainer && !PlayerState.defeatedTrainers.has(trainer.id)) {
                    this.startTrainerBattle(trainer);
                } else {
                    this.startDialogue(currentTrainerId && PlayerState.defeatedTrainers.has(currentTrainerId) ? `${currentTrainerId}_defeated` : this.currentNPC!);
                }
            }
        } else { this.interactionText.setVisible(false); }

        // Wild Encounter Logic
        let inTallGrass = false;
        this.physics.overlap(this.player, this.tallGrassZones, () => {
            inTallGrass = true;
        });

        if (inTallGrass && this.player.isMoving()) {
            const distance = this.playerLastPosForEncounter.distance({ x: this.player.x, y: this.player.y });

            if (distance >= this.STEP_DISTANCE_FOR_ENCOUNTER_CHECK) {
                this.playerLastPosForEncounter.set(this.player.x, this.player.y);
                GameFeel.grassRustle(this, this.player.x, this.player.y + 10);
                const encounter = this.encounterManager.checkEncounter('Route1Scene');
                if (encounter) {
                    this.triggerEncounter(encounter);
                }
            }
        } else {
            // When not in grass or not moving, keep the last position updated
            // to prevent a large distance jump when re-entering grass.
            this.playerLastPosForEncounter.set(this.player.x, this.player.y);
        }
    }

    private manualSave() {
        SaveManager.save(this, this.player.x, this.player.y);
    }

    private autoSave() {
        SaveManager.save(this, this.player.x, this.player.y);
        this.showAutoSaveIndicator('Autosaving...');
    }

    private showAutoSaveIndicator(text: string) {
        this.autoSaveIndicator.setText(text);
        this.autoSaveIndicator.setAlpha(1);
        this.tweens.killTweensOf(this.autoSaveIndicator);
        this.tweens.add({
            targets: this.autoSaveIndicator,
            alpha: 0,
            delay: 1500,
            duration: 500,
            ease: 'Power2'
        });
    }
}
