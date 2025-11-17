/**
 * Character Model
 */
import { db } from '../config/database';

export interface Character {
  id: number;
  user_id: number;
  name: string;
  level: number;
  exp: number;

  // Stats
  str: number;
  vit: number;
  dex: number;
  int: number;
  wis: number;
  luck: number;

  // Derived
  hp: number;
  max_hp: number;
  mp: number;
  max_mp: number;

  // Resources
  money: number;
  stat_points: number;
  skill_points: number;

  // Position
  position_x: number;
  position_y: number;
  position_z: number;
  scene_name: string;

  created_at: string;
  updated_at: string;
}

export class CharacterModel {
  /**
   * Create new character
   */
  static create(userId: number, name: string, stats?: Partial<Character>): Character {
    const stmt = db.prepare(`
      INSERT INTO characters (
        user_id, name, level, exp,
        str, vit, dex, int, wis, luck,
        hp, max_hp, mp, max_mp,
        money, stat_points, skill_points,
        position_x, position_y, position_z, scene_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const defaultStats = {
      level: 1,
      exp: 0,
      str: 8,
      vit: 9,
      dex: 11,
      int: 14,
      wis: 10,
      luck: 12,
      hp: 90,
      max_hp: 90,
      mp: 140,
      max_mp: 140,
      money: 1000,
      stat_points: 0,
      skill_points: 0,
      position_x: 0,
      position_y: 0,
      position_z: 0,
      scene_name: 'Mikro15_Home',
      ...stats
    };

    const result = stmt.run(
      userId, name, defaultStats.level, defaultStats.exp,
      defaultStats.str, defaultStats.vit, defaultStats.dex,
      defaultStats.int, defaultStats.wis, defaultStats.luck,
      defaultStats.hp, defaultStats.max_hp, defaultStats.mp, defaultStats.max_mp,
      defaultStats.money, defaultStats.stat_points, defaultStats.skill_points,
      defaultStats.position_x, defaultStats.position_y, defaultStats.position_z,
      defaultStats.scene_name
    );

    return this.findById(result.lastInsertRowid as number)!;
  }

  /**
   * Find character by ID
   */
  static findById(id: number): Character | undefined {
    const stmt = db.prepare('SELECT * FROM characters WHERE id = ?');
    return stmt.get(id) as Character | undefined;
  }

  /**
   * Find all characters for a user
   */
  static findByUserId(userId: number): Character[] {
    const stmt = db.prepare('SELECT * FROM characters WHERE user_id = ? ORDER BY created_at DESC');
    return stmt.all(userId) as Character[];
  }

  /**
   * Update character
   */
  static update(characterId: number, updates: Partial<Character>): Character | undefined {
    const fields: string[] = [];
    const values: any[] = [];

    // Build dynamic update query
    Object.keys(updates).forEach(key => {
      if (key !== 'id' && key !== 'user_id' && key !== 'created_at') {
        fields.push(`${key} = ?`);
        values.push((updates as any)[key]);
      }
    });

    if (fields.length === 0) return this.findById(characterId);

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(characterId);

    const stmt = db.prepare(`
      UPDATE characters SET ${fields.join(', ')} WHERE id = ?
    `);

    stmt.run(...values);
    return this.findById(characterId);
  }

  /**
   * Delete character
   */
  static delete(characterId: number): boolean {
    const stmt = db.prepare('DELETE FROM characters WHERE id = ?');
    const result = stmt.run(characterId);
    return result.changes > 0;
  }

  /**
   * Calculate max HP based on stats
   */
  static calculateMaxHp(level: number, vit: number): number {
    return 90 + (level * 10) + (vit * 5);
  }

  /**
   * Calculate max MP based on stats
   */
  static calculateMaxMp(level: number, int: number): number {
    return 140 + (level * 10) + (int * 10);
  }

  /**
   * Calculate EXP required for next level
   */
  static expToNextLevel(level: number): number {
    return level * 100;
  }

  /**
   * Gain experience
   */
  static gainExp(characterId: number, amount: number): Character | undefined {
    const char = this.findById(characterId);
    if (!char) return undefined;

    let newExp = char.exp + amount;
    let newLevel = char.level;
    let newStatPoints = char.stat_points;
    let newSkillPoints = char.skill_points;

    // Auto level up
    while (newExp >= this.expToNextLevel(newLevel) && newLevel < 100) {
      newExp -= this.expToNextLevel(newLevel);
      newLevel++;
      newStatPoints += 5;
      newSkillPoints += 1;
    }

    // Recalculate max HP/MP if leveled
    const newMaxHp = this.calculateMaxHp(newLevel, char.vit);
    const newMaxMp = this.calculateMaxMp(newLevel, char.int);

    return this.update(characterId, {
      exp: newExp,
      level: newLevel,
      stat_points: newStatPoints,
      skill_points: newSkillPoints,
      max_hp: newMaxHp,
      max_mp: newMaxMp,
      hp: newMaxHp, // Full heal on level up
      mp: newMaxMp
    });
  }

  /**
   * Add stat points
   */
  static addStatPoints(characterId: number, stat: keyof Character, points: number): Character | undefined {
    const char = this.findById(characterId);
    if (!char || char.stat_points < points) return undefined;

    const validStats = ['str', 'vit', 'dex', 'int', 'wis', 'luck'];
    if (!validStats.includes(stat as string)) return undefined;

    const newStatValue = (char[stat] as number) + points;
    const newStatPoints = char.stat_points - points;

    // Recalculate derived stats if needed
    const updates: Partial<Character> = {
      [stat]: newStatValue,
      stat_points: newStatPoints
    };

    if (stat === 'vit') {
      updates.max_hp = this.calculateMaxHp(char.level, newStatValue);
    }
    if (stat === 'int') {
      updates.max_mp = this.calculateMaxMp(char.level, newStatValue);
    }

    return this.update(characterId, updates);
  }

  /**
   * Take damage
   */
  static takeDamage(characterId: number, amount: number): Character | undefined {
    const char = this.findById(characterId);
    if (!char) return undefined;

    const newHp = Math.max(0, char.hp - amount);

    return this.update(characterId, { hp: newHp });
  }

  /**
   * Heal
   */
  static heal(characterId: number, amount: number): Character | undefined {
    const char = this.findById(characterId);
    if (!char) return undefined;

    const newHp = Math.min(char.max_hp, char.hp + amount);

    return this.update(characterId, { hp: newHp });
  }

  /**
   * Use MP
   */
  static useMp(characterId: number, amount: number): Character | undefined {
    const char = this.findById(characterId);
    if (!char || char.mp < amount) return undefined;

    const newMp = char.mp - amount;

    return this.update(characterId, { mp: newMp });
  }

  /**
   * Restore MP
   */
  static restoreMp(characterId: number, amount: number): Character | undefined {
    const char = this.findById(characterId);
    if (!char) return undefined;

    const newMp = Math.min(char.max_mp, char.mp + amount);

    return this.update(characterId, { mp: newMp });
  }
}
