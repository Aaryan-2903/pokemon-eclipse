import { PokemonInstance } from './PokemonData';
import { PlayerState } from './PlayerData';

export interface Item {
    id: string;
    name: string;
    description: string;
    price: number;
    canUseInBattle: boolean;
    canUseOutsideBattle: boolean;
    effect: (target: PokemonInstance) => { success: boolean, message: string };
}

export const Items: Record<string, Item> = {
    'Potion': {
        id: 'Potion',
        name: 'Potion',
        description: 'Restores HP by 20 points.',
        price: 300,
        canUseInBattle: true,
        canUseOutsideBattle: true,
        effect: (target) => {
            if (target.currentHp === 0) {
                return { success: false, message: `${target.name} has fainted!` };
            }
            if (target.currentHp >= target.maxHp) {
                return { success: false, message: `${target.name}'s HP is already full!` };
            }
            const healAmount = Math.min(20, target.maxHp - target.currentHp);
            target.currentHp += healAmount;
            return { success: true, message: `${target.name} recovered ${healAmount} HP!` };
        }
    },
    'Super Potion': {
        id: 'Super Potion',
        name: 'Super Potion',
        description: 'Restores HP by 50 points.',
        price: 700,
        canUseInBattle: true,
        canUseOutsideBattle: true,
        effect: (target) => {
            if (target.currentHp === 0) {
                return { success: false, message: `${target.name} has fainted!` };
            }
            if (target.currentHp >= target.maxHp) {
                return { success: false, message: `${target.name}'s HP is already full!` };
            }
            const healAmount = Math.min(50, target.maxHp - target.currentHp);
            target.currentHp += healAmount;
            return { success: true, message: `${target.name} recovered ${healAmount} HP!` };
        }
    },
    'Revive': {
        id: 'Revive',
        name: 'Revive',
        description: 'Revives a fainted Pokémon, restoring half of its maximum HP.',
        price: 1500,
        canUseInBattle: true,
        canUseOutsideBattle: true,
        effect: (target) => {
            if (target.currentHp > 0) {
                return { success: false, message: `${target.name} is not fainted.` };
            }
            target.currentHp = Math.floor(target.maxHp / 2);
            return { success: true, message: `${target.name} was revived!` };
        }
    },
    'Pokeball': {
        id: 'Pokeball',
        name: 'Pokéball',
        description: 'A device for catching wild Pokémon.',
        price: 200,
        canUseInBattle: true,
        canUseOutsideBattle: false,
        effect: () => {
            return { success: false, message: 'Cannot use this here.' };
        }
    }
};

export function useItem(itemId: string, target: PokemonInstance): { success: boolean, message: string } {
    const item = Items[itemId];
    if (!item) return { success: false, message: 'Item not found.' };
    
    const result = item.effect(target);
    if (result.success) {
        PlayerState.inventory[itemId] = (PlayerState.inventory[itemId] || 1) - 1;
        if (PlayerState.inventory[itemId] <= 0) {
            delete PlayerState.inventory[itemId];
        }
    }
    return result;
}