import { Scene } from 'phaser';
import { EventBus } from './EventBus';
import { StoryManager } from './StoryManager';

export class QuestTracker extends Phaser.GameObjects.Container {
    private bg: Phaser.GameObjects.Rectangle;
    private text: Phaser.GameObjects.Text;

    constructor(scene: Scene) {
        super(scene, 620, 20); // Top right corner
        
        this.bg = scene.add.rectangle(0, 0, 160, 50, 0x000000, 0.8).setOrigin(0).setStrokeStyle(2, 0xffffff);
        this.text = scene.add.text(10, 10, '', { 
            fontFamily: 'monospace', fontSize: '12px', color: '#ffffff', wordWrap: { width: 140 } 
        });
        
        this.add([this.bg, this.text]);
        this.setScrollFactor(0).setDepth(200);
        scene.add.existing(this);

        this.updateTracker();
        
        const updateHandler = () => this.updateTracker();
        EventBus.on('quest-updated', updateHandler);
        
        // Clean up the global event listener when this specific GameObject is destroyed
        this.on('destroy', () => {
            EventBus.off('quest-updated', updateHandler);
        });
    }

    public updateTracker() {
        // Defensive guard to prevent operating on destroyed objects
        if (!this.active || !this.text || !this.text.active) {
            return;
        }

        const quest = StoryManager.getInstance().getActiveQuest();
        if (quest) {
            this.text.setText(`Objective:\n${quest}`);
            this.setVisible(true);
        } else {
            this.setVisible(false);
        }
    }
}