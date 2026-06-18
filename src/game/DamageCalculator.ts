import { PokemonInstance } from './PokemonData';
import { Move } from './Moves';

export type DamageModifier = 'super' | 'not-very' | 'critical' | 'strong' | 'weak' | 'normal';

const TYPE_CHART: Record<string, { strong: string[], weak: string[] }> = {
    Fire: { strong: ['Grass', 'Bug'], weak: ['Water', 'Rock', 'Fire'] },
    Water: { strong: ['Fire', 'Rock', 'Ground'], weak: ['Grass', 'Water'] },
    Grass: { strong: ['Water', 'Rock', 'Ground'], weak: ['Fire', 'Grass', 'Flying', 'Bug'] },
    Electric: { strong: ['Water', 'Flying'], weak: ['Grass', 'Electric'] },
    Rock: { strong: ['Fire', 'Flying', 'Bug'], weak: ['Ground'] },
    Ground: { strong: ['Fire', 'Electric', 'Rock'], weak: ['Grass', 'Bug'] },
    Flying: { strong: ['Grass', 'Bug'], weak: ['Rock', 'Electric'] },
    Bug: { strong: ['Grass'], weak: ['Fire', 'Flying'] },
    Poison: { strong: ['Grass'], weak: ['Poison', 'Ground', 'Rock'] },
    Normal: { strong: [], weak: ['Rock'] }
};

export class DamageCalculator {
    public static calculate(attacker: PokemonInstance, defender: PokemonInstance, move: Move): { damage: number, modifier: DamageModifier, missed: boolean, critical: boolean } {
        if (Math.random() * 100 > move.accuracy) {
            return { damage: 0, modifier: 'normal', missed: true, critical: false };
        }

        if (move.power === 0) {
            return { damage: 0, modifier: 'normal', missed: false, critical: false };
        }

        const randomBonus = Math.floor(Math.random() * 4); // Random integer from 0 to 3
        const attackInfluence = Math.floor(attacker.attack / 5);
        const defenseInfluence = Math.floor(defender.defense / 8);

        let damage = move.power + randomBonus + attackInfluence - defenseInfluence;

        let modifier: DamageModifier = 'normal';
        let typeMultiplier = 1;
        const chartEntry = TYPE_CHART[move.type];
        if (chartEntry) {
            defender.types.forEach(type => {
                if (chartEntry.strong.includes(type)) typeMultiplier *= 1.5;
                if (chartEntry.weak.includes(type)) typeMultiplier *= 0.65;
            });
        }

        const critical = Math.random() < 0.1;
        damage = Math.round(damage * typeMultiplier * (critical ? 1.7 : 1));

        if (critical) {
            modifier = 'critical';
        } else if (typeMultiplier > 1) {
            modifier = 'super';
        } else if (typeMultiplier < 1) {
            modifier = 'not-very';
        } else if (randomBonus >= 3) { // A value of 3 gives a "strong hit"
            modifier = 'strong';
        } else if (randomBonus === 0) { // A value of 0 gives a "weak hit"
            modifier = 'weak';
        }

        // Ensure minimum damage is 1 for damaging moves
        damage = Math.max(1, damage);

        return { damage, modifier, missed: false, critical };
    }
}
