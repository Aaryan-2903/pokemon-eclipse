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
    'nova_give_items': [
        { speaker: 'Professor Nova', text: "It's dangerous to go alone! Take these.", portrait: 'portrait_nova' },
        { speaker: 'System', text: 'You received 5 Pokéballs and 2 Potions!' }
    ],
    'found_potion': [
        { speaker: 'System', text: 'You found a Potion!' }
    ],
    'found_pokeball': [
        { speaker: 'System', text: 'You found a Pokéball!' }
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
    'nurse_center_welcome': [
        { speaker: 'Nurse', text: "Welcome to our Pokémon Center. We can heal your Pokémon to perfect health.", portrait: 'portrait_nurse' },
        { speaker: 'Nurse', text: "Okay, I'll take your Pokémon for a few seconds.", portrait: 'portrait_nurse' }
    ],
    'nurse_center_complete': [
        { speaker: 'Nurse', text: "All done! Your Pokémon are fighting fit.", portrait: 'portrait_nurse' },
        { speaker: 'Nurse', text: "We hope to see you again!", portrait: 'portrait_nurse' }
    ],
    'shopkeeper_menu': [
        { speaker: 'Shopkeeper', text: "Welcome to the Poké Mart! How can I help you today?", portrait: 'portrait_shopkeeper' }
    ],
    'route1_youngster': [
        { speaker: 'Youngster', text: "I like wearing shorts! They're comfy and easy to wear!", portrait: 'portrait_youngster' }
    ],
    'route1_lass_defeated': [
        { speaker: 'Lass Chloe', text: "Aww, I lost!", portrait: 'portrait_traveler' }
    ],
    'route1_joey_defeated': [
        { speaker: 'Youngster Joey', text: "My Rattata will be stronger next time!", portrait: 'portrait_youngster' }
    ],
    'route1_kai_defeated': [
        { speaker: 'Rival Kai', text: "This isn't over, Max. I'll be back.", portrait: 'portrait_kai' }
    ],
    'route1_tim_defeated': [
        { speaker: 'Bug Catcher Tim', text: "You're a good trainer! My bugs will get stronger!", portrait: 'portrait_bugcatcher' }
    ],
    'route1_hiker_mike_defeated': [
        { speaker: 'Hiker Mike', text: "My Pokémon need to be as tough as rocks.", portrait: 'portrait_traveler' }
    ],
    'gym_aurora_defeated': [
        { speaker: 'Aurora', text: "That was a wonderful battle. Your bond with your Pokémon is clear.", portrait: 'portrait_aurora' }
    ],
    'gym_aurora_victory': [
        { speaker: 'Aurora', text: "You have proven your worth. As a symbol of your victory, I present you with the Sky Badge!", portrait: 'portrait_aurora' },
        { speaker: 'System', text: "You received the Sky Badge!" },
        { speaker: 'Aurora', text: "Also, please take this. It's a Technical Machine. It can teach a Pokémon a new move.", portrait: 'portrait_aurora' },
        { speaker: 'System', text: "You received a TM! (Placeholder)" }
    ],
    'route1_bugcatcher': [
        { speaker: 'Bug Catcher', text: "I'm looking for rare bugs in the tall grass.", portrait: 'portrait_bugcatcher' },
        { speaker: 'Bug Catcher', text: "Be careful, wild Pokémon will jump out at you if you walk through it!", portrait: 'portrait_bugcatcher' }
    ],
    'route1_traveler': [
        { speaker: 'Traveler', text: "I've been traveling across the Eclipse Region.", portrait: 'portrait_traveler' },
        { speaker: 'Traveler', text: "The sky has been looking strange lately, hasn't it?", portrait: 'portrait_traveler' }
    ],
    'route1_hiker': [
        { speaker: 'Hiker', text: "This route is long, but the view from Lunar City is worth it." }
    ],
    'route1_sign_west': [
        { speaker: 'Sign', text: 'West Path: Scenic Route' }
    ],
    'route1_sign_east': [
        { speaker: 'Sign', text: 'East Path: Quicker, but beware of strong trainers.' }
    ],
    'route1_kid': [
        { speaker: 'Kid', text: "I'm trying to catch a Pidgey! They're super fast." }
    ],
    'route1_collector': [
        { speaker: 'Collector', text: "I heard there are rare items hidden on this route if you look carefully." }
    ],
    'route1_scientist': [
        { speaker: 'Scientist', text: "The biodiversity on this route is fascinating. So many different species in one place." }
    ],
    'kai_route2_encounter': [
        { speaker: 'Kai', text: "Max! So you beat Aurora. Don't get cocky.", portrait: 'portrait_kai' },
        { speaker: 'Kai', text: "I was just heading to the Eclipse Forest, but some weirdos in black are blocking the way.", portrait: 'portrait_kai' },
        { speaker: 'Kai', text: "They call themselves 'Team Umbra'. Sounds lame. I'm going to check it out. See you around!", portrait: 'portrait_kai' }
    ],
    'route2_youngster_ben': [
        { speaker: 'Youngster', text: "This route is full of strong trainers! Are you one of them?", portrait: 'portrait_youngster' }
    ],
    'route2_youngster_ben_defeated': [
        { speaker: 'Youngster', text: "My Spearow needs to fly faster!", portrait: 'portrait_youngster' }
    ],
    'route2_lass_amy': [
        { speaker: 'Lass', text: "My Pokémon love the sun on Route 2!", portrait: 'portrait_traveler' }
    ],
    'route2_lass_amy_defeated': [
        { speaker: 'Lass', text: "Aww, my plants wilted!", portrait: 'portrait_traveler' }
    ],
    'route2_bugcatcher_sam': [
        { speaker: 'Bug Catcher', text: "Route 2 is a great place for bug Pokémon!", portrait: 'portrait_bugcatcher' }
    ],
    'route2_bugcatcher_sam_defeated': [
        { speaker: 'Bug Catcher', text: "My bugs will evolve and be stronger next time!", portrait: 'portrait_bugcatcher' }
    ],
    'route2_hiker': [
        { speaker: 'Hiker', text: "I heard there's a hidden cave somewhere on this route." }
    ],
    'route2_camper': [
        { speaker: 'Camper', text: "The wild Pokémon here are tougher than on Route 1." }
    ],
    'route2_fisher': [
        { speaker: 'Fisherman', text: "The river here has some rare water Pokémon." }
    ],
    'route2_team_umbra_grunt': [
        { speaker: 'Team Umbra Grunt', text: "Hmph, another weak trainer. Don't get in our way.", portrait: 'portrait_umbra_grunt' },
        { speaker: 'Team Umbra Grunt', text: "Team Umbra has important work to do here.", portrait: 'portrait_umbra_grunt' }
    ],
    'route2_team_umbra_grunt_defeated': [
        { speaker: 'Team Umbra Grunt', text: "You may have won this battle, but you won't stop Team Umbra!", portrait: 'portrait_umbra_grunt' }
    ],
    'route1_veteran': [
        { speaker: 'Veteran Trainer', text: "A true trainer knows the journey is more important than the destination." }
    ],
    'eclipse_citizen_1': [
        { speaker: 'Townsfolk', text: "It's a quiet town, but we like it that way." }
    ],
    'lunar_citizen_1': [
        { speaker: 'Scientist', text: "Lunar City is famous for its advanced research facilities.", portrait: 'portrait_traveler' }
    ],
    'lunar_citizen_2': [
        { speaker: 'Aspiring Trainer', text: "The Gym Leader here, Aurora, is a master of Flying-type Pokémon.", portrait: 'portrait_youngster' }
    ],
    'lunar_citizen_3': [ { speaker: 'Bug Enthusiast', text: "I came all the way from Viridian Forest to see the bugs here." } ],
    'lunar_citizen_4': [ { speaker: 'Off-duty Nurse', text: "Even when I'm not at the Center, I worry about trainers and their Pokémon." } ],
    'lunar_citizen_5': [ { speaker: 'Cool Guy', text: "This city is the place to be if you want to get strong." } ],
    'lunar_citizen_6': [ { speaker: 'Kid', text: "The Trainer School is tough, but I'm learning a lot!" } ],
    'lunar_citizen_7': [ { speaker: 'Tourist', text: "I'm just here to see the sights. The Gym building is impressive!" } ],
    'lunar_citizen_8': [ { speaker: 'Collector', text: "The Poké Mart here has a great selection." } ],
    'lunar_citizen_9': [ { speaker: 'Student', text: "I'm studying to be a Pokémon Professor, just like Professor Nova." } ],
    'lunar_citizen_10': [ { speaker: 'Researcher', text: "We're studying the effects of lunar cycles on Pokémon evolution." }
    ]
};