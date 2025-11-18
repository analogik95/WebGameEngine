import { Component } from '../../core/Component';
import { ItemData, ItemDatabase, ItemType } from '../types/Item';
import { CharacterStats } from './CharacterStats';

/**
 * Inventory Item
 */
export interface InventoryItem {
  item: ItemData;
  quantity: number;
  slotIndex: number;
}

/**
 * Inventory Component
 * Manages character's items and equipment
 */
export class Inventory extends Component {
  private items: Map<number, InventoryItem> = new Map();
  private maxSlots: number = 30;
  private stats: CharacterStats | null = null;

  // Equipment slots
  private weapon: ItemData | null = null;
  private helmet: ItemData | null = null;
  private chest: ItemData | null = null;
  private legs: ItemData | null = null;
  private gloves: ItemData | null = null;
  private boots: ItemData | null = null;
  private shield: ItemData | null = null;
  private accessory1: ItemData | null = null;
  private accessory2: ItemData | null = null;
  private accessory3: ItemData | null = null;

  // Callbacks for UI updates
  public onInventoryChanged?: () => void;
  public onEquipmentChanged?: () => void;

  protected override awake(): void {
    this.stats = this.getComponent(CharacterStats);
  }

  /**
   * Add item to inventory
   */
  addItem(itemId: string, quantity: number = 1): boolean {
    const itemData = ItemDatabase.getItem(itemId);
    if (!itemData) {
      console.error(`[Inventory] Item not found: ${itemId}`);
      return false;
    }

    // Check if item is stackable and already exists
    if (itemData.stackable) {
      const existingItem = this.findItemByName(itemData.name);
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity <= itemData.maxStack) {
          existingItem.quantity = newQuantity;
          console.log(`✅ Added ${quantity}x ${itemData.name} (Total: ${existingItem.quantity})`);
          this.onInventoryChanged?.();
          return true;
        } else {
          // Split into multiple stacks
          const remainder = newQuantity - itemData.maxStack;
          existingItem.quantity = itemData.maxStack;
          return this.addItem(itemId, remainder);
        }
      }
    }

    // Find empty slot
    const slot = this.findEmptySlot();
    if (slot === -1) {
      console.warn('⚠️ Inventory full!');
      return false;
    }

    // Add new item
    this.items.set(slot, {
      item: itemData,
      quantity: quantity,
      slotIndex: slot
    });

    console.log(`✅ Added ${quantity}x ${itemData.name} to slot ${slot}`);
    this.onInventoryChanged?.();
    return true;
  }

  /**
   * Remove item from inventory
   */
  removeItem(slotIndex: number, quantity: number = 1): boolean {
    const invItem = this.items.get(slotIndex);
    if (!invItem) {
      console.error(`[Inventory] No item in slot ${slotIndex}`);
      return false;
    }

    if (invItem.quantity < quantity) {
      console.error(`[Inventory] Not enough ${invItem.item.name}`);
      return false;
    }

    invItem.quantity -= quantity;
    console.log(`✅ Removed ${quantity}x ${invItem.item.name}`);

    if (invItem.quantity <= 0) {
      this.items.delete(slotIndex);
      console.log(`  Removed empty slot ${slotIndex}`);
    }

    this.onInventoryChanged?.();
    return true;
  }

  /**
   * Use/consume an item
   */
  useItem(slotIndex: number): boolean {
    const invItem = this.items.get(slotIndex);
    if (!invItem) {
      console.error(`[Inventory] No item in slot ${slotIndex}`);
      return false;
    }

    const item = invItem.item;

    // Check if consumable
    if (!item.consumable) {
      console.warn(`⚠️ ${item.name} is not consumable`);
      return false;
    }

    // Apply effects
    if (item.effects && this.stats) {
      for (const effect of item.effects) {
        switch (effect.type) {
          case 'heal':
            this.stats.heal(effect.value);
            console.log(`💚 Healed ${effect.value} HP`);
            break;
          case 'restore_mp':
            this.stats.restoreMp(effect.value);
            console.log(`💙 Restored ${effect.value} MP`);
            break;
          case 'buff':
            // TODO: Implement buff system
            console.log(`⬆️ Applied buff: +${effect.value} ${effect.stat}`);
            break;
        }
      }
    }

    // Remove one from stack
    this.removeItem(slotIndex, 1);
    return true;
  }

  /**
   * Equip an item
   */
  equipItem(slotIndex: number): boolean {
    const invItem = this.items.get(slotIndex);
    if (!invItem) {
      console.error(`[Inventory] No item in slot ${slotIndex}`);
      return false;
    }

    const item = invItem.item;

    // Check requirements
    if (!this.checkRequirements(item)) {
      console.warn(`⚠️ Cannot equip ${item.name}: Requirements not met`);
      return false;
    }

    // Unequip current item in slot
    let unequipped: ItemData | null = null;

    switch (item.type) {
      case ItemType.Weapon:
        unequipped = this.weapon;
        this.weapon = item;
        break;
      case ItemType.Armor:
        switch (item.armorType) {
          case 'helmet':
            unequipped = this.helmet;
            this.helmet = item;
            break;
          case 'chest':
            unequipped = this.chest;
            this.chest = item;
            break;
          case 'legs':
            unequipped = this.legs;
            this.legs = item;
            break;
          case 'gloves':
            unequipped = this.gloves;
            this.gloves = item;
            break;
          case 'boots':
            unequipped = this.boots;
            this.boots = item;
            break;
          case 'shield':
            unequipped = this.shield;
            this.shield = item;
            break;
        }
        break;
      case ItemType.Accessory:
        if (!this.accessory1) {
          this.accessory1 = item;
        } else if (!this.accessory2) {
          this.accessory2 = item;
        } else if (!this.accessory3) {
          unequipped = this.accessory3;
          this.accessory3 = item;
        }
        break;
      default:
        console.warn(`⚠️ ${item.name} cannot be equipped`);
        return false;
    }

    // Remove from inventory
    this.removeItem(slotIndex, 1);

    // Add unequipped item back to inventory
    if (unequipped) {
      this.addItem(unequipped.id, 1);
    }

    // Apply stat bonuses
    this.applyEquipmentStats();

    console.log(`⚔️ Equipped ${item.name}`);
    this.onEquipmentChanged?.();
    return true;
  }

  /**
   * Unequip an item
   */
  unequipItem(slot: string): boolean {
    let item: ItemData | null = null;

    switch (slot) {
      case 'weapon': item = this.weapon; this.weapon = null; break;
      case 'helmet': item = this.helmet; this.helmet = null; break;
      case 'chest': item = this.chest; this.chest = null; break;
      case 'legs': item = this.legs; this.legs = null; break;
      case 'gloves': item = this.gloves; this.gloves = null; break;
      case 'boots': item = this.boots; this.boots = null; break;
      case 'shield': item = this.shield; this.shield = null; break;
      case 'accessory1': item = this.accessory1; this.accessory1 = null; break;
      case 'accessory2': item = this.accessory2; this.accessory2 = null; break;
      case 'accessory3': item = this.accessory3; this.accessory3 = null; break;
      default:
        console.error(`[Inventory] Invalid equipment slot: ${slot}`);
        return false;
    }

    if (!item) {
      console.warn(`⚠️ No item equipped in ${slot}`);
      return false;
    }

    // Add back to inventory
    if (!this.addItem(item.id, 1)) {
      // If inventory is full, re-equip
      switch (slot) {
        case 'weapon': this.weapon = item; break;
        case 'helmet': this.helmet = item; break;
        // ... etc
      }
      console.warn('⚠️ Inventory full! Cannot unequip.');
      return false;
    }

    // Recalculate stats
    this.applyEquipmentStats();

    console.log(`🔓 Unequipped ${item.name}`);
    this.onEquipmentChanged?.();
    return true;
  }

  /**
   * Check if player meets item requirements
   */
  private checkRequirements(item: ItemData): boolean {
    if (!item.requirements || !this.stats) return true;

    const req = item.requirements;

    if (req.level && this.stats.level < req.level) return false;
    if (req.str && this.stats.str < req.str) return false;
    if (req.dex && this.stats.dex < req.dex) return false;
    if (req.int && this.stats.int < req.int) return false;

    return true;
  }

  /**
   * Apply equipment stat bonuses
   */
  private applyEquipmentStats(): void {
    if (!this.stats) return;

    // TODO: Implement equipment stat bonuses
    // This would modify CharacterStats based on equipped items
    console.log('⚙️ Recalculating equipment bonuses...');
  }

  /**
   * Find item by name
   */
  private findItemByName(name: string): InventoryItem | null {
    for (const item of this.items.values()) {
      if (item.item.name === name) {
        return item;
      }
    }
    return null;
  }

  /**
   * Find empty slot
   */
  private findEmptySlot(): number {
    for (let i = 0; i < this.maxSlots; i++) {
      if (!this.items.has(i)) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Get all items
   */
  getAllItems(): InventoryItem[] {
    return Array.from(this.items.values());
  }

  /**
   * Get item in slot
   */
  getItem(slotIndex: number): InventoryItem | null {
    return this.items.get(slotIndex) || null;
  }

  /**
   * Count specific item
   */
  countItem(itemId: string): number {
    let count = 0;
    for (const invItem of this.items.values()) {
      if (invItem.item.id === itemId) {
        count += invItem.quantity;
      }
    }
    return count;
  }

  /**
   * Get equipment
   */
  getEquipment() {
    return {
      weapon: this.weapon,
      helmet: this.helmet,
      chest: this.chest,
      legs: this.legs,
      gloves: this.gloves,
      boots: this.boots,
      shield: this.shield,
      accessory1: this.accessory1,
      accessory2: this.accessory2,
      accessory3: this.accessory3
    };
  }

  /**
   * Get total weight
   */
  getTotalWeight(): number {
    let weight = 0;
    for (const invItem of this.items.values()) {
      weight += invItem.item.weight * invItem.quantity;
    }
    return weight;
  }

  /**
   * Sort inventory
   */
  sortByName(): void {
    const sorted = Array.from(this.items.values()).sort((a, b) =>
      a.item.name.localeCompare(b.item.name)
    );
    this.items.clear();
    sorted.forEach((item, index) => {
      item.slotIndex = index;
      this.items.set(index, item);
    });
    this.onInventoryChanged?.();
  }

  sortByType(): void {
    const sorted = Array.from(this.items.values()).sort((a, b) =>
      a.item.type.localeCompare(b.item.type)
    );
    this.items.clear();
    sorted.forEach((item, index) => {
      item.slotIndex = index;
      this.items.set(index, item);
    });
    this.onInventoryChanged?.();
  }

  sortByRarity(): void {
    const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
    const sorted = Array.from(this.items.values()).sort((a, b) =>
      rarityOrder.indexOf(b.item.rarity) - rarityOrder.indexOf(a.item.rarity)
    );
    this.items.clear();
    sorted.forEach((item, index) => {
      item.slotIndex = index;
      this.items.set(index, item);
    });
    this.onInventoryChanged?.();
  }
}
