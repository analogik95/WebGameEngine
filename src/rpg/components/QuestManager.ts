import { Component } from '../../core/Component';
import { QuestData, QuestDatabase, QuestStatus, ActiveQuest, ObjectiveType } from '../types/Quest';
import { CharacterStats } from './CharacterStats';
import { Inventory } from './Inventory';

/**
 * Quest Manager Component
 * Manages quest tracking, progression, and completion
 */
export class QuestManager extends Component {
  private activeQuests: Map<string, ActiveQuest> = new Map();
  private completedQuests: Set<string> = new Set();
  private stats: CharacterStats | null = null;
  private inventory: Inventory | null = null;

  // Callbacks
  public onQuestStarted?: (quest: QuestData) => void;
  public onQuestCompleted?: (quest: QuestData) => void;
  public onQuestFailed?: (quest: QuestData) => void;
  public onObjectiveCompleted?: (questId: string, objectiveId: string) => void;
  public onQuestProgress?: () => void;

  protected override awake(): void {
    this.stats = this.getComponent(CharacterStats);
    this.inventory = this.getComponent(Inventory);
  }

  /**
   * Start a quest
   */
  startQuest(questId: string): boolean {
    const questData = QuestDatabase.getQuest(questId);
    if (!questData) {
      console.error(`[QuestManager] Quest not found: ${questId}`);
      return false;
    }

    // Check if already active or completed
    if (this.activeQuests.has(questId)) {
      console.warn(`⚠️ Quest "${questData.name}" is already active`);
      return false;
    }

    if (this.completedQuests.has(questId) && questData.type !== 'repeatable') {
      console.warn(`⚠️ Quest "${questData.name}" is already completed`);
      return false;
    }

    // Check requirements
    if (!this.checkRequirements(questData)) {
      console.warn(`⚠️ Requirements not met for quest "${questData.name}"`);
      return false;
    }

    // Create active quest
    const activeQuest: ActiveQuest = {
      quest: questData,
      status: QuestStatus.Active,
      startTime: new Date(),
      objectives: JSON.parse(JSON.stringify(questData.objectives)) // Deep copy
    };

    this.activeQuests.set(questId, activeQuest);

    console.log('╔════════════════════════════════════════╗');
    console.log('║         QUEST STARTED!                 ║');
    console.log('╠════════════════════════════════════════╣');
    console.log(`║ ${questData.name.padEnd(38)}║`);
    console.log(`║ ${questData.description.padEnd(38)}║`);
    console.log('╠════════════════════════════════════════╣');
    console.log('║ Objectives:                            ║');
    questData.objectives.forEach(obj => {
      console.log(`║ • ${obj.description.padEnd(36)}║`);
    });
    console.log('╚════════════════════════════════════════╝');

    this.onQuestStarted?.(questData);
    this.onQuestProgress?.();
    return true;
  }

  /**
   * Update quest progress
   */
  updateProgress(questId: string, objectiveId: string, amount: number = 1): void {
    const activeQuest = this.activeQuests.get(questId);
    if (!activeQuest) return;

    const objective = activeQuest.objectives.find(obj => obj.id === objectiveId);
    if (!objective || objective.completed) return;

    objective.current = Math.min(objective.current + amount, objective.required);

    if (objective.current >= objective.required) {
      objective.completed = true;
      console.log(`✅ Objective completed: ${objective.description}`);
      this.onObjectiveCompleted?.(questId, objectiveId);
    }

    // Check if all objectives are completed
    if (activeQuest.objectives.every(obj => obj.completed)) {
      this.completeQuest(questId);
    } else {
      this.onQuestProgress?.();
    }
  }

  /**
   * Complete a quest
   */
  private completeQuest(questId: string): void {
    const activeQuest = this.activeQuests.get(questId);
    if (!activeQuest) return;

    const quest = activeQuest.quest;

    // Remove from active
    this.activeQuests.delete(questId);

    // Add to completed (unless repeatable)
    if (quest.type !== 'repeatable') {
      this.completedQuests.add(questId);
    }

    // Give rewards
    this.giveRewards(quest);

    console.log('╔════════════════════════════════════════╗');
    console.log('║      QUEST COMPLETED! 🎉               ║');
    console.log('╠════════════════════════════════════════╣');
    console.log(`║ ${quest.name.padEnd(38)}║`);
    console.log('╠════════════════════════════════════════╣');
    console.log('║ Rewards:                               ║');
    if (quest.rewards.exp) {
      console.log(`║ • EXP: +${quest.rewards.exp.toString().padEnd(31)}║`);
    }
    if (quest.rewards.money) {
      console.log(`║ • Money: +${quest.rewards.money.toString().padEnd(28)}║`);
    }
    if (quest.rewards.skillPoints) {
      console.log(`║ • Skill Points: +${quest.rewards.skillPoints.toString().padEnd(21)}║`);
    }
    if (quest.rewards.items) {
      quest.rewards.items.forEach(item => {
        console.log(`║ • ${item.itemId} x${item.quantity}`.padEnd(40) + '║');
      });
    }
    console.log('╚════════════════════════════════════════╝');

    if (quest.completionDialogue) {
      console.log(`💬 ${quest.giver || 'System'}: ${quest.completionDialogue}`);
    }

    this.onQuestCompleted?.(quest);
    this.onQuestProgress?.();
  }

  /**
   * Fail a quest
   */
  failQuest(questId: string): void {
    const activeQuest = this.activeQuests.get(questId);
    if (!activeQuest) return;

    activeQuest.status = QuestStatus.Failed;
    this.activeQuests.delete(questId);

    console.log(`❌ Quest failed: ${activeQuest.quest.name}`);
    this.onQuestFailed?.(activeQuest.quest);
    this.onQuestProgress?.();
  }

  /**
   * Abandon a quest
   */
  abandonQuest(questId: string): void {
    const activeQuest = this.activeQuests.get(questId);
    if (!activeQuest) return;

    this.activeQuests.delete(questId);
    console.log(`🚫 Quest abandoned: ${activeQuest.quest.name}`);
    this.onQuestProgress?.();
  }

  /**
   * Check quest requirements
   */
  private checkRequirements(quest: QuestData): boolean {
    // Check level
    if (quest.requiredLevel && this.stats) {
      if (this.stats.level < quest.requiredLevel) {
        console.warn(`Level ${quest.requiredLevel} required`);
        return false;
      }
    }

    // Check required quests
    if (quest.requiredQuests) {
      for (const reqQuestId of quest.requiredQuests) {
        if (!this.completedQuests.has(reqQuestId)) {
          const reqQuest = QuestDatabase.getQuest(reqQuestId);
          console.warn(`Quest "${reqQuest?.name}" must be completed first`);
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Give quest rewards
   */
  private giveRewards(quest: QuestData): void {
    const rewards = quest.rewards;

    // Give EXP
    if (rewards.exp && this.stats) {
      this.stats.gainExp(rewards.exp);
    }

    // Give money
    if (rewards.money && this.stats) {
      this.stats.money += rewards.money;
    }

    // Give skill points
    if (rewards.skillPoints && this.stats) {
      this.stats.skillPoints += rewards.skillPoints;
    }

    // Give items
    if (rewards.items && this.inventory) {
      rewards.items.forEach(item => {
        this.inventory!.addItem(item.itemId, item.quantity);
      });
    }
  }

  /**
   * Track kill
   */
  trackKill(enemyName: string): void {
    for (const [questId, activeQuest] of this.activeQuests) {
      for (const objective of activeQuest.objectives) {
        if (objective.completed) continue;

        if (objective.type === ObjectiveType.Kill) {
          if (objective.target === 'any' || objective.target.toLowerCase() === enemyName.toLowerCase()) {
            this.updateProgress(questId, objective.id, 1);
          }
        }
      }
    }
  }

  /**
   * Track item collection
   */
  trackCollection(itemId: string, quantity: number = 1): void {
    for (const [questId, activeQuest] of this.activeQuests) {
      for (const objective of activeQuest.objectives) {
        if (objective.completed) continue;

        if (objective.type === ObjectiveType.Collect) {
          if (objective.target === itemId || objective.target === 'any_item') {
            this.updateProgress(questId, objective.id, quantity);
          }
        }
      }
    }
  }

  /**
   * Track skill use
   */
  trackSkillUse(skillName: string): void {
    for (const [questId, activeQuest] of this.activeQuests) {
      for (const objective of activeQuest.objectives) {
        if (objective.completed) continue;

        if (objective.type === ObjectiveType.UseSkill) {
          if (objective.target === skillName || objective.target === 'any_skill') {
            this.updateProgress(questId, objective.id, 1);
          }
        }
      }
    }
  }

  /**
   * Track NPC interaction
   */
  trackTalk(npcName: string): void {
    for (const [questId, activeQuest] of this.activeQuests) {
      for (const objective of activeQuest.objectives) {
        if (objective.completed) continue;

        if (objective.type === ObjectiveType.Talk) {
          if (objective.target.toLowerCase() === npcName.toLowerCase()) {
            this.updateProgress(questId, objective.id, 1);
          }
        }
      }
    }
  }

  /**
   * Get available quests
   */
  getAvailableQuests(): QuestData[] {
    return QuestDatabase.getAllQuests().filter(quest => {
      // Not already active or completed
      if (this.activeQuests.has(quest.id)) return false;
      if (this.completedQuests.has(quest.id) && quest.type !== 'repeatable') return false;

      // Check requirements
      return this.checkRequirements(quest);
    });
  }

  /**
   * Get active quests
   */
  getActiveQuests(): ActiveQuest[] {
    return Array.from(this.activeQuests.values());
  }

  /**
   * Get completed quest IDs
   */
  getCompletedQuests(): string[] {
    return Array.from(this.completedQuests);
  }

  /**
   * Is quest active
   */
  isQuestActive(questId: string): boolean {
    return this.activeQuests.has(questId);
  }

  /**
   * Is quest completed
   */
  isQuestCompleted(questId: string): boolean {
    return this.completedQuests.has(questId);
  }

  /**
   * Get quest by ID
   */
  getQuest(questId: string): ActiveQuest | undefined {
    return this.activeQuests.get(questId);
  }
}
