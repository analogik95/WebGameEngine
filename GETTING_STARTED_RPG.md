# Getting Started with "The Gamer" RPG

## Quick Start (5 Minutes)

### 1. Install Dependencies

```bash
# Frontend (TypeScript)
npm install
npm run build

# Backend (Python)
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Start the Backend Server

```bash
cd backend
source venv/bin/activate  # If not already activated
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
Starting The Gamer RPG server...
Database initialized!
Server ready!
```

### 3. Start the Frontend

In a new terminal:

```bash
npm run serve
```

Then open: `http://localhost:8080/examples/rpg-demo.html`

### 4. Create a Player

```bash
# Create account
curl -X POST http://localhost:8000/api/players/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "anatoly",
    "email": "anatoly@example.com",
    "password": "test123",
    "character_name": "Anatoly Petrauskas"
  }'

# Login to get player data
curl -X POST http://localhost:8000/api/players/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "anatoly",
    "password": "test123"
  }'
```

### 5. Play!

The demo will start automatically when you open the HTML file. You'll see:

- Your character (orange cube) in the center
- Colored cubes around you (test objects)
- HUD showing HP/MP/EXP bars
- Skill bar at the bottom

**Controls:**
- **WASD** - Move
- **Shift** - Sprint
- **Space** - Jump
- **Mouse** - Look around
- **1-9** - Use skills
- **T** - Test damage
- **Y** - Test heal
- **U** - Gain EXP
- **P** - Show Observe window

## What's Implemented

### ✅ Backend (Python/FastAPI)

**Game Server:**
- Real-time WebSocket connections
- Player authentication (register/login)
- Position synchronization
- Skill usage tracking
- Combat damage calculation
- Level up system
- Instant Dungeon creation

**Database:**
- Player accounts and characters
- Inventory items
- Learned skills
- Quest progress
- Dungeon run history

**Game Logic:**
- Stat calculations (HP, MP, damage, defense)
- Level progression (EXP system)
- Skill cooldowns and MP costs
- Combat formulas (dodge, crit, damage)
- Dungeon generation

### ✅ Frontend (TypeScript/WebGL)

**RPG Systems:**
- **PlayerStats**: STR, VIT, DEX, INT, WIS, LUCK
- **SkillSystem**: 10+ skills with hotkeys
- **GamerAbilities**: Observe, ID Create, ID Escape
- **NetworkManager**: WebSocket communication

**Components:**
- **PlayerController**: Movement, camera, input
- **GameUI**: HUD, bars, notifications

**Features:**
- Third-person camera
- WASD movement with sprint/jump
- Skill hotkeys (1-9)
- HP/MP/EXP bars
- Floating damage numbers
- Level up notifications
- Observe windows

## Game Systems Explained

### Stats System

#### Primary Stats
- **STR** → Physical damage
- **VIT** → Max HP, defense
- **DEX** → Dodge, critical hit
- **INT** → Max MP, magic damage
- **WIS** → MP regen, cooldown reduction
- **LUCK** → Crit rate, rare drops

#### Leveling
- **EXP to Level** = Current Level × 100
- **Level Up Rewards**:
  - +5 stat points
  - +HP/MP increases
  - Full restore
  - Unlock new skills

### Skills

| Skill | Type | MP | Cooldown | Unlock |
|-------|------|----|---------  |--------|
| Observe | Utility | 5 | 1s | Lv1 |
| Energy Bolt | Magic | 20 | 2s | Lv1 |
| Power Strike | Physical | 15 | 5s | Lv3 |
| Heal | Healing | 30 | 10s | Lv5 |
| Fireball | Magic AoE | 50 | 8s | Lv10 |

### Instant Dungeons

| Dungeon | MP Cost | Min Level | Monsters |
|---------|---------|-----------|----------|
| Empty Zone | 50 | 1 | None |
| Zombie Zone | 50 | 1 | Zombies |
| Goblin Cave | 100 | 10 | Goblins |
| Shadow Realm | 150 | 20 | Shadow Beasts |

## Development

### Project Structure

```
WebGameEngine/
├── backend/              # Python backend
│   ├── app/
│   │   ├── main.py       # FastAPI app
│   │   ├── models.py     # Database models
│   │   ├── database.py   # DB config
│   │   └── game_logic.py # Game mechanics
│   └── requirements.txt
│
├── src/rpg/              # TypeScript frontend
│   ├── components/
│   │   └── PlayerController.ts
│   ├── systems/
│   │   ├── PlayerStats.ts
│   │   ├── SkillSystem.ts
│   │   └── GamerAbilities.ts
│   ├── network/
│   │   └── NetworkManager.ts
│   └── ui/
│       └── GameUI.ts
│
├── examples/
│   └── rpg-demo.html     # Playable demo
│
└── RPG_README.md         # Full documentation
```

### Adding a New Skill

1. **Backend** - Add to `backend/app/game_logic.py`:

```python
SKILL_DATABASE = {
    # ... existing skills
    "my_skill": {
        "name": "My Skill",
        "type": "magic_attack",
        "mp_cost": 40,
        "cooldown": 6.0,
        "base_damage": 75,
        "damage_per_level": 12,
        "max_level": 100,
        "unlocked_at_level": 15
    }
}
```

2. **Frontend** - Add to `src/rpg/systems/SkillSystem.ts`:

```typescript
{
  id: 'my_skill',
  name: 'My Skill',
  description: 'Does something awesome',
  type: SkillType.MagicAttack,
  mpCost: 40,
  cooldown: 6.0,
  baseDamage: 75,
  damagePerLevel: 12,
  maxLevel: 100,
  unlockedAtLevel: 15
}
```

3. **Learn the skill**:

```typescript
skillSystem.learnSkill('my_skill');
skillSystem.setHotkey('my_skill', 5); // Bind to key 5
```

### Testing

```bash
# Backend tests
cd backend
pytest

# Frontend build
npm run build

# Run dev server
npm run serve
```

## API Documentation

Full API docs available when server is running:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Key Endpoints

```bash
# Register
POST /api/players/register
{
  "username": "player1",
  "email": "player@example.com",
  "password": "pass123"
}

# Login
POST /api/players/login
{
  "username": "player1",
  "password": "pass123"
}

# Get skills list
GET /api/skills

# WebSocket (real-time game)
WS /ws/{player_id}
```

### WebSocket Messages

**Client → Server:**

```javascript
// Move
{ type: "update_position", data: { x, y, z, scene } }

// Use skill
{ type: "use_skill", data: { skill_id: "fireball" } }

// Create dungeon
{ type: "create_dungeon", data: { dungeon_type: "zombie_zone" } }

// Attack
{ type: "attack_enemy", data: { enemy_id, skill_id } }
```

**Server → Client:**

```javascript
// Connected
{ type: "connected", player_data: {...} }

// Level up!
{ type: "level_up", new_level: 5, stat_points: 5 }

// Attack result
{ type: "attack_result", damage: 45, is_crit: false }
```

## Next Steps

### To Build Full Game:

1. **Combat System**
   - Enemy AI components
   - Targeting system
   - Damage calculations
   - Death/respawn

2. **Dungeon System**
   - Procedural room generation
   - Enemy spawning
   - Loot drops
   - Boss encounters

3. **Visaginas World**
   - 3D city modeling
   - Apartment interior
   - School building
   - NPC population

4. **Quest System**
   - Quest objectives
   - Quest tracking
   - Rewards
   - Story progression

5. **Inventory & Equipment**
   - Item system
   - Equipment slots
   - Stat bonuses
   - Crafting

## Troubleshooting

### Backend won't start

```bash
# Check Python version (need 3.8+)
python --version

# Reinstall dependencies
pip install --upgrade -r requirements.txt

# Check if port 8000 is free
lsof -i :8000
```

### Frontend build fails

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Can't connect to WebSocket

1. Verify backend is running: `curl http://localhost:8000`
2. Check browser console for errors
3. Make sure using correct player ID

### Database errors

```bash
# Reset database
cd backend
rm the_gamer_rpg.db
python -m uvicorn app.main:app --reload
# Database will be recreated
```

## Resources

- **Main README**: [README.md](README.md) - Game engine documentation
- **RPG Guide**: [RPG_README.md](RPG_README.md) - Detailed RPG documentation
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md) - Technical details
- **API Docs**: http://localhost:8000/docs (when server running)

## Support

For issues or questions:
1. Check [RPG_README.md](RPG_README.md) for detailed docs
2. Review [ARCHITECTURE.md](ARCHITECTURE.md) for technical info
3. Open an issue on GitHub

---

**Happy Gaming! 🎮✨**

Enjoy building your RPG adventure!
