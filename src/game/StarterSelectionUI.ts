import { Scene } from 'phaser';

interface StarterButton {
    container: Phaser.GameObjects.Container;
    img: Phaser.GameObjects.Image;
    text: Phaser.GameObjects.Text;
    name: string;
}

export class StarterSelectionUI extends Phaser.GameObjects.Container {
    private selectedIndex: number = 1; // Default to Charmander (middle)
    private buttons: StarterButton[] = [];
    private onSelect: (starter: string) => void;

    constructor(scene: Scene, onSelect: (starter: string) => void) {
        super(scene, 400, 300);
        this.onSelect = onSelect;
        
        const bg = scene.add.rectangle(0, 0, 500, 250, 0x000000, 0.8).setStrokeStyle(4, 0xffffff);
        const title = scene.add.text(0, -90, 'Choose Your Partner', { 
            fontFamily: 'monospace', fontSize: '20px', color: '#ffffff', fontStyle: 'bold' 
        }).setOrigin(0.5);

        const instructions = scene.add.text(0, 90, 'Use Arrows/Gamepad to choose, ENTER to select', {
            fontFamily: 'monospace', fontSize: '12px', color: '#9ca3af'
        }).setOrigin(0.5);

        const createBtn = (x: number, key: string, name: string, index: number) => {
            const container = scene.add.container(x, 10);
            const img = scene.add.image(0, -20, key).setInteractive({ useHandCursor: true });
            const text = scene.add.text(0, 40, name, { fontFamily: 'monospace', fontSize: '16px', color: '#ffffff' }).setOrigin(0.5);

            img.on('pointerdown', () => {
                this.confirmSelection(index);
            });

            img.on('pointerover', () => this.setSelectedIndex(index));

            container.add([img, text]);
            this.buttons.push({ container, img, text, name });
        };

        createBtn(-130, 'starter_grass', 'Bulbasaur', 0);
        createBtn(0, 'starter_fire', 'Charmander', 1);
        createBtn(130, 'starter_water', 'Squirtle', 2);

        this.add([bg, title, instructions, ...this.buttons.map(b => b.container)]);
        this.setScrollFactor(0).setDepth(300);
        scene.add.existing(this);

        this.bindInputs(scene);
        this.setSelectedIndex(this.selectedIndex);
    }

    private bindInputs(scene: Scene) {
        if (scene.input.keyboard) {
            scene.input.keyboard.on('keydown-LEFT', this.handleLeft, this);
            scene.input.keyboard.on('keydown-A', this.handleLeft, this);
            scene.input.keyboard.on('keydown-RIGHT', this.handleRight, this);
            scene.input.keyboard.on('keydown-D', this.handleRight, this);
            scene.input.keyboard.on('keydown-ENTER', this.handleConfirm, this);
            scene.input.keyboard.on('keydown-SPACE', this.handleConfirm, this);
        }
        scene.input.gamepad?.on('down', this.handleGamepad, this);

        // Safe cleanup on destroy
        this.on('destroy', () => {
            if (scene.input.keyboard) {
                scene.input.keyboard.off('keydown-LEFT', this.handleLeft, this);
                scene.input.keyboard.off('keydown-A', this.handleLeft, this);
                scene.input.keyboard.off('keydown-RIGHT', this.handleRight, this);
                scene.input.keyboard.off('keydown-D', this.handleRight, this);
                scene.input.keyboard.off('keydown-ENTER', this.handleConfirm, this);
                scene.input.keyboard.off('keydown-SPACE', this.handleConfirm, this);
            }
            scene.input.gamepad?.off('down', this.handleGamepad, this);
        });
    }

    private handleLeft() { this.setSelectedIndex(Math.max(0, this.selectedIndex - 1)); }
    private handleRight() { this.setSelectedIndex(Math.min(2, this.selectedIndex + 1)); }
    private handleConfirm() { this.confirmSelection(this.selectedIndex); }
    private handleGamepad(pad: any, button: any) {
        if (button.index === 14) this.handleLeft(); // D-Pad Left
        if (button.index === 15) this.handleRight(); // D-Pad Right
        if (button.index === 0) this.handleConfirm(); // A/Cross Button
    }

    private setSelectedIndex(index: number) {
        if (!this.active) return;
        this.selectedIndex = index;
        
        this.buttons.forEach((btn, i) => {
            if (i === index) {
                btn.img.setScale(1.2);
                btn.text.setColor('#fcd34d');
            } else {
                btn.img.setScale(1.0);
                btn.text.setColor('#ffffff');
            }
        });
    }

    private confirmSelection(index: number) {
        if (!this.active) return;
        const selectedName = this.buttons[index].name;
        this.destroy(); // Automatically triggers event cleanup logic above
        this.onSelect(selectedName);
    }
}