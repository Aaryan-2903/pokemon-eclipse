import { PokemonInstance } from './PokemonData';
import { Move } from './Moves';

export class DamageCalculator {
    public static calculate(attacker: PokemonInstance, defender: PokemonInstance, move: Move): number {
        // Foundational formula: Damage = Attack Power
        // (Type effectiveness, defense, and crits will be scaled in future phases)
        return move.power > 0 ? move.power : 0;
    }
}