import { Scene, Input } from 'phaser';
import { EventBus } from './EventBus';
import { Player } from './Player';
import { NPC } from './NPC';
import { DialogueBox } from './DialogueBox';
import { Dialogues, DialogueNode } from './dialogues';
import { PlayerState } from './PlayerData';
import { QuestTracker } from './QuestTracker';
import { SaveManager } from './SaveManager';
import { StoryManager, StoryFlag } from './StoryManager';
import { GameFeel } from './GameFeel';

export class AethelburgCityScene extends Scene {
    private player!: Player;
    private obstacles!: Phaser.Physics.Arcade.StaticGroup;
    private entrances!: Phaser.Physics.Arcade.StaticGroup;
    private npcZones!: Phaser.Physics.Arcade.StaticGroup;
    private itemPickups!: Phaser.Physics.Arcade.StaticGroup;
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
        super('AethelburgCityScene');
    }

    init(data: any) {
        this.spawnEntrance = data.spawnEntrance;
        this.spawnX = data.spawnX;
        this.spawnY = data.spawnY;
    }

    create() {
        GameFeel.startMusic(this, 'city');
        const worldWidth = 2500;
        const worldHeight = 2500;
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

        this.add.tileSprite(worldWidth / 2, worldHeight / 2, worldWidth, worldHeight, 'grass').setTint(0xaaaaaa).setDepth(0);
        
        // Plaza and paths
        this.add.rectangle(worldWidth / 2, worldHeight / 2, 500, 500, 0x78716c).setDepth(1);
        this.add.tileSprite(worldWidth / 2, worldHeight / 2, 128, worldHeight, 'path').setDepth(1);
        this.add.tileSprite(worldWidth / 2, worldHeight / 2, worldWidth, 128, 'path').setDepth(1);

        this.obstacles = this.physics.add.staticGroup();
        this.entrances = this.physics.add.staticGroup();
        this.npcZones = this.physics.add.staticGroup();
        this.itemPickups = this.physics.add.staticGroup();

        // Boundaries
        for (let x = 0; x <= worldWidth; x += 64) {
            if (x < worldWidth / 2 - 100 || x > worldWidth / 2 + 100) this.obstacles.create(x, 100, 'rock').setDepth(2);
            this.obstacles.create(x, worldHeight - 100, 'rock').setDepth(2);
        }
        for (let y = 100; y <= worldHeight - 100; y += 64) {
            this.obstacles.create(100, y, 'rock').setDepth(2);
            this.obstacles.create(worldWidth - 100, y, 'rock').setDepth(2);
        }

        // Transitions
        const veridiaZone = this.add.zone(worldWidth / 2, worldHeight - 50, 200, 40);
        this.physics.add.existing(veridiaZone, true);
        veridiaZone.setData('targetScene', 'VeridiaCityScene');
        this.entrances.add(veridiaZone);

        // North to Silitech City
        const silitechZone = this.add.zone(worldWidth / 2, 50, 200, 40);
        this.physics.add.existing(silitechZone, true);
        silitechZone.setData('targetScene', 'SilitechCityScene');
        this.entrances.add(silitechZone);

        // Buildings
        const addBuilding = (x: number, y: number, key: string, label: string, entranceId: string) => {
            const building = this.obstacles.create(x, y, key) as Phaser.Physics.Arcade.Image;
            building.setDepth(2);
            building.refreshBody();
            const doorZone = this.add.zone(x, y + building.height / 2 + 10, 48, 48);
            this.physics.add.existing(doorZone, true);
            doorZone.setData('entranceId', entranceId);
            this.entrances.add(doorZone);
            this.add.text(x, y - building.height / 2 - 20, label, { fontFamily: 'monospace', fontSize: '14px', color: '#ffffff', backgroundColor: '#000000aa', padding: { x: 6, y: 4 } }).setOrigin(0.5).setDepth(5);
        };

        addBuilding(worldWidth / 2, 800, 'building_gym', 'Aethelburg Gym', 'gym_aethelburg');
        addBuilding(worldWidth / 2 - 400, worldHeight / 2, 'center', 'Pokemon Center', 'center_aethelburg');
        addBuilding(worldWidth / 2 + 400, worldHeight / 2, 'mart', 'Poké Mart', 'mart_aethelburg');
        addBuilding(worldWidth / 2, 1800, 'lab', 'City Museum', 'aethelburg_museum');

        // NPCs
        const addNPC = (x: number, y: number, key: string, dialogueId: string, label: string) => {
            const npc = new NPC(this, x, y, key, dialogueId);
            this.obstacles.add(npc);
            this.npcZones.add(npc.interactionZone);
            this.add.text(x, y - 36, label, { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff', backgroundColor: '#000000aa', padding: { x: 4, y: 2 } }).setOrigin(0.5).setDepth(20);
        };
        addNPC(worldWidth / 2 + 150, worldHeight / 2, 'npc_traveler', 'aethelburg_citizen_1', 'Historian');
        addNPC(worldWidth / 2 - 150, worldHeight / 2, 'npc_youngster', 'aethelburg_citizen_2', 'Tourist');
        addNPC(worldWidth / 2, 2000, 'npc_traveler', 'aethelburg_citizen_3', 'Old Timer');
        addNPC(500, 500, 'npc_nova', 'aethelburg_citizen_4', 'Researcher');

        // Hidden Item
        this.addItemPickup(2300, 2300, 'Observatory Journal Page #4');

        // Player Spawn
        let spawnX = this.spawnX, spawnY = this.spawnY;
        if (spawnX === undefined || spawnY === undefined) {
            spawnX = worldWidth / 2; spawnY = worldHeight - 150;
        }
        this.player = new Player(this, spawnX, spawnY);
        this.physics.add.collider(this.player, this.obstacles);

        // Camera
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(1.5);

        // UI
        this.dialogueBox = new DialogueBox(this);
        this.questTracker = new QuestTracker(this);
        this.hudText = this.add.text(16, 16, '', { fontFamily: 'monospace', fontSize: '14px', color: '#ffffff', backgroundColor: '#00000099', padding: { x: 8, y: 8 }, wordWrap: { width: 250 } }).setScrollFactor(0).setDepth(100);
        this.autoSaveIndicator = this.add.text(this.cameras.main.displayWidth / 2, 16, '', { fontFamily: 'monospace', fontSize: '14px', color: '#22c55e', backgroundColor: '#000000aa', padding: { x: 8, y: 4 } }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(200).setAlpha(0);
        this.interactionText = this.add.text(0, 0, 'Press E to Enter', { fontFamily: 'monospace', fontSize: '12px', color: '#000000', backgroundColor: '#ffffff', padding: { x: 6, y: 4 } }).setOrigin(0.5).setDepth(100).setVisible(false).setScrollFactor(1);

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

    private addItemPickup(x: number, y: number, itemId: string) {
        const itemSprite = this.itemPickups.create(x, y, 'pokeball_item').setDepth(1);
        itemSprite.setData('itemId', itemId);
        itemSprite.refreshBody();
    }

    private openMenu() { this.isPausedByMenu = true; this.player.setMovementEnabled(false); this.interactionText.setVisible(false); this.scene.pause(); this.scene.launch('MenuScene', { fromScene: this.scene.key }); }
    private startDialogue(dialogueId: string) { if (!Dialogues[dialogueId]) return; this.activeDialogue = Dialogues[dialogueId]; this.currentDialogueIndex = 0; this.player.setMovementEnabled(false); this.interactionText.setVisible(false); this.showCurrentDialogue(); }
    private showCurrentDialogue() { if (!this.activeDialogue) return; this.dialogueBox.show(this.activeDialogue[this.currentDialogueIndex].speaker, this.activeDialogue[this.currentDialogueIndex].text, this.activeDialogue[this.currentDialogueIndex].portrait); }
    private progressDialogue() { this.currentDialogueIndex++; if (!this.activeDialogue || this.currentDialogueIndex >= this.activeDialogue.length) { this.endDialogue(); } else { this.showCurrentDialogue(); } }
    private endDialogue() { this.dialogueBox.hide(); this.activeDialogue = null; this.player.setMovementEnabled(true); }

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
        this.hudText.setText(`Location: Aethelburg City\nPosition: X: ${Math.round(this.player.x)}, Y: ${Math.round(this.player.y)}`);

        let transitionScene: string | null = null;
        this.physics.overlap(this.player, this.entrances, (_player, entrance) => {
            const target = (entrance as Phaser.GameObjects.GameObject).getData('targetScene');
            if (target) { transitionScene = target; }
        });
        if (transitionScene) {
            this.autoSave();
            GameFeel.fadeToScene(this, transitionScene, { spawnEntrance: 'aethelburg' });
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
        let currentEntranceId: string | null = null;
        this.physics.overlap(this.player, this.npcZones, (_player, zone) => {
            const npcId = (zone as Phaser.GameObjects.GameObject).getData('dialogueId');
            if (npcId) { this.currentNPC = npcId; }
        });
        this.physics.overlap(this.player, this.entrances, (_player, entrance) => {
            const entranceId = (entrance as Phaser.GameObjects.GameObject).getData('entranceId');
            if (entranceId) { currentEntranceId = entranceId; }
        });

        let interactionMessage = '';
        if (this.currentNPC) interactionMessage = 'Press E to Talk';
        else if (currentEntranceId) interactionMessage = 'Press E to Enter';

        if (interactionMessage) {
            this.interactionText.setText(interactionMessage).setPosition(this.player.x, this.player.y - 56).setVisible(true);
            if (Input.Keyboard.JustDown(this.interactKey)) {
                if (this.currentNPC) {
                    this.startDialogue(this.currentNPC);
                } else if (currentEntranceId) {
                    this.autoSave();
                    GameFeel.fadeToScene(this, 'InteriorScene', { entranceId: currentEntranceId, parentScene: this.scene.key }, [255, 255, 255]);
                }
            }
        } else {
            this.interactionText.setVisible(false);
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