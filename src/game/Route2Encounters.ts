export interface EncounterData {
    name: string;
    levelRange: [number, number];
    weight: number;
}

export const Route2Encounters: EncounterData[] = [
    { name: 'Spearow', levelRange: [5, 7], weight: 30 },
    { name: 'Oddish', levelRange: [4, 6], weight: 30 },
    { name: 'Bellsprout', levelRange: [4, 6], weight: 30 },
    { name: 'Pikachu', levelRange: [5, 8], weight: 10 }, // Rare encounter
];