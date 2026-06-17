export interface EncounterData {
    name: string;
    levelRange: [number, number];
    weight: number;
}

export const Route3Encounters: EncounterData[] = [
    { name: 'Pidgey', levelRange: [8, 10], weight: 30 },
    { name: 'Rattata', levelRange: [8, 10], weight: 25 },
    { name: 'Oddish', levelRange: [9, 11], weight: 20 },
    { name: 'Bellsprout', levelRange: [9, 11], weight: 20 },
    { name: 'Pikachu', levelRange: [10, 12], weight: 5 }, // Still rare
];