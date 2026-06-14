import { Scene, Types, Math as PhaserMath, Input } from 'phaser';
import { EventBus } from './EventBus';

export class OverworldScene extends Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Types.Input.Keyboard.CursorKeys;

    constructor() {
        super('OverworldScene');
    }

    create() {
        console.log('OverworldScene: create');

        // Add placeholder player sprite
        this.player = this.physics.add.sprite(400, 300, 'player_placeholder');
        
        // Setup camera to follow the player
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setZoom(2);

        // Setup WASD movement controls
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.addKeys({
                up: Input.Keyboard.KeyCodes.W,
                down: Input.Keyboard.KeyCodes.S,
                left: Input.Keyboard.KeyCodes.A,
                right: Input.Keyboard.KeyCodes.D
            }) as Types.Input.Keyboard.CursorKeys;
        }

        // Notify React that the scene is ready
        EventBus.emit('current-scene-ready', this);
    }

    update() {
        const speed = 150;
        
        let velocityX = 0;
        let velocityY = 0;

        if (this.cursors.left.isDown) {
            velocityX = -1;
        } else if (this.cursors.right.isDown) {
            velocityX = 1;
        }

        if (this.cursors.up.isDown) {
            velocityY = -1;
        } else if (this.cursors.down.isDown) {
            velocityY = 1;
        }
        
        if (velocityX !== 0 || velocityY !== 0) {
            const velocity = new PhaserMath.Vector2(velocityX, velocityY).normalize().scale(speed);
            this.player.setVelocity(velocity.x, velocity.y);
        } else {
            this.player.setVelocity(0, 0);
        }
    }
}