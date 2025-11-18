import { Inventory, InventoryItem } from '../components/Inventory';
import { ItemRarity } from '../types/Item';

/**
 * Inventory UI
 * Visual overlay for inventory management
 */
export class InventoryUI {
  private inventory: Inventory;
  private container: HTMLDivElement;
  private isOpen: boolean = false;
  private selectedSlot: number = -1;

  constructor(inventory: Inventory) {
    this.inventory = inventory;
    this.container = this.createUI();
    document.body.appendChild(this.container);

    // Bind inventory callbacks
    this.inventory.onInventoryChanged = () => this.refresh();
    this.inventory.onEquipmentChanged = () => this.refreshEquipment();

    // Initial render
    this.refresh();
  }

  /**
   * Create UI elements
   */
  private createUI(): HTMLDivElement {
    const container = document.createElement('div');
    container.id = 'inventory-ui';
    container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 800px;
      max-height: 600px;
      background: linear-gradient(135deg, rgba(20, 20, 30, 0.98), rgba(30, 30, 45, 0.98));
      border: 3px solid rgba(100, 200, 255, 0.5);
      border-radius: 10px;
      padding: 20px;
      color: white;
      font-family: 'Arial', sans-serif;
      display: none;
      z-index: 1000;
      box-shadow: 0 0 30px rgba(0, 0, 0, 0.8);
    `;

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #4AF; font-size: 28px;">
          <span style="margin-right: 10px;">🎒</span>Inventory
        </h2>
        <button id="close-inventory" style="
          background: rgba(200, 50, 50, 0.3);
          border: 2px solid rgba(255, 100, 100, 0.5);
          color: white;
          padding: 8px 16px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
        ">✖ Close</button>
      </div>

      <div style="display: flex; gap: 20px;">
        <!-- Equipment Panel -->
        <div style="
          flex: 0 0 200px;
          background: rgba(0, 0, 0, 0.3);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 15px;
        ">
          <h3 style="margin: 0 0 15px 0; color: #FA4; font-size: 18px;">⚔️ Equipment</h3>
          <div id="equipment-slots"></div>
        </div>

        <!-- Inventory Grid -->
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div style="color: #AAA; font-size: 14px;">
              <span id="inventory-weight">0</span> kg | <span id="inventory-count">0</span>/30 slots
            </div>
            <div style="display: flex; gap: 5px;">
              <button id="sort-name" style="
                background: rgba(100, 100, 100, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
              ">Name</button>
              <button id="sort-type" style="
                background: rgba(100, 100, 100, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
              ">Type</button>
              <button id="sort-rarity" style="
                background: rgba(100, 100, 100, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
              ">Rarity</button>
            </div>
          </div>
          <div id="inventory-grid" style="
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 8px;
            max-height: 450px;
            overflow-y: auto;
            padding: 10px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 8px;
          "></div>
        </div>
      </div>

      <!-- Item Details -->
      <div id="item-details" style="
        margin-top: 15px;
        padding: 15px;
        background: rgba(0, 0, 0, 0.4);
        border: 2px solid rgba(100, 200, 255, 0.3);
        border-radius: 8px;
        min-height: 100px;
        display: none;
      "></div>
    `;

    // Event listeners
    container.querySelector('#close-inventory')?.addEventListener('click', () => this.toggle());
    container.querySelector('#sort-name')?.addEventListener('click', () => {
      this.inventory.sortByName();
      this.refresh();
    });
    container.querySelector('#sort-type')?.addEventListener('click', () => {
      this.inventory.sortByType();
      this.refresh();
    });
    container.querySelector('#sort-rarity')?.addEventListener('click', () => {
      this.inventory.sortByRarity();
      this.refresh();
    });

    return container;
  }

  /**
   * Toggle inventory open/closed
   */
  toggle(): void {
    this.isOpen = !this.isOpen;
    this.container.style.display = this.isOpen ? 'block' : 'none';
    if (this.isOpen) {
      this.refresh();
    }
  }

  /**
   * Refresh inventory display
   */
  refresh(): void {
    const grid = this.container.querySelector('#inventory-grid');
    if (!grid) return;

    grid.innerHTML = '';

    const items = this.inventory.getAllItems();
    const totalWeight = this.inventory.getTotalWeight();

    // Update stats
    const weightEl = this.container.querySelector('#inventory-weight');
    const countEl = this.container.querySelector('#inventory-count');
    if (weightEl) weightEl.textContent = totalWeight.toFixed(1);
    if (countEl) countEl.textContent = items.length.toString();

    // Render items
    for (let i = 0; i < 30; i++) {
      const invItem = this.inventory.getItem(i);
      const slot = this.createSlot(i, invItem);
      grid.appendChild(slot);
    }

    this.refreshEquipment();
  }

  /**
   * Create inventory slot
   */
  private createSlot(index: number, invItem: InventoryItem | null): HTMLDivElement {
    const slot = document.createElement('div');
    slot.className = 'inventory-slot';
    slot.style.cssText = `
      width: 70px;
      height: 70px;
      background: rgba(40, 40, 60, 0.8);
      border: 2px solid rgba(100, 100, 120, 0.5);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
      transition: all 0.2s;
    `;

    if (invItem) {
      const rarityColor = this.getRarityColor(invItem.item.rarity);
      slot.style.borderColor = rarityColor;
      slot.style.background = `rgba(40, 40, 60, 0.9)`;

      // Item icon/emoji
      const icon = this.getItemIcon(invItem.item.type);
      slot.innerHTML = `
        <div style="text-align: center;">
          <div style="font-size: 32px; margin-bottom: 4px;">${icon}</div>
          ${invItem.quantity > 1 ? `<div style="
            position: absolute;
            bottom: 4px;
            right: 4px;
            background: rgba(0, 0, 0, 0.8);
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            color: white;
          ">${invItem.quantity}</div>` : ''}
        </div>
      `;

      // Hover effect
      slot.addEventListener('mouseenter', () => {
        slot.style.transform = 'scale(1.1)';
        slot.style.borderColor = rarityColor;
        slot.style.boxShadow = `0 0 15px ${rarityColor}`;
        this.showItemDetails(invItem);
      });

      slot.addEventListener('mouseleave', () => {
        slot.style.transform = 'scale(1)';
        slot.style.boxShadow = 'none';
      });

      // Click handlers
      slot.addEventListener('click', () => {
        if (invItem.item.consumable) {
          this.inventory.useItem(index);
        } else {
          this.inventory.equipItem(index);
        }
        this.refresh();
      });

      slot.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        // Right-click for drop/delete (future feature)
      });
    }

    return slot;
  }

  /**
   * Show item details
   */
  private showItemDetails(invItem: InventoryItem): void {
    const details = this.container.querySelector('#item-details');
    if (!details) return;

    details.style.display = 'block';

    const item = invItem.item;
    const rarityColor = this.getRarityColor(item.rarity);

    let statsHTML = '';
    if (item.stats) {
      const stats = item.stats;
      statsHTML = '<div style="margin-top: 10px;"><strong>Stats:</strong><br>';
      if (stats.attack) statsHTML += `⚔️ Attack: +${stats.attack}<br>`;
      if (stats.defense) statsHTML += `🛡️ Defense: +${stats.defense}<br>`;
      if (stats.magicAttack) statsHTML += `✨ Magic Attack: +${stats.magicAttack}<br>`;
      if (stats.str) statsHTML += `💪 STR: +${stats.str}<br>`;
      if (stats.vit) statsHTML += `❤️ VIT: +${stats.vit}<br>`;
      if (stats.dex) statsHTML += `🏃 DEX: +${stats.dex}<br>`;
      if (stats.int) statsHTML += `🧠 INT: +${stats.int}<br>`;
      if (stats.wis) statsHTML += `🦉 WIS: +${stats.wis}<br>`;
      if (stats.luck) statsHTML += `🍀 LUCK: +${stats.luck}<br>`;
      statsHTML += '</div>';
    }

    let reqHTML = '';
    if (item.requirements) {
      const req = item.requirements;
      reqHTML = '<div style="margin-top: 10px; color: #FAA;"><strong>Requirements:</strong><br>';
      if (req.level) reqHTML += `Level ${req.level}<br>`;
      if (req.str) reqHTML += `STR ${req.str}<br>`;
      if (req.dex) reqHTML += `DEX ${req.dex}<br>`;
      if (req.int) reqHTML += `INT ${req.int}<br>`;
      reqHTML += '</div>';
    }

    details.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div>
          <h3 style="margin: 0 0 5px 0; color: ${rarityColor}; font-size: 20px;">
            ${item.name}
          </h3>
          <div style="color: ${rarityColor}; font-size: 12px; text-transform: uppercase; margin-bottom: 10px;">
            ${item.rarity} ${item.type}
          </div>
          <p style="margin: 0; color: #CCC; font-size: 14px;">
            ${item.description}
          </p>
          ${statsHTML}
          ${reqHTML}
        </div>
        <div style="text-align: right; font-size: 12px; color: #AAA;">
          <div>💰 Sell: ${item.sellPrice}g</div>
          <div>⚖️ Weight: ${item.weight} kg</div>
          ${invItem.quantity > 1 ? `<div>📦 Quantity: ${invItem.quantity}</div>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Refresh equipment display
   */
  private refreshEquipment(): void {
    const equipSlots = this.container.querySelector('#equipment-slots');
    if (!equipSlots) return;

    const equipment = this.inventory.getEquipment();
    const slots = [
      { name: 'Weapon', key: 'weapon', icon: '⚔️' },
      { name: 'Helmet', key: 'helmet', icon: '🪖' },
      { name: 'Chest', key: 'chest', icon: '🛡️' },
      { name: 'Legs', key: 'legs', icon: '👖' },
      { name: 'Gloves', key: 'gloves', icon: '🧤' },
      { name: 'Boots', key: 'boots', icon: '👢' },
      { name: 'Shield', key: 'shield', icon: '🛡️' },
      { name: 'Ring 1', key: 'accessory1', icon: '💍' },
      { name: 'Ring 2', key: 'accessory2', icon: '💍' },
      { name: 'Amulet', key: 'accessory3', icon: '📿' }
    ];

    equipSlots.innerHTML = slots.map(slot => {
      const item = (equipment as any)[slot.key];
      return `
        <div style="
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          margin-bottom: 8px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          cursor: pointer;
        " data-slot="${slot.key}">
          <div style="font-size: 20px;">${slot.icon}</div>
          <div style="flex: 1;">
            <div style="font-size: 12px; color: #888;">${slot.name}</div>
            <div style="font-size: 14px; color: ${item ? '#4AF' : '#666'};">
              ${item ? item.name : 'Empty'}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Add click listeners for unequip
    equipSlots.querySelectorAll('[data-slot]').forEach(el => {
      el.addEventListener('click', () => {
        const slotKey = el.getAttribute('data-slot');
        if (slotKey && (equipment as any)[slotKey]) {
          this.inventory.unequipItem(slotKey);
        }
      });
    });
  }

  /**
   * Get rarity color
   */
  private getRarityColor(rarity: ItemRarity): string {
    const colors = {
      common: '#999',
      uncommon: '#4AF',
      rare: '#FA4',
      epic: '#D4F',
      legendary: '#FA4',
      mythic: '#F44'
    };
    return colors[rarity] || '#999';
  }

  /**
   * Get item icon
   */
  private getItemIcon(type: string): string {
    const icons: any = {
      weapon: '⚔️',
      armor: '🛡️',
      accessory: '💍',
      consumable: '🧪',
      quest_item: '📜',
      material: '⚙️',
      currency: '💰'
    };
    return icons[type] || '❓';
  }

  /**
   * Destroy UI
   */
  destroy(): void {
    this.container.remove();
  }
}
