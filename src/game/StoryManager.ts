export enum StoryFlag {
    INTRO_DONE = 'INTRO_DONE',
    HAS_MET_NOVA = 'HAS_MET_NOVA',
    HAS_CHOSEN_STARTER = 'HAS_CHOSEN_STARTER',
    HAS_RECEIVED_POKEDEX = 'HAS_RECEIVED_POKEDEX',
    HAS_ENTERED_ROUTE_1 = 'HAS_ENTERED_ROUTE_1',
    HAS_BATTLED_KAI = 'HAS_BATTLED_KAI',
    UMBRA_FIRST_ENCOUNTER = 'UMBRA_FIRST_ENCOUNTER'
}

export class StoryManager {
    private flags: Set<StoryFlag> = new Set();
    private activeQuest: string | null = null;
    private activeCutscene: string | null = null;

    private static instance: StoryManager;

    public static getInstance(): StoryManager {
        if (!StoryManager.instance) {
            StoryManager.instance = new StoryManager();
        }
        return StoryManager.instance;
    }

    public setFlag(flag: StoryFlag) {
        this.flags.add(flag);
    }

    public hasFlag(flag: StoryFlag): boolean {
        return this.flags.has(flag);
    }

    public getFlags(): Set<StoryFlag> {
        return this.flags;
    }

    public setFlags(flags: Set<StoryFlag>) {
        this.flags = flags;
    }

    public setActiveQuest(questId: string | null) {
        this.activeQuest = questId;
    }

    public getActiveQuest(): string | null {
        return this.activeQuest;
    }

    public isCutsceneActive(): boolean {
        return this.activeCutscene !== null;
    }
}