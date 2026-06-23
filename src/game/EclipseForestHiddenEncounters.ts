export interface EncounterData {
    name: string;
    levelRange: [number, number];
    weight: number;
}

export const EclipseForestHiddenEncounters: EncounterData[] = [
    { name: 'Pikachu', levelRange: [10, 12], weight: 40 },
    { name: 'Oddish', levelRange: [10, 12], weight: 30 },
    // A rarer Pokemon for this area
    { name: 'Paras', levelRange: [12, 14], weight: 30 },
];