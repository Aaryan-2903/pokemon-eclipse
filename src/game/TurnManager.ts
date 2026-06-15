import { PokemonInstance } from './PokemonData';
import { Move, Moves } from './Moves';
import { DamageCalculator } from './DamageCalculator';

export interface TurnAction {
    message: string;
    target?: 'player' | 'enemy';
    damage?: number;
    isFaint?: boolean;
}

export class TurnManager {
    public static processTurn(playerMon: PokemonInstance, playerMoveId: string, enemyMon: PokemonInstance, enemyMoveId: string): TurnAction[] {
        const actions: TurnAction[] = [];
        const playerMove = Moves[playerMoveId];
        const enemyMove = Moves[enemyMoveId];

        // --- Player Turn ---
        actions.push({ message: `${playerMon.name} used ${playerMove.name}!` });
        
        const pDamage = DamageCalculator.calculate(playerMon, enemyMon, playerMove);
        if (pDamage > 0) {
            enemyMon.currentHp = Math.max(0, enemyMon.currentHp - pDamage);
            actions.push({ message: `It did ${pDamage} damage.`, target: 'enemy', damage: pDamage });
        } else if (playerMove.power === 0) {
            actions.push({ message: `Wild ${enemyMon.name}'s stats fell!` });
        }
        if (enemyMon.currentHp <= 0) {
            actions.push({ message: `Wild ${enemyMon.name} fainted!`, isFaint: true, target: 'enemy' });
            return actions; // Battle ends immediately
        }

        // --- Enemy Turn ---
        actions.push({ message: `Wild ${enemyMon.name} used ${enemyMove.name}!` });
        const eDamage = DamageCalculator.calculate(enemyMon, playerMon, enemyMove);
        if (eDamage > 0) {
            playerMon.currentHp = Math.max(0, playerMon.currentHp - eDamage);
            actions.push({ message: `It did ${eDamage} damage.`, target: 'player', damage: eDamage });
        }
        if (playerMon.currentHp <= 0) {
            actions.push({ message: `${playerMon.name} fainted!`, isFaint: true, target: 'player' });
        }

        return actions;
    }
}