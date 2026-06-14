import { Scene } from 'phaser';
import { EventBus } from './EventBus';
import { Player } from './Player';

export class OverworldScene extends Scene {
    private player!: Player;
    private obstacles!: Phaser.Physics.Arcade.StaticGroup;
    private hudText!: Phaser.GameObjects.Text;

    constructor() {
        super('OverworldScene');
    }

    create() {
        console.log('OverworldScene: create');

        // Setup World Physics Bounds (2000x2000)
        const worldSize = 2000;
        this.physics.world.setBounds(0, 0, worldSize, worldSize);

        // Draw a grid background to visualize movement across the large world
        this.add.grid(worldSize / 2, worldSize / 2, worldSize, worldSize, 64, 64, 0x1f2937, 1, 0x374151, 1).setDepth(0);
        
        // Create Player at the center of the world
        this.player = new Player(this, worldSize / 2, worldSize / 2);

        // Setup Camera smooth follow and bounds
        this.cameras.main.setBounds(0, 0, worldSize, worldSize);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08); // 0.08 lerp for smoothness
        this.cameras.main.setZoom(1.5);

        // Collision-ready Architecture
        this.obstacles = this.physics.add.staticGroup();
        this.physics.add.collider(this.player, this.obstacles);

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
    }
}