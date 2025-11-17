# The Gamer RPG - Implementation Guide

A 3D web-based RPG game inspired by "The Gamer" manhwa, built on top of the Web Game Engine.

## 🎮 Game Overview

Play as Anatoly Petrauskas, a 17-year-old student in Visaginas, Lithuania, who suddenly gains the ability to see the world as an RPG game. Level up, learn skills, fight monsters in Instant Dungeons, and uncover the mysteries of the Abyss!

## 📋 Current Implementation Status

### ✅ Completed Systems

#### Backend (Python/FastAPI)
- ✅ FastAPI server with WebSocket support
- ✅ Database models (SQLAlchemy) for players, inventory, skills, quests
- ✅ Game logic (stats calculation, leveling, combat)
- ✅ Instant Dungeon system
- ✅ Skill system with cooldowns and MP costs
- ✅ REST API endpoints for player management
- ✅ Real-time multiplayer infrastructure

#### Frontend (TypeScript/WebGL)
- ✅ Player stats system (STR, VIT, DEX, INT, WIS, LUCK)
- ✅ Level and EXP system with progression
- ✅ Skill system with hotkeys (1-9)
- ✅ Gamer abilities (Observe, ID Create, ID Escape)
- ✅ Player controller with WASD movement
- ✅ Third-person camera system
- ✅ Network manager for server communication
- ✅ Game UI (HP/MP bars, EXP bar, skill bar)
- ✅ Floating damage numbers
- ✅ Notification system
- ✅ Observe window for inspecting targets

### 🚧 In Progress
- Combat system with targeting
- Enemy AI
- Procedural dungeon generation
- 3D Visaginas world

### 📝 Planned Features
- Quest system
- Inventory and equipment
- Crafting system
- Daily life simulation
- Story mode
- More enemy types
- Boss battles
- Multiplayer dungeons

## 🚀 Quick Start

### Prerequisites

```bash
# Node.js and npm (for frontend)
node --version  # v16 or higher
npm --version

# Python 3.8+ (for backend)
python --version
pip --version
```

### 1. Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at: `http://localhost:8000`

API documentation (Swagger): `http://localhost:8000/docs`

### 2. Setup Frontend

```bash
# Install dependencies
npm install

# Build the TypeScript code
npm run build

# Start development server
npm run serve
```

Open the demo: `http://localhost:8080/examples/rpg-demo.html`

### 3. Create a Player Account

```bash
curl -X POST http://localhost:8000/api/players/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "anatoly",
    "email": "anatoly@example.com",
    "password": "testpass123",
    "character_name": "Anatoly Petrauskas"
  }'
```

### 4. Login

```bash
curl -X POST http://localhost:8000/api/players/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "anatoly",
    "password": "testpass123"
  }'
```

## 🎯 How to Play

### Controls

- **WASD** - Move character
- **Shift** - Sprint
- **Space** - Jump
- **Mouse** - Look around / Rotate camera
- **1-9** - Use skills assigned to hotkeys
- **O** - Use Observe ability
- **I** - Open inventory (planned)
- **K** - Open skills menu (planned)
- **M** - Open map (planned)
- **Esc** - Pause menu (planned)

### Test Commands (Demo Only)

- **T** - Take 20 damage (test damage display)
- **Y** - Heal 30 HP (test healing)
- **U** - Gain 50 EXP (test leveling)
- **P** - Show Observe window (test UI)

## 🔧 Architecture

### Backend Structure

```
backend/
├── app/
│   ├── main.py           # FastAPI application and WebSocket
│   ├── models.py         # Database models (SQLAlchemy + Pydantic)
│   ├── database.py       # Database configuration
│   └── game_logic.py     # Core game mechanics
├── requirements.txt      # Python dependencies
└── the_gamer_rpg.db     # SQLite database (auto-created)
```

### Frontend Structure

```
src/rpg/
├── components/
│   └── PlayerController.ts    # Player movement and input
├── systems/
│   ├── PlayerStats.ts         # Stats, leveling, HP/MP
│   ├── SkillSystem.ts         # Skills and abilities
│   └── GamerAbilities.ts      # Special Gamer powers
├── network/
│   └── NetworkManager.ts      # WebSocket communication
└── ui/
    └── GameUI.ts              # HUD and UI rendering
```

## 📊 Game Systems

### Stats System

#### Primary Stats
- **STR (Strength)** - Physical damage, carry weight
- **VIT (Vitality)** - Max HP, defense, HP regen
- **DEX (Dexterity)** - Dodge chance, critical hit, attack speed
- **INT (Intelligence)** - Max MP, magic damage, skill learning speed
- **WIS (Wisdom)** - MP regen, skill cooldown reduction
- **LUCK** - Critical chance, rare drop rate, random events

#### Derived Stats
- **HP** = 50 + (VIT × 10) + (Level × 10)
- **MP** = 50 + (INT × 10) + (Level × 10)
- **Physical Damage** = 5 + STR + Weapon Damage
- **Magic Damage** = 10 + (INT × 2) + Spell Power
- **Defense** = VIT + Armor
- **Dodge Chance** = 5% + (DEX × 0.2%) + (LUCK × 0.1%)
- **Crit Chance** = 5% + (DEX × 0.1%) + (LUCK × 0.2%)

### Leveling System

- **EXP to Next Level** = Current Level × 100
- **Level Up Rewards**:
  - +5 Stat Points (allocate freely)
  - +10 HP + (VIT × 2)
  - +10 MP + (INT × 2)
  - Full HP/MP restore
  - Unlock new skills at certain levels

### Skill System

#### Skill Types
- **Utility** - Observe, buffs, debuffs
- **Physical Attack** - Melee skills
- **Magic Attack** - Ranged elemental spells
- **Healing** - HP/MP restoration
- **Special** - ID Create, ID Escape

#### Skill Leveling
- Use skill to gain skill EXP
- Skill level affects: damage, MP cost, cooldown
- Max skill level: 100
- MP cost reduces by 1% per level (max 50% reduction)

#### Available Skills

| Skill | Type | MP Cost | Cooldown | Unlock Level |
|-------|------|---------|----------|--------------|
| Observe | Utility | 5 | 1s | 1 |
| Energy Bolt | Magic Attack | 20 | 2s | 1 |
| Power Strike | Physical Attack | 15 | 5s | 3 |
| Heal | Healing | 30 | 10s | 5 |
| Dash Attack | Physical Attack | 20 | 7s | 7 |
| Fireball | Magic Attack | 50 | 8s | 10 |
| Mana Shield | Buff | 30 | 15s | 12 |
| Lightning Strike | Magic Attack | 60 | 10s | 15 |
| ID Create | Special | 50 | 1s | 1 |
| ID Escape | Special | 10 | 1s | 1 |

### Instant Dungeon System

#### Dungeon Types

| Dungeon | MP Cost | Min Level | Monsters | Boss |
|---------|---------|-----------|----------|------|
| Empty Zone | 50 | 1 | None | None |
| Zombie Zone | 50 | 1 | Zombies | Zombie Lord |
| Goblin Cave | 100 | 10 | Goblins | Goblin Chieftain |
| Shadow Realm | 150 | 20 | Shadow Beasts | Shadow Lord |

#### How It Works

1. Find isolated area (no NPCs nearby)
2. Use **ID Create** skill
3. Select dungeon type
4. Reality "shatters" and dungeon is created
5. Fight monsters, collect loot
6. Use **ID Escape** to exit anytime

## 🌐 Network Protocol

### WebSocket Messages

#### Client → Server

```javascript
// Update position
{
  type: "update_position",
  data: { x: 0, y: 0, z: 0, scene: "apartment" }
}

// Use skill
{
  type: "use_skill",
  data: { skill_id: "energy_bolt", target_id: 123 }
}

// Create dungeon
{
  type: "create_dungeon",
  data: { dungeon_type: "zombie_zone" }
}

// Attack enemy
{
  type: "attack_enemy",
  data: { enemy_id: "zombie_1", skill_id: "power_strike" }
}

// Gain EXP
{
  type: "gain_exp",
  data: { exp: 100 }
}
```

#### Server → Client

```javascript
// Connected
{
  type: "connected",
  message: "Welcome back, Anatoly!",
  player_data: { level: 5, hp: 250, mp: 340 }
}

// Skill used
{
  type: "skill_used",
  skill_id: "energy_bolt",
  mp_cost: 20,
  current_mp: 120
}

// Attack result
{
  type: "attack_result",
  damage: 45,
  is_crit: false,
  message: "45 damage"
}

// Level up!
{
  type: "level_up",
  new_level: 6,
  stat_points: 5,
  hp_gained: 28,
  mp_gained: 34
}
```

## 🎨 UI Components

### HUD (Heads-Up Display)
- **Top Left**: Player name, level, HP/MP/EXP bars
- **Top Right**: Active quest tracker (planned)
- **Bottom Center**: Skill bar with hotkeys 1-9
- **Floating**: Damage numbers, notifications

### Windows (Planned)
- **Inventory**: Grid-based item management
- **Skills**: Skill tree and hotkey assignment
- **Character**: Stats, equipment, appearance
- **Map**: Mini-map and world map
- **Quest Log**: Active and completed quests
- **Observe**: Target information display

## 🛠️ Development

### Adding a New Skill

1. Add skill definition in `src/rpg/systems/SkillSystem.ts`:

```typescript
{
  id: 'my_skill',
  name: 'My Skill',
  description: 'Does something cool',
  type: SkillType.MagicAttack,
  mpCost: 40,
  cooldown: 5.0,
  baseDamage: 75,
  damagePerLevel: 12,
  maxLevel: 100,
  unlockedAtLevel: 10
}
```

2. Add to backend `backend/app/game_logic.py` in `SKILL_DATABASE`

3. Implement skill effect in `PlayerController.ts`

### Adding a New Enemy

1. Create enemy model in `backend/app/models.py`
2. Add enemy stats and AI in game logic
3. Create 3D model or use primitive mesh
4. Implement AI behavior component
5. Add to dungeon spawn tables

### Database Migrations

```bash
cd backend

# Create migration
alembic revision --autogenerate -m "Add new feature"

# Apply migration
alembic upgrade head
```

## 📚 API Documentation

Full API documentation is available at: `http://localhost:8000/docs` when the backend is running.

### Key Endpoints

- `POST /api/players/register` - Create account
- `POST /api/players/login` - Login
- `GET /api/players/{id}` - Get player data
- `GET /api/skills` - List all skills
- `POST /api/game/heal` - Heal player (testing)
- `WS /ws/{player_id}` - WebSocket connection

## 🐛 Troubleshooting

### Backend won't start
- Make sure Python virtual environment is activated
- Check if port 8000 is already in use
- Verify all dependencies are installed: `pip install -r requirements.txt`

### Frontend build fails
- Clear node_modules: `rm -rf node_modules && npm install`
- Check TypeScript version: `npx tsc --version`
- Try: `npm run build`

### Can't connect to server
- Verify backend is running on port 8000
- Check browser console for WebSocket errors
- Ensure no firewall blocking localhost

### Database errors
- Delete `the_gamer_rpg.db` and restart server (will recreate)
- Check SQLAlchemy logs in terminal

## 🎯 Roadmap

### Phase 1: Core Mechanics (Current)
- [x] Player stats and leveling
- [x] Skill system
- [x] Basic UI
- [ ] Combat system
- [ ] Enemy AI

### Phase 2: Content
- [ ] Visaginas 3D world
- [ ] Story quests
- [ ] More dungeons and enemies
- [ ] Inventory and equipment
- [ ] NPC interactions

### Phase 3: Features
- [ ] Daily life simulation
- [ ] Time system (day/night, calendar)
- [ ] Relationship system
- [ ] Crafting and economy
- [ ] More Gamer abilities

### Phase 4: Multiplayer
- [ ] Party system
- [ ] Raid dungeons
- [ ] PvP arena
- [ ] Guild system

## 📄 License

MIT License - See LICENSE file

## 🙏 Credits

- Inspired by "The Gamer" manhwa by Sung Sang-Young
- Built on Web Game Engine (Unity-like architecture)
- FastAPI for backend
- Three.js concepts for 3D rendering

---

## Need Help?

- Check the [main README](README.md) for engine documentation
- Read [ARCHITECTURE.md](ARCHITECTURE.md) for technical details
- Open an issue on GitHub for bugs or questions

Happy gaming! 🎮✨
