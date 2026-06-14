export interface WildEncounter {
    pokemon: string;
    minLevel: number;
    maxLevel: number;
    chance: number; // 0.0 to 1.0
}

export interface TrainerData {
    id: string;
    name: string;
    team: string[]; // Future expansion: Detailed pokemon objects
}

export interface HiddenItem {
    id: string;
    item: string;
    x: number;
    y: number;
}

export interface RouteData {
    id: string;
    name: string;
    encounters: {
        grass: WildEncounter[];
        water: WildEncounter[];
    };
    trainers: TrainerData[];
    hiddenItems: HiddenItem[];
}

// Data architecture stub for future combat mechanics
export const Route1Data: RouteData = {
    id: 'route_1',
    name: 'Route 1',
    encounters: {
        grass: [
            // e.g. { pokemon: 'Pidgey', minLevel: 2, maxLevel: 4, chance: 0.5 }
        ],
        water: []
    },
    trainers: [],
    hiddenItems: []
};