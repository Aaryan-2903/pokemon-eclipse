import { Scene, Math as PhaserMath } from 'phaser';
import { SaveManager } from './SaveManager';

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
        createNPC('npc_youngster', 0x38bdf8); // Light blue
        createNPC('npc_bugcatcher', 0x4ade80); // Green
        createNPC('npc_traveler', 0x78350f); // Brown
        createNPC('npc_aurora', 0xa78bfa); // Violet

        // Generate Portrait Placeholders
        const createPortrait = (key: string, color: number) => {
            graphics.fillStyle(0x000000, 1);
            graphics.fillRect(0, 0, 96, 96);
            graphics.fillStyle(color, 1);
            graphics.fillRect(2, 2, 92, 92);
            graphics.fillStyle(0xfcd34d, 1); // Face
            graphics.fillCircle(48, 40, 24);
            graphics.generateTexture(key, 96, 96);
            graphics.clear();
        };

        createPortrait('portrait_nova', 0x10b981);
        createPortrait('portrait_kai', 0xef4444);
        createPortrait('portrait_nurse', 0xf472b6);
        createPortrait('portrait_shopkeeper', 0x3b82f6);
        createPortrait('portrait_youngster', 0x38bdf8);
        createPortrait('portrait_bugcatcher', 0x4ade80);
        createPortrait('portrait_traveler', 0x78350f);
        createPortrait('portrait_aurora', 0xa78bfa);
        createPortrait('portrait_umbra_grunt', 0x4b5563); // Slate gray

        // Generate Starter Placeholders
        const createStarter = (key: string, color: number) => {
            graphics.fillStyle(0x000000, 1);
            graphics.fillCircle(32, 32, 28);
            graphics.fillStyle(color, 1);
            graphics.fillCircle(32, 32, 24);
            graphics.generateTexture(key, 64, 64);
            graphics.clear();
        };
        createStarter('starter_grass', 0x22c55e);
        createStarter('starter_fire', 0xef4444);
        createStarter('starter_water', 0x3b82f6);

        // Generate new Pokemon sprites
        this.load.image('pokemon_sprite_front_21', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/21.png'); // Spearow
        this.load.image('pokemon_sprite_front_25', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png'); // Pikachu
        this.load.image('pokemon_sprite_front_41', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/41.png'); // Zubat
        this.load.image('pokemon_sprite_front_43', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/43.png'); // Oddish
        this.load.image('pokemon_sprite_front_46', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/46.png'); // Paras
        this.load.image('pokemon_sprite_front_74', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/74.png'); // Geodude
        this.load.image('pokemon_sprite_front_69', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/69.png'); // Bellsprout

        // Generate Pokemon Placeholder
        graphics.fillStyle(0x9ca3af, 1); // Gray
        graphics.fillCircle(32, 32, 30);
        graphics.generateTexture('pokemon_placeholder', 64, 64);
        graphics.clear();

        // Generate Floors
        graphics.fillStyle(0xd4d4d8, 1);
        graphics.fillRect(0, 0, 64, 64);
        graphics.lineStyle(2, 0xa1a1aa, 1); // Darker border for tiles
        graphics.strokeRect(0, 0, 64, 64);
        graphics.generateTexture('floor_lab', 64, 64);
        graphics.clear();

        graphics.fillStyle(0x78350f, 1);
        graphics.fillRect(0, 0, 64, 64);
        graphics.fillStyle(0x451a03, 1); // Darker wood lines to show movement
        graphics.fillRect(0, 16, 64, 2);
        graphics.fillRect(0, 32, 64, 2);
        graphics.fillRect(0, 48, 64, 2);
        graphics.lineStyle(2, 0x451a03, 1);
        graphics.strokeRect(0, 0, 64, 64);
        graphics.generateTexture('floor_wood', 64, 64);
        graphics.clear();

        graphics.fillStyle(0x000000, 0.5);
        graphics.fillRect(0, 0, 100, 20);
        graphics.generateTexture('exit_mat', 100, 20);
        graphics.clear();

        // Generate Grass Pattern
        graphics.fillStyle(0x4ade80, 1);
        graphics.fillRect(0, 0, 64, 64);
        graphics.fillStyle(0x22c55e, 1); // Darker grass blades
        graphics.fillRect(16, 16, 4, 8);
        graphics.fillRect(48, 40, 4, 8);
        graphics.generateTexture('grass', 64, 64);
        graphics.clear();

        // Generate Tall Grass
        graphics.fillStyle(0x166534, 1);
        graphics.fillRect(0, 0, 64, 64);
        graphics.fillStyle(0x14532d, 1);
        graphics.fillRect(16, 16, 8, 16);
        graphics.fillRect(40, 32, 8, 16);
        graphics.generateTexture('tall_grass', 64, 64);
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

        // Generate Rock
        graphics.fillStyle(0x9ca3af, 1); // Gray
        graphics.fillCircle(16, 16, 14);
        graphics.fillStyle(0x6b7280, 1);
        graphics.fillCircle(12, 12, 5);
        graphics.generateTexture('rock', 32, 32);
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

        // Generate Desk
        graphics.fillStyle(0x854d0e, 1); // Brown
        graphics.fillRect(0, 0, 200, 60);
        graphics.fillStyle(0x522d01, 1); // Darker brown for front panel
        graphics.fillRect(0, 10, 200, 50);
        graphics.generateTexture('desk_texture', 200, 60);
        graphics.clear();

        // Generate Sky Badge
        graphics.fillStyle(0x7dd3fc, 1); // Light Sky Blue
        graphics.fillPoints([ {x: 16, y: 2}, {x: 30, y: 16}, {x: 16, y: 30}, {x: 2, y: 16} ]);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(16, 16, 4);
        graphics.generateTexture('badge_sky', 32, 32);
        graphics.clear();

        // Generate Item Pickup Sprite
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(16, 16, 12);
        graphics.fillStyle(0xef4444, 1);
        graphics.slice(16, 16, 12, PhaserMath.DegToRad(180), PhaserMath.DegToRad(360));
        graphics.fillPath();
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(16, 16, 4);
        graphics.generateTexture('pokeball_item', 32, 32);
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
        createBuilding('building_gym', 192, 160, 0xf59e0b); // Amber roof

        // UI Elements
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(0, 0, 32, 4);
        graphics.fillRect(0, 10, 32, 4);
        graphics.fillRect(0, 20, 32, 4);
        graphics.generateTexture('menu_icon', 32, 24);
        graphics.clear();

        graphics.fillStyle(0xfcd34d, 1); // Yellow
        graphics.fillPoints([
            { x: 0, y: 0 },
            { x: 16, y: 8 },
            { x: 0, y: 16 }
        ]);
        graphics.generateTexture('selector_arrow', 16, 16);
        graphics.clear();

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
        console.log('PreloadScene: create - checking for save data...');
        const saveData = SaveManager.load();

        if (saveData) {
            console.log('Save data found, loading last scene.');
            // The SaveManager.load() already hydrated the global state.
            // We just need to start the correct scene with the correct player position.
            this.scene.start(saveData.scene.key, { 
                spawnX: saveData.scene.x, 
                spawnY: saveData.scene.y 
            });
        } else {
            console.log('No save data, starting new game.');
            this.scene.start('InteriorScene', { entranceId: 'home' });
        }
    }
}