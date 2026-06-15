import { PokemonInstance } from './PokemonData';

export interface IPlayerData {
    name: string;
    starterPokemon?: string;
    pokemonTeam: PokemonInstance[];
    inventory: Record<string, number>;
}

export const PlayerState: IPlayerData = {
    name: 'Max',
    pokemonTeam: [],
    inventory: { 'Pokeball': 10 }
};