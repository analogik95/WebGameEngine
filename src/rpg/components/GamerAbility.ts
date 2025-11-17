import { Component } from '../../core/Component';
import { CharacterStats } from './CharacterStats';

/**
 * Gamer Ability Component
 * The special "Gamer" power that allows game-like mechanics in real life
 * - Observe skill
 * - Quest system
 * - ID Create/Escape
 * - Level up system
 * - Status window
 */
export class GamerAbility extends Component {
  private _hasAwakened: boolean = false;
  private _observeLevel: number = 1;
  private _idCreateLevel: number = 1;

  // Gamer's Mind - Prevents mental status effects and fear
  private _gamersMindActive: boolean = true;

  // Gamer's Body - Treat body like game character
  private _gamersBodyActive: boolean = true;

  private stats: CharacterStats | null = null;

  protected override awake(): void {
    // Get CharacterStats component
    this.stats = this.getComponent(CharacterStats);
    if (!this.stats) {
      console.error('[GamerAbility] CharacterStats component required!');
    }
  }

  protected override start(): void {
    if (!this._hasAwakened) {
      this.awaken();
    }
  }

  /**
   * Initial awakening of Gamer powers
   */
  private awaken(): void {
    this._hasAwakened = true;
    console.log('='.repeat(50));
    console.log('🎮 GAMER ABILITY AWAKENED! 🎮');
    console.log('='.repeat(50));
    console.log('New Skills Unlocked:');
    console.log('  • Observe - View target information');
    console.log('  • ID Create - Create instant dungeons');
    console.log('  • ID Escape - Escape instant dungeons');
    console.log('  • Gamer\'s Mind - Mental status immunity');
    console.log('  • Gamer\'s Body - HP/MP system active');
    console.log('='.repeat(50));
  }

  /**
   * Observe skill - Get information about target
   */
  observe(target: any): any {
    if (!this._hasAwakened) {
      console.warn('Gamer ability not awakened yet!');
      return null;
    }

    // In a real implementation, this would analyze the target
    // For now, return mock data
    const info = {
      name: target.name || 'Unknown',
      level: target.level || 1,
      hp: target.hp || '???',
      maxHp: target.maxHp || '???',
      type: target.type || 'Unknown',
      threat: this.calculateThreat(target),
      thoughts: this.readThoughts(target),
      weaknesses: this.detectWeaknesses(target)
    };

    console.log('╔════════════════════════════════╗');
    console.log('║          OBSERVE               ║');
    console.log('╠════════════════════════════════╣');
    console.log(`║ Name: ${info.name.padEnd(24)}║`);
    console.log(`║ Level: ${info.level.toString().padEnd(23)}║`);
    console.log(`║ HP: ${info.hp}/${info.maxHp}${' '.repeat(20 - (info.hp + '/' + info.maxHp).toString().length)}║`);
    console.log(`║ Threat: ${info.threat.padEnd(21)}║`);
    console.log('╠════════════════════════════════╣');
    console.log(`║ ${info.thoughts.padEnd(30)}║`);
    console.log('╚════════════════════════════════╝');

    return info;
  }

  /**
   * Calculate threat level
   */
  private calculateThreat(target: any): string {
    if (!this.stats) return 'Unknown';

    const targetLevel = target.level || 1;
    const playerLevel = this.stats.level;
    const diff = targetLevel - playerLevel;

    if (diff <= -10) return 'No threat';
    if (diff <= -5) return 'Weak';
    if (diff <= 0) return 'Moderate';
    if (diff <= 5) return 'Dangerous';
    return 'DEADLY';
  }

  /**
   * Read thoughts (high WIS increases detail)
   */
  private readThoughts(target: any): string {
    const thoughts = [
      'Feeling neutral',
      'Slightly annoyed',
      'Hungry',
      'Thinking about lunch',
      'Bored',
      'Wants to go home',
      'Planning something',
      'Suspicious of you'
    ];

    return thoughts[Math.floor(Math.random() * thoughts.length)];
  }

  /**
   * Detect weaknesses (high INT increases accuracy)
   */
  private detectWeaknesses(target: any): string[] {
    // Based on player's INT stat
    const weaknesses = [];
    if (this.stats && this.stats.int > 15) {
      weaknesses.push('Fire');
    }
    return weaknesses;
  }

  /**
   * ID Create - Create Instant Dungeon
   */
  createInstantDungeon(type: string): boolean {
    if (!this._hasAwakened) {
      console.warn('Gamer ability not awakened yet!');
      return false;
    }

    const mpCosts: { [key: string]: number } = {
      'Empty': 50,
      'Zombie': 50,
      'Goblin': 100,
      'Shadow': 150,
      'Elemental': 200
    };

    const cost = mpCosts[type] || 50;

    if (!this.stats || !this.stats.useMp(cost)) {
      console.warn('Not enough MP to create dungeon!');
      return false;
    }

    console.log('╔════════════════════════════════╗');
    console.log('║      ID CREATE ACTIVATED       ║');
    console.log('╠════════════════════════════════╣');
    console.log(`║ Type: ${type.padEnd(24)}║`);
    console.log(`║ MP Cost: ${cost.toString().padEnd(21)}║`);
    console.log('╠════════════════════════════════╣');
    console.log('║ Reality shatters like glass... ║');
    console.log('║ Entering Instant Dungeon!      ║');
    console.log('╚════════════════════════════════╝');

    // TODO: Actually load dungeon scene
    return true;
  }

  /**
   * ID Escape - Escape Instant Dungeon
   */
  escapeInstantDungeon(): boolean {
    if (!this._hasAwakened) {
      console.warn('Gamer ability not awakened yet!');
      return false;
    }

    console.log('╔════════════════════════════════╗');
    console.log('║      ID ESCAPE ACTIVATED       ║');
    console.log('╠════════════════════════════════╣');
    console.log('║ Returning to reality...        ║');
    console.log('╚════════════════════════════════╝');

    // TODO: Return to normal world
    return true;
  }

  /**
   * Show status window
   */
  showStatus(): void {
    if (!this.stats) return;

    const info = this.stats.getInfo();

    console.log('╔════════════════════════════════╗');
    console.log('║        STATUS WINDOW           ║');
    console.log('╠════════════════════════════════╣');
    console.log(`║ Name: ${info.name.padEnd(24)}║`);
    console.log(`║ Level: ${info.level.toString().padEnd(23)}║`);
    console.log(`║ EXP: ${info.exp}/${info.expToNext}${' '.repeat(22 - (info.exp + '/' + info.expToNext).toString().length)}║`);
    console.log('╠════════════════════════════════╣');
    console.log(`║ HP: ${info.hp}/${info.maxHp}${' '.repeat(24 - (info.hp + '/' + info.maxHp).toString().length)}║`);
    console.log(`║ MP: ${info.mp}/${info.maxMp}${' '.repeat(24 - (info.mp + '/' + info.maxMp).toString().length)}║`);
    console.log('╠════════════════════════════════╣');
    console.log(`║ STR: ${info.stats.str.toString().padEnd(25)}║`);
    console.log(`║ VIT: ${info.stats.vit.toString().padEnd(25)}║`);
    console.log(`║ DEX: ${info.stats.dex.toString().padEnd(25)}║`);
    console.log(`║ INT: ${info.stats.int.toString().padEnd(25)}║`);
    console.log(`║ WIS: ${info.stats.wis.toString().padEnd(25)}║`);
    console.log(`║ LUCK: ${info.stats.luck.toString().padEnd(24)}║`);
    console.log('╠════════════════════════════════╣');
    console.log(`║ Money: ${info.money.toString().padEnd(23)}║`);
    console.log(`║ Stat Points: ${info.statPoints.toString().padEnd(17)}║`);
    console.log(`║ Skill Points: ${info.skillPoints.toString().padEnd(16)}║`);
    console.log('╚════════════════════════════════╝');
  }

  /**
   * Check if Gamer's Mind is blocking emotion
   */
  isEmotionBlocked(emotion: string): boolean {
    if (!this._gamersMindActive) return false;

    const blockedEmotions = ['fear', 'panic', 'terror', 'confusion', 'charm'];
    return blockedEmotions.includes(emotion.toLowerCase());
  }

  /**
   * Gamer's Body prevents injury (converts to HP damage)
   */
  convertPhysicalDamageToHp(physicalInjury: string): number {
    if (!this._gamersBodyActive || !this.stats) return 0;

    // Convert real-world injuries to game damage
    const damageMap: { [key: string]: number } = {
      'bruise': 5,
      'cut': 10,
      'stab': 50,
      'broken_bone': 100,
      'gunshot': 200
    };

    const damage = damageMap[physicalInjury] || 10;
    this.stats.takeDamage(damage);

    return damage;
  }

  // Getters
  get hasAwakened(): boolean { return this._hasAwakened; }
  get observeLevel(): number { return this._observeLevel; }
  get idCreateLevel(): number { return this._idCreateLevel; }
  get gamersMindActive(): boolean { return this._gamersMindActive; }
  get gamersBodyActive(): boolean { return this._gamersBodyActive; }

  /**
   * Level up specific Gamer skill
   */
  levelUpSkill(skill: 'observe' | 'idCreate'): void {
    if (skill === 'observe') {
      this._observeLevel++;
      console.log(`[Observe] leveled up to ${this._observeLevel}! More detailed information available.`);
    } else if (skill === 'idCreate') {
      this._idCreateLevel++;
      console.log(`[ID Create] leveled up to ${this._idCreateLevel}! Can create stronger dungeons.`);
    }
  }

  /**
   * Update - Can add passive effects here
   */
  protected override update(deltaTime: number): void {
    // Gamer's Mind constantly active
    if (this._gamersMindActive) {
      // Remove fear/confusion effects
    }
  }
}
