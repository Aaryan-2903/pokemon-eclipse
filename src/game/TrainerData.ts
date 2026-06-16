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