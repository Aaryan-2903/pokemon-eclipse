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
    },
    'Great Ball': {
        id: 'Great Ball',
        name: 'Great Ball',
        description: 'A good Ball with a higher catch rate than a Pokéball.',
        price: 600,
        canUseInBattle: true,
        canUseOutsideBattle: false,
        effect: () => {
            // The actual catch logic is handled in BattleScene
            return { success: false, message: 'Cannot use this here.' };
        }
    },
    'Max Revive': {
        id: 'Max Revive',
        name: 'Max Revive',
        description: 'Revives a fainted Pokémon, restoring its HP fully.',
        price: 4000,
        canUseInBattle: true,
        canUseOutsideBattle: true,
        effect: (target) => {
            if (target.currentHp > 0) {
                return { success: false, message: `${target.name} is not fainted.` };
            }
            target.currentHp = target.maxHp;
            return { success: true, message: `${target.name} was revived to full health!` };
        }
    },
    'Rare Candy': {
        id: 'Rare Candy',
        name: 'Rare Candy',
        description: 'A candy that is packed with energy. It raises the level of a single Pokémon by one.',
        price: 4800,
        canUseInBattle: false,
        canUseOutsideBattle: true,
        effect: (target) => {
            target.level++;
            // In a real game, you'd call handleLevelUp and manage the evolution scene.
            return { success: true, message: `${target.name} grew to level ${target.level}!` };
        }
    },
    'TM01': {
        id: 'TM01',
        name: 'TM01 - Mega Punch',
        description: 'Teaches a Pokémon the move Mega Punch.',
        price: 3000,
        canUseInBattle: false,
        canUseOutsideBattle: true,
        effect: (target) => {
            // In a real game, you'd check if the Pokémon can learn the move.
            return { success: false, message: `${target.name} can't learn this move.` };
        }
    },
    'Observatory Journal Page #1': {
        id: 'Observatory Journal Page #1', name: 'Journal Page 1', description: 'A dusty page from an old journal.', price: 0, canUseInBattle: false, canUseOutsideBattle: false, effect: () => ({ success: false, message: 'It seems to be a lore item.' })
    },
    'Crumbled Note': {
        id: 'Crumbled Note', name: 'Crumbled Note', description: 'A note dropped by Team Umbra.', price: 0, canUseInBattle: false, canUseOutsideBattle: false, effect: () => ({ success: false, message: 'It seems to be a lore item.' })
    },
    'Rare Flower': {
        id: 'Rare Flower', name: 'Rare Flower', description: 'A beautiful, glowing flower.', price: 0, canUseInBattle: false, canUseOutsideBattle: false, effect: () => ({ success: false, message: 'A botanist might want this.' })
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