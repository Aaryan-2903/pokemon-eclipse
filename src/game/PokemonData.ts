import { EvolutionTable } from './EvolutionData';

export interface PokemonInstance {
    name: string;
    id: number;
    level: number;
    types: string[];
    maxHp: number;
    currentHp: number;
    attack: number;
    defense: number;
    speed: number;
    moves: string[]; // Move IDs mapping to Moves.ts
    isPlayer: boolean;
    xp: number;
    totalXp: number;
}

export const POKEMON_SPECIES_ID_MAP: Record<string, number> = {
    'Bulbasaur': 1,
    'Ivysaur': 2,
    'Venusaur': 3,
    'Charmander': 4,
    'Squirtle': 7,
    'Caterpie': 10,
    'Weedle': 13,
    'Pidgey': 16,
    'Rattata': 19,
    'Charmeleon': 5,
    'Spearow': 21,
    'Pikachu': 25,
    'Oddish': 43,
    'Zubat': 41,
    'Paras': 46,
    'Bellsprout': 69,
    'Geodude': 74,
    'Nidoran♀': 29,
    'Wartortle': 8,
    'Blastoise': 9,
    'Charizard': 6,
    'Metapod': 11,
    'Butterfree': 12,
    'Kakuna': 14,
    'Beedrill': 15,
    'Pidgeotto': 17,
    'Pidgeot': 18,
    'Raticate': 20,
};

const POKEMON_TYPES_MAP: Record<string, string[]> = {
    'Bulbasaur': ['Grass', 'Poison'],
    'Ivysaur': ['Grass', 'Poison'],
    'Venusaur': ['Grass', 'Poison'],
    'Charmander': ['Fire'],
    'Squirtle': ['Water'],
    'Caterpie': ['Bug'],
    'Weedle': ['Bug', 'Poison'],
    'Pidgey': ['Normal', 'Flying'],
    'Spearow': ['Normal', 'Flying'],
    'Pikachu': ['Electric'],
    'Oddish': ['Grass', 'Poison'],
    'Zubat': ['Poison', 'Flying'],
    'Paras': ['Bug', 'Grass'],
    'Bellsprout': ['Grass', 'Poison'],
    'Geodude': ['Rock', 'Ground'],
    'Nidoran♀': ['Poison'],
    'Wartortle': ['Water'],
    'Blastoise': ['Water'],
    'Rattata': ['Normal'],
    'Charmeleon': ['Fire'],
    'Charizard': ['Fire', 'Flying'],
    'Kakuna': ['Bug', 'Poison'],
    'Metapod': ['Bug'],
    'Butterfree': ['Bug', 'Flying'],
    'Beedrill': ['Bug', 'Poison'],
    'Pidgeotto': ['Normal', 'Flying'],
    'Pidgeot': ['Normal', 'Flying'],
    'Raticate': ['Normal'],
};

export const generateWildPokemon = (name: string, level: number): PokemonInstance => {
    return {
        name,
        level,
        id: POKEMON_SPECIES_ID_MAP[name] || 1, // Default to Bulbasaur if not found
        types: POKEMON_TYPES_MAP[name] || ['Normal'],
        maxHp: 20 + level * 2,
        currentHp: 20 + level * 2,
        attack: 5 + level,
        defense: 5 + level,
        speed: 5 + level,
        moves: ['tackle'],
        isPlayer: false,
        xp: 0,
        totalXp: 0
    };
};

export const generatePlayerPokemon = (name: string, level: number): PokemonInstance => {
    const base = generateWildPokemon(name, level);
    return {
        ...base,
        moves: ['tackle', 'growl'],
        isPlayer: true,
    };
};

export const getXpForNextLevel = (level: number): number => {
    // A simple formula for now. Can be expanded later (e.g., Math.pow(level, 3))
    return 100;
};

export const handleLevelUp = (pokemon: PokemonInstance): { leveledUp: boolean, message: string, evolution: { to: string } | null } => {
    let xpForNextLevel = getXpForNextLevel(pokemon.level);
    let message = '';
    let leveledUp = false;
    let evolution: { to: string } | null = null;

    while (pokemon.xp >= xpForNextLevel) {
        leveledUp = true;
        const oldLevel = pokemon.level;
        pokemon.level++;
        pokemon.xp -= xpForNextLevel;
        pokemon.maxHp += 5;
        pokemon.attack += 2;
        pokemon.defense += 2;
        pokemon.speed += 2;
        pokemon.currentHp = pokemon.maxHp;

        xpForNextLevel = getXpForNextLevel(pokemon.level);

        console.log(`[XP DEBUG] LEVEL UP! ${pokemon.name} | Level ${oldLevel} -> ${pokemon.level} | XP is now ${pokemon.xp}/${xpForNextLevel}`);

        // Check for evolution
        const evolutionStep = EvolutionTable[pokemon.name];
        if (evolutionStep && pokemon.level >= evolutionStep.level) {
            evolution = { to: evolutionStep.to };
        }
    }
    if (leveledUp) {
        message = `${pokemon.name} grew to Level ${pokemon.level}!`;
    }
    return { leveledUp, message, evolution };
};

export const evolvePokemon = (pokemon: PokemonInstance, to: string) => {
    const oldName = pokemon.name;
    const hpPercent = pokemon.currentHp / pokemon.maxHp;
    pokemon.name = to;
    pokemon.id = POKEMON_SPECIES_ID_MAP[to] || pokemon.id;
    pokemon.types = POKEMON_TYPES_MAP[to] || pokemon.types;

    // Stat boost on evolution
    pokemon.maxHp += 10;
    pokemon.attack += 5;
    pokemon.defense += 5;
    pokemon.speed += 5;
    pokemon.currentHp = Math.round(pokemon.maxHp * hpPercent); // Preserve HP percentage

    console.log(`${oldName} evolved into ${to}!`, pokemon);
};