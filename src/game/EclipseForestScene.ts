import { Scene, Input } from 'phaser';
import { EventBus } from './EventBus';
import { Player } from './Player';
import { NPC } from './NPC';
import { DialogueBox } from './DialogueBox';
import { Dialogues, DialogueNode } from './dialogues';
import { QuestTracker } from './QuestTracker';
import { StoryManager, StoryFlag } from './StoryManager';
import { EncounterManager } from './EncounterManager';
import { PlayerState } from './PlayerData';
import { getTrainer, Trainer } from './TrainerData';
import { SaveManager } from './SaveManager';
import { PokemonInstance } from './PokemonData';
import { GameFeel } from './GameFeel';

export class EclipseForestScene extends Scene {
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
    private readonly STEP_DISTANCE_FOR_ENCOUNTER_CHECK = 32;

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
        const worldWidth = 4000;
        const worldHeight = 4000;
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

        this.add.tileSprite(worldWidth / 2, worldHeight / 2, worldWidth, worldHeight, 'grass').setDepth(0);

        this.obstacles = this.physics.add.staticGroup();
        this.entrances = this.physics.add.staticGroup();
        this.itemPickups = this.physics.add.staticGroup();
        this.npcZones = this.physics.add.staticGroup();
        this.tallGrassZones = this.physics.add.staticGroup();

        // --- Forest Layout ---
        // Outer walls
        for (let x = 0; x <= worldWidth; x += 64) {
            if (x < 1900 || x > 2100) this.obstacles.create(x, 100, 'tree').setDepth(2); // North
            if (x < 1900 || x > 2100) this.obstacles.create(x, worldHeight - 100, 'tree').setDepth(2); // South
        }
        for (let y = 100; y <= worldHeight - 100; y += 64) {
            this.obstacles.create(100, y, 'tree').setDepth(2); // West
            this.obstacles.create(worldWidth - 100, y, 'tree').setDepth(2); // East
        }

        // Internal maze-like trees
        for (let i = 0; i < 150; i++) {
            const x = Phaser.Math.Between(100, worldWidth - 100);
            const y = Phaser.Math.Between(100, worldHeight - 100);
            // Avoid blocking entry/exit paths
            if ((x > 1800 && x < 2200 && y > 3500) || (x > 1800 && x < 2200 && y < 500)) continue;
            this.obstacles.create(x, y, 'tree').setDepth(Phaser.Math.Between(2, 4));
        }

        // --- Tall Grass ---
        const addTallGrass = (x: number, y: number, width: number, height: number) => {
            this.add.tileSprite(x, y, width, height, 'tall_grass').setDepth(0.5);
            this.tallGrassZones.create(x, y).setSize(width, height).setVisible(false);
        };
        addTallGrass(1000, 3000, 1024, 512);
        addTallGrass(3000, 3000, 1024, 512);
        addTallGrass(2000, 1000, 1500, 768); // Central large patch

        // --- NPCs and Trainers ---
        const addNPC = (x: number, y: number, key: string, dialogueId: string, label: string, trainerId?: string) => {
            const npc = new NPC(this, x, y, key, dialogueId, trainerId);
            this.obstacles.add(npc);
            this.npcZones.add(npc.interactionZone);
            this.add.text(x, y - 36, label, { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff', backgroundColor: '#000000aa', padding: { x: 4, y: 2 } }).setOrigin(0.5).setDepth(20);
        };
        addNPC(1000, 3500, 'npc_bugcatcher', 'forest_bug_catcher_dave', 'Bug Catcher', 'forest_bug_catcher_dave');
        addNPC(3000, 1500, 'npc_traveler', 'forest_hiker_barry', 'Hiker', 'forest_hiker_barry');
        addNPC(500, 500, 'npc_youngster', 'forest_lost_child', 'Lost Child');
        addNPC(3500, 3500, 'npc_traveler', 'forest_explorer', 'Explorer');

        // --- Items ---
        this.addItemPickup(3500, 500, 'Pokeball');
        this.addItemPickup(500, 2000, 'Potion');
        this.addItemPickup(2000, 2000, 'Revive'); // In secret clearing

        // --- Signs and Transitions ---
        const addSign = (x: number, y: number, dialogueId: string) => {
            const sign = new NPC(this, x, y, 'sign', dialogueId);
            this.obstacles.add(sign);
            this.npcZones.add(sign.interactionZone);
        };
        addSign(2200, 3800, 'forest_entrance_sign');

        const route2Zone = this.add.zone(2000, worldHeight - 50, 200, 40);
        this.physics.add.existing(route2Zone, true);
        route2Zone.setData('targetScene', 'Route2Scene');
        this.entrances.add(route2Zone);

        const route3Zone = this.add.zone(2000, 50, 200, 40); // North exit
        this.physics.add.existing(route3Zone, true);
        route3Zone.setData('targetScene', 'Route3Scene');
        // This exit will be conditionally active based on story progression
        route3Zone.setData('blocked', !StoryManager.getInstance().hasFlag(StoryFlag.UNLOCKED_ROUTE3));
        this.entrances.add(route3Zone);

        // --- Player ---
        let spawnX = this.spawnX, spawnY = this.spawnY;
        if (spawnX === undefined || spawnY === undefined) {
            spawnX = 2000; spawnY = worldHeight - 150; // Default from Route 2
        }
        this.player = new Player(this, spawnX, spawnY);
        this.playerLastPosForEncounter = new Phaser.Math.Vector2(this.player.x, this.player.y);
        this.physics.add.collider(this.player, this.obstacles);

        // --- Camera ---
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(1.5);

        // --- Systems and UI ---
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

        // --- Story Events ---
        if (!StoryManager.getInstance().hasFlag(StoryFlag.DEFEATED_UMBRA_IN_FOREST)) {
            addNPC(2000, 500, 'npc_kai', 'forest_umbra_intro', 'Team Umbra Grunt', 'forest_umbra_grunt_1');
        }

        if (!StoryManager.getInstance().hasFlag(StoryFlag.ENTERED_ECLIPSE_FOREST)) {
            this.time.delayedCall(500, () => {
                this.startDialogue('forest_entry');
                StoryManager.getInstance().setFlag(StoryFlag.ENTERED_ECLIPSE_FOREST);
                StoryManager.getInstance().setActiveQuest("Find the source of the disturbance");
                EventBus.emit('quest-updated');
            });
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

        if (previousDialogueKey === 'forest_umbra_grunt_1_defeated') {
            // After defeating the grunt, unlock Route 3
            const gruntNPC = this.obstacles.getChildren().find(obj => (obj as NPC).trainerId === 'forest_umbra_grunt_1');
            if (gruntNPC) gruntNPC.destroy();
            const gruntZone = this.npcZones.getChildren().find(obj => (obj as Phaser.GameObjects.Zone).getData('trainerId') === 'forest_umbra_grunt_1');
            if (gruntZone) gruntZone.destroy();
            StoryManager.getInstance().setFlag(StoryFlag.UNLOCKED_ROUTE3);
            StoryManager.getInstance().setActiveQuest("Travel to Veridia City via Route 3");
            EventBus.emit('quest-updated');
            // Re-enable the exit zone to Route 3
            const route3Exit = this.entrances.getChildren().find(zone => (zone as Phaser.GameObjects.Zone).getData('targetScene') === 'Route3Scene');
            if (route3Exit) route3Exit.setData('blocked', false);
        }

        this.player.setMovementEnabled(true);
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
        trainer.team.forEach(p => PlayerState.pokedex.seen.add(p.name));
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
                        if (trainer.id === 'forest_umbra_grunt_1') {
                            StoryManager.getInstance().setFlag(StoryFlag.DEFEATED_UMBRA_IN_FOREST);
                            StoryManager.getInstance().setActiveQuest("Find a way out of the forest");
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

        let transitionScene: string | null = null;
        this.physics.overlap(this.player, this.entrances, (_player, entrance) => { transitionScene = (entrance as Phaser.GameObjects.GameObject).getData('targetScene'); });
        if (transitionScene) {
            const entranceZone = this.entrances.getChildren().find(zone => (zone as Phaser.GameObjects.GameObject).getData('targetScene') === transitionScene);
            if (entranceZone && entranceZone.getData('blocked')) {
                this.startDialogue('forest_umbra_intro'); // Grunt is blocking
            } else {
                this.autoSave();
                GameFeel.fadeToScene(this, transitionScene, { spawnEntrance: 'forest' }); // Let the next scene know we came from the forest
            }
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
                GameFeel.grassRustle(this, this.player.x, this.player.y + 10);
                const encounter = this.encounterManager.checkEncounter('EclipseForestScene');
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
