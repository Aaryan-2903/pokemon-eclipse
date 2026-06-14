export interface IPlayerData {
    name: string;
    starterPokemon?: string;
    // Future Expansion Points:
    // gender, starterPokemon, money, badges, inventory
}

export const PlayerState: IPlayerData = {
    name: 'Max'
};