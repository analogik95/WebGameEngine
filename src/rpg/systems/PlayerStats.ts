/**
 * The Gamer RPG - Player Statistics System
 */

export interface Stats {
  // Core stats
  strength: number;
  vitality: number;
  dexterity: number;
  intelligence: number;
  wisdom: number;
  luck: number;
}

export interface Resources {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
}

export interface CharacterData {
  id: number;
  name: string;
  level: number;
  exp: number;
  expToNext: number;
  stats: Stats;
  resources: Resources;
  money: number;
}

export class PlayerStats {
  private data: CharacterData;
  private statPoints: number = 0;

  constructor(data: CharacterData) {
    this.data = data;
  }

  // ========================================================================
  // Getters
  // ========================================================================

  get level(): number {
    return this.data.level;
  }

  get exp(): number {
    return this.data.exp;
  }

  get expToNext(): number {
    return this.data.expToNext;
  }

  get expPercentage(): number {
    return (this.exp / this.expToNext) * 100;
  }

  get hp(): number {
    return this.data.resources.hp;
  }

  get maxHp(): number {
    return this.data.resources.maxHp;
  }

  get mp(): number {
    return this.data.resources.mp;
  }

  get maxMp(): number {
    return this.data.resources.maxMp;
  }

  get hpPercentage(): number {
    return (this.hp / this.maxHp) * 100;
  }

  get mpPercentage(): number {
    return (this.mp / this.maxMp) * 100;
  }

  get stats(): Stats {
    return { ...this.data.stats };
  }

  get strength(): number {
    return this.data.stats.strength;
  }

  get vitality(): number {
    return this.data.stats.vitality;
  }

  get dexterity(): number {
    return this.data.stats.dexterity;
  }

  get intelligence(): number {
    return this.data.stats.intelligence;
  }

  get wisdom(): number {
    return this.data.stats.wisdom;
  }

  get luck(): number {
    return this.data.stats.luck;
  }

  get money(): number {
    return this.data.money;
  }

  get availableStatPoints(): number {
    return this.statPoints;
  }

  // ========================================================================
  // Setters
  // ========================================================================

  set hp(value: number) {
    this.data.resources.hp = Math.max(0, Math.min(value, this.maxHp));
  }

  set mp(value: number) {
    this.data.resources.mp = Math.max(0, Math.min(value, this.maxMp));
  }

  // ========================================================================
  // Stat Modification
  // ========================================================================

  addStat(statName: keyof Stats, amount: number): boolean {
    if (this.statPoints < amount) {
      return false;
    }

    this.data.stats[statName] += amount;
    this.statPoints -= amount;

    // Recalculate HP/MP if VIT or INT changed
    if (statName === 'vitality') {
      this.recalculateMaxHp();
    } else if (statName === 'intelligence') {
      this.recalculateMaxMp();
    }

    return true;
  }

  addStatPoints(amount: number): void {
    this.statPoints += amount;
  }

  // ========================================================================
  // Experience and Leveling
  // ========================================================================

  addExp(amount: number): boolean {
    this.data.exp += amount;

    if (this.data.exp >= this.data.expToNext) {
      this.levelUp();
      return true; // Leveled up
    }

    return false; // No level up
  }

  private levelUp(): void {
    this.data.level++;
    this.data.exp -= this.data.expToNext;
    this.data.expToNext = this.calculateExpToNextLevel();

    // Grant stat points
    this.statPoints += 5;

    // Increase HP/MP
    const hpGain = 10 + (this.vitality * 2);
    const mpGain = 10 + (this.intelligence * 2);

    this.data.resources.maxHp += hpGain;
    this.data.resources.maxMp += mpGain;

    // Restore to full on level up
    this.data.resources.hp = this.data.resources.maxHp;
    this.data.resources.mp = this.data.resources.maxMp;

    console.log(`⭐ LEVEL UP! Now level ${this.data.level}!`);
    console.log(`+${hpGain} Max HP, +${mpGain} Max MP`);
    console.log(`+5 Stat Points`);
  }

  private calculateExpToNextLevel(): number {
    return this.data.level * 100;
  }

  // ========================================================================
  // HP/MP Management
  // ========================================================================

  takeDamage(amount: number): void {
    this.hp -= amount;

    if (this.hp <= 0) {
      this.onDeath();
    }
  }

  heal(amount: number): void {
    this.hp += amount;
  }

  useMp(amount: number): boolean {
    if (this.mp < amount) {
      return false;
    }

    this.mp -= amount;
    return true;
  }

  restoreMp(amount: number): void {
    this.mp += amount;
  }

  private onDeath(): void {
    // Death penalty: Lose 10% exp
    const expLoss = Math.floor(this.exp * 0.1);
    this.data.exp = Math.max(0, this.data.exp - expLoss);

    // Respawn with 50% HP/MP
    this.data.resources.hp = Math.floor(this.maxHp * 0.5);
    this.data.resources.mp = Math.floor(this.maxMp * 0.5);

    console.log('💀 You died! Lost', expLoss, 'EXP');
  }

  // ========================================================================
  // Stat Calculations
  // ========================================================================

  private recalculateMaxHp(): void {
    const baseHp = 50;
    const hpPerVit = 10;
    const hpPerLevel = 10;

    this.data.resources.maxHp = baseHp + (this.vitality * hpPerVit) + (this.level * hpPerLevel);
  }

  private recalculateMaxMp(): void {
    const baseMp = 50;
    const mpPerInt = 10;
    const mpPerLevel = 10;

    this.data.resources.maxMp = baseMp + (this.intelligence * mpPerInt) + (this.level * mpPerLevel);
  }

  calculatePhysicalDamage(weaponDamage: number = 0): { min: number; max: number } {
    const baseDamage = 5;
    const damagePerStr = 2;

    const min = baseDamage + Math.floor(this.strength / 2) + Math.floor(weaponDamage / 2);
    const max = baseDamage + this.strength + weaponDamage;

    return { min, max };
  }

  calculateMagicDamage(spellPower: number = 0): { min: number; max: number } {
    const baseDamage = 10;

    const min = baseDamage + Math.floor(this.intelligence / 2) + Math.floor(spellPower / 2);
    const max = baseDamage + (this.intelligence * 2) + spellPower;

    return { min, max };
  }

  calculateDefense(armor: number = 0): number {
    const defensePerVit = 1;
    return (this.vitality * defensePerVit) + armor;
  }

  calculateDodgeChance(): number {
    const baseDodge = 0.05;
    const dodgePerDex = 0.002;
    const dodgePerLuck = 0.001;

    const dodge = baseDodge + (this.dexterity * dodgePerDex) + (this.luck * dodgePerLuck);
    return Math.min(dodge, 0.75); // Cap at 75%
  }

  calculateCritChance(): number {
    const baseCrit = 0.05;
    const critPerDex = 0.001;
    const critPerLuck = 0.002;

    const crit = baseCrit + (this.dexterity * critPerDex) + (this.luck * critPerLuck);
    return Math.min(crit, 0.50); // Cap at 50%
  }

  // ========================================================================
  // Serialization
  // ========================================================================

  toJSON(): CharacterData {
    return {
      ...this.data,
      stats: { ...this.data.stats },
      resources: { ...this.data.resources }
    };
  }

  updateFromServer(data: Partial<CharacterData>): void {
    if (data.level !== undefined) this.data.level = data.level;
    if (data.exp !== undefined) this.data.exp = data.exp;
    if (data.expToNext !== undefined) this.data.expToNext = data.expToNext;
    if (data.money !== undefined) this.data.money = data.money;

    if (data.stats) {
      this.data.stats = { ...this.data.stats, ...data.stats };
    }

    if (data.resources) {
      this.data.resources = { ...this.data.resources, ...data.resources };
    }
  }
}
