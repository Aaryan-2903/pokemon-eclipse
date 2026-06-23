export enum StoryFlag {
    INTRO_DONE = 'INTRO_DONE',
    HAS_MET_NOVA = 'HAS_MET_NOVA',
    HAS_CHOSEN_STARTER = 'HAS_CHOSEN_STARTER',
    HAS_RECEIVED_POKEDEX = 'HAS_RECEIVED_POKEDEX',
    HAS_ENTERED_ROUTE_1 = 'HAS_ENTERED_ROUTE_1',
    DEFEATED_GYM1 = 'DEFEATED_GYM1',
    MET_KAI_ROUTE2 = 'MET_KAI_ROUTE2',
    ENCOUNTERED_TEAM_UMBRA_ROUTE2 = 'ENCOUNTERED_TEAM_UMBRA_ROUTE2',
    ENTERED_ECLIPSE_FOREST = 'ENTERED_ECLIPSE_FOREST',
    FOREST_UMBRA_CUTSCENE_SEEN = 'FOREST_UMBRA_CUTSCENE_SEEN',
    DEFEATED_UMBRA_IN_FOREST = 'DEFEATED_UMBRA_IN_FOREST',
    UNLOCKED_ROUTE3 = 'UNLOCKED_ROUTE3',
    DEFEATED_GYM2 = 'DEFEATED_GYM2',
    OBSERVATORY_UMBRA_DEFEATED = 'OBSERVATORY_UMBRA_DEFEATED',
    OBSERVATORY_MYSTERY_SEEN = 'OBSERVATORY_MYSTERY_SEEN',
    SIDEQUEST_FOREST_FLOWER_STARTED = 'SIDEQUEST_FOREST_FLOWER_STARTED',
    SIDEQUEST_FOREST_FLOWER_COMPLETE = 'SIDEQUEST_FOREST_FLOWER_COMPLETE',
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