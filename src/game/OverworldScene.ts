import { Scene, Input } from 'phaser';
import { EventBus } from './EventBus';
import { Player } from './Player';
import { NPC } from './NPC';
import { DialogueBox } from './DialogueBox';
import { Dialogues, DialogueNode } from './dialogues';
import { QuestTracker } from './QuestTracker';

export class OverworldScene extends Scene {
    private player!: Player;
    private obstacles!: Phaser.Physics.Arcade.StaticGroup;
    private entrances!: Phaser.Physics.Arcade.StaticGroup;
    private npcZones!: Phaser.Physics.Arcade.StaticGroup;
    private hudText!: Phaser.GameObjects.Text;
    private interactionText!: Phaser.GameObjects.Text;
    private interactKey!: Phaser.Input.Keyboard.Key;
    private spaceKey!: Phaser.Input.Keyboard.Key;
    private enterKey!: Phaser.Input.Keyboard.Key;
    private escKey!: Phaser.Input.Keyboard.Key;
    private currentEntrance: string | null = null;
    private currentNPC: string | null = null;
    private dialogueBox!: DialogueBox;
    private questTracker!: QuestTracker;
    private activeDialogue: DialogueNode[] | null = null;
    private currentDialogueIndex: number = 0;
    private spawnEntrance?: string;

    constructor() {
        super('OverworldScene');
    }

    init(data: any) {
        this.spawnEntrance = data.spawnEntrance;
    }

    create() {
        console.log('OverworldScene: create');

        // Setup World Physics Bounds (2000x2000)
        const worldSize = 2000;
        this.physics.world.setBounds(0, 0, worldSize, worldSize);

        // 1. Draw Grass Background
        this.add.tileSprite(worldSize / 2, worldSize / 2, worldSize, worldSize, 'grass').setDepth(0);

        // 2. Draw Roads (TileSprites for repeating textures)
        const roadDepth = 1;
        // Main horizontal road connecting Center and Mart
        this.add.tileSprite(1000, 1060, 800, 64, 'path').setDepth(roadDepth);
        // Main vertical road to Lab
        this.add.tileSprite(1000, 1060, 64, 400, 'path').setDepth(roadDepth);
        // Branch to Player House
        this.add.tileSprite(800, 850, 64, 250, 'path').setDepth(roadDepth);
        this.add.tileSprite(900, 850, 200, 64, 'path').setDepth(roadDepth);
        // Branch to Rival House
        this.add.tileSprite(1200, 850, 64, 250, 'path').setDepth(roadDepth);
        this.add.tileSprite(1100, 850, 200, 64, 'path').setDepth(roadDepth);

        // 3. Collision-ready Architecture
        this.obstacles = this.physics.add.staticGroup();
        this.entrances = this.physics.add.staticGroup();
        this.npcZones = this.physics.add.staticGroup();

        // Environment: Town Boundaries (Trees)
        for (let x = 500; x <= 1500; x += 64) {
            if (x < 900 || x > 1100) {
                this.obstacles.create(x, 400, 'tree').setDepth(2); // North Edge Gap for Route 1
            }
            this.obstacles.create(x, 1600, 'tree').setDepth(2); // South Edge
        }
        for (let y = 400; y <= 1600; y += 64) {
            this.obstacles.create(500, y, 'tree').setDepth(2); // West Edge
            this.obstacles.create(1500, y, 'tree').setDepth(2); // East Edge
        }

        // Environment: Pond
        this.add.tileSprite(650, 1350, 192, 192, 'water').setDepth(0.5);
        const pondZone = this.add.zone(650, 1350, 192, 192);
        this.physics.add.existing(pondZone, true);
        this.obstacles.add(pondZone);

        // Environment: Flowers & Fences
        this.add.image(750, 800, 'flower').setDepth(0.5);
        this.add.image(850, 800, 'flower').setDepth(0.5);
        this.add.image(1150, 800, 'flower').setDepth(0.5);
        this.add.image(1250, 800, 'flower').setDepth(0.5);
        this.obstacles.create(700, 750, 'fence').setDepth(2);
        this.obstacles.create(900, 750, 'fence').setDepth(2);

        // Route 1 Preparation & Transition
        this.add.tileSprite(1000, 450, 128, 100, 'path').setDepth(roadDepth);
        this.obstacles.create(920, 450, 'sign').setDepth(2);
        this.add.text(920, 420, 'Route 1', {
            fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
            backgroundColor: '#000000aa', padding: { x: 4, y: 2 }
        }).setOrigin(0.5).setDepth(5);

        const route1Zone = this.add.zone(1000, 380, 128, 40);
        this.physics.add.existing(route1Zone, true);
        route1Zone.setData('targetScene', 'Route1Scene');
        this.entrances.add(route1Zone);

        const addBuilding = (x: number, y: number, key: string, label: string, entranceId: string) => {
            const building = this.obstacles.create(x, y, key) as Phaser.Physics.Arcade.Image;
            building.setDepth(2);
            building.refreshBody(); // Sync physics body with actual generated texture size
            
            // Entrance zone mapped at the bottom center of each building
            const doorZone = this.add.zone(x, y + building.height / 2 + 10, 48, 48);
            this.physics.add.existing(doorZone, true);
            doorZone.setData('entranceId', entranceId);
            this.entrances.add(doorZone);

            // Add building label floating above it
            this.add.text(x, y - building.height / 2 - 20, label, {
                fontFamily: 'monospace',
                fontSize: '14px',
                color: '#ffffff',
                backgroundColor: '#000000aa',
                padding: { x: 6, y: 4 }
            }).setOrigin(0.5).setDepth(5);
        };

        // Place Eclipse Town Buildings
        addBuilding(800, 750, 'house_player', 'Player House', 'home');
        addBuilding(1200, 750, 'house_rival', "Kai's House", 'kai_home');
        addBuilding(1000, 1300, 'lab', "Prof. Nova's Lab", 'lab');
        addBuilding(750, 1060, 'center', "Pokemon Center", 'center');
        addBuilding(1250, 1060, 'mart', "Poke Mart", 'mart');

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

        addNPC(1000, 1360, 'npc_nova', 'nova_intro', 'Prof. Nova');
        addNPC(1200, 830, 'npc_kai', 'kai_intro', 'Kai');
        addNPC(750, 1130, 'npc_nurse', 'nurse_intro', 'Nurse');
        addNPC(1250, 1130, 'npc_shopkeeper', 'shopkeeper_intro', 'Shopkeeper');

        // Set spawn point based on which building the player exited
        let spawnX = 800, spawnY = 850;
        if (this.spawnEntrance === 'home') { spawnX = 800; spawnY = 850; }
        else if (this.spawnEntrance === 'kai_home') { spawnX = 1200; spawnY = 850; }
        else if (this.spawnEntrance === 'lab') { spawnX = 1000; spawnY = 1420; }
        else if (this.spawnEntrance === 'center') { spawnX = 750; spawnY = 1140; }
        else if (this.spawnEntrance === 'mart') { spawnX = 1250; spawnY = 1140; }
        else if (this.spawnEntrance === 'route1') { spawnX = 1000; spawnY = 450; }

        this.player = new Player(this, spawnX, spawnY);

        // Setup Camera smooth follow and bounds
        this.cameras.main.setBounds(0, 0, worldSize, worldSize);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08); // 0.08 lerp for smoothness
        this.cameras.main.setZoom(1.5);

        this.physics.add.collider(this.player, this.obstacles);

        // Interaction System
        this.interactionText = this.add.text(0, 0, 'Press E to Enter', {
            fontFamily: 'monospace', fontSize: '12px', color: '#000000',
            backgroundColor: '#ffffff', padding: { x: 6, y: 4 }
        }).setOrigin(0.5).setDepth(100).setVisible(false).setScrollFactor(1);

        if (this.input.keyboard) {
            this.interactKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.E);
            this.spaceKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.SPACE);
            this.enterKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.ENTER);
            this.escKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.ESC);
        }

        // Setup Dialogue Box UI
        this.dialogueBox = new DialogueBox(this);
        this.questTracker = new QuestTracker(this);

        // Minimal HUD overlay (fixed to camera)
        this.hudText = this.add.text(16, 16, '', {
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: '#00000099',
            padding: { x: 8, y: 8 }
        }).setScrollFactor(0).setDepth(100);

        // Notify React that the scene is ready
        EventBus.emit('current-scene-ready', this);
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
        if (this.activeDialogue) {
            if (Input.Keyboard.JustDown(this.interactKey) || Input.Keyboard.JustDown(this.spaceKey) || Input.Keyboard.JustDown(this.enterKey)) {
                this.progressDialogue();
            } else if (Input.Keyboard.JustDown(this.escKey)) {
                this.endDialogue();
            }
            return; // Skip normal update logic while in dialogue
        }

        // Delegate movement logic to the Player class
        this.player.update(time, delta);

        // Update HUD Data
        const px = Math.round(this.player.x);
        const py = Math.round(this.player.y);
        this.hudText.setText(`Location: Eclipse Town\nPosition: X: ${px}, Y: ${py}`);

        // Entrance Detection logic
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
            this.scene.start(transitionScene, { spawnEntrance: 'town' });
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
                    this.scene.start('InteriorScene', { entranceId: this.currentEntrance });
                }
            }
        } else {
            this.interactionText.setVisible(false);
        }
    }
}