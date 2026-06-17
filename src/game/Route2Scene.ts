import { Scene, Input } from 'phaser';
import { EventBus } from './EventBus';
import { Player } from './Player';
import { NPC } from './NPC';
import { DialogueBox } from './DialogueBox';
import { Dialogues, DialogueNode } from './dialogues';
import { QuestTracker } from './QuestTracker';
import { StoryManager, StoryFlag } from './StoryManager';
import { EncounterManager } from './EncounterManager';
import { generatePlayerPokemon, PokemonInstance } from './PokemonData';
import { PlayerState } from './PlayerData';
import { getTrainer, Trainer } from './TrainerData';
import { SaveManager } from './SaveManager';
import { Route2Encounters } from './Route2Encounters';

export class Route2Scene extends Scene {
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
    private playerLastPosForEncounter!: Phaser.Math.Vector2;
    private isPausedByMenu: boolean = false;
    private readonly STEP_DISTANCE_FOR_ENCOUNTER_CHECK = 32; // pixels per step

    constructor() {
        super('Route2Scene');
    }

    init(data: any) {
        this.spawnEntrance = data.spawnEntrance;
        this.spawnX = data.spawnX;
        this.spawnY = data.spawnY;
    }

    create() {
        console.log('Route2Scene loaded');

        // --- DEBUG: Ensure player has a Pokémon for testing ---
        if (PlayerState.pokemonTeam.length === 0) {
            console.warn('No player Pokémon found! Creating a default Charmander for testing.');
            const defaultStarter = generatePlayerPokemon('Charmander', 5);
            PlayerState.pokemonTeam.push(defaultStarter);
        }
        // --- END DEBUG ---

        // Larger World Bounds for exploration (3000x3000)
        const worldWidth = 3000;
        const worldHeight = 3000;
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

        // Background
        this.add.tileSprite(worldWidth / 2, worldHeight / 2, worldWidth, worldHeight, 'grass').setDepth(0);

        // Main dirt pathway
        this.add.tileSprite(worldWidth / 2, worldHeight / 2, 256, worldHeight, 'path').setDepth(1);

        // Exploration Areas: Tall Grass Patches
        this.tallGrassZones = this.physics.add.staticGroup();
        const addTallGrass = (x: number, y: number, width: number, height: number) => {
            this.add.tileSprite(x, y, width, height, 'tall_grass').setDepth(0.5);
            this.tallGrassZones.create(x, y).setSize(width, height).setVisible(false);
        };
        addTallGrass(500, 500, 512, 256);
        addTallGrass(2500, 500, 512, 256);
        addTallGrass(1500, 1000, 768, 512);
        addTallGrass(500, 2000, 256, 512);
        addTallGrass(2500, 2000, 256, 512);
        addTallGrass(1500, 2500, 1024, 256);

        this.obstacles = this.physics.add.staticGroup();
        this.entrances = this.physics.add.staticGroup();
        this.npcZones = this.physics.add.staticGroup();
        this.itemPickups = this.physics.add.staticGroup();

        // Environment: Route Boundaries (Trees)
        for (let x = 0; x <= worldWidth; x += 64) {
            if (x < 1400 || x > 1600) {
                this.obstacles.create(x, 100, 'tree').setDepth(2); // North Edge
                this.obstacles.create(x, worldHeight - 100, 'tree').setDepth(2); // South Edge
            }
        }
        for (let y = 0; y <= worldHeight; y += 64) {
            this.obstacles.create(100, y, 'tree').setDepth(2); // West Edge
            this.obstacles.create(worldWidth - 100, y, 'tree').setDepth(2); // East Edge
        }

        // Decorative environment items
        this.obstacles.create(worldWidth / 2 - 500, worldHeight / 2 - 300, 'fence').setDepth(2);
        this.add.image(worldWidth / 2 - 500, worldHeight / 2 - 250, 'flower').setDepth(0.5);

        // Water hazard area
        this.add.tileSprite(worldWidth / 2 + 800, worldHeight / 2, 256, 512, 'water').setDepth(0.5);
        const riverZone = this.add.zone(worldWidth / 2 + 800, worldHeight / 2, 256, 512);
        this.physics.add.existing(riverZone, true);
        this.obstacles.add(riverZone);

        // Route sign
        this.obstacles.create(worldWidth / 2, worldHeight - 200, 'sign').setDepth(2);
        this.add.text(worldWidth / 2, worldHeight - 230, 'Route 2\nNorth: Forest Entrance\nSouth: Eclipse Town', {
            fontFamily: 'monospace', fontSize: '12px', color: '#ffffff',
            backgroundColor: '#000000aa', padding: { x: 4, y: 2 }, align: 'center'
        }).setOrigin(0.5).setDepth(5);

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
        addNPC(worldWidth / 2 - 200, worldHeight - 500, 'npc_youngster', 'route2_youngster_ben', 'Youngster Ben', 'route2_youngster_ben');
        addNPC(worldWidth / 2 + 200, worldHeight - 1000, 'npc_traveler', 'route2_lass_amy', 'Lass Amy', 'route2_lass_amy');
        addNPC(worldWidth / 2 - 400, worldHeight / 2, 'npc_bugcatcher', 'route2_bugcatcher_sam', 'Bug Catcher Sam', 'route2_bugcatcher_sam');

        // Add regular NPCs
        addNPC(worldWidth / 2 + 500, worldHeight - 700, 'npc_traveler', 'route2_hiker', 'Hiker');
        addNPC(worldWidth / 2 - 600, worldHeight / 2 + 500, 'npc_youngster', 'route2_camper', 'Camper');
        addNPC(worldWidth / 2 + 800, worldHeight / 2 + 100, 'npc_traveler', 'route2_fisher', 'Fisherman');

        // Team Umbra Grunt
        if (StoryManager.getInstance().hasFlag(StoryFlag.DEFEATED_GYM1) && !StoryManager.getInstance().hasFlag(StoryFlag.ENCOUNTERED_TEAM_UMBRA_ROUTE2)) {
            addNPC(worldWidth / 2 + 100, worldHeight / 2 - 500, 'npc_kai', 'route2_team_umbra_grunt', 'Team Umbra Grunt', 'route2_team_umbra_grunt');
        }

        // Add Item Pickups
        this.addItemPickup(worldWidth / 2 - 300, worldHeight - 800, 'Pokeball');
        this.addItemPickup(worldWidth / 2 + 700, worldHeight / 2 + 300, 'Potion');

        // Map Transition: Return to Eclipse Town
        const townZone = this.add.zone(worldWidth / 2, worldHeight - 50, 200, 40);
        this.physics.add.existing(townZone, true);
        townZone.setData('targetScene', 'OverworldScene');
        this.entrances.add(townZone);

        // Map Transition: North to Forest Entrance (Placeholder)
        const forestZone = this.add.zone(worldWidth / 2, 50, 200, 40);
        this.physics.add.existing(forestZone, true);
        forestZone.setData('targetScene', 'EclipseForestScene');
        this.entrances.add(forestZone);

        // Spawn location logic
        let spawnX = this.spawnX, spawnY = this.spawnY;
        if (spawnX === undefined || spawnY === undefined) {
            spawnX = worldWidth / 2; spawnY = worldHeight - 150; // default from Eclipse Town
            if (this.spawnEntrance === 'town') { 
                spawnX = worldWidth / 2; 
                spawnY = worldHeight - 150; 
            } else if (this.spawnEntrance === 'forest') {
                spawnX = worldWidth / 2;
                spawnY = 150;
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
            EventBus.off('save-game-from-menu', this.manualSave, this);
        });

        this.events.on('resume', () => {
            this.isPausedByMenu = false;
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

        // Story Progression: Meet Kai on Route 2
        if (StoryManager.getInstance().hasFlag(StoryFlag.DEFEATED_GYM1) && !StoryManager.getInstance().hasFlag(StoryFlag.MET_KAI_ROUTE2)) {
            this.time.delayedCall(500, () => {
                this.startDialogue('kai_route2_encounter');
                StoryManager.getInstance().setFlag(StoryFlag.MET_KAI_ROUTE2);
                StoryManager.getInstance().setActiveQuest("Investigate Team Umbra");
                EventBus.emit('quest-updated');
            });
        }

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
            this.activeDialogue = null; 
            this.dialogueBox.hide(); 
            this.player.setMovementEnabled(true); 
        } else { 
            this.showCurrentDialogue(); 
        } 
    }

    private triggerEncounter(enemyMon: PokemonInstance) {
        console.log('Encounter triggered!');
        this.player.setMovementEnabled(false);

        this.cameras.main.flash(300, 255, 255, 255);

        this.time.delayedCall(300, () => {
            console.log('About to start BattleScene...');
            this.scene.pause();
            
            if (PlayerState.pokemonTeam.length === 0) {
                console.error("Battle triggered without a player Pokémon.");
                this.scene.resume();
                this.player.setMovementEnabled(true);
                return;
            }

            this.scene.launch('BattleScene', {
                enemyMon
            });

            this.scene.get('BattleScene').events.once('battle-ended', (result: 'win' | 'loss' | 'run') => {
                console.log(`Battle ended with result: ${result}`);
                this.scene.stop('BattleScene');
                if (result === 'loss') {
                    PlayerState.pokemonTeam.forEach(p => p.currentHp = p.maxHp);
                    this.scene.start('InteriorScene', { entranceId: 'center', parentScene: 'OverworldScene' });
                } else {
                    if (result === 'win') {
                        this.autoSave();
                    }
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
                    console.log(`Trainer battle ended with result: ${result}`);
                    this.scene.stop('BattleScene');
                    this.cameras.main.fadeIn(250, 0, 0, 0);
                    this.scene.resume();
                    
                    if (result === 'win') {
                        PlayerState.defeatedTrainers.add(trainer.id);
                        PlayerState.money += trainer.rewardMoney;
                        this.autoSave();
                        this.startDialogue(`${trainer.id}_defeated`);
                        if (trainer.id === 'route2_team_umbra_grunt') {
                            StoryManager.getInstance().setFlag(StoryFlag.ENCOUNTERED_TEAM_UMBRA_ROUTE2);
                            StoryManager.getInstance().setActiveQuest("Report to Professor Nova");
                            EventBus.emit('quest-updated');
                        }
                    } else if (result === 'loss') {
                        this.scene.start('InteriorScene', { entranceId: 'center', parentScene: 'OverworldScene' });
                    }
                });
            });
        };
    }

    update(time: number, delta: number) {
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
        this.hudText.setText(`Location: Route 2\nPosition: X: ${Math.round(this.player.x)}, Y: ${Math.round(this.player.y)}`);

        let transitionScene: string | null = null;
        this.physics.overlap(this.player, this.entrances, (_player, entrance) => { transitionScene = (entrance as Phaser.GameObjects.GameObject).getData('targetScene'); });
        if (transitionScene) { 
            this.autoSave();
            this.scene.start(transitionScene, { spawnEntrance: 'route2' }); 
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

        let inTallGrass = false;
        this.physics.overlap(this.player, this.tallGrassZones, () => {
            inTallGrass = true;
        });

        if (inTallGrass && this.player.isMoving()) {
            const distance = this.playerLastPosForEncounter.distance({ x: this.player.x, y: this.player.y });

            if (distance >= this.STEP_DISTANCE_FOR_ENCOUNTER_CHECK) {
                this.playerLastPosForEncounter.set(this.player.x, this.player.y);
                const encounter = this.encounterManager.checkEncounter('Route2Scene');
                if (encounter) {
                    this.triggerEncounter(encounter);
                }
            }
        } else {
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