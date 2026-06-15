import { Scene, Input } from 'phaser';
import { Player } from './Player';
import { DialogueBox } from './DialogueBox';
import { Dialogues, DialogueNode } from './dialogues';
import { StoryManager, StoryFlag } from './StoryManager';
import { EventBus } from './EventBus';
import { QuestTracker } from './QuestTracker';
import { StarterSelectionUI } from './StarterSelectionUI';
import { PlayerState } from './PlayerData';
import { generatePlayerPokemon } from './PokemonData';
import { NPC } from './NPC';
import { SaveManager } from './SaveManager';

export class InteriorScene extends Scene {
    private player!: Player;
    private entranceId!: string;
    private exitZone!: Phaser.GameObjects.Zone;
    private dialogueBox!: DialogueBox;
    private questTracker!: QuestTracker;
    private interactKey!: Phaser.Input.Keyboard.Key;
    private spaceKey!: Phaser.Input.Keyboard.Key;
    private enterKey!: Phaser.Input.Keyboard.Key;
    private escKey!: Phaser.Input.Keyboard.Key;
    private interactionText!: Phaser.GameObjects.Text;
    private obstacles!: Phaser.Physics.Arcade.StaticGroup;
    private npcZones!: Phaser.Physics.Arcade.StaticGroup;
    
    private activeDialogueKey: string | null = null;
    private activeDialogue: DialogueNode[] | null = null;
    private currentDialogueIndex: number = 0;
    private currentNPC: string | null = null;
    public starterUIOpen: boolean = false;
    private spawnX?: number;
    private spawnY?: number;

    constructor() {
        super('InteriorScene');
    }

    init(data: any) {
        this.entranceId = data.entranceId || 'home';
        this.spawnX = data.spawnX;
        this.spawnY = data.spawnY;
    }

    create() {
        // Room rendering
        this.add.rectangle(400, 300, 800, 600, 0x000000).setDepth(-2);
        const isLab = this.entranceId === 'lab';
        const floorTex = isLab ? 'floor_lab' : 'floor_wood';
        
        // Draw walls (visual border to provide movement reference points)
        this.add.rectangle(400, 300, 620, 420, 0x333333).setDepth(-1.5);
        this.add.tileSprite(400, 300, 600, 400, floorTex).setDepth(-1);
        this.physics.world.setBounds(100, 100, 600, 400); // Create walls naturally
        this.obstacles = this.physics.add.staticGroup();

        // Add a visible exit door
        this.add.rectangle(400, 500, 100, 20, 0x000000).setDepth(0); // Doorway gap
        this.add.image(400, 490, 'exit_mat').setDepth(0);
        
        let playerX = 400, playerY = 450;
        if (this.spawnX !== undefined && this.spawnY !== undefined) {
            playerX = this.spawnX;
            playerY = this.spawnY;
        }

        this.player = new Player(this, playerX, playerY);
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, this.obstacles);
        
        this.exitZone = this.add.zone(400, 490, 100, 40);
        this.physics.add.existing(this.exitZone, true);

        this.cameras.main.setBounds(0, 0, 800, 600);
        this.cameras.main.setZoom(1.5);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

        this.dialogueBox = new DialogueBox(this);
        this.questTracker = new QuestTracker(this);
        this.npcZones = this.physics.add.staticGroup();

        if (this.input.keyboard) {
            this.interactKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.E);
            this.spaceKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.SPACE);
            this.enterKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.ENTER);
            this.escKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.ESC);
        }

        this.interactionText = this.add.text(0, 0, 'Press E to Exit', {
            fontFamily: 'monospace', fontSize: '12px', color: '#000000',
            backgroundColor: '#ffffff', padding: { x: 6, y: 4 }
        }).setOrigin(0.5).setDepth(100).setVisible(false).setScrollFactor(1);

        // Location-specific setup
        this.setupLocation();

        // Process Opening Story Events
        if (this.entranceId === 'home' && !StoryManager.getInstance().hasFlag(StoryFlag.INTRO_DONE)) {
            this.time.delayedCall(500, () => {
                this.startDialogue('home_intro');
                StoryManager.getInstance().setFlag(StoryFlag.INTRO_DONE);
                StoryManager.getInstance().setActiveQuest("Visit Professor Nova's Lab");
                EventBus.emit('quest-updated');
            });
        } else if (this.entranceId === 'lab' && !StoryManager.getInstance().hasFlag(StoryFlag.HAS_CHOSEN_STARTER)) {
            this.time.delayedCall(500, () => {
                this.startDialogue('nova_lab_intro');
            });
        }
        
        EventBus.emit('current-scene-ready', this);
    }

    private setupLocation() {
        if (this.entranceId === 'center') {
            // Add desk and nurse for Pokemon Center
            const desk = this.obstacles.create(400, 280, 'desk_texture');
            desk.refreshBody();

            const nurse = new NPC(this, 400, 250, 'npc_nurse', 'nurse_center_welcome');
            this.npcZones.add(nurse.interactionZone);
        } else if (this.entranceId === 'home') {
            // Add a visible center rug for visual movement reference
            this.add.rectangle(400, 300, 120, 80, 0x7f1d1d).setDepth(-0.5);
        }
        // Can add else-if blocks for 'mart', 'kai_home', etc.
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
        this.dialogueBox.hide();
        const previousDialogueKey = this.activeDialogueKey;
        
        this.activeDialogueKey = null;
        this.activeDialogue = null;

        if (previousDialogueKey === 'nova_lab_intro' && !StoryManager.getInstance().hasFlag(StoryFlag.HAS_CHOSEN_STARTER)) {
            this.starterUIOpen = true;
            new StarterSelectionUI(this, (starterName) => {
                this.starterUIOpen = false;
                console.log(`Starter selected: ${starterName}`);
                PlayerState.starterPokemon = starterName;
                StoryManager.getInstance().setFlag(StoryFlag.HAS_CHOSEN_STARTER);

                if (PlayerState.pokemonTeam.length === 0) {
                    const playerMon = generatePlayerPokemon(starterName, 5);
                    console.log('Player Pokemon created:', playerMon);
                    PlayerState.pokemonTeam.push(playerMon);
                    console.log('Player Pokemon saved. Current team:', PlayerState.pokemonTeam);
                }

                // Transition seamlessly into the Pokédex sequence
                this.activeDialogueKey = 'nova_give_pokedex';
                this.activeDialogue = [{ speaker: 'System', text: `You chose ${starterName}!` }, ...(Dialogues['nova_give_pokedex'] || [])];
                this.currentDialogueIndex = 0;
                this.showCurrentDialogue();
            });
        } else if (previousDialogueKey === 'nova_give_pokedex') {
            StoryManager.getInstance().setFlag(StoryFlag.HAS_RECEIVED_POKEDEX);
            StoryManager.getInstance().setActiveQuest("Travel to Route 1");
            EventBus.emit('quest-updated');
            this.player.setMovementEnabled(true);
        } else if (previousDialogueKey === 'nurse_center_welcome') {
            this.startHealingSequence();
        } else {
            this.player.setMovementEnabled(true);
        }
    }

    private startHealingSequence() {
        this.player.setMovementEnabled(false);

        // 1. Fade to white
        this.cameras.main.fadeOut(500, 255, 255, 255);

        this.cameras.main.once('camerafadeoutcomplete', () => {
            // 2. Heal all Pokémon in the party
            PlayerState.pokemonTeam.forEach(pokemon => {
                if (pokemon) pokemon.currentHp = pokemon.maxHp;
            });
            console.log('All Pokémon have been healed.', PlayerState.pokemonTeam);

            // 3. Wait a moment, then fade back in
            this.time.delayedCall(1000, () => {
                this.cameras.main.fadeIn(500, 255, 255, 255);
                this.cameras.main.once('camerafadeincomplete', () => {
                    this.startDialogue('nurse_center_complete');
                });
            });
        });
    }

    update(time: number, delta: number) {
        if (this.starterUIOpen || this.activeDialogue) {
            if (this.activeDialogue && !this.starterUIOpen) {
                if (Input.Keyboard.JustDown(this.spaceKey) || Input.Keyboard.JustDown(this.enterKey) || Input.Keyboard.JustDown(this.interactKey)) {
                    this.progressDialogue();
                } else if (Input.Keyboard.JustDown(this.escKey)) {
                    this.endDialogue();
                }
            }
            return;
        }

        this.player.update(time, delta);

        let nearExit = false;
        this.physics.overlap(this.player, this.exitZone, () => {
            nearExit = true;
        });

        this.currentNPC = null;
        this.physics.overlap(this.player, this.npcZones, (_player, zone) => {
            this.currentNPC = (zone as Phaser.GameObjects.GameObject).getData('dialogueId');
        });

        let interactionMessage = '';
        if (this.currentNPC) {
            interactionMessage = 'Press E to Talk';
        } else if (nearExit) {
            interactionMessage = 'Press E to Exit';
        }

        if (interactionMessage) {
            this.interactionText.setText(interactionMessage).setPosition(this.player.x, this.player.y - 56).setVisible(true);
            
            if (Input.Keyboard.JustDown(this.interactKey)) {
                if (this.currentNPC) {
                    this.startDialogue(this.currentNPC);
                } else if (nearExit) {
                    SaveManager.save(this, this.player.x, this.player.y);
                    this.scene.start('OverworldScene', { spawnEntrance: this.entranceId });
                }
            }
        } else {
            this.interactionText.setVisible(false);
        }
    }
}