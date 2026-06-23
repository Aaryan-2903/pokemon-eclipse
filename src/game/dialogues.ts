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
    'found_super_potion': [
        { speaker: 'System', text: 'You found a Super Potion!' }
    ],
    'found_revive': [
        { speaker: 'System', text: 'You found a Revive!' }
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
    'player_house_rest_complete': [
        { speaker: 'System', text: 'Your Pokemon had a good rest!' }
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
    'route2_hiker_liam_defeated': [
        { speaker: 'Hiker Liam', text: "You've got grit, kid.", portrait: 'portrait_traveler' }
    ],
    'route2_camper_shane_defeated': [
        { speaker: 'Camper Shane', text: "Whoa, your Pokémon is strong!", portrait: 'portrait_youngster' }
    ],
    'route2_picnicker': [
        { speaker: 'Picnicker', text: "I was going to have a picnic, but I saw some shady people in black coats heading north. It gave me the creeps." }
    ],
    'route2_fork_sign': [
        { speaker: 'Sign', text: '<< West Path: Winding Trail\n>> East Path: To Eclipse Forest' }
    ],
    'route2_team_umbra_grunt': [
        { speaker: 'Team Umbra Grunt', text: "Hmph, another weak trainer. Don't get in our way.", portrait: 'portrait_umbra_grunt' },
        { speaker: 'Team Umbra Grunt', text: "Team Umbra has important work to do here.", portrait: 'portrait_umbra_grunt' }
    ],
    'route2_team_umbra_grunt_defeated': [
        { speaker: 'Team Umbra Grunt', text: "Hmph! You're stronger than you look. But it doesn't matter.", portrait: 'portrait_umbra_grunt' },
        { speaker: 'Team Umbra Grunt', text: "We will gather all the Eclipse Shards, and no one can stop us!", portrait: 'portrait_umbra_grunt' },
        { speaker: 'System', text: 'The grunt dropped something as they fled...' }
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
    ],
    'lunar_route3_locked': [
        { speaker: 'Gate Guard', text: "Route 3 is closed while crews inspect the northern pass." },
        { speaker: 'Gate Guard', text: "Trainers with the Sky Badge may pass. Aurora trusts them to handle the rough road ahead." }
    ],
    'lunar_plaza_gardener': [
        { speaker: 'Gardener', text: "The plaza stays green because everyone in Lunar City helps care for it.", portrait: 'portrait_traveler' }
    ],
    'lunar_fountain_kid': [
        { speaker: 'Kid', text: "I toss coins in the fountain before every trainer battle. It totally works!", portrait: 'portrait_youngster' }
    ],
    'lunar_center_hint': [
        { speaker: 'Nurse', text: "The Pokemon Center is just east of the plaza. Rest before you head south to Route 2.", portrait: 'portrait_nurse' }
    ],
    'lunar_mart_collector': [
        { speaker: 'Collector', text: "Stock up at the Mart before Route 2. The grass gets thick past the south gate.", portrait: 'portrait_bugcatcher' }
    ],
    'lunar_main_street_traveler': [
        { speaker: 'Traveler', text: "Main Street runs straight through the city. If you get lost, find the fountain and follow the road.", portrait: 'portrait_traveler' }
    ],
    'lunar_gym_fan': [
        { speaker: 'Gym Fan', text: "The Gym District is north of the plaza. Aurora's Flying-type Pokemon are graceful and fast.", portrait: 'portrait_youngster' }
    ],
    'lunar_route3_guard_tip': [
        { speaker: 'Cool Guy', text: "The north gate leads to Route 3, but only badge-holders are allowed through right now.", portrait: 'portrait_kai' }
    ],
    'lunar_school_researcher': [
        { speaker: 'Researcher', text: "Trainer School is open to everyone. Smart routing wins battles before the first move is called.", portrait: 'portrait_nova' }
    ],
    'lunar_house_neighbor': [
        { speaker: 'Neighbor', text: "I like living off Main Street. Close to the plaza, close to the shops, and far from wild Pokemon.", portrait: 'portrait_youngster' }
    ],
    'lunar_route1_welcome': [
        { speaker: 'Guide', text: "Route 1 comes in from the west. Follow the stone path and you will hit Green Plaza right away.", portrait: 'portrait_traveler' }
    ],
    'lunar_route2_warning': [
        { speaker: 'Scout', text: "Route 2 starts at the south gate. Stock up before you leave; the road bends toward Eclipse Forest.", portrait: 'portrait_youngster' }
    ],
    'forest_entry': [
        { speaker: 'System', text: "You've entered the Eclipse Forest. The air is thick and still." }
    ],
    'forest_entrance_sign': [
        { speaker: 'Sign', text: 'Eclipse Forest\nBeware of getting lost.' }
    ],
    'forest_bug_catcher_dave_defeated': [
        { speaker: 'Bug Catcher Dave', text: "My bugs need more training!", portrait: 'portrait_bugcatcher' }
    ],
    'forest_hiker_barry_defeated': [
        { speaker: 'Hiker Barry', text: "Tough battle! You must be on the right path.", portrait: 'portrait_traveler' }
    ],
    'forest_lost_child': [
        { speaker: 'Lost Child', text: "I can't find my way back... I saw some scary people in black coats go deeper into the forest." }
    ],
    'forest_explorer': [
        { speaker: 'Explorer', text: "This forest is a maze! I heard a rumor of a hidden clearing where rare Pokémon gather." }
    ],
    'forest_umbra_cutscene': [
        { speaker: 'Scientist', text: "The Eclipse Shard is responding.", portrait: 'portrait_traveler' },
        { speaker: 'Team Umbra Grunt', text: "Our leader will be pleased.", portrait: 'portrait_umbra_grunt' },
        { speaker: 'Scientist', text: "We are close to unlocking its power.", portrait: 'portrait_traveler' },
        { speaker: 'Scientist', text: "Wait... someone's here!", portrait: 'portrait_traveler' },
    ],
    'forest_umbra_grunt_1_prebattle': [
        { speaker: 'Team Umbra Grunt', text: "You shouldn't be here.", portrait: 'portrait_umbra_grunt' },
        { speaker: 'Team Umbra Grunt', text: "I'll make sure you forget what you saw!", portrait: 'portrait_umbra_grunt' }
    ],
    'forest_umbra_intro': [
        { speaker: 'Team Umbra Grunt', text: "You again! Meddling kids have no place here!", portrait: 'portrait_umbra_grunt' },
        { speaker: 'Team Umbra Grunt', text: "We're searching for Eclipse Shards, and you won't interfere!", portrait: 'portrait_umbra_grunt' }
    ],
    'forest_umbra_grunt_1_defeated': [
        { speaker: 'Team Umbra Grunt', text: "Argh! How are you so strong?!", portrait: 'portrait_umbra_grunt' },
        { speaker: 'Team Umbra Grunt', text: "This won't stop us! Retreat!", portrait: 'portrait_umbra_grunt' },
        { speaker: 'System', text: 'The Scientist vanished in the confusion. The Grunt dropped something as they fled...' }
    ],
    'forest_umbra_equipment': [
        { speaker: 'System', text: "It's a strange device, humming with a faint energy. It seems to be of Team Umbra origin." }
    ],
    'route3_entry': [
        { speaker: 'System', text: "You've entered Route 3. The path ahead is clear." }
    ],
    'route3_sign': [
        { speaker: 'Sign', text: 'Route 3\nNorth: Veridia City\nSouth: Eclipse Forest' }
    ],
    'route3_youngster_toby_defeated': [
        { speaker: 'Youngster Toby', text: "I'll get stronger, just you wait!", portrait: 'portrait_youngster' }
    ],
    'route3_hiker': [
        { speaker: 'Hiker', text: "Veridia City is just ahead. It's a beautiful city surrounded by nature." }
    ],
    'route3_lass': [
        { speaker: 'Lass', text: "I heard the Gym Leader in Veridia City uses Grass-type Pokémon." }
    ],
    'veridia_city_entry': [
        { speaker: 'System', text: "You've arrived in Veridia City. The air is fresh and green." }
    ],
    'veridia_city_sign': [
        { speaker: 'Sign', text: 'Welcome to Veridia City!\nThe Green Jewel' }
    ],
    'veridia_citizen_1': [
        { speaker: 'Citizen', text: "This city is known for its beautiful gardens and the Grass-type Gym." }
    ],
    'veridia_citizen_2': [
        { speaker: 'Citizen', text: "Gym Leader Lily is very kind, but her Pokémon are tough!" }
    ],
    'veridia_citizen_3': [
        { speaker: 'Citizen', text: "The Pokémon Center here is always busy with trainers preparing for the Gym." }
    ],
    'gym_lily_intro': [
        { speaker: 'Gym Leader Lily', text: "Welcome to my Gym, challenger. I am Lily, and my Grass-type Pokémon are ready to test your bond!", portrait: 'portrait_nova' } // Using Nova's portrait as placeholder
    ],
    'gym_lily_victory': [
        { speaker: 'Gym Leader Lily', text: "Your growth is truly remarkable! You've earned this badge.", portrait: 'portrait_nova' },
        { speaker: 'System', text: "You received the Grass Badge!" },
        { speaker: 'Gym Leader Lily', text: "With this, you can now use the move Cut outside of battle! (Placeholder)", portrait: 'portrait_nova' }
    ]
};
