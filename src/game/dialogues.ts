export interface DialogueNode {
    speaker: string;
    text: string;
    next?: string;
}

export const Dialogues: Record<string, DialogueNode[]> = {
    'nova_intro': [
        { speaker: 'Professor Nova', text: "Welcome to Eclipse Town, Max.\nStrange things have been happening around the Eclipse Shards." }
    ],
    'kai_intro': [
        { speaker: 'Kai', text: "One day I'll become the strongest trainer in the Eclipse Region." }
    ],
    'nurse_intro': [
        { speaker: 'Nurse', text: "Your Pokémon look healthy today." }
    ],
    'shopkeeper_intro': [
        { speaker: 'Shopkeeper', text: "We'll have plenty of items in stock soon." }
    ]
};