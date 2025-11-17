# 🎮 Quick Reference Card

**Keep this handy while developing!**

---

## ⚡ Quick Commands

```bash
# Setup (first time)
npm install
npm run build

# Development
npm run editor        # Launch visual editor
npm run serve         # Run demo/games
npm run dev           # Watch mode (auto-rebuild)
npm run build         # Manual rebuild

# URLs
# Editor:  http://localhost:8080/editor/index.html
# Demo:    http://localhost:8080/examples/anatoly-demo.html
```

---

## 🎨 Editor Shortcuts

| Key | Action |
|-----|--------|
| **Q** | Select tool |
| **W** | Move tool |
| **E** | Rotate tool |
| **R** | Scale tool |
| **F** | Focus on selected |
| **Delete** | Delete selected |
| **Ctrl+D** | Duplicate |
| **Ctrl+C/V** | Copy/Paste |
| **Ctrl+S** | Save scene |
| **Middle Mouse** | Orbit camera |
| **Right Mouse** | Free look |
| **Mouse Wheel** | Zoom |

---

## 🎮 Game Controls

| Key | Action |
|-----|--------|
| **WASD** | Move |
| **Shift** | Run |
| **Space** | Jump |
| **Tab** | Show status |
| **Right Mouse** | Rotate camera |
| **Mouse Wheel** | Zoom |

---

## 💻 Console Commands

**Open console with F12, then try:**

```javascript
// === Character Info ===
gamerAbility.showStatus()        // Show full status window
anatolyStats.getInfo()            // Get stats as object

// === Leveling ===
anatolyStats.gainExp(100)         // Gain 100 EXP
anatolyStats.addStatPoint('str', 5)  // Add 5 STR

// === Gamer Abilities ===
gamerAbility.observe(zombie)      // Use Observe on target
gamerAbility.observe(babushka)    // Observe anyone
gamerAbility.createInstantDungeon('Zombie')  // Create ID (50 MP)
gamerAbility.escapeInstantDungeon()  // Exit ID

// === Combat ===
anatolyStats.takeDamage(50)       // Take 50 damage
anatolyStats.heal(100)            // Heal 100 HP
anatolyStats.useMp(50)            // Use 50 MP
zombieStats.takeDamage(999)       // Kill zombie

// === UI ===
hud.showNotification('Message!', 3000)  // Show notification
hud.setVisible(false)             // Hide HUD
hud.setVisible(true)              // Show HUD

// === Teleport ===
anatoly.getComponent(PlayerController).teleport(new Vector3(10, 0, 5))
```

---

## 🔧 Creating Components

### **Character with Stats**
```typescript
const char = scene.createGameObject('Character');
const stats = char.addComponent(CharacterStats);
stats.loadData({
  name: 'Hero',
  level: 5,
  stats: { str: 15, vit: 12, dex: 10, int: 8, wis: 8, luck: 10 }
});
```

### **Player Controller**
```typescript
const player = scene.createGameObject('Player');
const controller = player.addComponent(PlayerController);
controller.walkSpeed = 5.0;
controller.runSpeed = 10.0;
controller.setCamera(cameraGameObject);
```

### **Enemy NPC**
```typescript
const enemy = scene.createGameObject('Enemy');
const stats = enemy.addComponent(CharacterStats);
stats.loadData({ level: 10, stats: {...} });

const ai = enemy.addComponent(NPCController);
ai.npcType = NPCType.Enemy;
ai.detectionRange = 10;
ai.attackRange = 2;
```

### **Friendly NPC with Dialogue**
```typescript
const npc = scene.createGameObject('NPC');
const ai = npc.addComponent(NPCController);
ai.npcType = NPCType.Friendly;
ai.addDialogue('Hello!');
ai.addDialogue('How are you?');
```

### **HUD**
```typescript
const hudObj = scene.createGameObject('HUD');
const hud = hudObj.addComponent(RPGHud);
hud.setPlayerStats(playerStats);
```

---

## 📊 Stat Formulas

```
Max HP  = 90 + (Level × 10) + (VIT × 5)
Max MP  = 140 + (Level × 10) + (INT × 10)
EXP Next = Current Level × 100
Damage  = STR × 0.5 + Weapon Damage
Defense = VIT × 0.5 + Armor Defense
MP Regen = 1 + (WIS × 0.1) per second
Speed Bonus = (DEX - 10) × 0.1
```

---

## 🎯 Component Quick Ref

### **CharacterStats**
```typescript
stats.gainExp(amount)              // Gain EXP
stats.addStatPoint(stat, points)   // Add stat points
stats.takeDamage(amount)           // Take damage
stats.heal(amount)                 // Heal HP
stats.useMp(amount)                // Use MP
stats.restoreMp(amount)            // Restore MP
stats.getInfo()                    // Get all info
```

### **GamerAbility**
```typescript
gamer.showStatus()                 // Show status window
gamer.observe(target)              // Observe target
gamer.createInstantDungeon(type)   // Create ID
gamer.escapeInstantDungeon()       // Escape ID
gamer.isEmotionBlocked(emotion)    // Check Gamer's Mind
```

### **PlayerController**
```typescript
controller.setCamera(camera)       // Set camera
controller.teleport(position)      // Teleport
controller.getCurrentSpeed()       // Get speed
// Settings:
controller.walkSpeed = 5.0
controller.runSpeed = 10.0
controller.jumpForce = 8.0
```

### **NPCController**
```typescript
npc.addDialogue(line)              // Add dialogue
npc.addPatrolPoint(position)       // Add patrol point
npc.interact(player)               // Interact
npc.takeAggro(attacker)           // Start combat
// Settings:
npc.npcType = NPCType.Enemy
npc.detectionRange = 10
npc.attackRange = 2
```

### **RPGHud**
```typescript
hud.setPlayerStats(stats)          // Link to stats
hud.showNotification(msg, time)    // Show message
hud.setVisible(visible)            // Show/hide
```

---

## 🎨 Creating GameObjects

### **Primitive Shapes**
```typescript
const cube = scene.createGameObject('Cube');
const renderer = cube.addComponent(MeshRenderer);
renderer.mesh = Mesh.createCube(1);
renderer.material = createMaterial();

// Also: createSphere(radius, segments, rings)
//       createPlane(width, height)
```

### **Light**
```typescript
const light = scene.createGameObject('Light');
const lightComp = light.addComponent(Light);
lightComp.type = LightType.Directional;  // or Point, Spot
lightComp.intensity = 1.0;
lightComp.color = new Vector3(1, 1, 1);
```

### **Camera**
```typescript
const cam = scene.createGameObject('Camera');
const camera = cam.addComponent(Camera);
cam.transform.position = new Vector3(0, 2, 5);
cam.transform.lookAt(new Vector3(0, 0, 0));
```

---

## 🔍 Finding Things

```typescript
// Find by name
const obj = scene.findGameObject('PlayerName');

// Get component
const stats = gameObject.getComponent(CharacterStats);

// Check if has component
if (gameObject.getComponent(CharacterStats)) {
  // Has stats
}
```

---

## 📐 Transform

```typescript
// Position
transform.position = new Vector3(x, y, z);
transform.position.x = 10;

// Rotation (degrees)
transform.eulerAngles = new Vector3(0, 90, 0);

// Scale
transform.scale = new Vector3(2, 2, 2);

// Look at
transform.lookAt(targetPosition);

// Direction vectors
const forward = transform.forward;
const right = transform.right;
const up = transform.up;
```

---

## 🎲 Vector3 Math

```typescript
const v = new Vector3(1, 2, 3);

v.add(other)               // Add vector
v.subtract(other)          // Subtract
v.multiplyScalar(5)        // Multiply by scalar
v.normalize()              // Make unit length
v.length()                 // Get magnitude
v.clone()                  // Copy vector

// Static
Vector3.zero               // (0, 0, 0)
Vector3.one                // (1, 1, 1)
Vector3.up                 // (0, 1, 0)
Vector3.forward            // (0, 0, 1)
```

---

## 🐛 Common Issues

### **Black screen?**
- Check console (F12) for errors
- Make sure you ran `npm run build`
- Use HTTP server, not file://

### **Changes not showing?**
```bash
npm run build  # Rebuild
# Or use: npm run dev  # Auto-rebuild
```

### **Can't find module?**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### **Editor won't load?**
- Check port 8080 is free
- Make sure you're accessing via HTTP
- Clear browser cache

---

## 📁 Important Files

```
GETTING_STARTED.md      # Full tutorial
editor/README.md        # Editor guide
src/rpg/README.md       # RPG API docs
examples/README.md      # Demo & templates
PROJECT_SUMMARY.md      # Everything we built
```

---

## 🎯 NPM Scripts

```json
{
  "build": "tsc",                    // Compile TS → JS
  "dev": "tsc --watch",              // Auto-rebuild
  "serve": "http-server . -p 8080",  // Start server
  "editor": "npm run build && ..."   // Launch editor
}
```

---

## 🌟 Pro Tips

1. **Use editor for layout, code for logic**
2. **Save scenes often** (they're just JSON)
3. **Console is your friend** - test there first
4. **Read component docs** - everything is documented
5. **Start simple** - add one feature at a time
6. **Check browser console** - errors show there
7. **Use `npm run dev`** - auto-rebuilds on save

---

## 📚 Learning Path

1. **Day 1:** Run editor, create simple scene, run demo
2. **Week 1:** Add CharacterStats, create NPCs
3. **Month 1:** Build custom game mechanics
4. **Month 3:** Complete game!

---

## 🎮 NPC Types

```typescript
NPCType.Friendly      // Talk, quest giver
NPCType.Neutral       // Passive
NPCType.Enemy         // Attack player
NPCType.Merchant      // Shop keeper
NPCType.QuestGiver    // Gives quests
```

## 🤖 AI States

```typescript
AIState.Idle          // Standing around
AIState.Patrol        // Following waypoints
AIState.Chase         // Chasing target
AIState.Attack        // In combat
AIState.Flee          // Running away
AIState.Dead          // Defeated
```

---

## 🎨 Example: Full Character Setup

```typescript
// Create player
const player = scene.createGameObject('Player');
player.transform.position = new Vector3(0, 0.5, 0);

// Add visuals
const renderer = player.addComponent(MeshRenderer);
renderer.mesh = Mesh.createCube(1);
renderer.material = createMaterial();

// Add stats
const stats = player.addComponent(CharacterStats);
stats.characterName = 'Anatoly';
stats.loadData({
  level: 1,
  stats: { str: 8, vit: 9, dex: 11, int: 14, wis: 10, luck: 12 }
});

// Add Gamer ability
const gamer = player.addComponent(GamerAbility);

// Add controller
const controller = player.addComponent(PlayerController);
controller.setCamera(cameraGameObject);

// Create HUD
const hudObj = scene.createGameObject('HUD');
const hud = hudObj.addComponent(RPGHud);
hud.setPlayerStats(stats);

// Done! Full RPG character ready!
```

---

## ⚡ Performance Tips

1. Keep GameObjects < 1000
2. Use object pooling for bullets/effects
3. Batch objects with same material
4. Use appropriate polygon counts
5. Disable off-screen objects

---

## 🔗 Quick Links

- **Editor:** `npm run editor`
- **Demo:** `npm run serve` → `examples/anatoly-demo.html`
- **Docs:** `GETTING_STARTED.md`
- **Console:** Press **F12** in browser

---

**🎮 Save this file - you'll reference it constantly! 📋**

---

## 💡 One-Liners

```javascript
// Quick test commands (paste in console)

// Max stats cheat
anatolyStats.addStatPoint('str', 50)
anatolyStats.addStatPoint('vit', 50)
anatolyStats.addStatPoint('int', 50)

// God mode
anatolyStats.hp = 99999
anatolyStats.mp = 99999

// Instant level 50
for(let i=0; i<5000; i++) anatolyStats.gainExp(100)

// Spam notifications
for(let i=0; i<5; i++) hud.showNotification('Test '+i, 2000)

// Kill all zombies
zombieStats.hp = 0
```

---

**Happy coding! 🚀✨**
