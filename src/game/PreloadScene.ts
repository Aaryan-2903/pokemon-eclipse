import { Scene } from 'phaser';

export class PreloadScene extends Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        console.log('PreloadScene: preload - generating textures');

        const graphics = this.add.graphics();
        
        // Generate Player Sprite Sheet (4 Directions x 4 Frames)
        for (let dir = 0; dir < 4; dir++) {
            for (let frame = 0; frame < 4; frame++) {
                const px = frame * 32;
                const py = dir * 48;
                const walkOffset = (frame % 2 !== 0) ? -2 : 0; // Bounce effect
                
                graphics.fillStyle(0xfcd34d, 1); // Skin tone
                graphics.fillCircle(px + 16, py + 14 + walkOffset, 10); // Head
                graphics.fillStyle(0x3b82f6, 1); // Blue jacket
                graphics.fillRoundedRect(px + 6, py + 22 + walkOffset, 20, 24, 6); // Body
                
                graphics.fillStyle(0x000000, 1); // Details (Eyes / Backpack)
                if (dir === 0) { // Down
                    graphics.fillRect(px + 11, py + 12 + walkOffset, 2, 2);
                    graphics.fillRect(px + 19, py + 12 + walkOffset, 2, 2);
                } else if (dir === 1) { // Left
                    graphics.fillRect(px + 9, py + 12 + walkOffset, 2, 2);
                } else if (dir === 2) { // Right
                    graphics.fillRect(px + 21, py + 12 + walkOffset, 2, 2);
                } else if (dir === 3) { // Up
                    graphics.fillStyle(0x1e3a8a, 1); // Backpack
                    graphics.fillRect(px + 8, py + 24 + walkOffset, 16, 16);
                }
            }
        }
        graphics.generateTexture('player_texture', 128, 192);
        graphics.clear();

        // Generate Basic NPCs
        const createNPC = (key: string, color: number) => {
            graphics.fillStyle(0xfcd34d, 1); // Skin tone
            graphics.fillCircle(16, 14, 10); // Head
            graphics.fillStyle(color, 1); // Body color
            graphics.fillRoundedRect(6, 22, 20, 24, 6); // Body
            graphics.fillStyle(0x000000, 1); // Eyes
            graphics.fillRect(11, 12, 2, 2);
            graphics.fillRect(19, 12, 2, 2);
            graphics.generateTexture(key, 32, 48);
            graphics.clear();
        };

        createNPC('npc_nova', 0x10b981); // Emerald
        createNPC('npc_kai', 0xef4444);  // Red
        createNPC('npc_nurse', 0xf472b6); // Pink
        createNPC('npc_shopkeeper', 0x3b82f6); // Blue

        // Generate Grass Pattern
        graphics.fillStyle(0x4ade80, 1);
        graphics.fillRect(0, 0, 64, 64);
        graphics.fillStyle(0x22c55e, 1); // Darker grass blades
        graphics.fillRect(16, 16, 4, 8);
        graphics.fillRect(48, 40, 4, 8);
        graphics.generateTexture('grass', 64, 64);
        graphics.clear();

        // Generate Dirt Path Pattern
        graphics.fillStyle(0xd6d3d1, 1);
        graphics.fillRect(0, 0, 64, 64);
        graphics.fillStyle(0xa8a29e, 1); // Path edges
        graphics.fillRect(0, 0, 64, 4);
        graphics.fillRect(0, 60, 64, 4);
        graphics.generateTexture('path', 64, 64);
        graphics.clear();

        // Generate Tree
        graphics.fillStyle(0x78350f, 1); // Trunk
        graphics.fillRect(24, 32, 16, 32);
        graphics.fillStyle(0x166534, 1); // Leaves
        graphics.fillCircle(32, 24, 24);
        graphics.fillCircle(16, 32, 16);
        graphics.fillCircle(48, 32, 16);
        graphics.generateTexture('tree', 64, 64);
        graphics.clear();

        // Generate Fence
        graphics.fillStyle(0x92400e, 1);
        graphics.fillRect(0, 16, 64, 8);
        graphics.fillRect(0, 40, 64, 8);
        graphics.fillRect(16, 8, 8, 48);
        graphics.fillRect(40, 8, 8, 48);
        graphics.generateTexture('fence', 64, 64);
        graphics.clear();

        // Generate Flowers
        graphics.fillStyle(0xef4444, 1);
        graphics.fillCircle(8, 8, 4);
        graphics.fillCircle(12, 12, 4);
        graphics.fillStyle(0xfbbf24, 1);
        graphics.fillCircle(10, 10, 4);
        graphics.generateTexture('flower', 20, 20);
        graphics.clear();

        // Generate Signboard
        graphics.fillStyle(0x78350f, 1);
        graphics.fillRect(14, 16, 4, 16); // Post
        graphics.fillStyle(0xd97706, 1);
        graphics.fillRect(4, 4, 24, 16); // Board
        graphics.generateTexture('sign', 32, 32);
        graphics.clear();

        // Generate Water
        graphics.fillStyle(0x38bdf8, 1);
        graphics.fillRect(0, 0, 64, 64);
        graphics.fillStyle(0x0ea5e9, 1);
        graphics.fillRect(16, 16, 16, 4);
        graphics.fillRect(40, 40, 16, 4);
        graphics.generateTexture('water', 64, 64);
        graphics.clear();

        // Building Generator Helper
        const createBuilding = (key: string, width: number, height: number, roofColor: number) => {
            graphics.fillStyle(0xf8fafc, 1); // Building base
            graphics.fillRoundedRect(0, 0, width, height, 8);
            graphics.fillStyle(roofColor, 1); // Roof covering top 40%
            graphics.fillRect(0, 0, width, height * 0.4);
            graphics.fillStyle(0x475569, 1); // Door
            graphics.fillRect(width / 2 - 16, height - 32, 32, 32);
            graphics.generateTexture(key, width, height);
            graphics.clear();
        };

        // Generate Buildings
        createBuilding('house_player', 128, 128, 0x3b82f6); // Blue roof
        createBuilding('house_rival', 128, 128, 0xef4444);  // Red roof
        createBuilding('lab', 256, 192, 0x64748b);          // Slate roof
        createBuilding('center', 160, 128, 0xf43f5e);       // Rose roof
        createBuilding('mart', 160, 128, 0x0ea5e9);         // Sky blue roof

        graphics.destroy();

        // Map the generated player texture into individual frames
        const tex = this.textures.get('player_texture');
        for (let dir = 0; dir < 4; dir++) {
            for (let frame = 0; frame < 4; frame++) {
                tex.add(`${dir}_${frame}`, 0, frame * 32, dir * 48, 32, 48);
            }
        }
    }

    create() {
        console.log('PreloadScene: create - starting OverworldScene');
        this.scene.start('OverworldScene');
    }
}