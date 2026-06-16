import { Scene, Input } from 'phaser';
import { EventBus } from './EventBus';
import { Player } from './Player';
import { NPC } from './NPC';
import { DialogueBox } from './DialogueBox';
import { Dialogues, DialogueNode } from './dialogues';
import { PlayerState } from './PlayerData';
import { getTrainer, Trainer } from './TrainerData';
import { QuestTracker } from './QuestTracker';
import { SaveManager } from './SaveManager';

export class LunarCityScene extends Scene {
    private player!: Player;
    private obstacles!: Phaser.Physics.Arcade.StaticGroup;
    private entrances!: Phaser.Physics.Arcade.StaticGroup;
    private npcZones!: Phaser.Physics.Arcade.StaticGroup;
    private autoSaveIndicator!: Phaser.GameObjects.Text;
    private hudText!: Phaser.GameObjects.Text;
    private interactionText!: Phaser.GameObjects.Text;
    private interactKey!: Phaser.Input.Keyboard.Key;
    private spaceKey!: Phaser.Input.Keyboard.Key;
    private enterKey!: Phaser.Input.Keyboard.Key;
    private escKey!: Phaser.Input.Keyboard.Key;
    private teamKey!: Phaser.Input.Keyboard.Key;
    private badgeKey!: Phaser.Input.Keyboard.Key;
    private currentEntrance: string | null = null;
    private currentNPC: string | null = null;
    private dialogueBox!: DialogueBox;
    private questTracker!: QuestTracker;
    private activeDialogue: DialogueNode[] | null = null;
    private currentDialogueIndex: number = 0;
    private spawnEntrance?: string;
    private spawnX?: number;
    private spawnY?: number;
    private isPausedByMenu: boolean = false;

    constructor() {
        super('LunarCityScene');
    }

    init(data: any) {
        this.spawnEntrance = data.spawnEntrance;
        this.spawnX = data.spawnX;
        this.spawnY = data.spawnY;
    }

    create() {
        const worldSize = 3000;
        this.physics.world.setBounds(0, 0, worldSize, worldSize);

        this.add.tileSprite(worldSize / 2, worldSize / 2, worldSize, worldSize, 'grass').setDepth(0);
        this.add.tileSprite(1500, 1500, 128, 3000, 'path').setDepth(1);

        this.obstacles = this.physics.add.staticGroup();
        this.entrances = this.physics.add.staticGroup();
        this.npcZones = this.physics.add.staticGroup();

        // Boundaries
        for (let x = 500; x <= 2500; x += 64) {
            this.obstacles.create(x, 500, 'tree').setDepth(2);
            if (x < 1400 || x > 1600) {
                this.obstacles.create(x, 2500, 'tree').setDepth(2); // South Edge Gap for Route 1
            }
        }
        for (let y = 500; y <= 2500; y += 64) {
            this.obstacles.create(500, y, 'tree').setDepth(2);
            this.obstacles.create(2500, y, 'tree').setDepth(2);
        }

        // Route 1 Transition
        this.add.tileSprite(1500, 2450, 128, 100, 'path').setDepth(1);
        this.obstacles.create(1420, 2450, 'sign').setDepth(2);
        this.add.text(1420, 2420, 'Eclipse Town via Route 1', {
            fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
            backgroundColor: '#000000aa', padding: { x: 4, y: 2 }
        }).setOrigin(0.5).setDepth(5);

        const route1Zone = this.add.zone(1500, 2520, 128, 40);
        this.physics.add.existing(route1Zone, true);
        route1Zone.setData('targetScene', 'Route1Scene');
        this.entrances.add(route1Zone);

        // Welcome Sign
        this.obstacles.create(1600, 2400, 'sign').setDepth(2);
        this.add.text(1600, 2370, 'Welcome to Lunar City!', {
            fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
            backgroundColor: '#000000aa', padding: { x: 4, y: 2 }
        }).setOrigin(0.5).setDepth(5);

        const addBuilding = (x: number, y: number, key: string, label: string, entranceId: string) => {
            const building = this.obstacles.create(x, y, key) as Phaser.Physics.Arcade.Image;
            building.setDepth(2);
            building.refreshBody();
            
            const doorZone = this.add.zone(x, y + building.height / 2 + 10, 48, 48);
            this.physics.add.existing(doorZone, true);
            doorZone.setData('entranceId', entranceId);
            this.entrances.add(doorZone);

            this.add.text(x, y - building.height / 2 - 20, label, {
                fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
                backgroundColor: '#000000aa', padding: { x: 6, y: 4 }
            }).setOrigin(0.5).setDepth(5);
        };

        // Place Lunar City Buildings
        addBuilding(1800, 1500, 'mart', "Poké Mart", 'mart');
        addBuilding(1200, 1500, 'building_gym', 'Lunar City Gym', 'gym');
        addBuilding(1500, 1000, 'center', "Pokemon Center", 'center');
        addBuilding(1000, 1000, 'lab', "Trainer School", 'school'); // Using lab texture for school
        addBuilding(1000, 2000, 'house_player', "House", 'house1');
        addBuilding(1800, 2000, 'house_rival', "House", 'house2');

        // Add NPCs
        const addNPC = (x: number, y: number, key: string, dialogueId: string, label: string) => {
            const npc = new NPC(this, x, y, key, dialogueId);
            this.obstacles.add(npc); 
            this.npcZones.add(npc.interactionZone);
            
            this.add.text(x, y - 36, label, {
                fontFamily: 'monospace', fontSize: '12px', color: '#ffffff',
                backgroundColor: '#000000aa', padding: { x: 4, y: 2 }
            }).setOrigin(0.5).setDepth(20);
        };

        addNPC(1500, 1800, 'npc_traveler', 'lunar_citizen_1', 'Scientist');
        addNPC(1300, 1400, 'npc_youngster', 'lunar_citizen_2', 'Aspiring Trainer');
        addNPC(1600, 1400, 'npc_bugcatcher', 'lunar_citizen_3', 'Bug Enthusiast');
        addNPC(1400, 1200, 'npc_nurse', 'lunar_citizen_4', 'Off-duty Nurse');
        addNPC(1600, 1200, 'npc_kai', 'lunar_citizen_5', 'Cool Guy');
        addNPC(1100, 1200, 'npc_youngster', 'lunar_citizen_6', 'Kid');
        addNPC(1700, 1200, 'npc_traveler', 'lunar_citizen_7', 'Tourist');
        addNPC(1100, 1800, 'npc_bugcatcher', 'lunar_citizen_8', 'Collector');
        addNPC(1700, 1800, 'npc_youngster', 'lunar_citizen_9', 'Student');
        addNPC(1500, 2200, 'npc_nova', 'lunar_citizen_10', 'Researcher');

        let spawnX = this.spawnX, spawnY = this.spawnY;
        if (spawnX === undefined || spawnY === undefined) {
            spawnX = 1500; spawnY = 2450; // default from Route 1
            if (this.spawnEntrance === 'mart') { spawnX = 1800; spawnY = 1580; }
            else if (this.spawnEntrance === 'gym') { spawnX = 1200; spawnY = 1580; }
            else if (this.spawnEntrance === 'center') { spawnX = 1500; spawnY = 1080; }
            // Add other house spawns if needed
        }

        this.player = new Player(this, spawnX, spawnY);

        this.cameras.main.setBounds(0, 0, worldSize, worldSize);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(1.5);

        this.physics.add.collider(this.player, this.obstacles);

        // UI elements (copy-pasted from OverworldScene)
        this.interactionText = this.add.text(0, 0, 'Press E to Enter', {
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

        EventBus.emit('current-scene-ready', this);
    }

    // Methods copied from OverworldScene
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
        const node = this.activeDialogue[this.currentDialogueIndex];
        this.dialogueBox.show(node.speaker, node.text, node.portrait);
    }

    private progressDialogue() {
        if (!this.activeDialogue) return;
        this.currentDialogueIndex++;
        if (this.currentDialogueIndex >= this.activeDialogue.length) {
            this.endDialogue();
        } else {
            this.showCurrentDialogue();
        }
    }

    private endDialogue() {
        this.activeDialogue = null;
        this.dialogueBox.hide();
        this.player.setMovementEnabled(true);
    }

    update(time: number, delta: number) {
        if (this.isPausedByMenu) {
            return;
        }

        if (this.activeDialogue) {
            if (Input.Keyboard.JustDown(this.interactKey) || Input.Keyboard.JustDown(this.spaceKey) || Input.Keyboard.JustDown(this.enterKey)) {
                this.progressDialogue();
            } else if (Input.Keyboard.JustDown(this.escKey)) {
                this.endDialogue();
            }
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

        this.player.update(time, delta);

        const px = Math.round(this.player.x);
        const py = Math.round(this.player.y);
        this.hudText.setText(`Location: Lunar City\nPosition: X: ${px}, Y: ${py}`);

        this.currentEntrance = null;
        let transitionScene: string | null = null;

        this.physics.overlap(this.player, this.entrances, (_player, entranceObj) => {
            const entrance = entranceObj as Phaser.GameObjects.GameObject;
            if (entrance.getData('targetScene')) {
                transitionScene = entrance.getData('targetScene');
            } else {
                this.currentEntrance = entrance.getData('entranceId');
            }
        });

        if (transitionScene) {
            this.autoSave();
            this.scene.start(transitionScene, { spawnEntrance: 'lunar_city' });
            return;
        }

        this.currentNPC = null;
        this.physics.overlap(this.player, this.npcZones, (_player, zoneObj) => {
            const zone = zoneObj as Phaser.GameObjects.GameObject;
            this.currentNPC = zone.getData('dialogueId');
        });

        let interactionMessage = '';
        if (this.currentNPC) {
            interactionMessage = 'Press E to Talk';
        } else if (this.currentEntrance) {
            interactionMessage = 'Press E to Enter';
        }

        if (interactionMessage) {
            this.interactionText.setText(interactionMessage);
            this.interactionText.setPosition(this.player.x, this.player.y - 56).setVisible(true);
            
            if (Input.Keyboard.JustDown(this.interactKey)) {
                if (this.currentNPC) {
                    this.startDialogue(this.currentNPC);
                } else if (this.currentEntrance) {
                    this.autoSave();
                    this.scene.start('InteriorScene', { entranceId: this.currentEntrance, parentScene: this.scene.key });
                }
            }
        } else {
            this.interactionText.setVisible(false);
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