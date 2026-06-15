export interface EncounterData {
    name: string;
    levelRange: [number, number];
    weight: number;
}

export const Route1Encounters: EncounterData[] = [
    { name: 'Pidgey', levelRange: [2, 4], weight: 45 },
    { name: 'Rattata', levelRange: [2, 4], weight: 45 },
    { name: 'Caterpie', levelRange: [3, 5], weight: 5 },
    { name: 'Weedle', levelRange: [3, 5], weight: 5 },
];