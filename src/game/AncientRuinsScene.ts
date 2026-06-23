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

export class AncientRuinsScene extends Scene {
    private player!: Player;
    private obstacles!: Phaser.Physics.Arcade.StaticGroup;
    private entrances!: Phaser.Physics.Arcade.StaticGroup;
    private itemPickups!: Phaser.Physics.Arcade.StaticGroup;
    private npcZones!: Phaser.Physics.Arcade.StaticGroup;
    private hudText!: Phaser.GameObjects.Text;
    private autoSaveIndicator!: Phaser.GameObjects.Text;
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
    private isPausedByMenu: boolean = false;

    private umbraCutsceneTrigger!: Phaser.GameObjects.Zone;
    private cutsceneNPCs: Phaser.GameObjects.Sprite[] = [];

    constructor() {
        super('AncientRuinsScene');
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

        this.add.tileSprite(worldWidth / 2, worldHeight / 2, worldWidth, worldHeight, 'grass').setTint(0x999977).setDepth(0);

        this.obstacles = this.physics.add.staticGroup();
        this.entrances = this.physics.add.staticGroup();
        this.npcZones = this.physics.add.staticGroup();
        this.itemPickups = this.physics.add.staticGroup();

        // Scenery
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * worldWidth;
            const y = Math.random() * worldHeight;
            this.obstacles.create(x, y, 'rock').setDepth(Phaser.Math.Between(2, 12)).setScale(Math.random() * 0.5 + 0.8);
        }

        const addNPC = (x: number, y: number, key: string, dialogueId: string, label: string, trainerId?: string) => {
            const npc = new NPC(this, x, y, key, dialogueId, trainerId);
            this.obstacles.add(npc);
            this.npcZones.add(npc.interactionZone);
            this.add.text(x, y - 36, label, { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff', backgroundColor: '#000000aa', padding: { x: 4, y: 2 } }).setOrigin(0.5).setDepth(20);
            return npc;
        };

        // Feature 2: Team Umbra Research Camp
        addNPC(1000, 3500, 'sign', 'umbra_camp_notes', 'Research Notes');
        this.obstacles.create(1100, 3500, 'rock').setTint(0x555555); // Tent placeholder
        this.obstacles.create(900, 3450, 'rock').setTint(0x555555); // Equipment placeholder

        // Feature 1: Ancient Tablet
        const tablet = addNPC(2000, 500, 'sign', 'ancient_ruins_tablet', 'Ancient Tablet');
        tablet.setScale(1.5).setTint(0xaaaaaa);

        // Feature 4: Journal Page #3
        this.addItemPickup(3800, 3800, 'Observatory Journal Page #3');

        // Feature 3: Scientist Encounter
        const storyManager = StoryManager.getInstance();
        if (!storyManager.hasFlag(StoryFlag.ANCIENT_RUINS_UMBRA_ENCOUNTER_SEEN)) {
            this.umbraCutsceneTrigger = this.add.zone(2000, 2000, 400, 400);
            this.physics.add.existing(this.umbraCutsceneTrigger, true);
        }

        // Transition back to Route 3
        const route3Zone = this.add.zone(worldWidth / 2, worldHeight - 50, 200, 40);
        this.physics.add.existing(route3Zone, true);
        route3Zone.setData('targetScene', 'Route3Scene');
        this.entrances.add(route3Zone);

        // Player
        let spawnX = this.spawnX, spawnY = this.spawnY;
        if (spawnX === undefined || spawnY === undefined) {
            spawnX = worldWidth / 2; spawnY = worldHeight - 150;
        }
        this.player = new Player(this, spawnX, spawnY);
        this.physics.add.collider(this.player, this.obstacles);

        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(1.5);

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

        EventBus.on('save-game-from-menu', this.manualSave, this);
        this.events.on('shutdown', () => { EventBus.off('save-game-from-menu', this.manualSave, this); });
        this.events.on('resume', () => { this.isPausedByMenu = false; if (!this.activeDialogue) this.player.setMovementEnabled(true); });

        EventBus.emit('current-scene-ready', this);
    }

    private triggerUmbraRuinsCutscene() {
        if (this.umbraCutsceneTrigger.active) this.umbraCutsceneTrigger.destroy();
        
        StoryManager.getInstance().setFlag(StoryFlag.ANCIENT_RUINS_UMBRA_ENCOUNTER_SEEN);
        this.player.setMovementEnabled(false);

        this.cameras.main.pan(2000, 2000, 1000, 'Power2');
        this.cameras.main.zoomTo(2, 1000);

        const grunt = this.add.sprite(1950, 2050, 'npc_kai').setAlpha(0);
        const scientist = this.add.sprite(2050, 2050, 'npc_traveler').setAlpha(0);
        this.cutsceneNPCs = [grunt, scientist];

        this.tweens.add({
            targets: this.cutsceneNPCs, alpha: 1, duration: 500, delay: 800,
            onComplete: () => this.startDialogue('observatory_umbra_cutscene') // Reusing dialogue key for same conversation
        });
    }

    private triggerTabletCutscene() {
        if (StoryManager.getInstance().hasFlag(StoryFlag.ANCIENT_RUINS_TABLET_SEEN)) return;
        StoryManager.getInstance().setFlag(StoryFlag.ANCIENT_RUINS_TABLET_SEEN);
        this.player.setMovementEnabled(false);
        GameFeel.playSfx('evolve');
        this.cameras.main.shake(300, 0.008);
        this.startDialogue('ancient_ruins_tablet');
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

        if (endedDialogueKey === 'observatory_umbra_cutscene') {
            this.tweens.add({
                targets: this.cutsceneNPCs, alpha: 0, duration: 500,
                onComplete: () => {
                    this.cutsceneNPCs.forEach(npc => npc.destroy());
                    this.cutsceneNPCs = [];
                    this.cameras.main.zoomTo(1.5, 500);
                    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
                    this.player.setMovementEnabled(true);
                }
            });
        } else {
            this.player.setMovementEnabled(true);
        }
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
        this.hudText.setText(`Location: Ancient Ruins\nPosition: X: ${Math.round(this.player.x)}, Y: ${Math.round(this.player.y)}`);

        if (this.umbraCutsceneTrigger && this.umbraCutsceneTrigger.active) {
            this.physics.overlap(this.player, this.umbraCutsceneTrigger, this.triggerUmbraRuinsCutscene, undefined, this);
        }

        let transitionScene: string | null = null;
        this.physics.overlap(this.player, this.entrances, (_player, entrance) => { transitionScene = (entrance as Phaser.GameObjects.GameObject).getData('targetScene'); });
        if (transitionScene) {
            this.autoSave();
            GameFeel.fadeToScene(this, transitionScene, { spawnEntrance: 'ruins' });
            return;
        }

        this.physics.overlap(this.player, this.itemPickups, (_player, itemPickupObj) => {
            const itemPickup = itemPickupObj as Phaser.GameObjects.GameObject;
            const itemId = itemPickup.getData('itemId') as string;
            if (itemId) {
                PlayerState.inventory[itemId] = (PlayerState.inventory[itemId] || 0) + 1;
                this.startDialogue(`found_${itemId.toLowerCase().replace(/ /g, '_').replace(/#/g, '')}`);
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
                if (this.currentNPC === 'ancient_ruins_tablet') {
                    this.triggerTabletCutscene();
                } else {
                    this.startDialogue(this.currentNPC!);
                }
            }
        } else {
            this.interactionText.setVisible(false);
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