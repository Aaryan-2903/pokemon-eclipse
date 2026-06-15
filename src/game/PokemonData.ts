export interface PokemonInstance {
    name: string;
    id: number;
    level: number;
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

const POKEMON_SPECIES_ID_MAP: Record<string, number> = {
    'Bulbasaur': 1,
    'Charmander': 4,
    'Squirtle': 7,
    'Caterpie': 10,
    'Weedle': 13,
    'Pidgey': 16,
    'Rattata': 19,
};

export const generateWildPokemon = (name: string, level: number): PokemonInstance => {
    return {
        name,
        level,
        id: POKEMON_SPECIES_ID_MAP[name] || 1, // Default to Bulbasaur if not found
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

export const handleLevelUp = (pokemon: PokemonInstance): { leveledUp: boolean, message: string } => {
    const xpForNextLevel = 100;
    let message = '';
    let leveledUp = false;
    while (pokemon.xp >= xpForNextLevel) {
        leveledUp = true;
        pokemon.level++;
        pokemon.xp -= xpForNextLevel;
        pokemon.maxHp += 5;
        pokemon.attack += 2;
        pokemon.defense += 2;
        pokemon.speed += 2;
        pokemon.currentHp = pokemon.maxHp;
    }
    if (leveledUp) {
        message = `${pokemon.name} grew to Level ${pokemon.level}!`;
    }
    return { leveledUp, message };
};