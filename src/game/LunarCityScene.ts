import { Scene, Input } from 'phaser';
import { EventBus } from './EventBus';
import { Player } from './Player';
import { NPC } from './NPC';
import { DialogueBox } from './DialogueBox';
import { Dialogues, DialogueNode } from './dialogues';
import { PlayerState } from './PlayerData';
import { QuestTracker } from './QuestTracker';
import { SaveManager } from './SaveManager';
import { GameFeel } from './GameFeel';

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
    private currentLockedRoute: { targetScene: string, requiredBadge: string } | null = null;
    private dialogueBox!: DialogueBox;
    private questTracker!: QuestTracker;
    private activeDialogue: DialogueNode[] | null = null;
    private currentDialogueIndex: number = 0;
    private spawnEntrance?: string;
    private spawnX?: number;
    private spawnY?: number;
    private isPausedByMenu = false;

    constructor() {
        super('LunarCityScene');
    }

    init(data: any) {
        this.spawnEntrance = data.spawnEntrance;
        this.spawnX = data.spawnX;
        this.spawnY = data.spawnY;
    }

    create() {
        console.log('[LunarCityScene] create start', {
            spawnEntrance: this.spawnEntrance,
            spawnX: this.spawnX,
            spawnY: this.spawnY
        });
        GameFeel.startMusic(this, 'city');

        const worldWidth = 3400;
        const worldHeight = 3400;
        const centerX = worldWidth / 2;
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

        this.add.tileSprite(worldWidth / 2, worldHeight / 2, worldWidth, worldHeight, 'grass').setDepth(0);

        this.obstacles = this.physics.add.staticGroup();
        this.entrances = this.physics.add.staticGroup();
        this.npcZones = this.physics.add.staticGroup();

        this.drawCityGround(centerX, worldHeight);
        this.createBoundaryTrees(worldWidth, worldHeight, centerX);
        this.createDistricts(centerX);
        this.createTransitions(centerX, worldHeight);
        this.verifyNavigationTriggers();

        let spawnX = this.spawnX;
        let spawnY = this.spawnY;
        if (spawnX === undefined || spawnY === undefined) {
            spawnX = 520;
            spawnY = 1500;

            if (this.spawnEntrance === 'route2') {
                spawnX = 650;
                spawnY = 3060;
            } else if (this.spawnEntrance === 'lunar_city') {
                spawnX = 520;
                spawnY = 1500;
            } else if (this.spawnEntrance === 'route3') {
                spawnX = centerX;
                spawnY = 420;
            } else if (this.spawnEntrance === 'center') {
                spawnX = 2360;
                spawnY = 1760;
            } else if (this.spawnEntrance === 'mart') {
                spawnX = 2360;
                spawnY = 2240;
            } else if (this.spawnEntrance === 'gym') {
                spawnX = centerX;
                spawnY = 790;
            } else if (this.spawnEntrance?.startsWith('house')) {
                spawnX = this.spawnEntrance.endsWith('1') || this.spawnEntrance.endsWith('3') ? 1020 : 2860;
                spawnY = this.spawnEntrance.endsWith('1') || this.spawnEntrance.endsWith('2') ? 1300 : 1980;
            } else if (this.spawnEntrance === 'school') {
                spawnX = 1020;
                spawnY = 2220;
            }
        }

        this.player = new Player(this, spawnX, spawnY);
        console.log('[LunarCityScene] player spawn resolved', { x: spawnX, y: spawnY });
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(1.5);
        this.physics.add.collider(this.player, this.obstacles);

        this.createUi();

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
        console.log('[LunarCityScene] create complete');
    }

    private drawCityGround(centerX: number, worldHeight: number) {
        const plazaY = 1500;
        const mainStreetY = 2400;

        // Main Street network: open hub roads, not corridor walls.
        this.add.tileSprite(centerX, worldHeight / 2, 320, worldHeight - 360, 'path').setDepth(1);
        this.add.tileSprite(1500, plazaY, 2600, 320, 'path').setDepth(1);
        this.add.tileSprite(650, 2250, 300, 1700, 'path').setDepth(1);
        this.add.tileSprite(1500, mainStreetY, 1800, 300, 'path').setDepth(1);
        this.add.tileSprite(2360, 1980, 260, 900, 'path').setDepth(1);
        this.add.tileSprite(2060, 1900, 760, 220, 'path').setDepth(1);
        this.add.tileSprite(centerX, 820, 320, 1100, 'path').setDepth(1);

        // Green Plaza
        this.add.rectangle(centerX, plazaY, 940, 680, 0xd6d3d1, 1).setDepth(1.1);
        this.add.rectangle(centerX, plazaY, 860, 600, 0xa8a29e, 0.32).setStrokeStyle(6, 0x78716c).setDepth(1.15);

        this.add.circle(centerX, plazaY, 96, 0x7dd3fc, 1).setStrokeStyle(8, 0x0ea5e9).setDepth(1.3);
        this.add.circle(centerX, plazaY, 44, 0xe0f2fe, 0.9).setDepth(1.35);
        this.add.rectangle(centerX, plazaY, 22, 112, 0x38bdf8, 0.75).setDepth(1.4);
        this.add.circle(centerX, plazaY - 76, 18, 0xbae6fd, 0.95).setDepth(1.45);

        this.add.text(centerX, plazaY - 310, 'Green Plaza', {
            fontFamily: 'monospace',
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#00000099',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setDepth(5);

        this.add.text(1350, mainStreetY - 35, 'Main Street', {
            fontFamily: 'monospace',
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#00000099',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setDepth(5);

        this.addScenery(centerX, plazaY, mainStreetY);
    }

    private addScenery(centerX: number, plazaY: number, mainStreetY: number) {
        const addBench = (x: number, y: number) => {
            this.add.rectangle(x, y, 76, 16, 0x854d0e).setDepth(2);
            this.add.rectangle(x, y + 12, 82, 8, 0x522d01).setDepth(2);
        };

        const addLamp = (x: number, y: number) => {
            this.add.rectangle(x, y + 16, 8, 42, 0x334155).setDepth(2);
            this.add.circle(x, y - 8, 13, 0xfef3c7, 0.92).setStrokeStyle(2, 0xfacc15).setDepth(2);
        };

        addBench(centerX - 230, plazaY - 150);
        addBench(centerX + 230, plazaY - 150);
        addBench(centerX - 230, plazaY + 170);
        addBench(centerX + 230, plazaY + 170);

        [1180, 2220].forEach(x => {
            addLamp(x, plazaY - 250);
            addLamp(x, plazaY + 260);
        });

        [980, 1360, 2040, 2440].forEach(x => addLamp(x, mainStreetY - 145));
        [980, 1360, 2040, 2440].forEach(x => addLamp(x, mainStreetY + 145));

        [
            [1120, 1160], [2280, 1160], [1120, 1840], [2280, 1840],
            [920, 2220], [2760, 1720], [2760, 2240], [980, 2760]
        ].forEach(([x, y]) => this.obstacles.create(x, y, 'tree').setDepth(2));
    }

    private createBoundaryTrees(worldWidth: number, worldHeight: number, centerX: number) {
        for (let x = 220; x <= worldWidth - 220; x += 64) {
            if (Math.abs(x - centerX) > 170) this.obstacles.create(x, 220, 'tree').setDepth(2);
            if (Math.abs(x - 650) > 170) this.obstacles.create(x, worldHeight - 220, 'tree').setDepth(2);
        }

        for (let y = 220; y <= worldHeight - 220; y += 64) {
            if (Math.abs(y - 1500) > 170) this.obstacles.create(220, y, 'tree').setDepth(2);
            this.obstacles.create(worldWidth - 220, y, 'tree').setDepth(2);
        }
    }

    private createDistricts(centerX: number) {
        const addBuilding = (x: number, y: number, key: string, label: string, entranceId: string) => {
            const building = this.obstacles.create(x, y, key) as Phaser.Physics.Arcade.Image;
            building.setDepth(2);
            building.refreshBody();

            const doorX = x;
            const doorY = y + building.height / 2 + 22;
            this.add.rectangle(doorX, doorY, 64, 18, 0x111827, 0.55).setDepth(1.9);
            const doorZone = this.add.zone(doorX, doorY, 88, 70);
            this.physics.add.existing(doorZone, true);
            doorZone.setData('entranceId', entranceId);
            doorZone.setData('debugName', `door:${entranceId}`);
            this.entrances.add(doorZone);
            console.log('[LunarCityScene] door trigger registered', { entranceId, x: doorX, y: doorY, width: 88, height: 70 });

            this.add.text(x, y - building.height / 2 - 22, label, {
                fontFamily: 'monospace',
                fontSize: '14px',
                color: '#ffffff',
                backgroundColor: '#000000aa',
                padding: { x: 6, y: 4 }
            }).setOrigin(0.5).setDepth(5);
        };

        addBuilding(centerX, 620, 'building_gym', 'Lunar Gym', 'gym');
        addBuilding(2360, 1640, 'center', 'Pokemon Center', 'center');
        addBuilding(2360, 2120, 'mart', 'Poke Mart', 'mart');
        addBuilding(1010, 2080, 'lab', 'Trainer School', 'school');
        addBuilding(1000, 1180, 'house_player', 'West House', 'house1');
        addBuilding(2860, 1360, 'house_rival', 'East House', 'house2');
        addBuilding(980, 2660, 'house_player', 'Southwest House', 'house3');
        addBuilding(2860, 2040, 'house_rival', 'Southeast House', 'house4');

        this.add.text(centerX, 910, 'Gym District', {
            fontFamily: 'monospace',
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#00000099',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setDepth(5);

        const addNPC = (x: number, y: number, key: string, dialogueId: string, label: string) => {
            const npc = new NPC(this, x, y, key, dialogueId);
            this.obstacles.add(npc);
            this.npcZones.add(npc.interactionZone);

            this.add.text(x, y - 38, label, {
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#ffffff',
                backgroundColor: '#000000aa',
                padding: { x: 4, y: 2 }
            }).setOrigin(0.5).setDepth(20);
        };

        addNPC(1220, 1340, 'npc_traveler', 'lunar_plaza_gardener', 'Gardener');
        addNPC(1480, 1660, 'npc_youngster', 'lunar_fountain_kid', 'Kid');
        addNPC(2080, 1600, 'npc_nurse', 'lunar_center_hint', 'Nurse');
        addNPC(2140, 2240, 'npc_bugcatcher', 'lunar_mart_collector', 'Collector');
        addNPC(1260, 2360, 'npc_traveler', 'lunar_main_street_traveler', 'Traveler');
        addNPC(1500, 930, 'npc_youngster', 'lunar_gym_fan', 'Gym Fan');
        addNPC(1900, 930, 'npc_kai', 'lunar_route3_guard_tip', 'Cool Guy');
        addNPC(760, 2240, 'npc_nova', 'lunar_school_researcher', 'Researcher');
        addNPC(1120, 2840, 'npc_youngster', 'lunar_house_neighbor', 'Neighbor');
        addNPC(520, 1700, 'npc_traveler', 'lunar_route1_welcome', 'Guide');
        addNPC(760, 3000, 'npc_youngster', 'lunar_route2_warning', 'Scout');
    }

    private createTransitions(centerX: number, worldHeight: number) {
        this.add.tileSprite(centerX, 315, 180, 190, 'path').setDepth(1);
        this.obstacles.create(centerX - 130, 330, 'sign').setDepth(2);
        this.add.text(centerX - 130, 290, 'Route 3\nLocked', {
            fontFamily: 'monospace',
            fontSize: '13px',
            color: '#ffffff',
            backgroundColor: '#000000aa',
            padding: { x: 4, y: 2 },
            align: 'center'
        }).setOrigin(0.5).setDepth(5);

        this.add.rectangle(centerX, 270, 210, 28, 0x0f172a, 0.38).setDepth(1.8);
        const route3Zone = this.add.zone(centerX, 270, 220, 96);
        this.physics.add.existing(route3Zone, true);
        route3Zone.setData('targetScene', 'Route3Scene');
        route3Zone.setData('requiresBadge', 'Sky Badge');
        route3Zone.setData('debugName', 'route:Route3Scene');
        this.entrances.add(route3Zone);
        console.log('[LunarCityScene] route trigger registered', { targetScene: 'Route3Scene', x: centerX, y: 270, width: 220, height: 96, requiresBadge: 'Sky Badge' });

        this.add.tileSprite(650, worldHeight - 310, 220, 210, 'path').setDepth(1);
        this.obstacles.create(815, worldHeight - 330, 'sign').setDepth(2);
        this.add.text(815, worldHeight - 370, 'Route 2\nEclipse Forest', {
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#ffffff',
            backgroundColor: '#000000aa',
            padding: { x: 4, y: 2 },
            align: 'center'
        }).setOrigin(0.5).setDepth(5);

        this.add.rectangle(650, worldHeight - 260, 260, 28, 0x0f172a, 0.38).setDepth(1.8);
        const route2Zone = this.add.zone(650, worldHeight - 260, 280, 110);
        this.physics.add.existing(route2Zone, true);
        route2Zone.setData('targetScene', 'Route2Scene');
        route2Zone.setData('debugName', 'route:Route2Scene');
        this.entrances.add(route2Zone);
        console.log('[LunarCityScene] route trigger registered', { targetScene: 'Route2Scene', x: 650, y: worldHeight - 260, width: 280, height: 110 });

        this.add.tileSprite(335, 1500, 230, 220, 'path').setDepth(1);
        this.obstacles.create(455, 1360, 'sign').setDepth(2);
        this.add.text(455, 1320, 'Route 1\nStarter Town', {
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#ffffff',
            backgroundColor: '#000000aa',
            padding: { x: 4, y: 2 },
            align: 'center'
        }).setOrigin(0.5).setDepth(5);

        this.add.rectangle(310, 1500, 28, 260, 0x0f172a, 0.38).setDepth(1.8);
        const route1Zone = this.add.zone(310, 1500, 130, 280);
        this.physics.add.existing(route1Zone, true);
        route1Zone.setData('targetScene', 'Route1Scene');
        route1Zone.setData('debugName', 'route:Route1Scene');
        this.entrances.add(route1Zone);
        console.log('[LunarCityScene] route trigger registered', { targetScene: 'Route1Scene', x: 310, y: 1500, width: 130, height: 280 });
    }

    private verifyNavigationTriggers() {
        const triggers = this.entrances.getChildren().map((entry) => {
            const zone = entry as Phaser.GameObjects.Zone;
            return {
                name: zone.getData('debugName') || zone.getData('targetScene') || zone.getData('entranceId') || 'unknown',
                targetScene: zone.getData('targetScene') || null,
                entranceId: zone.getData('entranceId') || null,
                requiredBadge: zone.getData('requiresBadge') || null,
                x: Math.round(zone.x),
                y: Math.round(zone.y),
                width: zone.width,
                height: zone.height
            };
        });

        console.log('[LunarCityScene] navigation trigger verification', triggers);
    }

    private createUi() {
        this.interactionText = this.add.text(0, 0, 'Press E to Enter', {
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#000000',
            backgroundColor: '#ffffff',
            padding: { x: 6, y: 4 }
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
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: '#00000099',
            padding: { x: 8, y: 8 },
            wordWrap: { width: 250 }
        }).setScrollFactor(0).setDepth(100);

        this.autoSaveIndicator = this.add.text(this.cameras.main.displayWidth / 2, 16, '', {
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#22c55e',
            backgroundColor: '#000000aa',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(200).setAlpha(0);
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
        if (this.isPausedByMenu) return;

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
        this.hudText.setText(`Location: Lunar City\nPosition: X: ${Math.round(this.player.x)}, Y: ${Math.round(this.player.y)}`);

        this.currentEntrance = null;
        this.currentLockedRoute = null;
        let transitionScene: string | null = null;
        let requiredBadge: string | null = null;

        this.physics.overlap(this.player, this.entrances, (_player, entranceObj) => {
            const entrance = entranceObj as Phaser.GameObjects.GameObject;
            if (entrance.getData('targetScene')) {
                transitionScene = entrance.getData('targetScene');
                requiredBadge = entrance.getData('requiresBadge') || null;
            } else {
                this.currentEntrance = entrance.getData('entranceId');
            }
        });

        if (transitionScene) {
            if (requiredBadge && !PlayerState.badges.has(requiredBadge)) {
                this.currentLockedRoute = { targetScene: transitionScene, requiredBadge };
                transitionScene = null;
            } else {
                this.autoSave();
                const spawnEntrance = transitionScene === 'Route2Scene'
                    ? 'lunar_city'
                    : transitionScene === 'Route1Scene'
                        ? 'lunar_city'
                        : 'route3';
                console.log('[LunarCityScene] route transition start', { transitionScene, spawnEntrance });
                GameFeel.fadeToScene(this, transitionScene, { spawnEntrance });
                return;
            }
        }

        this.currentNPC = null;
        this.physics.overlap(this.player, this.npcZones, (_player, zoneObj) => {
            const zone = zoneObj as Phaser.GameObjects.GameObject;
            this.currentNPC = zone.getData('dialogueId');
        });

        let interactionMessage = '';
        if (this.currentLockedRoute) {
            interactionMessage = 'Press E to Inspect';
        } else if (this.currentNPC) {
            interactionMessage = 'Press E to Talk';
        } else if (this.currentEntrance) {
            interactionMessage = 'Press E to Enter';
        }

        if (interactionMessage) {
            this.interactionText.setText(interactionMessage);
            this.interactionText.setPosition(this.player.x, this.player.y - 56).setVisible(true);

            if (Input.Keyboard.JustDown(this.interactKey)) {
                if (this.currentLockedRoute) {
                    console.log('[LunarCityScene] locked route inspected', this.currentLockedRoute);
                    this.startDialogue('lunar_route3_locked');
                } else if (this.currentNPC) {
                    this.startDialogue(this.currentNPC);
                } else if (this.currentEntrance) {
                    this.autoSave();
                    console.log('[LunarCityScene] door transition start', { entranceId: this.currentEntrance });
                    GameFeel.fadeToScene(this, 'InteriorScene', { entranceId: this.currentEntrance, parentScene: this.scene.key }, [255, 255, 255]);
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
