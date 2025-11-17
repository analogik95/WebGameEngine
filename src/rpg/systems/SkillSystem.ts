/**
 * The Gamer RPG - Skill System
 */

export enum SkillType {
  Utility = 'utility',
  PhysicalAttack = 'physical_attack',
  MagicAttack = 'magic_attack',
  Healing = 'healing',
  Buff = 'buff',
  Debuff = 'debuff',
  Special = 'special'
}

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  type: SkillType;
  mpCost: number;
  cooldown: number; // seconds
  baseDamage?: number;
  damagePerLevel?: number;
  baseHealing?: number;
  healingPerLevel?: number;
  damageMultiplier?: number;
  aoeRadius?: number;
  maxLevel: number;
  unlockedAtLevel: number;
}

export interface PlayerSkill {
  id: string;
  level: number;
  exp: number;
  expToNext: number;
  hotkey?: number; // 1-9
  lastUsed: number; // timestamp
}

export class SkillSystem {
  private skills: Map<string, PlayerSkill> = new Map();
  private skillDefinitions: Map<string, SkillDefinition> = new Map();

  constructor() {
    this.initializeSkillDefinitions();
  }

  // ========================================================================
  // Skill Definitions
  // ========================================================================

  private initializeSkillDefinitions(): void {
    const skills: SkillDefinition[] = [
      {
        id: 'observe',
        name: 'Observe',
        description: 'View detailed information about targets',
        type: SkillType.Utility,
        mpCost: 5,
        cooldown: 1.0,
        maxLevel: 10,
        unlockedAtLevel: 1
      },
      {
        id: 'energy_bolt',
        name: 'Energy Bolt',
        description: 'Fire a bolt of pure mana energy',
        type: SkillType.MagicAttack,
        mpCost: 20,
        cooldown: 2.0,
        baseDamage: 50,
        damagePerLevel: 10,
        maxLevel: 100,
        unlockedAtLevel: 1
      },
      {
        id: 'power_strike',
        name: 'Power Strike',
        description: 'Powerful melee attack with 200% damage',
        type: SkillType.PhysicalAttack,
        mpCost: 15,
        cooldown: 5.0,
        damageMultiplier: 2.0,
        maxLevel: 100,
        unlockedAtLevel: 3
      },
      {
        id: 'heal',
        name: 'Heal',
        description: 'Restore HP',
        type: SkillType.Healing,
        mpCost: 30,
        cooldown: 10.0,
        baseHealing: 50,
        healingPerLevel: 5,
        maxLevel: 100,
        unlockedAtLevel: 5
      },
      {
        id: 'fireball',
        name: 'Fireball',
        description: 'Explosive AoE fire damage',
        type: SkillType.MagicAttack,
        mpCost: 50,
        cooldown: 8.0,
        baseDamage: 100,
        damagePerLevel: 15,
        aoeRadius: 5.0,
        maxLevel: 100,
        unlockedAtLevel: 10
      },
      {
        id: 'id_create',
        name: 'ID Create',
        description: 'Create an Instant Dungeon',
        type: SkillType.Special,
        mpCost: 50,
        cooldown: 1.0,
        maxLevel: 10,
        unlockedAtLevel: 1
      },
      {
        id: 'id_escape',
        name: 'ID Escape',
        description: 'Exit current Instant Dungeon',
        type: SkillType.Special,
        mpCost: 10,
        cooldown: 1.0,
        maxLevel: 1,
        unlockedAtLevel: 1
      },
      {
        id: 'dash_attack',
        name: 'Dash Attack',
        description: 'Charge forward and knockback enemies',
        type: SkillType.PhysicalAttack,
        mpCost: 20,
        cooldown: 7.0,
        baseDamage: 40,
        damagePerLevel: 8,
        maxLevel: 100,
        unlockedAtLevel: 7
      },
      {
        id: 'mana_shield',
        name: 'Mana Shield',
        description: 'Absorb damage using MP',
        type: SkillType.Buff,
        mpCost: 30,
        cooldown: 15.0,
        maxLevel: 50,
        unlockedAtLevel: 12
      },
      {
        id: 'lightning_strike',
        name: 'Lightning Strike',
        description: 'Chain lightning damage jumping between enemies',
        type: SkillType.MagicAttack,
        mpCost: 60,
        cooldown: 10.0,
        baseDamage: 80,
        damagePerLevel: 12,
        maxLevel: 100,
        unlockedAtLevel: 15
      }
    ];

    skills.forEach(skill => {
      this.skillDefinitions.set(skill.id, skill);
    });
  }

  // ========================================================================
  // Skill Management
  // ========================================================================

  learnSkill(skillId: string): boolean {
    if (this.skills.has(skillId)) {
      return false; // Already learned
    }

    const definition = this.skillDefinitions.get(skillId);
    if (!definition) {
      return false; // Unknown skill
    }

    this.skills.set(skillId, {
      id: skillId,
      level: 1,
      exp: 0,
      expToNext: 100,
      lastUsed: 0
    });

    return true;
  }

  hasSkill(skillId: string): boolean {
    return this.skills.has(skillId);
  }

  getSkill(skillId: string): PlayerSkill | undefined {
    return this.skills.get(skillId);
  }

  getSkillDefinition(skillId: string): SkillDefinition | undefined {
    return this.skillDefinitions.get(skillId);
  }

  getAllSkills(): PlayerSkill[] {
    return Array.from(this.skills.values());
  }

  getAvailableSkills(playerLevel: number): SkillDefinition[] {
    return Array.from(this.skillDefinitions.values())
      .filter(skill => skill.unlockedAtLevel <= playerLevel);
  }

  // ========================================================================
  // Skill Usage
  // ========================================================================

  canUseSkill(skillId: string, currentMp: number): { canUse: boolean; reason?: string } {
    const skill = this.skills.get(skillId);
    const definition = this.skillDefinitions.get(skillId);

    if (!skill) {
      return { canUse: false, reason: 'Skill not learned' };
    }

    if (!definition) {
      return { canUse: false, reason: 'Unknown skill' };
    }

    // Check MP cost
    const mpCost = this.getSkillMpCost(skillId);
    if (currentMp < mpCost) {
      return { canUse: false, reason: `Not enough MP (need ${mpCost})` };
    }

    // Check cooldown
    const now = Date.now();
    const timeSinceLastUse = (now - skill.lastUsed) / 1000; // Convert to seconds

    if (timeSinceLastUse < definition.cooldown) {
      const remaining = definition.cooldown - timeSinceLastUse;
      return { canUse: false, reason: `On cooldown (${remaining.toFixed(1)}s remaining)` };
    }

    return { canUse: true };
  }

  useSkill(skillId: string): void {
    const skill = this.skills.get(skillId);
    if (!skill) return;

    skill.lastUsed = Date.now();

    // Add skill EXP
    this.addSkillExp(skillId, 10);
  }

  getCooldownRemaining(skillId: string): number {
    const skill = this.skills.get(skillId);
    const definition = this.skillDefinitions.get(skillId);

    if (!skill || !definition) return 0;

    const now = Date.now();
    const timeSinceLastUse = (now - skill.lastUsed) / 1000;
    const remaining = Math.max(0, definition.cooldown - timeSinceLastUse);

    return remaining;
  }

  // ========================================================================
  // Skill Calculations
  // ========================================================================

  getSkillDamage(skillId: string, playerInt: number): number {
    const skill = this.skills.get(skillId);
    const definition = this.skillDefinitions.get(skillId);

    if (!skill || !definition) return 0;

    const baseDamage = definition.baseDamage || 0;
    const damagePerLevel = definition.damagePerLevel || 0;
    const damageMultiplier = definition.damageMultiplier || 1.0;

    // Base skill damage
    let skillDamage = baseDamage + (skill.level * damagePerLevel);

    // Apply INT scaling for magic skills
    if (definition.type === SkillType.MagicAttack) {
      skillDamage += playerInt * 2;
    }

    // Apply multiplier
    skillDamage = Math.floor(skillDamage * damageMultiplier);

    return skillDamage;
  }

  getSkillHealing(skillId: string): number {
    const skill = this.skills.get(skillId);
    const definition = this.skillDefinitions.get(skillId);

    if (!skill || !definition) return 0;

    const baseHealing = definition.baseHealing || 0;
    const healingPerLevel = definition.healingPerLevel || 0;

    return baseHealing + (skill.level * healingPerLevel);
  }

  getSkillMpCost(skillId: string): number {
    const skill = this.skills.get(skillId);
    const definition = this.skillDefinitions.get(skillId);

    if (!skill || !definition) return 0;

    // MP cost reduces by 1% per skill level (max 50% reduction)
    const reduction = Math.min(skill.level * 0.01, 0.50);
    return Math.floor(definition.mpCost * (1.0 - reduction));
  }

  // ========================================================================
  // Skill Leveling
  // ========================================================================

  addSkillExp(skillId: string, amount: number): boolean {
    const skill = this.skills.get(skillId);
    const definition = this.skillDefinitions.get(skillId);

    if (!skill || !definition) return false;

    skill.exp += amount;

    if (skill.exp >= skill.expToNext) {
      return this.levelUpSkill(skillId);
    }

    return false;
  }

  private levelUpSkill(skillId: string): boolean {
    const skill = this.skills.get(skillId);
    const definition = this.skillDefinitions.get(skillId);

    if (!skill || !definition) return false;

    if (skill.level >= definition.maxLevel) {
      return false; // Already max level
    }

    skill.level++;
    skill.exp -= skill.expToNext;
    skill.expToNext = skill.level * 100;

    console.log(`📖 ${definition.name} leveled up to ${skill.level}!`);

    return true;
  }

  // ========================================================================
  // Hotkeys
  // ========================================================================

  setHotkey(skillId: string, hotkey: number): boolean {
    if (hotkey < 1 || hotkey > 9) return false;

    const skill = this.skills.get(skillId);
    if (!skill) return false;

    // Remove hotkey from other skills
    this.skills.forEach(s => {
      if (s.hotkey === hotkey) {
        s.hotkey = undefined;
      }
    });

    skill.hotkey = hotkey;
    return true;
  }

  getSkillByHotkey(hotkey: number): PlayerSkill | undefined {
    return Array.from(this.skills.values()).find(s => s.hotkey === hotkey);
  }

  // ========================================================================
  // Serialization
  // ========================================================================

  toJSON(): any {
    return {
      skills: Array.from(this.skills.entries()).map(([id, skill]) => ({
        ...skill
      }))
    };
  }

  loadFromJSON(data: any): void {
    if (data.skills) {
      data.skills.forEach((skillData: PlayerSkill) => {
        this.skills.set(skillData.id, skillData);
      });
    }
  }
}
