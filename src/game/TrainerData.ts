import { PokemonInstance, generateWildPokemon } from './PokemonData';
import { PlayerState } from './PlayerData';

export interface Trainer {
    id: string;
    name: string;
    spriteKey: string;
    team: PokemonInstance[];
    preBattleDialogue: string;
    postBattleDialogue: string;
    rewardMoney: number;
}

// Function to dynamically generate trainer teams
const createTeam = (specs: { name: string, level: number }[]): PokemonInstance[] => {
    return specs.map(spec => generateWildPokemon(spec.name, spec.level));
};

// Define all trainers in the game
export const Trainers: Record<string, Omit<Trainer, 'team'> & { teamSpec: { name: string, level: number }[] | (() => { name: string, level: number }[]) }> = {
    'route1_joey': {
        id: 'route1_joey',
        name: 'Youngster Joey',
        spriteKey: 'npc_youngster',
        teamSpec: [{ name: 'Rattata', level: 4 }],
        preBattleDialogue: "My Rattata is in the top percentage of all Rattata!",
        postBattleDialogue: "Wow! You're pretty strong!",
        rewardMoney: 100,
    },
    'route1_tim': {
        id: 'route1_tim',
        name: 'Bug Catcher Tim',
        spriteKey: 'npc_bugcatcher',
        teamSpec: [{ name: 'Caterpie', level: 3 }, { name: 'Caterpie', level: 4 }],
        preBattleDialogue: "I love bug Pokémon! Let's battle!",
        postBattleDialogue: "You're a good trainer! My bugs will get stronger!",
        rewardMoney: 120,
    },
    'route1_lass': {
        id: 'route1_lass',
        name: 'Lass Chloe',
        spriteKey: 'npc_traveler', // Using traveler sprite for now
        teamSpec: [{ name: 'Pidgey', level: 5 }, { name: 'Rattata', level: 5 }],
        preBattleDialogue: "You look like a strong trainer. Let's see what you've got!",
        postBattleDialogue: "Wow, you're really good!",
        rewardMoney: 150,
    },
    'route1_hiker_mike': {
        id: 'route1_hiker_mike',
        name: 'Hiker Mike',
        spriteKey: 'npc_traveler', // Using traveler sprite for Hiker
        teamSpec: [{ name: 'Geodude', level: 6 }],
        preBattleDialogue: "A long hike is the best way to train!",
        postBattleDialogue: "You're as tough as a rock!",
        rewardMoney: 180,
    },
    'gym_aurora': {
        id: 'gym_aurora',
        name: 'Gym Leader Aurora',
        spriteKey: 'npc_aurora',
        teamSpec: [{ name: 'Pidgey', level: 10 }, { name: 'Pidgeotto', level: 12 }],
        preBattleDialogue: "Welcome, challenger. I am Aurora, the Gym Leader of Eclipse Town. Show me if your spirit can soar as high as my Pokémon!",
        postBattleDialogue: "Your spirit truly took flight! You've earned this.",
        rewardMoney: 1000,
    },
    'route1_kai': {
        id: 'route1_kai',
        name: 'Rival Kai',
        spriteKey: 'npc_kai',
        teamSpec: () => {
            const playerStarter = PlayerState.starterPokemon || 'Charmander';
            let rivalStarterName = 'Bulbasaur'; // Default if player has Squirtle
            if (playerStarter === 'Bulbasaur') rivalStarterName = 'Charmander';
            if (playerStarter === 'Charmander') rivalStarterName = 'Squirtle';
            return [{ name: rivalStarterName, level: 7 }];
        },
        preBattleDialogue: "Max! Let's see whose Pokémon is stronger!",
        postBattleDialogue: "Hmph! I guess you got lucky this time.",
        rewardMoney: 200,
    },
    'route2_youngster_ben': {
        id: 'route2_youngster_ben',
        name: 'Youngster Ben',
        spriteKey: 'npc_youngster',
        teamSpec: [{ name: 'Spearow', level: 6 }],
        preBattleDialogue: "My Spearow is super fast! Can you keep up?",
        postBattleDialogue: "Whoa, you're good! My Pokémon need more training!",
        rewardMoney: 150,
    },
    'route2_lass_amy': {
        id: 'route2_lass_amy',
        name: 'Lass Amy',
        spriteKey: 'npc_traveler',
        teamSpec: [{ name: 'Oddish', level: 5 }, { name: 'Bellsprout', level: 5 }],
        preBattleDialogue: "My grass Pokémon are ready to battle!",
        postBattleDialogue: "You're stronger than I thought!",
        rewardMoney: 180,
    },
    'route2_bugcatcher_sam': {
        id: 'route2_bugcatcher_sam',
        name: 'Bug Catcher Sam',
        spriteKey: 'npc_bugcatcher',
        teamSpec: [{ name: 'Caterpie', level: 6 }, { name: 'Weedle', level: 6 }],
        preBattleDialogue: "I've caught so many bugs on this route!",
        postBattleDialogue: "My bugs are still the best, even if they lost!",
        rewardMoney: 160,
    },
    'route2_team_umbra_grunt': {
        id: 'route2_team_umbra_grunt',
        name: 'Team Umbra Grunt',
        spriteKey: 'npc_kai', // Placeholder sprite
        teamSpec: [{ name: 'Zubat', level: 8 }],
        preBattleDialogue: "Hmph, another weak trainer. Don't get in our way.",
        postBattleDialogue: "You may have won this battle, but you won't stop Team Umbra!",
        rewardMoney: 250,
    }
};

export const getTrainer = (id: string): Trainer | undefined => {
    const trainerData = Trainers[id];
    if (!trainerData) return undefined;

    const teamSpec = typeof trainerData.teamSpec === 'function' ? trainerData.teamSpec() : trainerData.teamSpec;

    return {
        ...trainerData,
        team: createTeam(teamSpec)
    };
};