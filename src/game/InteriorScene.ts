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
import { getTrainer, Trainer } from './TrainerData';
import { NPC } from './NPC';
import { SaveManager } from './SaveManager';
import { GameFeel } from './GameFeel';

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
    private teamKey!: Phaser.Input.Keyboard.Key;
    private badgeKey!: Phaser.Input.Keyboard.Key;
    private leftKey!: Phaser.Input.Keyboard.Key;
    private rightKey!: Phaser.Input.Keyboard.Key;
    private autoSaveIndicator!: Phaser.GameObjects.Text;
    private interactionText!: Phaser.GameObjects.Text;
    private obstacles!: Phaser.Physics.Arcade.StaticGroup;
    private npcZones!: Phaser.Physics.Arcade.StaticGroup;
    private bedZone?: Phaser.GameObjects.Zone;
    private restPrompt?: Phaser.GameObjects.Container;
    private restPromptOpen = false;
    private restChoiceIndex = 0;
    private restChoiceTexts: Phaser.GameObjects.Text[] = [];
    private isResting = false;
    
    private activeDialogueKey: string | null = null;
    private activeDialogue: DialogueNode[] | null = null;
    private currentDialogueIndex: number = 0;
    private currentNPC: string | null = null;
    private parentScene!: string;
    public starterUIOpen: boolean = false;
    private spawnX?: number;
    private spawnY?: number;
    private isPausedByMenu: boolean = false;

    constructor() {
        super('InteriorScene');
    }

    init(data: any) {
        this.entranceId = data.entranceId || 'home';
        this.spawnX = data.spawnX;
        this.spawnY = data.spawnY;
        this.parentScene = data.parentScene || 'OverworldScene';
    }

    create() {
        GameFeel.startMusic(this, this.entranceId === 'center' || this.entranceId === 'mart' ? 'city' : 'route');
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
            this.teamKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.T);
            this.badgeKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.B);
            this.leftKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.LEFT);
            this.rightKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.RIGHT);
        }

        this.interactionText = this.add.text(0, 0, 'Press E to Exit', {
            fontFamily: 'monospace', fontSize: '12px', color: '#000000',
            backgroundColor: '#ffffff', padding: { x: 6, y: 4 }
        }).setOrigin(0.5).setDepth(100).setVisible(false).setScrollFactor(1);

        this.autoSaveIndicator = this.add.text(this.cameras.main.displayWidth / 2, 16, '', {
            fontFamily: 'monospace', fontSize: '14px', color: '#22c55e',
            backgroundColor: '#000000aa', padding: { x: 8, y: 4 }
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(200).setAlpha(0);

        const menuButton = document.createElement('button');
        menuButton.innerHTML = '&#9776; Menu'; // Hamburger icon
        menuButton.style.position = 'absolute';
        menuButton.style.top = '60px';
        menuButton.style.right = '20px';
        menuButton.style.padding = '8px 12px';
        menuButton.style.backgroundColor = '#111827';
        menuButton.style.color = 'white';
        menuButton.style.border = '2px solid #4b5563';
        menuButton.style.borderRadius = '5px';
        menuButton.style.cursor = 'pointer';
        menuButton.style.fontFamily = 'monospace';
        menuButton.style.zIndex = '100';

        menuButton.onclick = () => {
            console.log("Menu button clicked");
            this.openMenu();
        };

        // Add the button as a DOM element, which will overlay the canvas
        const domElement = this.add.dom(0, 0, menuButton).setOrigin(0, 0);

        EventBus.on('save-game-from-menu', this.manualSave, this);
        this.events.on('shutdown', () => {
            // Clean up listeners and DOM elements to prevent memory leaks
            EventBus.off('save-game-from-menu', this.manualSave, this);
            domElement.destroy();
        });

        this.events.on('resume', () => {
            this.isPausedByMenu = false;
            // When the scene resumes from a paused state (e.g., closing the menu), re-enable player movement.
            if (!this.activeDialogue && !this.starterUIOpen && !this.isResting && !this.restPromptOpen) {
                this.player.setMovementEnabled(true);
            }
        });

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

    private addNPC(x: number, y: number, key: string, dialogueId: string, label: string, trainerId?: string) {
        const npc = new NPC(this, x, y, key, dialogueId, trainerId);
        this.obstacles.add(npc);
        this.npcZones.add(npc.interactionZone);
        this.add.text(x, y - 36, label, { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff', backgroundColor: '#000000aa', padding: { x: 4, y: 2 } }).setOrigin(0.5).setDepth(20);
        return npc;
    }

    private startTrainerBattle(trainer: Trainer) {
        this.player.setMovementEnabled(false);
        this.interactionText.setVisible(false);
    
        // Show pre-battle dialogue
        this.activeDialogueKey = trainer.id; // Use trainer id as a key
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
                    this.scene.resume();
                    
                    if (result === 'win') {
                        PlayerState.defeatedTrainers.add(trainer.id);
                        PlayerState.money += trainer.rewardMoney;
                        this.autoSave(); // Auto-save after winning

                        if (trainer.id === 'gym_aurora') {
                            PlayerState.badges.add('Sky Badge');
                            this.startDialogue('gym_aurora_victory');
                            StoryManager.getInstance().setFlag(StoryFlag.DEFEATED_GYM1);
                            StoryManager.getInstance().setActiveQuest("Meet Kai on Route 2");
                            EventBus.emit('quest-updated');
                        } else if (trainer.id === 'gym_lily') {
                            PlayerState.badges.add('Verdant Badge');
                            this.startDialogue('gym_lily_victory');
                            StoryManager.getInstance().setFlag(StoryFlag.DEFEATED_GYM2);
                            StoryManager.getInstance().setActiveQuest("Explore the path north of Veridia");
                        } else {
                            this.startDialogue(`${trainer.id}_defeated`);
                        }
                    } else if (result === 'loss') {
                        this.scene.start('InteriorScene', { entranceId: 'center', parentScene: 'OverworldScene' }); // Go to pokecenter on loss, assume it's in Eclipse Town
                    }
                });
            });
        };
    }

    private openMenu() {
        this.isPausedByMenu = true;
        // Explicitly disable player movement before pausing the scene to prevent background input.
        this.player.setMovementEnabled(false);
        this.interactionText.setVisible(false); // Hide interaction prompts
        this.scene.pause();
        this.scene.launch('MenuScene', { fromScene: this.scene.key });
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
            this.addPlayerHouseBed();
        } else if (this.entranceId === 'gym') {
            if (!PlayerState.defeatedTrainers.has('gym_aurora')) {
                this.addNPC(400, 200, 'npc_aurora', 'gym_aurora_intro', 'Gym Leader Aurora', 'gym_aurora');
            } else {
                this.addNPC(400, 200, 'npc_aurora', 'gym_aurora_defeated', 'Gym Leader Aurora');
            }
        } else if (this.entranceId === 'gym_veridia') {
            if (!PlayerState.defeatedTrainers.has('veridia_gym_trainer_1')) {
                this.addNPC(300, 350, 'npc_traveler', 'veridia_gym_trainer_1_prebattle', 'Lass Briana', 'veridia_gym_trainer_1');
            }
            if (!PlayerState.defeatedTrainers.has('veridia_gym_trainer_2')) {
                this.addNPC(500, 350, 'npc_bugcatcher', 'veridia_gym_trainer_2_prebattle', 'Bug Catcher James', 'veridia_gym_trainer_2');
            }
            if (!PlayerState.defeatedTrainers.has('gym_lily')) {
                this.addNPC(400, 200, 'npc_nova', 'gym_lily_intro', 'Gym Leader Lily', 'gym_lily');
            } else {
                this.addNPC(400, 200, 'npc_nova', 'gym_lily_defeated', 'Gym Leader Lily');
            }
        } else if (this.entranceId === 'mart') {
            // Add shopkeeper
            const shopkeeper = new NPC(this, 400, 250, 'npc_shopkeeper', 'shopkeeper_menu');
            this.obstacles.add(shopkeeper);
            this.npcZones.add(shopkeeper.interactionZone);
        } else if (this.entranceId === 'school') {
            this.add.text(400, 300, 'Trainer School\n(Under Construction)', { fontFamily: 'monospace', fontSize: '24px', color: '#ffffff', align: 'center' }).setOrigin(0.5);
        } else if (this.entranceId.startsWith('house')) {
            this.add.text(400, 300, 'This is a private residence.', { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' }).setOrigin(0.5);
        }
        // Can add else-if blocks for 'mart', 'kai_home', etc.
    }

    private addPlayerHouseBed() {
        this.add.rectangle(220, 185, 112, 78, 0x8b5cf6).setDepth(0.2).setStrokeStyle(3, 0x312e81);
        this.add.rectangle(220, 158, 100, 24, 0xe0f2fe).setDepth(0.3);
        this.add.rectangle(220, 198, 100, 50, 0xc4b5fd).setDepth(0.3);
        this.add.text(220, 236, 'Bed', {
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#ffffff',
            backgroundColor: '#00000099',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5).setDepth(5);

        const bedObstacle = this.add.zone(220, 185, 112, 78);
        this.physics.add.existing(bedObstacle, true);
        this.obstacles.add(bedObstacle);

        this.bedZone = this.add.zone(220, 250, 140, 90);
        this.physics.add.existing(this.bedZone, true);
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
                    PlayerState.pokedex.caught.add(starterName);
                    PlayerState.pokedex.seen.add(starterName);
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
            this.startDialogue('nova_give_items');
        } else if (previousDialogueKey === 'shopkeeper_menu') {
            this.scene.pause();
            this.scene.launch('ShopScene', { fromScene: this.scene.key });
        } else if (previousDialogueKey === 'nurse_center_welcome') {
            this.startHealingSequence();
        } else if (previousDialogueKey === 'nova_give_items') {
            PlayerState.inventory['Pokeball'] = (PlayerState.inventory['Pokeball'] || 0) + 5;
            PlayerState.inventory['Potion'] = (PlayerState.inventory['Potion'] || 0) + 2;
            console.log('Items added. Current inventory:', PlayerState.inventory);
            this.player.setMovementEnabled(true);
        } else {
            this.player.setMovementEnabled(true);
        }
    }

    private startHealingSequence() {
        this.player.setMovementEnabled(false);
        GameFeel.playSfx('heal');

        // 1. Fade to white
        this.cameras.main.fadeOut(500, 255, 255, 255);

        this.cameras.main.once('camerafadeoutcomplete', () => {
            // 2. Heal all Pokémon in the party
            PlayerState.pokemonTeam.forEach(pokemon => {
                if (pokemon) pokemon.currentHp = pokemon.maxHp;
            });
            console.log('All Pokémon have been healed.', PlayerState.pokemonTeam);

            // Auto-save the healed state
            this.autoSave();

            // 3. Wait a moment, then fade back in
            this.time.delayedCall(1000, () => {
                this.cameras.main.fadeIn(500, 255, 255, 255);
                this.cameras.main.once('camerafadeincomplete', () => {
                    this.startDialogue('nurse_center_complete');
                });
            });
        });
    }

    private openRestPrompt() {
        if (this.restPromptOpen || this.isResting) return;

        this.restPromptOpen = true;
        this.restChoiceIndex = 0;
        this.player.setMovementEnabled(false);
        this.interactionText.setVisible(false);

        this.restPrompt = this.add.container(400, 300).setScrollFactor(0).setDepth(500);
        const panel = this.add.rectangle(0, 0, 360, 170, 0x000000, 0.88).setStrokeStyle(4, 0xffffff);
        const question = this.add.text(0, -55, 'Would you like to rest?', {
            fontFamily: 'monospace',
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const yes = this.add.text(-55, 30, 'Yes', {
            fontFamily: 'monospace',
            fontSize: '20px',
            color: '#fcd34d'
        }).setOrigin(0.5);
        const no = this.add.text(55, 30, 'No', {
            fontFamily: 'monospace',
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.restChoiceTexts = [yes, no];
        this.restPrompt.add([panel, question, yes, no]);
        this.updateRestPromptSelection();
    }

    private updateRestPromptSelection() {
        this.restChoiceTexts.forEach((text, index) => {
            text.setText(`${index === this.restChoiceIndex ? '> ' : '  '}${index === 0 ? 'Yes' : 'No'}`);
            text.setColor(index === this.restChoiceIndex ? '#fcd34d' : '#ffffff');
        });
    }

    private closeRestPrompt(restoreMovement: boolean) {
        this.restPrompt?.destroy();
        this.restPrompt = undefined;
        this.restChoiceTexts = [];
        this.restPromptOpen = false;
        if (restoreMovement) {
            this.player.setMovementEnabled(true);
        }
    }

    private confirmRestChoice() {
        if (!this.restPromptOpen) return;

        if (this.restChoiceIndex === 1) {
            this.closeRestPrompt(true);
            return;
        }

        this.closeRestPrompt(false);
        this.startBedRestSequence();
    }

    private startBedRestSequence() {
        if (this.isResting || this.entranceId !== 'home') return;

        this.isResting = true;
        this.player.setMovementEnabled(false);
        this.interactionText.setVisible(false);

        this.tweens.add({
            targets: this.player,
            x: 220,
            y: 240,
            duration: 650,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                this.playSleepAnimation();
            }
        });
    }

    private playSleepAnimation() {
        const zzz = this.add.text(this.player.x + 26, this.player.y - 50, 'Zzz', {
            fontFamily: 'monospace',
            fontSize: '18px',
            color: '#bfdbfe',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(250);

        this.tweens.add({
            targets: zzz,
            y: zzz.y - 34,
            alpha: 0.2,
            duration: 900,
            repeat: 1,
            ease: 'Sine.easeOut'
        });

        this.tweens.add({
            targets: this.player,
            angle: -8,
            alpha: 0.82,
            duration: 450,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                GameFeel.playSfx('heal');
                this.cameras.main.fadeOut(500, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    this.time.delayedCall(2300, () => {
                        this.completeBedRest(zzz);
                    });
                });
            }
        });
    }

    private completeBedRest(zzz: Phaser.GameObjects.Text) {
        PlayerState.pokemonTeam.forEach(pokemon => {
            if (pokemon) {
                pokemon.currentHp = pokemon.maxHp;
            }
        });
        console.log('[InteriorScene] Player house bed rest healed party.', PlayerState.pokemonTeam);
        SaveManager.save(this, this.player.x, this.player.y);

        zzz.destroy();
        this.player.setAngle(0).setAlpha(1);
        this.tweens.add({
            targets: this.player,
            y: 270,
            duration: 350,
            ease: 'Back.easeOut'
        });

        this.cameras.main.fadeIn(500, 0, 0, 0);
        this.cameras.main.once('camerafadeincomplete', () => {
            this.isResting = false;
            this.showAutoSaveIndicator('Rested and saved');
            this.startDialogue('player_house_rest_complete');
        });
    }

    update(time: number, delta: number) {
        // If the menu is open, do not process any game logic for this scene.
        if (this.isPausedByMenu) {
            return;
        }

        if (this.restPromptOpen) {
            if (Input.Keyboard.JustDown(this.spaceKey) || Input.Keyboard.JustDown(this.enterKey) || Input.Keyboard.JustDown(this.interactKey)) {
                this.confirmRestChoice();
            } else if (Input.Keyboard.JustDown(this.escKey)) {
                this.closeRestPrompt(true);
            } else if (Input.Keyboard.JustDown(this.leftKey) || Input.Keyboard.JustDown(this.rightKey)) {
                this.restChoiceIndex = this.restChoiceIndex === 0 ? 1 : 0;
                this.updateRestPromptSelection();
            }
            return;
        }

        if (this.isResting) {
            return;
        }

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

        let nearExit = false;
        this.physics.overlap(this.player, this.exitZone, () => {
            nearExit = true;
        });

        let nearBed = false;
        if (this.entranceId === 'home' && this.bedZone) {
            this.physics.overlap(this.player, this.bedZone, () => {
                nearBed = true;
            });
        }

        this.currentNPC = null;
        let currentTrainerId: string | null = null;
        this.physics.overlap(this.player, this.npcZones, (_player, zone) => {
            const go = zone as Phaser.GameObjects.GameObject;
            this.currentNPC = go.getData('dialogueId');
            currentTrainerId = go.getData('trainerId');
        });

        let interactionMessage = '';
        if (nearBed) {
            interactionMessage = 'Press E to Rest';
        } else if (this.currentNPC) {
            if (currentTrainerId && !PlayerState.defeatedTrainers.has(currentTrainerId)) {
                interactionMessage = 'Press E to Battle';
            } else {
                interactionMessage = 'Press E to Talk';
            }
        } else if (nearExit) {
            interactionMessage = 'Press E to Exit';
        }

        if (interactionMessage) {
            this.interactionText.setText(interactionMessage).setPosition(this.player.x, this.player.y - 56).setVisible(true);
            
            if (Input.Keyboard.JustDown(this.interactKey)) {
                const trainer = currentTrainerId ? getTrainer(currentTrainerId) : null;
                if (nearBed) {
                    this.openRestPrompt();
                } else if (trainer && !PlayerState.defeatedTrainers.has(trainer.id)) {
                    this.startTrainerBattle(trainer);
                } else if (this.currentNPC) {
                    this.startDialogue(currentTrainerId && PlayerState.defeatedTrainers.has(currentTrainerId) ? `${currentTrainerId}_defeated` : this.currentNPC!);
                } else if (nearExit) {
                    this.autoSave();
                    GameFeel.fadeToScene(this, this.parentScene, { spawnEntrance: this.entranceId });
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
