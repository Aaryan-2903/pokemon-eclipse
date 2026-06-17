export interface EncounterData {
    name: string;
    levelRange: [number, number];
    weight: number;
}

export const EclipseForestEncounters: EncounterData[] = [
    { name: 'Caterpie', levelRange: [6, 8], weight: 25 },
    { name: 'Weedle', levelRange: [6, 8], weight: 25 },
    { name: 'Pidgey', levelRange: [7, 9], weight: 20 },
    { name: 'Oddish', levelRange: [7, 9], weight: 15 },
    { name: 'Bellsprout', levelRange: [7, 9], weight: 15 },
    { name: 'Pikachu', levelRange: [8, 10], weight: 10 },
];