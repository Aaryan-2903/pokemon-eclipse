import { Route1Encounters, EncounterData } from './Route1Encounters';

// A simple map to hold encounter tables for different routes.
const encounterTables: Record<string, EncounterData[]> = {
    'Route1Scene': Route1Encounters,
};

export class EncounterManager {
    private scene: Phaser.Scene;
    private encounterChance: number = 0.15; // 15% chance per check
    private lastEncounterTime: number = 0;
    private cooldown: number = 3000; // 3 seconds

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /**
     * Checks if a wild Pokémon encounter should occur.
     * @param routeKey The key of the current route scene (e.g., 'Route1Scene').
     * @returns The encountered Pokémon data or null if no encounter happens.
     */
    public checkEncounter(routeKey: string): EncounterData | null {
        const now = this.scene.time.now;
        if (now - this.lastEncounterTime < this.cooldown) {
            return null;
        }

        if (Math.random() < this.encounterChance) {
            const encounterTable = encounterTables[routeKey];
            if (encounterTable) {
                this.lastEncounterTime = now;
                return this.selectRandomPokemon(encounterTable);
            }
        }

        return null;
    }

    /**
     * Selects a random Pokémon from an encounter table based on weights.
     */
    private selectRandomPokemon(table: EncounterData[]): EncounterData {
        const totalWeight = table.reduce((sum, pokemon) => sum + pokemon.weight, 0);
        let random = Math.random() * totalWeight;

        for (const pokemon of table) {
            if (random < pokemon.weight) return pokemon;
            random -= pokemon.weight;
        }

        return table[0]; // Fallback
    }

    public static getRandomLevel(pokemon: EncounterData): number {
        const [min, max] = pokemon.levelRange;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}