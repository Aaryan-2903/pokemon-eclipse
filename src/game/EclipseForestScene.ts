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
import { GameFeel } from './GameFeel';

export class EclipseForestScene extends Scene {
    private player!: Player;
    private obstacles!: Phaser.Physics.Arcade.StaticGroup;
    private entrances!: Phaser.Physics.Arcade.StaticGroup;
    private npcZones!: Phaser.Physics.Arcade.StaticGroup;
    private itemPickups!: Phaser.Physics.Arcade.StaticGroup;
    private hudText!: Phaser.GameObjects.Text;
    private autoSaveIndicator!: Phaser.GameObjects.Text;
    private tallGrassZones!: Phaser.Physics.Arcade.StaticGroup;
    private tallGrassZones_rare!: Phaser.Physics.Arcade.StaticGroup;
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
    private readonly STEP_DISTANCE_FOR_ENCOUNTER_CHECK = 32;

    private umbraCutsceneTrigger!: Phaser.GameObjects.Zone;
    private cutsceneNPCs: Phaser.GameObjects.Sprite[] = [];

    constructor() {
        super('EclipseForestScene');
    }

    init(data: any) {
        this.spawnEntrance = data.spawnEntrance;
        this.spawnX = data.spawnX;
        this.spawnY = data.spawnY;
    }

    create() {
        GameFeel.startMusic(this, 'route');

        if (PlayerState.pokemonTeam.length === 0) {
            PlayerState.pokemonTeam.push(generatePlayerPokemon('Charmander', 5));
        }

        const worldWidth = 8000;
        const worldHeight = 8000;
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

        this.add.tileSprite(worldWidth / 2, worldHeight / 2, worldWidth, worldHeight, 'grass').setTint(0x888888).setDepth(0);

        // --- Path Layout ---
        this.add.tileSprite(4000, 7000, 256, 2000, 'path').setDepth(1); // South entrance path
        this.add.tileSprite(4000, 5500, 2000, 256, 'path').setDepth(1); // Fork
        this.add.tileSprite(2500, 5500, 256, 2000, 'path').setDepth(1); // West path
        this.add.tileSprite(3750, 4500, 2500, 256, 'path').setDepth(1); // West-East connector
        this.add.tileSprite(5000, 3500, 256, 2000, 'path').setDepth(1); // East path
        this.add.tileSprite(4000, 2500, 2000, 256, 'path').setDepth(1); // Central connector
        this.add.tileSprite(3000, 1500, 256, 2000, 'path').setDepth(1); // Path to NW exit
        this.add.tileSprite(6000, 1500, 256, 2000, 'path').setDepth(1); // Path to NE exit

        // --- Tall Grass Patches ---
        this.tallGrassZones = this.physics.add.staticGroup();
        this.tallGrassZones_rare = this.physics.add.staticGroup();
        const addTallGrass = (x: number, y: number, width: number, height: number) => {
            this.add.tileSprite(x, y, width, height, 'tall_grass').setDepth(0.5);
            this.tallGrassZones.create(x, y).setSize(width, height).setVisible(false);
        };
        const addRareTallGrass = (x: number, y: number, width: number, height: number) => {
            this.add.tileSprite(x, y, width, height, 'tall_grass').setTint(0xccffcc).setDepth(0.5); // Slightly different tint
            this.tallGrassZones_rare.create(x, y).setSize(width, height).setVisible(false);
        };
        addTallGrass(2500, 6500, 1024, 1024); // SW field
        addTallGrass(5500, 5000, 1500, 1024); // East field
        addRareTallGrass(1500, 1500, 1024, 1024); // NW hidden clearing (rare pokemon)
        addTallGrass(4000, 3500, 1024, 512); // Central patch

        this.obstacles = this.physics.add.staticGroup();
        this.entrances = this.physics.add.staticGroup();
        this.npcZones = this.physics.add.staticGroup();
        this.itemPickups = this.physics.add.staticGroup();

        // --- Scenery and Boundaries ---
        const addScenery = (count: number, area: Phaser.Geom.Rectangle) => {
            for (let i = 0; i < count; i++) {
                const x = Phaser.Math.Between(area.x, area.x + area.width);
                const y = Phaser.Math.Between(area.y, area.y + area.height);
                const isTree = Math.random() > 0.1;
                this.obstacles.create(x, y, isTree ? 'tree' : 'rock').setDepth(Phaser.Math.Between(2, 12)).refreshBody();
            }
        };
        // Outer boundaries
        addScenery(400, new Phaser.Geom.Rectangle(0, 0, worldWidth, 200));
        addScenery(400, new Phaser.Geom.Rectangle(0, worldHeight - 200, worldWidth, 200));
        addScenery(400, new Phaser.Geom.Rectangle(0, 0, 200, worldHeight));
        addScenery(400, new Phaser.Geom.Rectangle(worldWidth - 200, 0, 200, worldHeight));
        // Inner dense areas
        addScenery(200, new Phaser.Geom.Rectangle(0, 2000, 2000, 4000));
        addScenery(200, new Phaser.Geom.Rectangle(6000, 2000, 2000, 4000));
        addScenery(100, new Phaser.Geom.Rectangle(4500, 6000, 3000, 1500));

        const addNPC = (x: number, y: number, key: string, dialogueId: string, label: string, trainerId?: string) => {
            const npc = new NPC(this, x, y, key, dialogueId, trainerId);
            this.obstacles.add(npc);
            this.npcZones.add(npc.interactionZone);
            this.add.text(x, y - 36, label, { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff', backgroundColor: '#000000aa', padding: { x: 4, y: 2 } }).setOrigin(0.5).setDepth(20);
            return npc;
        };

        // --- NPCs, Trainers, and Items ---
        const storyManager = StoryManager.getInstance();
        let botanistDialogue = 'forest_botanist_intro';
        if (storyManager.hasFlag(StoryFlag.SIDEQUEST_FOREST_FLOWER_COMPLETE)) {
            botanistDialogue = 'forest_botanist_complete';
        } else if (storyManager.hasFlag(StoryFlag.SIDEQUEST_FOREST_FLOWER_STARTED)) {
            if (PlayerState.inventory['Rare Flower'] > 0) {
                botanistDialogue = 'forest_botanist_complete';
            } else {
                botanistDialogue = 'forest_botanist_quest_active';
            }
        }
        addNPC(2500, 5500, 'npc_traveler', botanistDialogue, 'Botanist');

        addNPC(4500, 6000, 'npc_youngster', 'forest_lost_child', 'Lost Child');
        addNPC(5500, 4800, 'npc_bugcatcher', 'forest_bug_catcher_dave', 'Bug Catcher Dave', 'forest_bug_catcher_dave'); // Optional trainer
        addNPC(1800, 1800, 'npc_traveler', 'forest_hiker_barry', 'Hiker Barry', 'forest_hiker_barry'); // Optional trainer

        // New optional trainers
        addNPC(6800, 3500, 'npc_kai', 'forest_ace_trainer_m', 'Ace Trainer Felix', 'forest_ace_trainer_m'); // Hidden east path
        addNPC(1000, 6000, 'npc_bugcatcher', 'forest_bug_maniac', 'Bug Maniac Donald', 'forest_bug_maniac'); // Hidden south-west path

        // Umbra Equipment
        const equipment = addNPC(4200, 4200, 'rock', 'forest_umbra_equipment', 'Strange Device');
        equipment.setTint(0x9333ea); // Purple tint

        this.addItemPickup(6500, 6500, 'Super Potion'); // Dead end reward
        this.addItemPickup(1000, 1000, 'Revive'); // Hidden clearing reward
        this.addItemPickup(500, 7500, 'Max Revive'); // Deep south-west corner

        // --- Transitions ---
        const route2Zone = this.add.zone(4000, worldHeight - 50, 400, 40);
        this.physics.add.existing(route2Zone, true);
        route2Zone.setData('targetScene', 'Route2Scene');
        this.entrances.add(route2Zone);

        const veridiaZone = this.add.zone(1000, 50, 400, 40);
        this.physics.add.existing(veridiaZone, true);
        veridiaZone.setData('targetScene', 'VeridiaCityScene');
        this.entrances.add(veridiaZone);

        const route3Zone = this.add.zone(7000, 50, 400, 40);
        this.physics.add.existing(route3Zone, true);
        route3Zone.setData('targetScene', 'Route3Scene');
        this.entrances.add(route3Zone);

        let spawnX = this.spawnX, spawnY = this.spawnY;
        if (spawnX === undefined || spawnY === undefined) {
            spawnX = 4000; spawnY = worldHeight - 150; // Default from Route 2
            if (this.spawnEntrance === 'route3') { spawnX = 7000; spawnY = 150; }
            if (this.spawnEntrance === 'veridia_city') { spawnX = 1000; spawnY = 150; }
        }
        this.player = new Player(this, spawnX, spawnY);
        this.playerLastPosForEncounter = new Phaser.Math.Vector2(this.player.x, this.player.y);
        this.physics.add.collider(this.player, this.obstacles);

        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(1.5);

        this.encounterManager = new EncounterManager(this);
        this.dialogueBox = new DialogueBox(this);
        this.questTracker = new QuestTracker(this);
        this.hudText = this.add.text(16, 16, '', { fontFamily: 'monospace', fontSize: '14px', color: '#ffffff', backgroundColor: '#00000099', padding: { x: 8, y: 8 }, wordWrap: { width: 250 } }).setScrollFactor(0).setDepth(100);
        this.autoSaveIndicator = this.add.text(this.cameras.main.displayWidth / 2, 16, '', { fontFamily: 'monospace', fontSize: '14px', color: '#22c55e', backgroundColor: '#000000aa', padding: { x: 8, y: 4 } }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(200).setAlpha(0);
        this.interactionText = this.add.text(0, 0, 'Press E to Talk', { fontFamily: 'monospace', fontSize: '12px', color: '#000000', backgroundColor: '#ffffff', padding: { x: 6, y: 4 } }).setOrigin(0.5).setDepth(100).setVisible(false).setScrollFactor(1);

        if (this.input.keyboard) {
            this.interactKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.E);
            this.spaceKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.SPACE);
            this.enterKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.ENTER);
            this.escKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.ESC);
            this.teamKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.T);
            this.badgeKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.B);
        }

        if (!storyManager.hasFlag(StoryFlag.ENTERED_ECLIPSE_FOREST)) {
            storyManager.setFlag(StoryFlag.ENTERED_ECLIPSE_FOREST);
            storyManager.setActiveQuest("Find a way through the forest");
            EventBus.emit('quest-updated');
            this.startDialogue('forest_entry');
        }

        if (!storyManager.hasFlag(StoryFlag.DEFEATED_UMBRA_IN_FOREST)) {
            if (storyManager.hasFlag(StoryFlag.FOREST_UMBRA_CUTSCENE_SEEN) && !PlayerState.defeatedTrainers.has('forest_umbra_grunt_1')) {
                addNPC(4000, 3950, 'npc_kai', 'forest_umbra_grunt_1_prebattle', 'Team Umbra Grunt', 'forest_umbra_grunt_1');
            } else if (!storyManager.hasFlag(StoryFlag.FOREST_UMBRA_CUTSCENE_SEEN)) {
                this.umbraCutsceneTrigger = this.add.zone(4000, 4000, 400, 400);
                this.physics.add.existing(this.umbraCutsceneTrigger, true);
            }
        }

        EventBus.on('save-game-from-menu', this.manualSave, this);
        this.events.on('shutdown', () => { EventBus.off('save-game-from-menu', this.manualSave, this); });
        this.events.on('resume', () => {
            this.isPausedByMenu = false;
            if (!this.activeDialogue) this.player.setMovementEnabled(true);
        });

        EventBus.emit('current-scene-ready', this);
    }

    private triggerUmbraForestCutscene() {
        if (this.umbraCutsceneTrigger.active) this.umbraCutsceneTrigger.destroy();
        
        StoryManager.getInstance().setFlag(StoryFlag.FOREST_UMBRA_CUTSCENE_SEEN);
        this.player.setMovementEnabled(false);
        GameFeel.playSfx('evolve');
        this.cameras.main.shake(250, 0.005);

        this.cameras.main.pan(4000, 4000, 1000, 'Power2');
        this.cameras.main.zoomTo(2, 1000);

        const grunt = this.add.sprite(3950, 4050, 'npc_kai').setAlpha(0);
        const scientist = this.add.sprite(4050, 4050, 'npc_traveler').setAlpha(0);
        this.cutsceneNPCs = [grunt, scientist];

        this.tweens.add({
            targets: this.cutsceneNPCs,
            alpha: 1,
            duration: 500,
            delay: 800,
            onComplete: () => {
                this.startDialogue('forest_umbra_cutscene');
                const originalEndDialogue = this.endDialogue.bind(this);
                this.endDialogue = () => {
                    this.endDialogue = originalEndDialogue;
                    const trainer = getTrainer('forest_umbra_grunt_1');
                    if (trainer) this.startTrainerBattle(trainer);
                };
            }
        });
    }

    private openMenu() { this.isPausedByMenu = true; this.player.setMovementEnabled(false); this.interactionText.setVisible(false); this.scene.pause(); this.scene.launch('MenuScene', { fromScene: this.scene.key }); }
    private startDialogue(dialogueId: string) { if (!Dialogues[dialogueId]) return; this.activeDialogueKey = dialogueId; this.activeDialogue = Dialogues[dialogueId]; this.currentDialogueIndex = 0; this.player.setMovementEnabled(false); this.interactionText.setVisible(false); this.showCurrentDialogue(); }
    private showCurrentDialogue() { if (!this.activeDialogue) return; this.dialogueBox.show(this.activeDialogue[this.currentDialogueIndex].speaker, this.activeDialogue[this.currentDialogueIndex].text, this.activeDialogue[this.currentDialogueIndex].portrait); }
    private progressDialogue() { this.currentDialogueIndex++; if (!this.activeDialogue || this.currentDialogueIndex >= this.activeDialogue.length) { this.endDialogue(); } else { this.showCurrentDialogue(); } }
    
    private endDialogue() {
        const endedDialogueKey = this.activeDialogueKey;
        this.dialogueBox.hide();
        this.activeDialogueKey = null;
        this.activeDialogue = null;

        const storyManager = StoryManager.getInstance();
        if (endedDialogueKey === 'forest_botanist_intro' && !storyManager.hasFlag(StoryFlag.SIDEQUEST_FOREST_FLOWER_STARTED)) {
            storyManager.setFlag(StoryFlag.SIDEQUEST_FOREST_FLOWER_STARTED);
        } else if (endedDialogueKey === 'forest_botanist_complete' && !storyManager.hasFlag(StoryFlag.SIDEQUEST_FOREST_FLOWER_COMPLETE)) {
            if (PlayerState.inventory['Rare Flower'] > 0) {
                PlayerState.inventory['Rare Flower']--;
                if (PlayerState.inventory['Rare Flower'] <= 0) delete PlayerState.inventory['Rare Flower'];
                PlayerState.inventory['Rare Candy'] = (PlayerState.inventory['Rare Candy'] || 0) + 1;
                storyManager.setFlag(StoryFlag.SIDEQUEST_FOREST_FLOWER_COMPLETE);
            }
        }

        if (endedDialogueKey === 'forest_umbra_grunt_1_defeated') {
            StoryManager.getInstance().setFlag(StoryFlag.DEFEATED_UMBRA_IN_FOREST);
            this.tweens.add({
                targets: this.cutsceneNPCs,
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    this.cutsceneNPCs.forEach(npc => npc.destroy());
                    this.cutsceneNPCs = [];
                    this.cameras.main.zoomTo(1.5, 500);
                    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

                    // Give reward and show message
                    PlayerState.inventory['Potion'] = (PlayerState.inventory['Potion'] || 0) + 1;
                    this.startDialogue('found_potion');
                }
            });
        } else if (endedDialogueKey && endedDialogueKey.startsWith('found_')) {
            this.player.setMovementEnabled(true);
        } else {
            this.player.setMovementEnabled(true);
        }
    }

    private triggerEncounter(enemyMon: PokemonInstance) {
        PlayerState.pokedex.seen.add(enemyMon.name);
        this.player.setMovementEnabled(false);
        this.cameras.main.flash(300, 255, 255, 255);
        this.time.delayedCall(300, () => {
            this.scene.pause();
            this.scene.launch('BattleScene', { enemyMon });
            this.scene.get('BattleScene').events.once('battle-ended', (result: 'win' | 'loss' | 'run') => {
                this.scene.stop('BattleScene');
                if (result === 'loss') {
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
        trainer.team.forEach(p => PlayerState.pokedex.seen.add(p.name));
        this.player.setMovementEnabled(false);
        this.interactionText.setVisible(false);
        this.startDialogue(trainer.id === 'forest_umbra_grunt_1' ? 'forest_umbra_grunt_1_prebattle' : trainer.preBattleDialogue);
        
        const originalEndDialogue = this.endDialogue.bind(this);
        this.endDialogue = () => {
            this.endDialogue = originalEndDialogue;
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
                        this.cutsceneNPCs.forEach(npc => npc.destroy());
                        this.cutsceneNPCs = [];
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
        this.hudText.setText(`Location: Eclipse Forest\nPosition: X: ${Math.round(this.player.x)}, Y: ${Math.round(this.player.y)}`);

        if (this.umbraCutsceneTrigger && this.umbraCutsceneTrigger.active) {
            this.physics.overlap(this.player, this.umbraCutsceneTrigger, this.triggerUmbraForestCutscene, undefined, this);
        }

        let transitionScene: string | null = null;
        this.physics.overlap(this.player, this.entrances, (_player, entrance) => { transitionScene = (entrance as Phaser.GameObjects.GameObject).getData('targetScene'); });
        if (transitionScene) {
            this.autoSave();
            GameFeel.fadeToScene(this, transitionScene, { spawnEntrance: 'forest' });
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

        let inRareGrass = false;
        this.physics.overlap(this.player, this.tallGrassZones_rare, () => { inRareGrass = true; });

        if (inTallGrass && this.player.isMoving()) {
            const distance = this.playerLastPosForEncounter.distance({ x: this.player.x, y: this.player.y });
            if (distance >= this.STEP_DISTANCE_FOR_ENCOUNTER_CHECK) {
                this.playerLastPosForEncounter.set(this.player.x, this.player.y);
                GameFeel.grassRustle(this, this.player.x, this.player.y + 10);
                const encounter = this.encounterManager.checkEncounter(inRareGrass ? 'EclipseForestScene_Hidden' : 'EclipseForestScene');
                if (encounter) this.triggerEncounter(encounter);
            }
        } else {
            this.playerLastPosForEncounter.set(this.player.x, this.player.y);
        }
    }

    private addItemPickup(x: number, y: number, itemId: string) {
        const itemSprite = this.itemPickups.create(x, y, 'pokeball_item').setDepth(1);
        itemSprite.setData('itemId', itemId);
        itemSprite.refreshBody();
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