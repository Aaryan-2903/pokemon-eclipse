import { Scene } from 'phaser';

export class NPC extends Phaser.GameObjects.Sprite {
    public dialogueId: string;
    public trainerId?: string;
    public interactionZone: Phaser.GameObjects.Zone;

    constructor(scene: Scene, x: number, y: number, texture: string, dialogueId: string, trainerId?: string) {
        super(scene, x, y, texture);
        
        scene.add.existing(this);
        this.setDepth(5);
        
        this.dialogueId = dialogueId;
        this.trainerId = trainerId;
        
        // Create interaction zone extending beyond the visual sprite
        this.interactionZone = scene.add.zone(x, y, 64, 64);
        scene.physics.add.existing(this.interactionZone, true);
        this.interactionZone.setData('dialogueId', dialogueId);
        if (trainerId) {
            this.interactionZone.setData('trainerId', trainerId);
        }
    }
}