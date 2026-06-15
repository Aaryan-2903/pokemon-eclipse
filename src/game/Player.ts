import { Scene, Input, Math as PhaserMath } from 'phaser';
import { PlayerState } from './PlayerData';

export class Player extends Phaser.Physics.Arcade.Sprite {
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasdKeys!: Phaser.Types.Input.Keyboard.CursorKeys;
    private speed: number = 200;
    private nameText!: Phaser.GameObjects.Text;
    private lastDirection: string = 'down';
    private movementEnabled: boolean = true;

    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, 'player_texture', '0_0');

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

        // Identity Label
        this.nameText = scene.add.text(x, y, PlayerState.name, {
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#ffffff',
            backgroundColor: '#000000aa',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5).setDepth(20);

        this.setupAnimations();
    }

    private setupAnimations() {
        const directions = ['down', 'left', 'right', 'up'];
        directions.forEach((dir, index) => {
            const walkKey = `walk_${dir}`;
            if (!this.scene.anims.exists(walkKey)) {
                this.scene.anims.create({
                    key: walkKey,
                    frames: [
                        { key: 'player_texture', frame: `${index}_1` },
                        { key: 'player_texture', frame: `${index}_0` },
                        { key: 'player_texture', frame: `${index}_3` },
                        { key: 'player_texture', frame: `${index}_0` }
                    ],
                    frameRate: 6,
                    repeat: -1
                });
            }
        });
    }

    public setMovementEnabled(enabled: boolean) {
        this.movementEnabled = enabled;
        if (!enabled) {
            this.setVelocity(0, 0);
            this.anims.stop();
            let idleIdx = 0;
            if (this.lastDirection === 'left') idleIdx = 1;
            else if (this.lastDirection === 'right') idleIdx = 2;
            else if (this.lastDirection === 'up') idleIdx = 3;
            this.setFrame(`${idleIdx}_0`);
        }
    }

    update(time: number, delta: number) {
        if (!this.movementEnabled) return;

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

            // Animation logic
            let dir = this.lastDirection;
            if (velocityX < 0) dir = 'left';
            else if (velocityX > 0) dir = 'right';
            else if (velocityY < 0) dir = 'up';
            else if (velocityY > 0) dir = 'down';

            this.anims.play(`walk_${dir}`, true);
            this.lastDirection = dir;
        } else {
            this.setVelocity(0, 0);
            this.anims.stop();

            // Snap to idle frame
            let idleIdx = 0;
            if (this.lastDirection === 'left') idleIdx = 1;
            else if (this.lastDirection === 'right') idleIdx = 2;
            else if (this.lastDirection === 'up') idleIdx = 3;
            this.setFrame(`${idleIdx}_0`);
        }

        // Keep name attached to player
        this.nameText.setPosition(this.x, this.y - 36);
    }

    public isMoving(): boolean {
        return this.body.velocity.x !== 0 || this.body.velocity.y !== 0;
    }
}