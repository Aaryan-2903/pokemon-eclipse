export interface EvolutionStep {
    level: number;
    to: string;
}

export const EvolutionTable: Record<string, EvolutionStep> = {
    'Charmander': { level: 16, to: 'Charmeleon' },
    'Charmeleon': { level: 36, to: 'Charizard' },
    'Caterpie': { level: 7, to: 'Metapod' },
    'Metapod': { level: 10, to: 'Butterfree' },
    'Weedle': { level: 7, to: 'Kakuna' },
    'Kakuna': { level: 10, to: 'Beedrill' },
    'Pidgey': { level: 18, to: 'Pidgeotto' },
    'Pidgeotto': { level: 36, to: 'Pidgeot' },
    'Rattata': { level: 20, to: 'Raticate' },
};