import { Component } from '../../core/Component';

/**
 * Character Stats Component
 * Manages RPG stats like STR, VIT, DEX, INT, WIS, LUCK
 * Based on "The Gamer" system
 */
export class CharacterStats extends Component {
  // Core Stats
  private _name: string = 'Unnamed';
  private _level: number = 1;
  private _exp: number = 0;

  // Primary Stats
  private _str: number = 8;   // Strength - Physical damage
  private _vit: number = 9;   // Vitality - HP and defense
  private _dex: number = 11;  // Dexterity - Speed and accuracy
  private _int: number = 14;  // Intelligence - Magic power and MP
  private _wis: number = 10;  // Wisdom - MP regen and skill effectiveness
  private _luck: number = 12; // Luck - Critical hits and drops

  // Derived Stats
  private _hp: number = 90;
  private _maxHp: number = 90;
  private _mp: number = 140;
  private _maxMp: number = 140;

  // Resources
  private _money: number = 1000;
  private _statPoints: number = 0;
  private _skillPoints: number = 0;

  // Event callbacks
  public onLevelUp?: (newLevel: number) => void;
  public onStatChange?: (stat: string, value: number) => void;
  public onDeath?: () => void;

  protected override start(): void {
    this.recalculateStats();
  }

  // Getters and Setters
  get characterName(): string { return this._name; }
  set characterName(value: string) { this._name = value; }

  get level(): number { return this._level; }
  get exp(): number { return this._exp; }

  get str(): number { return this._str; }
  get vit(): number { return this._vit; }
  get dex(): number { return this._dex; }
  get int(): number { return this._int; }
  get wis(): number { return this._wis; }
  get luck(): number { return this._luck; }

  get hp(): number { return this._hp; }
  get maxHp(): number { return this._maxHp; }
  get mp(): number { return this._mp; }
  get maxMp(): number { return this._maxMp; }

  get money(): number { return this._money; }
  set money(value: number) { this._money = Math.max(0, value); }

  get statPoints(): number { return this._statPoints; }
  get skillPoints(): number { return this._skillPoints; }

  /**
   * Calculate EXP required for next level
   */
  expToNextLevel(): number {
    return this._level * 100;
  }

  /**
   * Check if character can level up
   */
  canLevelUp(): boolean {
    return this._exp >= this.expToNextLevel();
  }

  /**
   * Gain experience points
   */
  gainExp(amount: number): void {
    this._exp += amount;
    console.log(`[${this._name}] Gained ${amount} EXP (${this._exp}/${this.expToNextLevel()})`);

    // Auto-level up if enough EXP
    while (this.canLevelUp() && this._level < 100) {
      this.levelUp();
    }
  }

  /**
   * Level up the character
   */
  private levelUp(): void {
    this._exp -= this.expToNextLevel();
    this._level++;
    this._statPoints += 5;
    this._skillPoints += 1;

    // Recalculate derived stats
    this.recalculateStats();

    // Full heal on level up
    this._hp = this._maxHp;
    this._mp = this._maxMp;

    console.log(`[${this._name}] LEVEL UP! Now level ${this._level}`);

    if (this.onLevelUp) {
      this.onLevelUp(this._level);
    }
  }

  /**
   * Add points to a stat
   */
  addStatPoint(stat: 'str' | 'vit' | 'dex' | 'int' | 'wis' | 'luck', points: number = 1): boolean {
    if (this._statPoints < points) {
      console.warn('Not enough stat points');
      return false;
    }

    switch (stat) {
      case 'str': this._str += points; break;
      case 'vit': this._vit += points; break;
      case 'dex': this._dex += points; break;
      case 'int': this._int += points; break;
      case 'wis': this._wis += points; break;
      case 'luck': this._luck += points; break;
    }

    this._statPoints -= points;
    this.recalculateStats();

    if (this.onStatChange) {
      this.onStatChange(stat, (this as any)['_' + stat]);
    }

    return true;
  }

  /**
   * Recalculate derived stats based on primary stats
   */
  private recalculateStats(): void {
    const oldMaxHp = this._maxHp;
    const oldMaxMp = this._maxMp;

    // Calculate max HP: Base 90 + (10 per level) + (5 per VIT)
    this._maxHp = 90 + (this._level * 10) + (this._vit * 5);

    // Calculate max MP: Base 140 + (10 per level) + (10 per INT)
    this._maxMp = 140 + (this._level * 10) + (this._int * 10);

    // Adjust current HP/MP if max changed
    if (oldMaxHp !== this._maxHp) {
      const hpPercent = oldMaxHp > 0 ? this._hp / oldMaxHp : 1;
      this._hp = Math.floor(this._maxHp * hpPercent);
    }
    if (oldMaxMp !== this._maxMp) {
      const mpPercent = oldMaxMp > 0 ? this._mp / oldMaxMp : 1;
      this._mp = Math.floor(this._maxMp * mpPercent);
    }
  }

  /**
   * Take damage
   */
  takeDamage(amount: number): number {
    // Calculate defense from VIT
    const defense = Math.floor(this._vit * 0.5);
    const actualDamage = Math.max(1, amount - defense);

    this._hp = Math.max(0, this._hp - actualDamage);

    console.log(`[${this._name}] Took ${actualDamage} damage (${this._hp}/${this._maxHp} HP)`);

    if (this._hp <= 0) {
      this.die();
    }

    return actualDamage;
  }

  /**
   * Heal HP
   */
  heal(amount: number): number {
    const oldHp = this._hp;
    this._hp = Math.min(this._maxHp, this._hp + amount);
    const actualHeal = this._hp - oldHp;

    console.log(`[${this._name}] Healed ${actualHeal} HP (${this._hp}/${this._maxHp})`);
    return actualHeal;
  }

  /**
   * Use MP
   */
  useMp(amount: number): boolean {
    if (this._mp < amount) {
      console.warn(`[${this._name}] Not enough MP (${this._mp}/${amount})`);
      return false;
    }

    this._mp -= amount;
    console.log(`[${this._name}] Used ${amount} MP (${this._mp}/${this._maxMp})`);
    return true;
  }

  /**
   * Restore MP
   */
  restoreMp(amount: number): number {
    const oldMp = this._mp;
    this._mp = Math.min(this._maxMp, this._mp + amount);
    return this._mp - oldMp;
  }

  /**
   * MP regeneration per second (based on WIS)
   */
  getMpRegenRate(): number {
    return 1 + (this._wis * 0.1);
  }

  /**
   * Handle character death
   */
  private die(): void {
    console.log(`[${this._name}] DIED!`);

    if (this.onDeath) {
      this.onDeath();
    }
  }

  /**
   * Respawn character
   */
  respawn(): void {
    this._hp = this._maxHp;
    this._mp = this._maxMp;
    console.log(`[${this._name}] Respawned!`);
  }

  /**
   * Get character info as object
   */
  getInfo(): any {
    return {
      name: this._name,
      level: this._level,
      exp: this._exp,
      expToNext: this.expToNextLevel(),
      stats: {
        str: this._str,
        vit: this._vit,
        dex: this._dex,
        int: this._int,
        wis: this._wis,
        luck: this._luck
      },
      hp: this._hp,
      maxHp: this._maxHp,
      mp: this._mp,
      maxMp: this._maxMp,
      money: this._money,
      statPoints: this._statPoints,
      skillPoints: this._skillPoints
    };
  }

  /**
   * Load character data
   */
  loadData(data: any): void {
    this._name = data.name || this._name;
    this._level = data.level || 1;
    this._exp = data.exp || 0;

    if (data.stats) {
      this._str = data.stats.str || 8;
      this._vit = data.stats.vit || 9;
      this._dex = data.stats.dex || 11;
      this._int = data.stats.int || 14;
      this._wis = data.stats.wis || 10;
      this._luck = data.stats.luck || 12;
    }

    this._money = data.money || 1000;
    this._statPoints = data.statPoints || 0;
    this._skillPoints = data.skillPoints || 0;

    this.recalculateStats();

    this._hp = data.hp !== undefined ? data.hp : this._maxHp;
    this._mp = data.mp !== undefined ? data.mp : this._maxMp;
  }

  /**
   * MP regen update
   */
  protected override update(deltaTime: number): void {
    // Regenerate MP over time based on WIS
    if (this._mp < this._maxMp) {
      const regenAmount = this.getMpRegenRate() * deltaTime;
      this._mp = Math.min(this._maxMp, this._mp + regenAmount);
    }
  }
}
