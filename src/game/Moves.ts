export interface Move {
    id: string;
    name: string;
    power: number;
    accuracy: number;
    type: string;
}

export const Moves: Record<string, Move> = {
    'tackle': { id: 'tackle', name: 'Tackle', power: 10, accuracy: 100, type: 'Normal' },
    'scratch': { id: 'scratch', name: 'Scratch', power: 10, accuracy: 100, type: 'Normal' },
    'growl': { id: 'growl', name: 'Growl', power: 0, accuracy: 100, type: 'Normal' },
    'ember': { id: 'ember', name: 'Ember', power: 15, accuracy: 100, type: 'Fire' }
};