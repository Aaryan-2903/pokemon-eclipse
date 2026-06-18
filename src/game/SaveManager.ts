import { PlayerState } from './PlayerData';
import { StoryManager, StoryFlag } from './StoryManager';
import { PokemonInstance } from './PokemonData';
import { Scene } from 'phaser';

export interface SaveData {
    timestamp: number;
    playerState: {
        name: string;
        starterPokemon?: string;
        pokemonTeam: PokemonInstance[];
        pokemonBox: PokemonInstance[];
        inventory: Record<string, number>;
        money: number;
        defeatedTrainers: string[];
        badges: string[];
        pokedex: {
            seen: string[];
            caught: string[];
        };
    };
    storyState: {
        flags: StoryFlag[];
        activeQuest: string | null;
    };
    scene: {
        key: string;
        x: number;
        y: number;
    };
}

const SAVE_KEY = 'pokemon-save-data';

export class SaveManager {
    public static save(scene: Scene, playerX: number, playerY: number) {
        const saveData: SaveData = {
            timestamp: Date.now(),
            playerState: {
                name: PlayerState.name,
                starterPokemon: PlayerState.starterPokemon,
                pokemonTeam: PlayerState.pokemonTeam,
                pokemonBox: PlayerState.pokemonBox,
                inventory: PlayerState.inventory,
                money: PlayerState.money,
                defeatedTrainers: Array.from(PlayerState.defeatedTrainers),
                badges: Array.from(PlayerState.badges),
                pokedex: {
                    seen: Array.from(PlayerState.pokedex.seen),
                    caught: Array.from(PlayerState.pokedex.caught),
                },
            },
            storyState: {
                flags: Array.from(StoryManager.getInstance().getFlags()),
                activeQuest: StoryManager.getInstance().getActiveQuest(),
            },
            scene: {
                key: scene.scene.key,
                x: playerX,
                y: playerY,
            }
        };

        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
            console.log('Game saved!', saveData);
        } catch (e) {
            console.error('Failed to save game:', e);
        }
    }

    public static load(): SaveData | null {
        try {
            const savedString = localStorage.getItem(SAVE_KEY);
            if (!savedString) return null;

            const saveData: SaveData = JSON.parse(savedString);

            // Hydrate state
            PlayerState.name = saveData.playerState.name;
            PlayerState.starterPokemon = saveData.playerState.starterPokemon;
            PlayerState.pokemonTeam = saveData.playerState.pokemonTeam || [];
            PlayerState.pokemonBox = saveData.playerState.pokemonBox || [];
            PlayerState.inventory = saveData.playerState.inventory;

            // Migration for old saves or empty inventories.
            if (!PlayerState.inventory || Object.keys(PlayerState.inventory).length === 0) {
                console.log('Saved inventory is missing or empty, initializing starter items.');
                PlayerState.inventory = { 'Pokeball': 5, 'Potion': 3 };
            }

            PlayerState.money = saveData.playerState.money;
            PlayerState.defeatedTrainers = new Set(saveData.playerState.defeatedTrainers);
            PlayerState.badges = new Set(saveData.playerState.badges || []);
            PlayerState.pokedex = {
                seen: new Set(saveData.playerState.pokedex?.seen || []),
                caught: new Set(saveData.playerState.pokedex?.caught || []),
            };

            StoryManager.getInstance().setFlags(new Set(saveData.storyState.flags));
            StoryManager.getInstance().setActiveQuest(saveData.storyState.activeQuest);
            
            console.log('Game loaded!', saveData);
            return saveData;
        } catch (e) {
            console.error('Failed to load game:', e);
            return null;
        }
    }

    public static hasSaveData(): boolean {
        return localStorage.getItem(SAVE_KEY) !== null;
    }

    public static clearSaveData() {
        localStorage.removeItem(SAVE_KEY);
        console.log('Save data cleared.');
    }

    public static getLastSaveTimestamp(): string | null {
        try {
            const savedString = localStorage.getItem(SAVE_KEY);
            if (!savedString) return null;

            // Partially parse to avoid loading everything just for the timestamp
            const saveData: { timestamp: number } = JSON.parse(savedString);
            if (!saveData.timestamp) return null;

            return new Date(saveData.timestamp).toLocaleString();
        } catch (e) {
            console.error('Failed to get last save timestamp:', e);
            return null;
        }
    }
}