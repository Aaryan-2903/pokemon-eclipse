import { Route1Encounters } from './Route1Encounters';
import { Route2Encounters } from './Route2Encounters';
import { Route3Encounters } from './Route3Encounters';
import { EclipseForestEncounters } from './EclipseForestEncounters';
import { POKEMON_SPECIES_ID_MAP, POKEMON_TYPES_MAP } from './PokemonData';

export interface PokedexEntry {
    id: number;
    name: string;
    types: string[];
    levelRange?: [number, number];
}

const allEncounters = [
    ...Route1Encounters,
    ...Route2Encounters,
    ...Route3Encounters,
    ...EclipseForestEncounters,
];

const levelRanges: Record<string, [number, number]> = {};

allEncounters.forEach(encounter => {
    if (!levelRanges[encounter.name]) {
        levelRanges[encounter.name] = [...encounter.levelRange];
    } else {
        levelRanges[encounter.name][0] = Math.min(levelRanges[encounter.name][0], encounter.levelRange[0]);
        levelRanges[encounter.name][1] = Math.max(levelRanges[encounter.name][1], encounter.levelRange[1]);
    }
});

export const AllPokemon: PokedexEntry[] = Object.keys(POKEMON_SPECIES_ID_MAP)
    .map(name => ({
        id: POKEMON_SPECIES_ID_MAP[name],
        name,
        types: POKEMON_TYPES_MAP[name] || ['Normal'],
        levelRange: levelRanges[name],
    }))
    .sort((a, b) => a.id - b.id);