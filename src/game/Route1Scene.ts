import { Scene, Input } from 'phaser';
import { EventBus } from './EventBus';
import { Player } from './Player';
import { NPC } from './NPC';
import { DialogueBox } from './DialogueBox';
import { Dialogues, DialogueNode } from './dialogues';
import { QuestTracker } from './QuestTracker';
import { StoryManager, StoryFlag } from './StoryManager';
import { Route1Data } from './RouteData';

export class Route1Scene extends Scene {
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
    private currentNPC: string | null = null;
    private dialogueBox!: DialogueBox;
    private questTracker!: QuestTracker;
    private activeDialogue: DialogueNode[] | null = null;
    private currentDialogueIndex: number = 0;
    private spawnEntrance?: string;

    constructor() {
        super('Route1Scene');
    }

    init(data: any) {
        this.spawnEntrance = data.spawnEntrance;
    }

    create() {
        console.log(`Loading Route Data: ${Route1Data.name}`);

        // Larger World Bounds for exploration (2000x3000)
        const worldWidth = 2000;
        const worldHeight = 3000;
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

        // Grass Background
        this.add.tileSprite(worldWidth / 2, worldHeight / 2, worldWidth, worldHeight, 'grass').setDepth(0);

        // Main dirt pathway leading north
        this.add.tileSprite(1000, 1500, 128, 3000, 'path').setDepth(1);

        // Exploration Areas: Tall Grass Patches (Future Encounter Zones)
        this.add.tileSprite(800, 2500, 256, 256, 'tall_grass').setDepth(0.5);
        this.add.tileSprite(1200, 2000, 256, 384, 'tall_grass').setDepth(0.5);
        this.add.tileSprite(800, 1200, 384, 256, 'tall_grass').setDepth(0.5);
        this.add.tileSprite(1200, 600, 256, 256, 'tall_grass').setDepth(0.5);

        this.obstacles = this.physics.add.staticGroup();
        this.entrances = this.physics.add.staticGroup();
        this.npcZones = this.physics.add.staticGroup();

        // Environment: Route Boundaries (Trees)
        for (let x = 500; x <= 1500; x += 64) {
            this.obstacles.create(x, 100, 'tree').setDepth(2); // North Edge
            if (x < 900 || x > 1100) this.obstacles.create(x, 2900, 'tree').setDepth(2); // South Edge Gap for Town
        }
        for (let y = 100; y <= 2900; y += 64) {
            this.obstacles.create(500, y, 'tree').setDepth(2); // West Edge
            this.obstacles.create(1500, y, 'tree').setDepth(2); // East Edge
        }

        // Decorative environment items
        this.obstacles.create(850, 2300, 'fence').setDepth(2);
        this.add.image(850, 2350, 'flower').setDepth(0.5);

        // Water hazard area
        this.add.tileSprite(1250, 1000, 256, 256, 'water').setDepth(0.5);
        const pondZone = this.add.zone(1250, 1000, 256, 256);
        this.physics.add.existing(pondZone, true);
        this.obstacles.add(pondZone);

        // Route sign
        this.obstacles.create(1100, 2800, 'sign').setDepth(2);
        this.add.text(1100, 2770, 'Route 1\nNorth: Lunar City', {
            fontFamily: 'monospace', fontSize: '12px', color: '#ffffff',
            backgroundColor: '#000000aa', padding: { x: 4, y: 2 }, align: 'center'
        }).setOrigin(0.5).setDepth(5);

        // NPCs
        const addNPC = (x: number, y: number, key: string, dialogueId: string, label: string) => {
            const npc = new NPC(this, x, y, key, dialogueId);
            this.obstacles.add(npc); 
            this.npcZones.add(npc.interactionZone);
            this.add.text(x, y - 36, label, {
                fontFamily: 'monospace', fontSize: '12px', color: '#ffffff',
                backgroundColor: '#000000aa', padding: { x: 4, y: 2 }
            }).setOrigin(0.5).setDepth(20);
        };

        addNPC(1000, 2200, 'npc_youngster', 'route1_youngster', 'Youngster');
        addNPC(800, 1300, 'npc_bugcatcher', 'route1_bugcatcher', 'Bug Catcher');
        addNPC(1000, 500, 'npc_traveler', 'route1_traveler', 'Traveler');

        // Map Transition: Return to Eclipse Town
        const townZone = this.add.zone(1000, 2950, 200, 40);
        this.physics.add.existing(townZone, true);
        townZone.setData('targetScene', 'OverworldScene');
        this.entrances.add(townZone);

        // Spawn location logic
        let spawnX = 1000, spawnY = 2850;
        if (this.spawnEntrance === 'town') { spawnX = 1000; spawnY = 2850; }
        this.player = new Player(this, spawnX, spawnY);

        // Camera Setup
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(1.5);
        this.physics.add.collider(this.player, this.obstacles);

        // UI & Quest System Trigger
        this.dialogueBox = new DialogueBox(this);
        this.questTracker = new QuestTracker(this);
        this.hudText = this.add.text(16, 16, '', {
            fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
            backgroundColor: '#00000099', padding: { x: 8, y: 8 }
        }).setScrollFactor(0).setDepth(100);
        
        this.interactionText = this.add.text(0, 0, 'Press E to Talk', {
            fontFamily: 'monospace', fontSize: '12px', color: '#000000',
            backgroundColor: '#ffffff', padding: { x: 6, y: 4 }
        }).setOrigin(0.5).setDepth(100).setVisible(false).setScrollFactor(1);

        if (this.input.keyboard) {
            this.interactKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.E);
            this.spaceKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.SPACE);
            this.enterKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.ENTER);
            this.escKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.ESC);
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
    }

    // Reuse Dialogue functions (abbreviated here, identical to OverworldScene)
    private showCurrentDialogue() { this.dialogueBox.show(this.activeDialogue![this.currentDialogueIndex].speaker, this.activeDialogue![this.currentDialogueIndex].text, this.activeDialogue![this.currentDialogueIndex].portrait); }
    private progressDialogue() { this.currentDialogueIndex++; if (this.currentDialogueIndex >= this.activeDialogue!.length) { this.activeDialogue = null; this.dialogueBox.hide(); this.player.setMovementEnabled(true); } else { this.showCurrentDialogue(); } }

    update(time: number, delta: number) {
        if (this.activeDialogue) {
            if (Input.Keyboard.JustDown(this.interactKey) || Input.Keyboard.JustDown(this.spaceKey) || Input.Keyboard.JustDown(this.enterKey)) this.progressDialogue();
            return;
        }

        this.player.update(time, delta);
        this.hudText.setText(`Location: Route 1\nPosition: X: ${Math.round(this.player.x)}, Y: ${Math.round(this.player.y)}`);

        let transitionScene: string | null = null;
        this.physics.overlap(this.player, this.entrances, (_player, entrance) => { transitionScene = (entrance as Phaser.GameObjects.GameObject).getData('targetScene'); });
        if (transitionScene) { this.scene.start(transitionScene, { spawnEntrance: 'route1' }); return; }

        this.currentNPC = null;
        this.physics.overlap(this.player, this.npcZones, (_player, zone) => { this.currentNPC = (zone as Phaser.GameObjects.GameObject).getData('dialogueId'); });
        if (this.currentNPC) { this.interactionText.setPosition(this.player.x, this.player.y - 56).setVisible(true); if (Input.Keyboard.JustDown(this.interactKey)) { this.activeDialogue = Dialogues[this.currentNPC]; this.currentDialogueIndex = 0; this.player.setMovementEnabled(false); this.interactionText.setVisible(false); this.showCurrentDialogue(); } } 
        else { this.interactionText.setVisible(false); }
    }
}