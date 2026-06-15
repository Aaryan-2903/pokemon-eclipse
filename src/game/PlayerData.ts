import { PokemonInstance } from './PokemonData';

export interface IPlayerData {
    name: string;
    starterPokemon?: string;
    pokemonTeam: PokemonInstance[];
    inventory: Record<string, number>;
    money: number;
    defeatedTrainers: Set<string>;
}

export const PlayerState: IPlayerData = {
    name: 'Max',
    pokemonTeam: [],
    inventory: { 'Pokeball': 10 },
    money: 1000,
    defeatedTrainers: new Set(),
};