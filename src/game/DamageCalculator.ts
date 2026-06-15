import { PokemonInstance } from './PokemonData';
import { Move } from './Moves';

export class DamageCalculator {
    public static calculate(attacker: PokemonInstance, defender: PokemonInstance, move: Move): { damage: number, modifier: 'strong' | 'weak' | 'normal' } {
        if (move.power === 0) {
            return { damage: 0, modifier: 'normal' };
        }

        const randomBonus = Math.floor(Math.random() * 4); // Random integer from 0 to 3
        const attackInfluence = Math.floor(attacker.attack / 5);
        const defenseInfluence = Math.floor(defender.defense / 8);

        let damage = move.power + randomBonus + attackInfluence - defenseInfluence;

        // Determine modifier for messaging based on the random bonus
        let modifier: 'strong' | 'weak' | 'normal' = 'normal';
        if (randomBonus >= 3) { // A value of 3 gives a "strong hit"
            modifier = 'strong';
        } else if (randomBonus === 0) { // A value of 0 gives a "weak hit"
            modifier = 'weak';
        }

        // Ensure minimum damage is 1 for damaging moves
        damage = Math.max(1, damage);

        return { damage, modifier };
    }
}