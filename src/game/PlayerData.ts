import { PokemonInstance } from './PokemonData';

export interface IPokedex {
    seen: Set<string>;
    caught: Set<string>;
}

export interface IPlayerData {
    name: string;
    starterPokemon?: string;
    pokemonTeam: PokemonInstance[];
    pokemonBox: PokemonInstance[];
    inventory: Record<string, number>;
    money: number;
    defeatedTrainers: Set<string>;
    badges: Set<string>;
    pokedex: IPokedex;
}

export const PlayerState: IPlayerData = {
    name: 'Max',
    pokemonTeam: [],
    pokemonBox: [],
    inventory: { 'Pokeball': 5, 'Potion': 3 },
    money: 1000,
    defeatedTrainers: new Set(),
    badges: new Set(),
    pokedex: {
        seen: new Set(),
        caught: new Set(),
    },
};