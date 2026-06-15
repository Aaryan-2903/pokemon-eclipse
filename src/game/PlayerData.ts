import { PokemonInstance } from './PokemonData';

export interface IPlayerData {
    name: string;
    starterPokemon?: string;
    pokemonTeam: PokemonInstance[];
}

export const PlayerState: IPlayerData = {
    name: 'Max',
    pokemonTeam: []
};