import { Scene, Input, Math as PhaserMath } from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasdKeys!: Phaser.Types.Input.Keyboard.CursorKeys;
    private speed: number = 200;

    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, 'trainer_placeholder');

        // Add to the scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Setup collision with world edges
        this.setCollideWorldBounds(true);
        this.setDepth(10); // Ensure player renders above the ground/grid

        // Map both Arrow keys and WASD controls
        if (scene.input.keyboard) {
            this.cursors = scene.input.keyboard.createCursorKeys();
            this.wasdKeys = scene.input.keyboard.addKeys({
                up: Input.Keyboard.KeyCodes.W,
                down: Input.Keyboard.KeyCodes.S,
                left: Input.Keyboard.KeyCodes.A,
                right: Input.Keyboard.KeyCodes.D
            }) as Phaser.Types.Input.Keyboard.CursorKeys;
        }
    }

    update(time: number, delta: number) {
        let velocityX = 0;
        let velocityY = 0;

        const left = this.cursors?.left.isDown || this.wasdKeys?.left.isDown;
        const right = this.cursors?.right.isDown || this.wasdKeys?.right.isDown;
        const up = this.cursors?.up.isDown || this.wasdKeys?.up.isDown;
        const down = this.cursors?.down.isDown || this.wasdKeys?.down.isDown;

        if (left) velocityX = -1;
        else if (right) velocityX = 1;

        if (up) velocityY = -1;
        else if (down) velocityY = 1;

        if (velocityX !== 0 || velocityY !== 0) {
            // Normalize vector to ensure diagonal movement isn't faster
            const velocity = new PhaserMath.Vector2(velocityX, velocityY).normalize().scale(this.speed);
            this.setVelocity(velocity.x, velocity.y);
        } else {
            this.setVelocity(0, 0);
        }
    }
}