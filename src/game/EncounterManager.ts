import { Route1Encounters, EncounterData } from './Route1Encounters';
import { Route2Encounters } from './Route2Encounters';
import { EclipseForestEncounters } from './EclipseForestEncounters';
import { PokemonInstance, generateWildPokemon } from './PokemonData';
import { EclipseForestHiddenEncounters } from './EclipseForestHiddenEncounters';
import { Route3Encounters } from './Route3Encounters';

// A simple map to hold encounter tables for different routes.
const encounterTables: Record<string, EncounterData[]> = {
    'Route1Scene': Route1Encounters,
    'Route2Scene': Route2Encounters,
    'EclipseForestScene': EclipseForestEncounters,
    'EclipseForestScene_Hidden': EclipseForestHiddenEncounters,
    'Route3Scene': Route3Encounters,
};

export class EncounterManager {
    private scene: Phaser.Scene;
    private readonly ENCOUNTER_RATE: number = 0.1;
    private readonly ENCOUNTER_COOLDOWN_STEPS: number = 12;
    private stepsSinceLastEncounter: number = 0;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.stepsSinceLastEncounter = this.ENCOUNTER_COOLDOWN_STEPS; // Allow first encounter immediately
    }

    /**
     * Checks if a wild Pokémon encounter should occur.
     * @param routeKey The key of the current route scene (e.g., 'Route1Scene').
     * @returns The encountered Pokémon data or null if no encounter happens.
     */
    public checkEncounter(routeKey: string): PokemonInstance | null {
        this.stepsSinceLastEncounter++;
        if (this.stepsSinceLastEncounter < this.ENCOUNTER_COOLDOWN_STEPS) {
            return null;
        }

        if (Math.random() < this.ENCOUNTER_RATE) {
            const encounterTable = encounterTables[routeKey];
            if (encounterTable) {
                this.stepsSinceLastEncounter = 0; // Reset for cooldown
                const encounterData = this.selectRandomPokemon(encounterTable);
                console.log(`[EncounterManager] Generated wild encounter: ${encounterData.name}`);
                const level = EncounterManager.getRandomLevel(encounterData);
                return generateWildPokemon(encounterData.name, level);
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