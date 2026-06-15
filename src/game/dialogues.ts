export interface DialogueNode {
    speaker: string;
    text: string;
    portrait?: string;
    next?: string;
}

export const Dialogues: Record<string, DialogueNode[]> = {
    'home_intro': [
        { speaker: 'System', text: "Message from Professor Nova:\n'Max, please come to my lab! It is urgent.'" }
    ],
    'nova_lab_intro': [
        { speaker: 'Professor Nova', text: "Welcome, Max.", portrait: 'portrait_nova' },
        { speaker: 'Professor Nova', text: "The Eclipse Shards have become active again.", portrait: 'portrait_nova' },
        { speaker: 'Professor Nova', text: "Something unusual is happening across the region.", portrait: 'portrait_nova' },
        { speaker: 'Professor Nova', text: "I need a capable trainer to help investigate.", portrait: 'portrait_nova' },
        { speaker: 'Professor Nova', text: "Before you begin your journey, choose a partner Pokémon.", portrait: 'portrait_nova' }
    ],
    'nova_give_pokedex': [
        { speaker: 'Professor Nova', text: "Take this Pokédex.", portrait: 'portrait_nova' },
        { speaker: 'Professor Nova', text: "It will help you document Pokémon across the Eclipse Region.", portrait: 'portrait_nova' }
    ],
    'nova_intro': [
        { speaker: 'Professor Nova', text: "Welcome to Eclipse Town, Max.", portrait: 'portrait_nova' },
        { speaker: 'Professor Nova', text: "The Eclipse Shards have been behaving strangely lately.", portrait: 'portrait_nova' },
        { speaker: 'Professor Nova', text: "I have a feeling something big is coming.", portrait: 'portrait_nova' }
    ],
    'kai_intro': [
        { speaker: 'Kai', text: "Hey Max!", portrait: 'portrait_kai' },
        { speaker: 'Kai', text: "I'm going to become the strongest trainer in the Eclipse Region.", portrait: 'portrait_kai' },
        { speaker: 'Kai', text: "You better keep up.", portrait: 'portrait_kai' }
    ],
    'nurse_intro': [
        { speaker: 'Nurse', text: "Welcome to the Pokémon Center.", portrait: 'portrait_nurse' },
        { speaker: 'Nurse', text: "We'll be able to heal your Pokémon once your journey begins.", portrait: 'portrait_nurse' }
    ],
    'shopkeeper_intro': [
        { speaker: 'Shopkeeper', text: "Our shelves are still being stocked.", portrait: 'portrait_shopkeeper' },
        { speaker: 'Shopkeeper', text: "Come back soon.", portrait: 'portrait_shopkeeper' }
    ],
    'route1_youngster': [
        { speaker: 'Youngster', text: "I like wearing shorts! They're comfy and easy to wear!", portrait: 'portrait_youngster' }
    ],
    'route1_joey_defeated': [
        { speaker: 'Youngster Joey', text: "My Rattata will be stronger next time!", portrait: 'portrait_youngster' }
    ],
    'route1_kai_defeated': [
        { speaker: 'Rival Kai', text: "This isn't over, Max. I'll be back.", portrait: 'portrait_kai' }
    ],
    'route1_bugcatcher': [
        { speaker: 'Bug Catcher', text: "I'm looking for rare bugs in the tall grass.", portrait: 'portrait_bugcatcher' },
        { speaker: 'Bug Catcher', text: "Be careful, wild Pokémon will jump out at you if you walk through it!", portrait: 'portrait_bugcatcher' }
    ],
    'route1_traveler': [
        { speaker: 'Traveler', text: "I've been traveling across the Eclipse Region.", portrait: 'portrait_traveler' },
        { speaker: 'Traveler', text: "The sky has been looking strange lately, hasn't it?", portrait: 'portrait_traveler' }
    ]
};