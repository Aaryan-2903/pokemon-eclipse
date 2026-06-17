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

export class EclipseForestScene extends Scene {
    private player!: Player;
    private obstacles!: Phaser.Physics.Arcade.StaticGroup;
    private entrances!: Phaser.Physics.Arcade.StaticGroup;
    private npcZones!: Phaser.Physics.Arcade.StaticGroup;
    private tallGrassZones!: Phaser.Physics.Arcade.StaticGroup;
    private interactionText!: Phaser.GameObjects.Text;
    private interactKey!: Phaser.Input.Keyboard.Key;
    private spaceKey!: Phaser.Input.Keyboard.Key;
    private enterKey!: Phaser.Input.Keyboard.Key;
    private escKey!: Phaser.Input.Keyboard.Key;
    private currentNPC: string | null = null;
    private dialogueBox!: DialogueBox;
    private activeDialogue: DialogueNode[] | null = null;
    private currentDialogueIndex: number = 0;
    private encounterManager!: EncounterManager;
    private playerLastPosForEncounter!: Phaser.Math.Vector2;
    private readonly STEP_DISTANCE_FOR_ENCOUNTER_CHECK = 32;

    constructor() {
        super('EclipseForestScene');
    }

    create() {
        const worldWidth = 2000;
        const worldHeight = 2000;
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

        this.add.tileSprite(worldWidth / 2, worldHeight / 2, worldWidth, worldHeight, 'grass').setDepth(0);

        this.obstacles = this.physics.add.staticGroup();
        this.entrances = this.physics.add.staticGroup();
        this.npcZones = this.physics.add.staticGroup();
        this.tallGrassZones = this.physics.add.staticGroup();

        // Forest maze layout with trees
        for (let i = 0; i < 50; i++) {
            const x = Phaser.Math.Between(100, worldWidth - 100);
            const y = Phaser.Math.Between(100, worldHeight - 100);
            // Avoid blocking the main path
            if (x > 800 && x < 1200) continue;
            this.obstacles.create(x, y, 'tree').setDepth(Phaser.Math.Between(2, 4));
        }

        // Define the main path
        this.add.tileSprite(1000, 1000, 128, worldHeight, 'path').setDepth(1);

        // Add tall grass
        const addTallGrass = (x: number, y: number, width: number, height: number) => {
            this.add.tileSprite(x, y, width, height, 'tall_grass').setDepth(0.5);
            this.tallGrassZones.create(x, y).setSize(width, height).setVisible(false);
        };
        addTallGrass(500, 500, 512, 256);
        addTallGrass(1500, 1500, 512, 512);

        // Southern entrance from Route 2
        const route2Zone = this.add.zone(1000, worldHeight - 20, 128, 40);
        this.physics.add.existing(route2Zone, true);
        route2Zone.setData('targetScene', 'Route2Scene');
        this.entrances.add(route2Zone);

        // Northern exit to Route 3 (initially blocked)
        const route3Zone = this.add.zone(1000, 20, 128, 40);
        this.physics.add.existing(route3Zone, true);
        route3Zone.setData('targetScene', 'OverworldScene'); // Placeholder for Route 3
        this.entrances.add(route3Zone);

        // Player setup
        this.player = new Player(this, 1000, worldHeight - 100);
        this.playerLastPosForEncounter = new Phaser.Math.Vector2(this.player.x, this.player.y);
        this.physics.add.collider(this.player, this.obstacles);

        // Camera
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(1.5);

        // Encounter Manager
        this.encounterManager = new EncounterManager(this);

        // UI
        this.dialogueBox = new DialogueBox(this);
        new QuestTracker(this); // Automatically adds itself to the scene

        this.interactionText = this.add.text(0, 0, 'Press E', {
            fontFamily: 'monospace', fontSize: '12px', color: '#000000',
            backgroundColor: '#ffffff', padding: { x: 6, y: 4 }
        }).setOrigin(0.5).setDepth(100).setVisible(false);

        if (this.input.keyboard) {
            this.interactKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.E);
            this.spaceKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.SPACE);
            this.enterKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.ENTER);
            this.escKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.ESC);
        }

        // Story Event: Team Umbra in the forest
        if (!StoryManager.getInstance().hasFlag(StoryFlag.DEFEATED_UMBRA_IN_FOREST)) {
            const umbraGrunt = new NPC(this, 1000, 1000, 'npc_kai', 'forest_umbra_intro', 'forest_umbra_grunt');
            this.obstacles.add(umbraGrunt);
            this.npcZones.add(umbraGrunt.interactionZone);
        }

        // Story Progression
        if (!StoryManager.getInstance().hasFlag(StoryFlag.ENTERED_ECLIPSE_FOREST)) {
            this.time.delayedCall(500, () => {
                this.startDialogue('forest_entry');
                StoryManager.getInstance().setFlag(StoryFlag.ENTERED_ECLIPSE_FOREST);
                StoryManager.getInstance().setActiveQuest("Find the source of the disturbance");
                EventBus.emit('quest-updated');
            });
        }
    }

    private startDialogue(dialogueId: string) {
        if (!Dialogues[dialogueId]) return;
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
            this.activeDialogue = null;
            this.dialogueBox.hide();
            this.player.setMovementEnabled(true);
        } else {
            this.showCurrentDialogue();
        }
    }

    update(time: number, delta: number) {
        if (this.activeDialogue) {
            if (Input.Keyboard.JustDown(this.interactKey) || Input.Keyboard.JustDown(this.spaceKey) || Input.Keyboard.JustDown(this.enterKey)) {
                this.progressDialogue();
            }
            return;
        }

        if (!this.player.canMove()) return;

        this.player.update(time, delta);

        // Scene Transition
        let transitionScene: string | null = null;
        this.physics.overlap(this.player, this.entrances, (_player, entrance) => {
            transitionScene = (entrance as Phaser.GameObjects.GameObject).getData('targetScene');
        });
        if (transitionScene) {
            this.scene.start(transitionScene, { spawnEntrance: 'forest' });
            return;
        }

        // NPC Interaction
        this.currentNPC = null;
        let currentTrainerId: string | null = null;
        this.physics.overlap(this.player, this.npcZones, (_player, zone) => {
            const go = zone as Phaser.GameObjects.GameObject;
            this.currentNPC = go.getData('dialogueId');
            currentTrainerId = go.getData('trainerId');
        });

        if (this.currentNPC) {
            this.interactionText.setText('Press E to Talk').setPosition(this.player.x, this.player.y - 56).setVisible(true);
            if (Input.Keyboard.JustDown(this.interactKey)) {
                this.startDialogue(this.currentNPC);
            }
        } else {
            this.interactionText.setVisible(false);
        }

        // Wild Encounters
        let inTallGrass = false;
        this.physics.overlap(this.player, this.tallGrassZones, () => {
            inTallGrass = true;
        });

        if (inTallGrass && this.player.isMoving()) {
            const distance = this.playerLastPosForEncounter.distance({ x: this.player.x, y: this.player.y });
            if (distance >= this.STEP_DISTANCE_FOR_ENCOUNTER_CHECK) {
                this.playerLastPosForEncounter.set(this.player.x, this.player.y);
                const encounter = this.encounterManager.checkEncounter('EclipseForestScene');
                if (encounter) {
                    // Simplified trigger for now
                    console.log(`Wild ${encounter.name} appeared!`);
                }
            }
        } else {
            this.playerLastPosForEncounter.set(this.player.x, this.player.y);
        }
    }
}