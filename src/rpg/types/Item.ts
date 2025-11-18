/**
 * Item System
 * Defines items, equipment, consumables, and quest items
 */

export enum ItemType {
  Weapon = 'weapon',
  Armor = 'armor',
  Accessory = 'accessory',
  Consumable = 'consumable',
  QuestItem = 'quest_item',
  Material = 'material',
  Currency = 'currency'
}

export enum ItemRarity {
  Common = 'common',
  Uncommon = 'uncommon',
  Rare = 'rare',
  Epic = 'epic',
  Legendary = 'legendary',
  Mythic = 'mythic'
}

export enum WeaponType {
  Sword = 'sword',
  Dagger = 'dagger',
  Staff = 'staff',
  Bow = 'bow',
  Fist = 'fist',
  Gun = 'gun'
}

export enum ArmorType {
  Helmet = 'helmet',
  Chest = 'chest',
  Legs = 'legs',
  Gloves = 'gloves',
  Boots = 'boots',
  Shield = 'shield'
}

export interface ItemStats {
  // Offensive
  attack?: number;
  magicAttack?: number;
  criticalChance?: number;
  criticalDamage?: number;

  // Defensive
  defense?: number;
  magicDefense?: number;
  blockChance?: number;

  // Attributes
  str?: number;
  vit?: number;
  dex?: number;
  int?: number;
  wis?: number;
  luck?: number;

  // Resources
  hpBonus?: number;
  mpBonus?: number;
  hpRegen?: number;
  mpRegen?: number;
}

export interface ItemEffect {
  type: 'heal' | 'restore_mp' | 'buff' | 'debuff' | 'damage';
  value: number;
  duration?: number; // seconds
  stat?: string;
}

export interface ItemRequirements {
  level?: number;
  str?: number;
  dex?: number;
  int?: number;
  quest?: string; // Quest ID required
}

export interface ItemData {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;

  // Type-specific
  weaponType?: WeaponType;
  armorType?: ArmorType;

  // Stats and effects
  stats?: ItemStats;
  effects?: ItemEffect[];

  // Metadata
  stackable: boolean;
  maxStack: number;
  sellPrice: number;
  buyPrice: number;
  weight: number;

  // Requirements
  requirements?: ItemRequirements;

  // Consumable properties
  consumable: boolean;

  // Quest item properties
  questItem: boolean;
  questId?: string;

  // Icon/visual
  icon?: string;
  model?: string;
}

/**
 * Item Database
 */
export class ItemDatabase {
  private static items: Map<string, ItemData> = new Map();

  static registerItem(item: ItemData): void {
    this.items.set(item.id, item);
  }

  static getItem(id: string): ItemData | undefined {
    return this.items.get(id);
  }

  static getAllItems(): ItemData[] {
    return Array.from(this.items.values());
  }

  static getItemsByType(type: ItemType): ItemData[] {
    return this.getAllItems().filter(item => item.type === type);
  }

  static getItemsByRarity(rarity: ItemRarity): ItemData[] {
    return this.getAllItems().filter(item => item.rarity === rarity);
  }

  /**
   * Initialize default items
   */
  static initializeDefaultItems(): void {
    // Weapons
    this.registerItem({
      id: 'rusty_sword',
      name: 'Rusty Sword',
      description: 'An old rusty sword. Better than bare hands.',
      type: ItemType.Weapon,
      weaponType: WeaponType.Sword,
      rarity: ItemRarity.Common,
      stats: { attack: 5 },
      stackable: false,
      maxStack: 1,
      sellPrice: 10,
      buyPrice: 25,
      weight: 3,
      consumable: false,
      questItem: false
    });

    this.registerItem({
      id: 'iron_sword',
      name: 'Iron Sword',
      description: 'A well-crafted iron sword.',
      type: ItemType.Weapon,
      weaponType: WeaponType.Sword,
      rarity: ItemRarity.Uncommon,
      stats: { attack: 15, criticalChance: 5 },
      stackable: false,
      maxStack: 1,
      sellPrice: 50,
      buyPrice: 100,
      weight: 4,
      consumable: false,
      questItem: false,
      requirements: { level: 5 }
    });

    this.registerItem({
      id: 'steel_dagger',
      name: 'Steel Dagger',
      description: 'A sharp dagger. Fast and deadly.',
      type: ItemType.Weapon,
      weaponType: WeaponType.Dagger,
      rarity: ItemRarity.Uncommon,
      stats: { attack: 12, criticalChance: 15, dex: 2 },
      stackable: false,
      maxStack: 1,
      sellPrice: 60,
      buyPrice: 120,
      weight: 2,
      consumable: false,
      questItem: false,
      requirements: { level: 5, dex: 10 }
    });

    this.registerItem({
      id: 'wooden_staff',
      name: 'Wooden Staff',
      description: 'A simple wooden staff imbued with magic.',
      type: ItemType.Weapon,
      weaponType: WeaponType.Staff,
      rarity: ItemRarity.Common,
      stats: { magicAttack: 10, int: 3 },
      stackable: false,
      maxStack: 1,
      sellPrice: 40,
      buyPrice: 80,
      weight: 2,
      consumable: false,
      questItem: false,
      requirements: { int: 10 }
    });

    // Armor
    this.registerItem({
      id: 'leather_helmet',
      name: 'Leather Helmet',
      description: 'Basic leather helmet.',
      type: ItemType.Armor,
      armorType: ArmorType.Helmet,
      rarity: ItemRarity.Common,
      stats: { defense: 3 },
      stackable: false,
      maxStack: 1,
      sellPrice: 20,
      buyPrice: 40,
      weight: 1,
      consumable: false,
      questItem: false
    });

    this.registerItem({
      id: 'leather_chest',
      name: 'Leather Chestplate',
      description: 'Sturdy leather armor.',
      type: ItemType.Armor,
      armorType: ArmorType.Chest,
      rarity: ItemRarity.Common,
      stats: { defense: 8, hpBonus: 20 },
      stackable: false,
      maxStack: 1,
      sellPrice: 40,
      buyPrice: 80,
      weight: 3,
      consumable: false,
      questItem: false
    });

    // Consumables
    this.registerItem({
      id: 'health_potion',
      name: 'Health Potion',
      description: 'Restores 50 HP.',
      type: ItemType.Consumable,
      rarity: ItemRarity.Common,
      effects: [{ type: 'heal', value: 50 }],
      stackable: true,
      maxStack: 99,
      sellPrice: 10,
      buyPrice: 25,
      weight: 0.1,
      consumable: true,
      questItem: false
    });

    this.registerItem({
      id: 'mana_potion',
      name: 'Mana Potion',
      description: 'Restores 50 MP.',
      type: ItemType.Consumable,
      rarity: ItemRarity.Common,
      effects: [{ type: 'restore_mp', value: 50 }],
      stackable: true,
      maxStack: 99,
      sellPrice: 10,
      buyPrice: 25,
      weight: 0.1,
      consumable: true,
      questItem: false
    });

    this.registerItem({
      id: 'strength_potion',
      name: 'Strength Potion',
      description: 'Temporarily increases STR by 5 for 60 seconds.',
      type: ItemType.Consumable,
      rarity: ItemRarity.Uncommon,
      effects: [{ type: 'buff', value: 5, stat: 'str', duration: 60 }],
      stackable: true,
      maxStack: 20,
      sellPrice: 30,
      buyPrice: 60,
      weight: 0.1,
      consumable: true,
      questItem: false
    });

    // Quest Items
    this.registerItem({
      id: 'zombie_essence',
      name: 'Zombie Essence',
      description: 'Essence extracted from a zombie. Babushka might want this.',
      type: ItemType.QuestItem,
      rarity: ItemRarity.Uncommon,
      stackable: true,
      maxStack: 99,
      sellPrice: 0,
      buyPrice: 0,
      weight: 0.1,
      consumable: false,
      questItem: true,
      questId: 'clear_zombies'
    });

    // Materials
    this.registerItem({
      id: 'iron_ore',
      name: 'Iron Ore',
      description: 'Raw iron ore. Can be smelted.',
      type: ItemType.Material,
      rarity: ItemRarity.Common,
      stackable: true,
      maxStack: 99,
      sellPrice: 5,
      buyPrice: 10,
      weight: 1,
      consumable: false,
      questItem: false
    });

    this.registerItem({
      id: 'monster_claw',
      name: 'Monster Claw',
      description: 'Sharp claw from a monster. Useful for crafting.',
      type: ItemType.Material,
      rarity: ItemRarity.Common,
      stackable: true,
      maxStack: 99,
      sellPrice: 8,
      buyPrice: 15,
      weight: 0.2,
      consumable: false,
      questItem: false
    });

    console.log(`✅ Initialized ${this.items.size} items in database`);
  }
}

// Initialize items on module load
ItemDatabase.initializeDefaultItems();
