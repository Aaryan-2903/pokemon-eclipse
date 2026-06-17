import { PokemonInstance } from './PokemonData';
import { Move, Moves } from './Moves';
import { DamageCalculator } from './DamageCalculator';

export interface TurnAction {
    message: string;
    target?: 'player' | 'enemy';
    damage?: number;
    isFaint?: boolean;
    isGameOver?: boolean;
}

export class TurnManager {
    public static processTurn(playerMon: PokemonInstance, playerMoveId: string, enemyMon: PokemonInstance, enemyMoveId: string): TurnAction[] {
        const actions: TurnAction[] = [];
        const playerMove = Moves[playerMoveId];
        const enemyMove = Moves[enemyMoveId];

        // --- Player Turn ---
        actions.push({ message: `${playerMon.name} used ${playerMove.name}!` });
        
        const pResult = DamageCalculator.calculate(playerMon, enemyMon, playerMove);
        if (pResult.damage > 0) {
            enemyMon.currentHp = Math.max(0, enemyMon.currentHp - pResult.damage);
            if (pResult.modifier === 'strong') {
                actions.push({ message: "It's a strong hit!" });
            } else if (pResult.modifier === 'weak') {
                actions.push({ message: "It's a weak hit!" });
            }
            actions.push({ message: `It did ${pResult.damage} damage.`, target: 'enemy', damage: pResult.damage });
        } else if (playerMove.power === 0) {
            actions.push({ message: `Wild ${enemyMon.name}'s stats fell!` });
        }
        if (enemyMon.currentHp <= 0) {
            actions.push({ message: `Wild ${enemyMon.name} fainted!`, isFaint: true, target: 'enemy' });
            return actions; // Battle ends immediately
        }

        // --- Enemy Turn ---
        actions.push({ message: `Wild ${enemyMon.name} used ${enemyMove.name}!` });
        const eResult = DamageCalculator.calculate(enemyMon, playerMon, enemyMove);
        if (eResult.damage > 0) {
            playerMon.currentHp = Math.max(0, playerMon.currentHp - eResult.damage);
            if (eResult.modifier === 'strong') {
                actions.push({ message: "It's a strong hit!" });
            } else if (eResult.modifier === 'weak') {
                actions.push({ message: "It's a weak hit!" });
            }
            actions.push({ message: `It did ${eResult.damage} damage.`, target: 'player', damage: eResult.damage });
        }
        if (playerMon.currentHp <= 0) {
            actions.push({ message: `${playerMon.name} fainted!`, isFaint: true, target: 'player' });
            // No longer immediately game over, handled by BattleScene
            return actions;
        }

        return actions;
    }

    public static processEnemyTurn(playerMon: PokemonInstance, enemyMon: PokemonInstance, enemyMoveId: string): TurnAction[] {
        const actions: TurnAction[] = [];
        const enemyMove = Moves[enemyMoveId];

        actions.push({ message: `Wild ${enemyMon.name} used ${enemyMove.name}!` });
        const eResult = DamageCalculator.calculate(enemyMon, playerMon, enemyMove);
        if (eResult.damage > 0) {
            playerMon.currentHp = Math.max(0, playerMon.currentHp - eResult.damage);
            if (eResult.modifier === 'strong') {
                actions.push({ message: "It's a strong hit!" });
            } else if (eResult.modifier === 'weak') {
                actions.push({ message: "It's a weak hit!" });
            }
            actions.push({ message: `It did ${eResult.damage} damage.`, target: 'player', damage: eResult.damage });
        }
        if (playerMon.currentHp <= 0) {
            actions.push({ message: `${playerMon.name} fainted!`, isFaint: true, target: 'player' });
            // No longer immediately game over, handled by BattleScene
        }

        return actions;
    }
}