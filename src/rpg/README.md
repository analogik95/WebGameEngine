# RPG System - "The Gamer" Components

Complete RPG system for creating "The Gamer" style games with level-up mechanics, stats, skills, and more!

## 📦 Components

### CharacterStats
Manages all RPG character statistics and leveling.

**Features:**
- 6 Primary Stats (STR, VIT, DEX, INT, WIS, LUCK)
- HP/MP system with auto-calculation
- Experience and leveling (up to level 100)
- Stat points allocation
- Skill points
- Money system
- Damage/healing
- Auto MP regeneration based on WIS

**Usage:**
```typescript
const character = gameObject.addComponent(CharacterStats);
character.characterName = 'Anatoly';
character.loadData({
  level: 1,
  stats: { str: 8, vit: 9, dex: 11, int: 14, wis: 10, luck: 12 }
});

// Gain experience
character.gainExp(100); // Auto-levels when enough EXP

// Use stat points
character.addStatPoint('str', 1); // +1 STR

// Combat
character.takeDamage(50);
character.heal(25);
character.useMp(50);
```

### GamerAbility
The special "Gamer" power system - treat life like a game!

**Features:**
- **Observe**: View detailed info about targets
- **ID Create**: Create instant dungeons
- **ID Escape**: Exit instant dungeons
- **Gamer's Mind**: Immunity to fear and mental status
- **Gamer's Body**: HP/MP system instead of real injuries

**Usage:**
```typescript
const gamer = gameObject.addComponent(GamerAbility);

// Show status window
gamer.showStatus();

// Observe target
const info = gamer.observe(targetNPC);

// Create instant dungeon
gamer.createInstantDungeon('Zombie'); // Costs MP

// Escape dungeon
gamer.escapeInstantDungeon();
```

### PlayerController
Third-person action RPG player controller with camera.

**Features:**
- WASD movement
- Sprint (Shift)
- Jump (Space)
- Mouse camera control (orbit, zoom)
- Speed affected by DEX stat
- Gravity and ground detection

**Usage:**
```typescript
const player = gameObject.addComponent(PlayerController);
player.walkSpeed = 5.0;
player.runSpeed = 10.0;
player.setCamera(cameraGameObject);

// Teleport
player.teleport(new Vector3(10, 0, 10));
```

### NPCController
AI controller for NPCs with behavior states.

**NPC Types:**
- Friendly
- Neutral
- Enemy
- Merchant
- Quest Giver

**AI States:**
- Idle
- Patrol
- Chase
- Attack
- Flee
- Dead

**Usage:**
```typescript
const npc = gameObject.addComponent(NPCController);
npc.npcName = 'Babushka';
npc.npcType = NPCType.Friendly;

// Add dialogue
npc.addDialogue('Hello, dear!');
npc.addDialogue('How are you today?');

// Add patrol points
npc.addPatrolPoint(new Vector3(0, 0, 0));
npc.addPatrolPoint(new Vector3(10, 0, 10));

// Interact
npc.interact(player);

// Combat
npc.takeAggro(player); // Starts chasing
```

### RPGHud
HTML overlay HUD displaying character stats.

**Features:**
- HP/MP bars with animations
- EXP bar
- Level display
- All 6 stats
- Money display
- Level-up notifications
- Stat change notifications

**Usage:**
```typescript
const hud = hudObject.addComponent(RPGHud);
hud.setPlayerStats(characterStats);

// Show notification
hud.showNotification('Found 100 gold!', 2000);

// Toggle visibility
hud.setVisible(false);
```

## 🎮 Complete Example

See `examples/anatoly-demo.html` for a full working example!

```typescript
// Create player
const player = scene.createGameObject('Anatoly');
const stats = player.addComponent(CharacterStats);
const gamer = player.addComponent(GamerAbility);
const controller = player.addComponent(PlayerController);

stats.loadData({
  name: 'Anatoly',
  level: 1,
  stats: { str: 8, vit: 9, dex: 11, int: 14, wis: 10, luck: 12 }
});

// Create HUD
const hudObj = scene.createGameObject('HUD');
const hud = hudObj.addComponent(RPGHud);
hud.setPlayerStats(stats);

// Create enemy
const zombie = scene.createGameObject('Zombie');
const zombieStats = zombie.addComponent(CharacterStats);
const zombieAI = zombie.addComponent(NPCController);

zombieStats.loadData({ name: 'Zombie', level: 3 });
zombieAI.npcType = NPCType.Enemy;
```

## 📊 Character Stats System

### Primary Stats

**STR (Strength)**
- Increases physical damage
- Base: 8

**VIT (Vitality)**
- Increases max HP
- Increases defense
- Base: 9
- Max HP Formula: 90 + (Level × 10) + (VIT × 5)

**DEX (Dexterity)**
- Increases attack speed
- Increases movement speed (in PlayerController)
- Base: 11

**INT (Intelligence)**
- Increases magic damage
- Increases max MP
- Base: 14
- Max MP Formula: 140 + (Level × 10) + (INT × 10)

**WIS (Wisdom)**
- Increases MP regeneration
- Increases skill effectiveness
- Base: 10
- MP Regen: 1 + (WIS × 0.1) per second

**LUCK (Luck)**
- Increases critical hit chance
- Increases rare drops
- Base: 12

### Level Up System

**EXP to Next Level**: Current Level × 100
- Level 1→2: 100 EXP
- Level 2→3: 200 EXP
- Level 100: 10,000 EXP

**Level Up Rewards:**
- +5 Stat Points (allocate freely)
- +1 Skill Point
- Full HP/MP restore
- Recalculates max HP/MP

### Combat System

**Damage Formula:**
```
Base Damage = STR × 0.5 + Weapon Damage
Defense = VIT × 0.5 + Armor Defense
Actual Damage = max(1, Base Damage - Defense)
```

**Critical Hits:**
- Based on LUCK stat
- 2x damage

## 🎯 Console Commands (Debug)

When running the demo, these objects are exposed to the console:

```javascript
// View character status
anatolyStats.getInfo()
gamerAbility.showStatus()

// Gain EXP
anatolyStats.gainExp(100)

// Add stat points
anatolyStats.addStatPoint('str', 5)

// Combat
anatolyStats.takeDamage(50)
anatolyStats.heal(100)

// Observe NPC
gamerAbility.observe(zombie)

// Create instant dungeon
gamerAbility.createInstantDungeon('Zombie')

// Teleport
anatoly.getComponent(PlayerController).teleport(new Vector3(10, 0, 10))
```

## 🎨 Creating Custom Components

Extend the system with your own components:

```typescript
import { Component } from '../core/Component';
import { CharacterStats } from './rpg/components/CharacterStats';

class CustomSkill extends Component {
  private stats: CharacterStats | null = null;

  protected override awake(): void {
    this.stats = this.getComponent(CharacterStats);
  }

  useSkill(): void {
    if (this.stats && this.stats.useMp(50)) {
      console.log('Skill activated!');
      // Skill logic here
    }
  }
}
```

## 📁 File Structure

```
src/rpg/
├── components/
│   ├── CharacterStats.ts    # Stats, leveling, HP/MP
│   ├── GamerAbility.ts      # Gamer powers (Observe, ID Create)
│   ├── PlayerController.ts  # Player movement & camera
│   └── NPCController.ts     # NPC AI behavior
├── ui/
│   └── RPGHud.ts           # HUD overlay
├── index.ts                # Exports
└── README.md              # This file
```

## 🚀 Next Steps

### Planned Features
- [ ] Inventory system
- [ ] Equipment system
- [ ] Skill tree system
- [ ] Quest system
- [ ] Dialogue system
- [ ] Combat skills with cooldowns
- [ ] Status effects (buffs/debuffs)
- [ ] Instant dungeon procedural generation
- [ ] Save/Load system
- [ ] Multiplayer support

### For "The Gamer" RPG
- [ ] Visaginas city map
- [ ] School interior
- [ ] Anatoly's apartment
- [ ] Character relationships
- [ ] Katerina mentor system
- [ ] Faction system
- [ ] Story quests
- [ ] Skill creation system

## 🎯 Integration with Editor

All these components can be added to GameObjects in the visual editor:

1. Create a GameObject in the editor
2. Add MeshRenderer for visuals
3. Add CharacterStats for RPG stats
4. Add PlayerController or NPCController for behavior
5. Add GamerAbility for special powers
6. Save the scene!

## 📝 License

MIT License - Same as Web Game Engine

---

**Ready to create "The Gamer" RPG! 🎮✨**
