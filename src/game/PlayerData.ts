import { PokemonInstance } from './PokemonData';

export interface IPlayerData {
    name: string;
    starterPokemon?: string;
    pokemonTeam: PokemonInstance[];
    pokemonBox: PokemonInstance[];
    inventory: Record<string, number>;
    money: number;
    defeatedTrainers: Set<string>;
    badges: Set<string>;
}

export const PlayerState: IPlayerData = {
    name: 'Max',
    pokemonTeam: [],
    pokemonBox: [],
    inventory: { 'Pokeball': 5, 'Potion': 3 },
    money: 1000,
    defeatedTrainers: new Set(),
    badges: new Set(),
};