import { Scene, Input } from 'phaser';
import { EventBus } from './EventBus';
import { Player } from './Player';

export class OverworldScene extends Scene {
    private player!: Player;
    private obstacles!: Phaser.Physics.Arcade.StaticGroup;
    private entrances!: Phaser.Physics.Arcade.StaticGroup;
    private hudText!: Phaser.GameObjects.Text;
    private interactionText!: Phaser.GameObjects.Text;
    private interactKey!: Phaser.Input.Keyboard.Key;
    private currentEntrance: string | null = null;

    constructor() {
        super('OverworldScene');
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

        // Environment: Town Boundaries (Trees)
        for (let x = 500; x <= 1500; x += 64) {
            this.obstacles.create(x, 400, 'tree').setDepth(2); // North Edge
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

        // Route 1 Preparation
        this.add.tileSprite(1000, 500, 128, 200, 'path').setDepth(roadDepth);
        this.obstacles.create(920, 450, 'sign').setDepth(2);
        this.add.text(920, 420, 'Route 1', {
            fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
            backgroundColor: '#000000aa', padding: { x: 4, y: 2 }
        }).setOrigin(0.5).setDepth(5);

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

        // Create Player in front of their house
        this.player = new Player(this, 800, 850);

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
        }

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

    update(time: number, delta: number) {
        // Delegate movement logic to the Player class
        this.player.update(time, delta);

        // Update HUD Data
        const px = Math.round(this.player.x);
        const py = Math.round(this.player.y);
        this.hudText.setText(`Location: Eclipse Town\nPosition: X: ${px}, Y: ${py}`);

        // Entrance Detection logic
        this.currentEntrance = null;
        this.physics.overlap(this.player, this.entrances, (player, entranceObj) => {
            const entrance = entranceObj as Phaser.GameObjects.GameObject;
            this.currentEntrance = entrance.getData('entranceId');
        });

        if (this.currentEntrance) {
            this.interactionText.setPosition(this.player.x, this.player.y - 56).setVisible(true);
            
            if (Input.Keyboard.JustDown(this.interactKey)) {
                console.log(`Transition to map ID: ${this.currentEntrance}`);
            }
        } else {
            this.interactionText.setVisible(false);
        }
    }
}