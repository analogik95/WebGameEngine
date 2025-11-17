/**
 * The Gamer RPG - Special Gamer Abilities
 * Observe, ID Create, ID Escape, etc.
 */

import { GameObject } from '../../core/GameObject';

export interface ObserveData {
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  mp?: number;
  maxMp?: number;
  description: string;
  threat: 'none' | 'low' | 'medium' | 'high' | 'extreme';
  drops?: string[];
  weaknesses?: string[];
  resistances?: string[];
}

export enum DungeonType {
  EmptyZone = 'empty_zone',
  ZombieZone = 'zombie_zone',
  GoblinCave = 'goblin_cave',
  ShadowRealm = 'shadow_realm'
}

export interface DungeonInfo {
  type: DungeonType;
  name: string;
  description: string;
  mpCost: number;
  minLevel: number;
  recommendedLevel: number;
}

export class GamerAbilities {
  private observeLevel: number = 1;
  private idCreateLevel: number = 1;
  private currentDungeon: DungeonType | null = null;
  private inDungeon: boolean = false;

  // ========================================================================
  // Observe Ability
  // ========================================================================

  observe(target: GameObject | any): ObserveData | null {
    // Get target data (this will be expanded to query from server/scene)
    const observeData = this.analyzeTarget(target);

    if (!observeData) {
      return null;
    }

    // Higher Observe level reveals more information
    if (this.observeLevel < 3) {
      // Low level: Hide some details
      observeData.drops = undefined;
      observeData.weaknesses = undefined;
      observeData.resistances = undefined;
    }

    return observeData;
  }

  private analyzeTarget(target: any): ObserveData | null {
    // This is a mock implementation
    // In a real game, this would query the target's actual stats

    if (target.type === 'npc' || target.type === 'player') {
      return {
        name: target.name || 'Unknown',
        level: target.level || 1,
        hp: target.hp || 100,
        maxHp: target.maxHp || 100,
        mp: target.mp,
        maxMp: target.maxMp,
        description: target.description || 'A person.',
        threat: this.calculateThreat(target.level || 1),
        drops: target.drops,
        weaknesses: target.weaknesses,
        resistances: target.resistances
      };
    }

    if (target.type === 'enemy' || target.type === 'monster') {
      return {
        name: target.name || 'Monster',
        level: target.level || 1,
        hp: target.hp || 50,
        maxHp: target.maxHp || 50,
        description: target.description || 'A hostile creature.',
        threat: this.calculateThreat(target.level || 1),
        drops: target.drops,
        weaknesses: target.weaknesses,
        resistances: target.resistances
      };
    }

    return null;
  }

  private calculateThreat(targetLevel: number): 'none' | 'low' | 'medium' | 'high' | 'extreme' {
    // This would compare to player level in real implementation
    const playerLevel = 1; // Mock player level

    const levelDiff = targetLevel - playerLevel;

    if (levelDiff <= -10) return 'none';
    if (levelDiff <= -5) return 'low';
    if (levelDiff <= 2) return 'medium';
    if (levelDiff <= 10) return 'high';
    return 'extreme';
  }

  levelUpObserve(): void {
    if (this.observeLevel < 10) {
      this.observeLevel++;
      console.log(`📊 Observe leveled up to ${this.observeLevel}!`);
    }
  }

  // ========================================================================
  // Instant Dungeon System
  // ========================================================================

  getDungeonTypes(): DungeonInfo[] {
    return [
      {
        type: DungeonType.EmptyZone,
        name: 'Empty Zone',
        description: 'Safe practice area with no monsters',
        mpCost: 50,
        minLevel: 1,
        recommendedLevel: 1
      },
      {
        type: DungeonType.ZombieZone,
        name: 'Zombie Zone',
        description: 'Abandoned building filled with zombies',
        mpCost: 50,
        minLevel: 1,
        recommendedLevel: 5
      },
      {
        type: DungeonType.GoblinCave,
        name: 'Goblin Cave',
        description: 'Underground cave system inhabited by goblins',
        mpCost: 100,
        minLevel: 10,
        recommendedLevel: 15
      },
      {
        type: DungeonType.ShadowRealm,
        name: 'Shadow Realm',
        description: 'Distorted reality filled with shadow creatures',
        mpCost: 150,
        minLevel: 20,
        recommendedLevel: 25
      }
    ];
  }

  canCreateDungeon(dungeonType: DungeonType, playerLevel: number, playerMp: number): { canCreate: boolean; reason?: string } {
    const dungeonInfo = this.getDungeonTypes().find(d => d.type === dungeonType);

    if (!dungeonInfo) {
      return { canCreate: false, reason: 'Unknown dungeon type' };
    }

    if (playerLevel < dungeonInfo.minLevel) {
      return { canCreate: false, reason: `Requires level ${dungeonInfo.minLevel}` };
    }

    if (playerMp < dungeonInfo.mpCost) {
      return { canCreate: false, reason: `Not enough MP (need ${dungeonInfo.mpCost})` };
    }

    if (this.inDungeon) {
      return { canCreate: false, reason: 'Already in a dungeon' };
    }

    return { canCreate: true };
  }

  createDungeon(dungeonType: DungeonType): boolean {
    if (this.inDungeon) {
      console.warn('Already in a dungeon!');
      return false;
    }

    this.currentDungeon = dungeonType;
    this.inDungeon = true;

    console.log(`🌀 Creating Instant Dungeon: ${dungeonType}`);

    return true;
  }

  escapeDungeon(): boolean {
    if (!this.inDungeon) {
      console.warn('Not in a dungeon!');
      return false;
    }

    console.log(`🚪 Escaping from dungeon...`);

    this.currentDungeon = null;
    this.inDungeon = false;

    return true;
  }

  isInDungeon(): boolean {
    return this.inDungeon;
  }

  getCurrentDungeon(): DungeonType | null {
    return this.currentDungeon;
  }

  levelUpIDCreate(): void {
    if (this.idCreateLevel < 10) {
      this.idCreateLevel++;
      console.log(`🌀 ID Create leveled up to ${this.idCreateLevel}!`);
    }
  }

  // ========================================================================
  // Gamer's Mind (Passive)
  // ========================================================================

  /**
   * Gamer's Mind: Prevents panic, fear, and confusion
   * This is a passive ability that's always active
   */
  gamersMind(): boolean {
    // In a real implementation, this would grant immunity to certain status effects
    return true;
  }

  // ========================================================================
  // Gamer's Body (Passive)
  // ========================================================================

  /**
   * Gamer's Body: Treat the body like a game character
   * - Sleep restores HP/MP
   * - No exhaustion (stamina = game mechanic only)
   * - Clean and fresh even after fighting
   */
  gamersBody(action: 'sleep' | 'rest'): { hpRestored: number; mpRestored: number } {
    if (action === 'sleep') {
      // Full restore on sleep (8 hours)
      return {
        hpRestored: 9999, // Will be capped to max HP
        mpRestored: 9999  // Will be capped to max MP
      };
    } else if (action === 'rest') {
      // Partial restore on short rest (1 hour)
      return {
        hpRestored: 50,
        mpRestored: 50
      };
    }

    return { hpRestored: 0, mpRestored: 0 };
  }

  // ========================================================================
  // Quest Log (Future)
  // ========================================================================

  // These methods will be expanded when quest system is implemented

  viewQuestLog(): void {
    console.log('📋 Quest log not yet implemented');
  }

  acceptQuest(questId: string): void {
    console.log(`✅ Accepted quest: ${questId}`);
  }

  completeQuest(questId: string): void {
    console.log(`🎉 Completed quest: ${questId}`);
  }
}
