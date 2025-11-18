/**
 * Quest System
 * Defines quests, objectives, and rewards
 */

export enum QuestType {
  Main = 'main',
  Side = 'side',
  Daily = 'daily',
  Repeatable = 'repeatable'
}

export enum QuestStatus {
  NotStarted = 'not_started',
  Active = 'active',
  Completed = 'completed',
  Failed = 'failed'
}

export enum ObjectiveType {
  Kill = 'kill',
  Collect = 'collect',
  Talk = 'talk',
  Reach = 'reach',
  UseSkill = 'use_skill',
  Escort = 'escort'
}

export interface QuestObjective {
  id: string;
  type: ObjectiveType;
  description: string;
  target: string; // monster name, item id, NPC name, location, etc.
  current: number;
  required: number;
  completed: boolean;
}

export interface QuestReward {
  exp?: number;
  money?: number;
  items?: { itemId: string; quantity: number }[];
  skillPoints?: number;
}

export interface QuestData {
  id: string;
  name: string;
  description: string;
  type: QuestType;
  level: number; // Recommended level

  // Requirements
  requiredLevel?: number;
  requiredQuests?: string[]; // Quest IDs that must be completed first

  // Quest giver
  giver?: string; // NPC name
  giverDialogue?: string;

  // Objectives
  objectives: QuestObjective[];

  // Rewards
  rewards: QuestReward;

  // Completion
  completionDialogue?: string;
  completionLocation?: string; // Where to turn in
}

/**
 * Active Quest Instance
 */
export interface ActiveQuest {
  quest: QuestData;
  status: QuestStatus;
  startTime: Date;
  objectives: QuestObjective[];
  progressData?: any;
}

/**
 * Quest Database
 */
export class QuestDatabase {
  private static quests: Map<string, QuestData> = new Map();

  static registerQuest(quest: QuestData): void {
    this.quests.set(quest.id, quest);
  }

  static getQuest(id: string): QuestData | undefined {
    return this.quests.get(id);
  }

  static getAllQuests(): QuestData[] {
    return Array.from(this.quests.values());
  }

  static getQuestsByType(type: QuestType): QuestData[] {
    return this.getAllQuests().filter(q => q.type === type);
  }

  /**
   * Initialize default quests
   */
  static initializeDefaultQuests(): void {
    // Main Quest 1: Awakening
    this.registerQuest({
      id: 'awakening',
      name: 'The Awakening',
      description: 'Something strange has happened. You now see the world like a game. Test your new abilities.',
      type: QuestType.Main,
      level: 1,
      giver: 'System',
      giverDialogue: '🎮 You have awakened the Gamer ability! The world is now your game.',
      objectives: [
        {
          id: 'check_stats',
          type: ObjectiveType.Talk,
          description: 'Check your status window',
          target: 'status',
          current: 0,
          required: 1,
          completed: false
        },
        {
          id: 'test_observe',
          type: ObjectiveType.UseSkill,
          description: 'Use Observe skill on an object',
          target: 'observe',
          current: 0,
          required: 1,
          completed: false
        },
        {
          id: 'kill_first_enemy',
          type: ObjectiveType.Kill,
          description: 'Defeat your first enemy',
          target: 'any',
          current: 0,
          required: 1,
          completed: false
        }
      ],
      rewards: {
        exp: 100,
        money: 50,
        skillPoints: 1
      },
      completionDialogue: 'You\'re getting the hang of this! More challenges await.'
    });

    // Main Quest 2: First Steps
    this.registerQuest({
      id: 'first_steps',
      name: 'First Steps',
      description: 'Babushka seems worried about the zombies near her garden. Help her clear them out.',
      type: QuestType.Main,
      level: 1,
      requiredQuests: ['awakening'],
      giver: 'Babushka',
      giverDialogue: 'Anatoly, dear! Those awful zombies are back. Can you help your old Babushka?',
      objectives: [
        {
          id: 'talk_to_babushka',
          type: ObjectiveType.Talk,
          description: 'Talk to Babushka',
          target: 'babushka',
          current: 0,
          required: 1,
          completed: false
        },
        {
          id: 'clear_zombies',
          type: ObjectiveType.Kill,
          description: 'Clear zombies from the garden',
          target: 'zombie',
          current: 0,
          required: 5,
          completed: false
        },
        {
          id: 'collect_essence',
          type: ObjectiveType.Collect,
          description: 'Collect zombie essence',
          target: 'zombie_essence',
          current: 0,
          required: 3,
          completed: false
        },
        {
          id: 'return_to_babushka',
          type: ObjectiveType.Talk,
          description: 'Return to Babushka',
          target: 'babushka',
          current: 0,
          required: 1,
          completed: false
        }
      ],
      rewards: {
        exp: 250,
        money: 100,
        items: [
          { itemId: 'health_potion', quantity: 5 },
          { itemId: 'mana_potion', quantity: 3 }
        ]
      },
      completionDialogue: 'Thank you so much, dear! Here, take these potions. You\'ll need them.'
    });

    // Side Quest: The Rusty Blade
    this.registerQuest({
      id: 'rusty_blade',
      name: 'The Rusty Blade',
      description: 'Find a better weapon than your bare fists.',
      type: QuestType.Side,
      level: 1,
      objectives: [
        {
          id: 'find_weapon',
          type: ObjectiveType.Collect,
          description: 'Find or buy a weapon',
          target: 'any_weapon',
          current: 0,
          required: 1,
          completed: false
        },
        {
          id: 'equip_weapon',
          type: ObjectiveType.UseSkill,
          description: 'Equip the weapon',
          target: 'equip',
          current: 0,
          required: 1,
          completed: false
        }
      ],
      rewards: {
        exp: 50,
        money: 25
      }
    });

    // Side Quest: Gathering Materials
    this.registerQuest({
      id: 'gather_materials',
      name: 'Gathering Materials',
      description: 'Collect materials from defeated enemies.',
      type: QuestType.Side,
      level: 2,
      objectives: [
        {
          id: 'collect_claws',
          type: ObjectiveType.Collect,
          description: 'Collect monster claws',
          target: 'monster_claw',
          current: 0,
          required: 10,
          completed: false
        },
        {
          id: 'collect_ore',
          type: ObjectiveType.Collect,
          description: 'Collect iron ore',
          target: 'iron_ore',
          current: 0,
          required: 5,
          completed: false
        }
      ],
      rewards: {
        exp: 150,
        money: 75,
        items: [
          { itemId: 'iron_sword', quantity: 1 }
        ]
      }
    });

    // Daily Quest: Training
    this.registerQuest({
      id: 'daily_training',
      name: 'Daily Training',
      description: 'Complete your daily training regimen.',
      type: QuestType.Daily,
      level: 1,
      objectives: [
        {
          id: 'defeat_enemies',
          type: ObjectiveType.Kill,
          description: 'Defeat 10 enemies',
          target: 'any',
          current: 0,
          required: 10,
          completed: false
        },
        {
          id: 'use_skills',
          type: ObjectiveType.UseSkill,
          description: 'Use skills 20 times',
          target: 'any_skill',
          current: 0,
          required: 20,
          completed: false
        }
      ],
      rewards: {
        exp: 200,
        money: 50,
        skillPoints: 1
      }
    });

    // Repeatable Quest: Zombie Hunter
    this.registerQuest({
      id: 'zombie_hunter',
      name: 'Zombie Hunter',
      description: 'The zombies keep coming back. Keep them at bay.',
      type: QuestType.Repeatable,
      level: 1,
      giver: 'Babushka',
      objectives: [
        {
          id: 'kill_zombies',
          type: ObjectiveType.Kill,
          description: 'Defeat zombies',
          target: 'zombie',
          current: 0,
          required: 10,
          completed: false
        }
      ],
      rewards: {
        exp: 100,
        money: 50,
        items: [
          { itemId: 'health_potion', quantity: 2 }
        ]
      }
    });

    // Main Quest 3: ID Create
    this.registerQuest({
      id: 'id_create_tutorial',
      name: 'Instant Dungeon',
      description: 'Learn to create your first instant dungeon.',
      type: QuestType.Main,
      level: 3,
      requiredLevel: 3,
      requiredQuests: ['first_steps'],
      giver: 'System',
      giverDialogue: '🎮 New ability unlocked: ID Create! You can now create instant dungeons.',
      objectives: [
        {
          id: 'create_dungeon',
          type: ObjectiveType.UseSkill,
          description: 'Create an instant dungeon',
          target: 'id_create',
          current: 0,
          required: 1,
          completed: false
        },
        {
          id: 'clear_dungeon',
          type: ObjectiveType.Kill,
          description: 'Clear the dungeon',
          target: 'dungeon_boss',
          current: 0,
          required: 1,
          completed: false
        },
        {
          id: 'escape_dungeon',
          type: ObjectiveType.UseSkill,
          description: 'Escape the dungeon',
          target: 'id_escape',
          current: 0,
          required: 1,
          completed: false
        }
      ],
      rewards: {
        exp: 500,
        money: 200,
        skillPoints: 2,
        items: [
          { itemId: 'iron_sword', quantity: 1 },
          { itemId: 'leather_chest', quantity: 1 }
        ]
      },
      completionDialogue: 'Excellent work! Instant dungeons will be a valuable training tool.'
    });

    console.log(`✅ Initialized ${this.quests.size} quests in database`);
  }
}

// Initialize quests on module load
QuestDatabase.initializeDefaultQuests();
