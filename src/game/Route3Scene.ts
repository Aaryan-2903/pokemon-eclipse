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

export class Route3Scene extends Scene {
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
        super('Route3Scene');
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

        const worldWidth = 3000;
        const worldHeight = 6000;
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

        this.add.tileSprite(worldWidth / 2, worldHeight / 2, worldWidth, worldHeight, 'grass').setTint(0xaaaaaa).setDepth(0);

        this.add.tileSprite(1500, 5000, 256, 2000, 'path').setDepth(1);
        this.add.tileSprite(1500, 4000, 1000, 256, 'path').setDepth(1);
        this.add.tileSprite(2000, 2500, 256, 3000, 'path').setDepth(1);
        this.add.tileSprite(1500, 1000, 1000, 256, 'path').setDepth(1);

        this.tallGrassZones = this.physics.add.staticGroup();
        const addTallGrass = (x: number, y: number, width: number, height: number) => {
            this.add.tileSprite(x, y, width, height, 'tall_grass').setDepth(0.5);
            this.tallGrassZones.create(x, y).setSize(width, height).setVisible(false);
        };
        addTallGrass(1000, 4500, 1024, 1024);
        addTallGrass(2500, 2500, 512, 2048);

        this.obstacles = this.physics.add.staticGroup();
        this.entrances = this.physics.add.staticGroup();
        this.npcZones = this.physics.add.staticGroup();
        this.itemPickups = this.physics.add.staticGroup();

        const addScenery = (count: number, area: Phaser.Geom.Rectangle) => {
            for (let i = 0; i < count; i++) {
                const x = Phaser.Math.Between(area.x, area.x + area.width);
                const y = Phaser.Math.Between(area.y, area.y + area.height);
                const isTree = Math.random() > 0.4;
                this.obstacles.create(x, y, isTree ? 'tree' : 'rock').setDepth(Phaser.Math.Between(2, 12)).refreshBody();
            }
        };
        addScenery(200, new Phaser.Geom.Rectangle(0, 0, worldWidth, 100));
        addScenery(200, new Phaser.Geom.Rectangle(0, worldHeight - 100, worldWidth, 100));
        addScenery(200, new Phaser.Geom.Rectangle(0, 0, 100, worldHeight));
        addScenery(200, new Phaser.Geom.Rectangle(worldWidth - 100, 0, 100, worldHeight));
        addScenery(100, new Phaser.Geom.Rectangle(0, 1000, 1000, 4000));
        addScenery(100, new Phaser.Geom.Rectangle(2000, 1000, 1000, 2000));

        const addNPC = (x: number, y: number, key: string, dialogueId: string, label: string, trainerId?: string) => {
            const npc = new NPC(this, x, y, key, dialogueId, trainerId);
            this.obstacles.add(npc);
            this.npcZones.add(npc.interactionZone);
            this.add.text(x, y - 36, label, { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff', backgroundColor: '#000000aa', padding: { x: 4, y: 2 } }).setOrigin(0.5).setDepth(20);
        };

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

        addBuilding(1500, 500, 'lab', 'Observatory', 'observatory');
        addNPC(1500, 4000, 'npc_traveler', 'route3_hiker_john', 'Hiker John', 'route3_hiker_john');
        addNPC(2000, 2000, 'npc_aurora', 'route3_ace_trainer_female', 'Ace Trainer Maria', 'route3_ace_trainer_female');
        // Optional trainer in "cave" area
        addNPC(400, 900, 'npc_traveler', 'route3_blackbelt', 'Blackbelt Kenji', 'route3_blackbelt');
        this.add.rectangle(500, 1000, 100, 100, 0x000000).setDepth(0);
        addNPC(500, 1100, 'npc_traveler', 'route3_cave_explorer', 'Explorer');

        this.addItemPickup(500, 500, 'Super Potion');
        this.addItemPickup(2800, 5800, 'Crumbled Note'); // Hidden Umbra clue
        this.addItemPickup(2500, 500, 'Rare Flower'); // Side quest item
        this.addItemPickup(200, 2500, 'TM01'); // Hidden item

        const lunarCityZone = this.add.zone(1500, worldHeight - 50, 200, 40);
        this.physics.add.existing(lunarCityZone, true);
        lunarCityZone.setData('targetScene', 'LunarCityScene');
        this.entrances.add(lunarCityZone);

        let spawnX = this.spawnX, spawnY = this.spawnY;
        if (spawnX === undefined || spawnY === undefined) {
            if (this.spawnEntrance === 'lunar_city') {
                spawnX = 1500; spawnY = worldHeight - 150;
            } else if (this.spawnEntrance === 'observatory') {
                spawnX = 1500; spawnY = 600;
            } else {
                spawnX = 1500; spawnY = worldHeight - 150;
            }
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

    private openMenu() { this.isPausedByMenu = true; this.player.setMovementEnabled(false); this.interactionText.setVisible(false); this.scene.pause(); this.scene.launch('MenuScene', { fromScene: this.scene.key }); }
    private startDialogue(dialogueId: string) { if (!Dialogues[dialogueId]) return; this.activeDialogueKey = dialogueId; this.activeDialogue = Dialogues[dialogueId]; this.currentDialogueIndex = 0; this.player.setMovementEnabled(false); this.interactionText.setVisible(false); this.showCurrentDialogue(); }
    private showCurrentDialogue() { if (!this.activeDialogue) return; this.dialogueBox.show(this.activeDialogue[this.currentDialogueIndex].speaker, this.activeDialogue[this.currentDialogueIndex].text, this.activeDialogue[this.currentDialogueIndex].portrait); }
    private progressDialogue() { this.currentDialogueIndex++; if (!this.activeDialogue || this.currentDialogueIndex >= this.activeDialogue.length) { this.endDialogue(); } else { this.showCurrentDialogue(); } }
    private endDialogue() { this.dialogueBox.hide(); this.activeDialogueKey = null; this.activeDialogue = null; this.player.setMovementEnabled(true); }

    private triggerEncounter(enemyMon: PokemonInstance) {
        PlayerState.pokedex.seen.add(enemyMon.name);
        this.player.setMovementEnabled(false);
        this.cameras.main.flash(300, 255, 255, 255);
        this.time.delayedCall(300, () => {
            this.scene.pause();
            this.scene.launch('BattleScene', { enemyMon });
            this.scene.get('BattleScene').events.once('battle-ended', (result: 'win' | 'loss' | 'run') => {
                this.scene.stop('BattleScene');
                if (result === 'loss') { this.scene.start('InteriorScene', { entranceId: 'center', parentScene: 'OverworldScene' }); }
                else { if (result === 'win') this.autoSave(); this.cameras.main.fadeIn(250, 0, 0, 0); this.scene.resume(); this.player.setMovementEnabled(true); }
            });
        });
    }

    private startTrainerBattle(trainer: Trainer) {
        trainer.team.forEach(p => PlayerState.pokedex.seen.add(p.name));
        this.player.setMovementEnabled(false);
        this.interactionText.setVisible(false);
        this.startDialogue(trainer.preBattleDialogue);
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
                    } else if (result === 'loss') { this.scene.start('InteriorScene', { entranceId: 'center', parentScene: 'OverworldScene' }); }
                });
            });
        };
    }

    update(time: number, delta: number) {
        if (this.isPausedByMenu) return;
        if (this.activeDialogue) { if (Input.Keyboard.JustDown(this.interactKey) || Input.Keyboard.JustDown(this.spaceKey) || Input.Keyboard.JustDown(this.enterKey)) this.progressDialogue(); return; }
        if (Input.Keyboard.JustDown(this.escKey)) { this.openMenu(); return; }
        if (Input.Keyboard.JustDown(this.teamKey)) { this.scene.pause(); this.scene.launch('TeamScene', { fromScene: this.scene.key, inBattle: false }); return; }
        if (Input.Keyboard.JustDown(this.badgeKey)) { this.scene.pause(); this.scene.launch('BadgeScene', { fromScene: this.scene.key }); return; }
        if (!this.player.canMove()) return;

        this.player.update(time, delta);
        this.hudText.setText(`Location: Route 3\nPosition: X: ${Math.round(this.player.x)}, Y: ${Math.round(this.player.y)}`);

        let transitionScene: string | null = null;
        let currentEntranceId: string | null = null;
        this.physics.overlap(this.player, this.entrances, (_player, entrance) => {
            const target = (entrance as Phaser.GameObjects.GameObject).getData('targetScene');
            if (target) { transitionScene = target; }
            else { currentEntranceId = (entrance as Phaser.GameObjects.GameObject).getData('entranceId'); }
        });

        if (transitionScene) { this.autoSave(); GameFeel.fadeToScene(this, transitionScene, { spawnEntrance: 'route3' }); return; }

        this.physics.overlap(this.player, this.itemPickups, (_player, itemPickupObj) => {
            const itemPickup = itemPickupObj as Phaser.GameObjects.GameObject;
            const itemId = itemPickup.getData('itemId') as string;
            if (itemId) { PlayerState.inventory[itemId] = (PlayerState.inventory[itemId] || 0) + 1; this.startDialogue(`found_${itemId.toLowerCase()}`); itemPickup.destroy(); }
        });

        this.currentNPC = null;
        let currentTrainerId: string | null = null;
        this.physics.overlap(this.player, this.npcZones, (_player, zone) => { const go = zone as Phaser.GameObjects.GameObject; this.currentNPC = go.getData('dialogueId'); currentTrainerId = go.getData('trainerId'); });

        let interactionMessage = '';
        if (this.currentNPC) { if (currentTrainerId && !PlayerState.defeatedTrainers.has(currentTrainerId)) interactionMessage = 'Press E to Battle'; else interactionMessage = 'Press E to Talk'; }
        else if (currentEntranceId) { interactionMessage = 'Press E to Enter'; }

        if (interactionMessage) {
            this.interactionText.setText(interactionMessage).setPosition(this.player.x, this.player.y - 56).setVisible(true);
            if (Input.Keyboard.JustDown(this.interactKey)) {
                const trainer = currentTrainerId ? getTrainer(currentTrainerId) : null;
                if (trainer && !PlayerState.defeatedTrainers.has(trainer.id)) { this.startTrainerBattle(trainer); }
                else if (this.currentNPC) { this.startDialogue(currentTrainerId && PlayerState.defeatedTrainers.has(currentTrainerId) ? `${currentTrainerId}_defeated` : this.currentNPC!); }
                else if (currentEntranceId) { this.autoSave(); GameFeel.fadeToScene(this, 'InteriorScene', { entranceId: currentEntranceId, parentScene: this.scene.key }, [255, 255, 255]); }
            }
        } else { this.interactionText.setVisible(false); }

        let inTallGrass = false;
        this.physics.overlap(this.player, this.tallGrassZones, () => { inTallGrass = true; });
        if (inTallGrass && this.player.isMoving()) {
            const distance = this.playerLastPosForEncounter.distance({ x: this.player.x, y: this.player.y });
            if (distance >= this.STEP_DISTANCE_FOR_ENCOUNTER_CHECK) {
                this.playerLastPosForEncounter.set(this.player.x, this.player.y);
                GameFeel.grassRustle(this, this.player.x, this.player.y + 10);
                const encounter = this.encounterManager.checkEncounter('Route3Scene');
                if (encounter) this.triggerEncounter(encounter);
            }
        } else { this.playerLastPosForEncounter.set(this.player.x, this.player.y); }
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