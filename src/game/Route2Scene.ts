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
import { GameFeel } from './GameFeel';

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
        super('Route2Scene');
    }

    init(data: any) {
        this.spawnEntrance = data.spawnEntrance;
        this.spawnX = data.spawnX;
        this.spawnY = data.spawnY;
    }

    create() {
        console.log('Route2Scene loaded');
        GameFeel.startMusic(this, 'route');

        // --- DEBUG: Ensure player has a Pokémon for testing ---
        if (PlayerState.pokemonTeam.length === 0) {
            console.warn('No player Pokémon found! Creating a default Charmander for testing.');
            const defaultStarter = generatePlayerPokemon('Charmander', 5);
            PlayerState.pokemonTeam.push(defaultStarter);
        }
        // --- END DEBUG ---

        // Expanded Route 2: Larger and more explorable
        const worldWidth = 6000;
        const worldHeight = 6000;
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

        // Background
        this.add.tileSprite(worldWidth / 2, worldHeight / 2, worldWidth, worldHeight, 'grass').setDepth(0);

        // --- Path Layout ---
        // Path from Lunar City (South)
        this.add.tileSprite(3000, 5500, 256, 1000, 'path').setDepth(1); 
        // The Great Fork
        this.add.tileSprite(3000, 4800, 1500, 256, 'path').setDepth(1); 
        // East Path (Main)
        this.add.tileSprite(3750, 3800, 256, 2000, 'path').setDepth(1);
        // West Path (Winding)
        this.add.tileSprite(2250, 4300, 256, 1000, 'path').setDepth(1);
        this.add.tileSprite(1500, 3800, 1500, 256, 'path').setDepth(1);
        this.add.tileSprite(750, 2800, 256, 2000, 'path').setDepth(1);
        this.add.tileSprite(2250, 1800, 3000, 256, 'path').setDepth(1);
        // Path to Eclipse Forest (North)
        this.add.tileSprite(3000, 950, 256, 1700, 'path').setDepth(1);

        // --- Tall Grass Patches ---
        this.tallGrassZones = this.physics.add.staticGroup();
        const addTallGrass = (x: number, y: number, width: number, height: number) => {
            this.add.tileSprite(x, y, width, height, 'tall_grass').setDepth(0.5);
            this.tallGrassZones.create(x, y).setSize(width, height).setVisible(false);
        };
        // East path fields
        addTallGrass(4500, 3800, 1024, 1500); 
        // West path fields
        addTallGrass(1500, 4500, 1024, 1024); 
        addTallGrass(1500, 2500, 1024, 1024);
        // North field
        addTallGrass(4000, 1000, 2048, 512);  
        // Hidden northwest patch
        addTallGrass(500, 500, 512, 512);   

        this.obstacles = this.physics.add.staticGroup();
        this.entrances = this.physics.add.staticGroup();
        this.npcZones = this.physics.add.staticGroup();
        this.itemPickups = this.physics.add.staticGroup();

        // --- Scenery and Boundaries ---
        // Add more trees and rocks for better scenery and path definition
        const addScenery = (count: number, area: Phaser.Geom.Rectangle) => {
            for (let i = 0; i < count; i++) {
                const x = Phaser.Math.Between(area.x, area.x + area.width);
                const y = Phaser.Math.Between(area.y, area.y + area.height);
                const isTree = Math.random() > 0.25;
                this.obstacles.create(x, y, isTree ? 'tree' : 'rock').setDepth(Phaser.Math.Between(2, 12)).refreshBody();
            }
        };
        // Outer boundaries
        addScenery(200, new Phaser.Geom.Rectangle(0, 0, worldWidth, 100));
        addScenery(200, new Phaser.Geom.Rectangle(0, worldHeight - 100, worldWidth, 100));
        addScenery(200, new Phaser.Geom.Rectangle(0, 0, 100, worldHeight));
        addScenery(200, new Phaser.Geom.Rectangle(worldWidth - 100, 0, 100, worldHeight));
        // Path dividers
        addScenery(50, new Phaser.Geom.Rectangle(2500, 2000, 1000, 2500)); // Central divider
        addScenery(30, new Phaser.Geom.Rectangle(0, 1800, 700, 2000)); // West path shapers
        addScenery(30, new Phaser.Geom.Rectangle(4000, 2000, 2000, 1500)); // East path shapers

        // --- Signs ---
        this.obstacles.create(3200, 5800, 'sign').setDepth(2);
        this.add.text(3200, 5770, 'Route 2\nNorth: Eclipse Forest\nSouth: Lunar City', {
            fontFamily: 'monospace', fontSize: '12px', color: '#ffffff',
            backgroundColor: '#000000aa', padding: { x: 4, y: 2 }, align: 'center'
        }).setOrigin(0.5).setDepth(5);

        const addSign = (x: number, y: number, dialogueId: string) => {
            const sign = new NPC(this, x, y, 'sign', dialogueId);
            this.obstacles.add(sign);
            this.npcZones.add(sign.interactionZone);
        };
        addSign(3300, 4900, 'route2_fork_sign');

        // --- NPCs and Trainers ---
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
        addNPC(3750, 4200, 'npc_youngster', 'route2_youngster_ben', 'Youngster Ben', 'route2_youngster_ben'); // East path
        addNPC(2250, 4000, 'npc_bugcatcher', 'route2_bugcatcher_sam', 'Bug Catcher Sam', 'route2_bugcatcher_sam'); // West path
        addNPC(750, 3200, 'npc_traveler', 'route2_lass_amy', 'Lass Amy', 'route2_lass_amy'); // West path
        // Optional trainers
        addNPC(400, 400, 'npc_traveler', 'route2_hiker_liam', 'Hiker Liam', 'route2_hiker_liam'); // Hidden northwest
        addNPC(1800, 5000, 'npc_youngster', 'route2_camper_shane', 'Camper Shane', 'route2_camper_shane'); // West path side area

        // Add regular NPCs
        addNPC(4500, 1500, 'npc_traveler', 'route2_picnicker', 'Picnicker');

        // Team Umbra Grunt
        if (StoryManager.getInstance().hasFlag(StoryFlag.DEFEATED_GYM1) && !StoryManager.getInstance().hasFlag(StoryFlag.ENCOUNTERED_TEAM_UMBRA_ROUTE2)) {
            // Blocks the main eastern path
            addNPC(3750, 3000, 'npc_kai', 'route2_team_umbra_grunt', 'Team Umbra Grunt', 'route2_team_umbra_grunt');
        }

        // --- Item Pickups ---
        this.addItemPickup(5800, 5800, 'Potion'); // Hidden in SE corner
        this.addItemPickup(200, 4800, 'Super Potion'); // Hidden on west path
        this.addItemPickup(5000, 500, 'Revive'); // Dead end near exit

        // --- Transitions ---
        // Return to Lunar City (South)
        const townZone = this.add.zone(3000, worldHeight - 50, 200, 40);
        this.physics.add.existing(townZone, true);
        townZone.setData('targetScene', 'LunarCityScene');
        this.entrances.add(townZone);

        // North to Forest Entrance
        const forestZone = this.add.zone(3000, 50, 200, 40);
        this.physics.add.existing(forestZone, true);
        forestZone.setData('targetScene', 'EclipseForestScene');
        this.entrances.add(forestZone);

        // --- Player Spawn ---
        let spawnX = this.spawnX, spawnY = this.spawnY;
        if (spawnX === undefined || spawnY === undefined) {
            spawnX = 3000; spawnY = worldHeight - 150; // default from Lunar City
            if (this.spawnEntrance === 'lunar_city' || this.spawnEntrance === 'route2') { // Coming from LunarCityScene
                spawnX = 3000; 
                spawnY = worldHeight - 150; 
            } else if (this.spawnEntrance === 'forest') { // Coming from EclipseForestScene
                spawnX = 3000;
                spawnY = 150;
            }
        }

        this.player = new Player(this, spawnX, spawnY);
        this.playerLastPosForEncounter = new Phaser.Math.Vector2(this.player.x, this.player.y);

        // --- Camera and Colliders ---
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(1.5);
        this.physics.add.collider(this.player, this.obstacles);

        // --- Systems and UI ---
        this.encounterManager = new EncounterManager(this);

        this.dialogueBox = new DialogueBox(this);
        this.questTracker = new QuestTracker(this);
        this.hudText = this.add.text(16, 16, '', {
            fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
            backgroundColor: '#00000099', padding: { x: 8, y: 8 },
            wordWrap: { width: 250 }
        }).setScrollFactor(0).setDepth(100);
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

        // --- Story Events ---
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
        const previousDialogueKey = this.activeDialogueKey;
        
        this.activeDialogueKey = null;
        this.activeDialogue = null;

        if (previousDialogueKey === 'route2_team_umbra_grunt_defeated') {
            PlayerState.inventory['Revive'] = (PlayerState.inventory['Revive'] || 0) + 1;
            this.startDialogue('found_revive');

            const gruntNPC = this.obstacles.getChildren().find(obj => (obj as NPC).trainerId === 'route2_team_umbra_grunt');
            if (gruntNPC) gruntNPC.destroy();
            const gruntZone = this.npcZones.getChildren().find(obj => (obj as Phaser.GameObjects.Zone).getData('trainerId') === 'route2_team_umbra_grunt');
            if (gruntZone) gruntZone.destroy();

        } else if (previousDialogueKey && previousDialogueKey.startsWith('found_')) {
            // After finding any item, re-enable movement
            this.player.setMovementEnabled(true);
        } else {
            this.player.setMovementEnabled(true);
        }
    }

    private triggerEncounter(enemyMon: PokemonInstance) {
        console.log('Encounter triggered!');
        PlayerState.pokedex.seen.add(enemyMon.name);
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
        trainer.team.forEach(p => PlayerState.pokedex.seen.add(p.name));
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
                        if (trainer.id === 'route2_team_umbra_grunt') {
                            StoryManager.getInstance().setFlag(StoryFlag.ENCOUNTERED_TEAM_UMBRA_ROUTE2);
                            StoryManager.getInstance().setActiveQuest("Report to Professor Nova");
                            EventBus.emit('quest-updated');
                        }
                        this.startDialogue(`${trainer.id}_defeated`);
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
            GameFeel.fadeToScene(this, transitionScene, { spawnEntrance: 'route2' }); // Let the next scene know we came from Route 2
            return; 
        }

        this.physics.overlap(this.player, this.itemPickups, (_player, itemPickupObj) => {
            const itemPickup = itemPickupObj as Phaser.GameObjects.GameObject;
            const itemId = itemPickup.getData('itemId') as string;
            if (itemId) {
                PlayerState.inventory[itemId] = (PlayerState.inventory[itemId] || 0) + 1;
                this.startDialogue(`found_${itemId.toLowerCase()}`); // e.g., found_potion
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
                GameFeel.grassRustle(this, this.player.x, this.player.y + 10);
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
