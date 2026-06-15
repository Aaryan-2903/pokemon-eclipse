export interface PokemonInstance {
    name: string;
    level: number;
    maxHp: number;
    currentHp: number;
    attack: number;
    defense: number;
    speed: number;
    moves: string[]; // Move IDs mapping to Moves.ts
    isPlayer: boolean;
}

export const generateWildPokemon = (name: string, level: number): PokemonInstance => {
    return {
        name,
        level,
        maxHp: 20 + level * 2,
        currentHp: 20 + level * 2,
        attack: 5 + level,
        defense: 5 + level,
        speed: 5 + level,
        moves: ['tackle'],
        isPlayer: false
    };
};

export const generatePlayerPokemon = (name: string, level: number): PokemonInstance => {
    return {
        ...generateWildPokemon(name, level),
        moves: ['tackle', 'growl'],
        isPlayer: true
    };
};