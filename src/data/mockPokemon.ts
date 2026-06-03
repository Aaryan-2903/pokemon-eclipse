export interface PokemonEntry {
  id: number;
  name: string;
  type: string[];
  description: string;
  rarity: string;
}

export const mockPokemon: PokemonEntry[] = [
  {
    id: 1,
    name: 'Pikachu',
    type: ['Electric'],
    description: 'A friendly Electric-type favorite with powerful Thunderbolt attacks.',
    rarity: 'Common',
  },
  {
    id: 4,
    name: 'Charmander',
    type: ['Fire'],
    description: 'A Fire-type starter with a blazing tail and bold spirit.',
    rarity: 'Common',
  },
  {
    id: 7,
    name: 'Squirtle',
    type: ['Water'],
    description: 'A Water-type turtle Pokémon with impressive shell defense.',
    rarity: 'Common',
  },
  {
    id: 25,
    name: 'Raichu',
    type: ['Electric'],
    description: 'An evolved Electric form that moves with extraordinary speed.',
    rarity: 'Rare',
  },
  {
    id: 94,
    name: 'Gengar',
    type: ['Ghost', 'Poison'],
    description: 'A shadowy Ghost-type with a mischievous grin and spectral power.',
    rarity: 'Rare',
  },
  {
    id: 131,
    name: 'Lapras',
    type: ['Water', 'Ice'],
    description: 'A gentle sea creature known for ferrying travelers across oceans.',
    rarity: 'Legendary',
  },
];
