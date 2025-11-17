# 🎮 Getting Started with "The Gamer" RPG Engine

**Welcome to your Unity-like 3D game engine for creating "The Gamer" style RPGs in the browser!**

This guide will get you up and running in **5 minutes**! ⚡

---

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)
- Modern web browser (Chrome, Firefox, Safari, Edge)

---

## 🚀 Quick Start (5 Minutes)

### **Step 1: Install Dependencies**
```bash
cd WebGameEngine
npm install
```

### **Step 2: Build the Engine**
```bash
npm run build
```

### **Step 3: Choose Your Adventure**

#### **Option A: Visual Editor (Recommended)** 🎨
```bash
npm run editor
```
Opens the Unity-like editor in your browser automatically!

#### **Option B: Play the Demo** 🎮
```bash
npm run serve
```
Then open: `http://localhost:8080/examples/anatoly-demo.html`

---

## 🎨 **Using the Visual Editor**

### **Your First Scene in 2 Minutes:**

1. **Editor opens automatically** at `http://localhost:8080/editor/index.html`

2. **Create a cube:**
   - Click **"Cube"** button in the top menu
   - See it appear in Hierarchy and Viewport!

3. **Move it around:**
   - Select cube in Hierarchy (turns blue)
   - Edit **Position** in Inspector panel
   - Change X, Y, Z values
   - Watch it move in real-time!

4. **Add a light:**
   - Click **"Light"** button
   - Your scene now has dynamic lighting!

5. **Save your scene:**
   - Click **"Save"** button
   - Downloads as `NewScene.json`

**🎉 You just created your first 3D scene!**

---

## 🎮 **Playing the Anatoly Demo**

### **What's in the Demo:**

- **Anatoly** - Playable character with "Gamer" abilities
- **Babushka** - Friendly NPC (Anatoly's grandmother)
- **Zombie** - Enemy NPC for testing combat
- **Apartment** - Simple environment (Mikro-15)
- **Full HUD** - HP/MP bars, stats, level

### **Controls:**

| Action | Key/Mouse |
|--------|-----------|
| Move | **WASD** |
| Run | **Shift** (hold) |
| Jump | **Space** |
| Rotate Camera | **Right Mouse** (drag) |
| Zoom | **Mouse Wheel** |
| Show Status | **Tab** |

### **Console Commands:**

Open browser console (**F12**) and try:

```javascript
// See Anatoly's stats
gamerAbility.showStatus()
anatolyStats.getInfo()

// Gain experience
anatolyStats.gainExp(100)  // Auto-levels at 100 EXP!

// Add stat points
anatolyStats.addStatPoint('str', 5)  // +5 Strength

// Use Gamer abilities
gamerAbility.observe(zombie)  // See zombie's info
gamerAbility.observe(babushka)  // See babushka's info
gamerAbility.createInstantDungeon('Zombie')  // Costs 50 MP

// Combat testing
anatolyStats.takeDamage(50)  // Lose 50 HP
anatolyStats.heal(100)  // Heal 100 HP
zombieStats.takeDamage(999)  // Defeat zombie

// Fun stuff
hud.showNotification('You found a secret!', 3000)
```

---

## 🏗️ **Building Your Own Game**

### **Method 1: Use the Editor (Easy)**

1. **Start the editor:**
   ```bash
   npm run editor
   ```

2. **Create your scene:**
   - Add primitives (Cube, Sphere, Plane)
   - Position lights
   - Set up cameras
   - Save your scene

3. **Add RPG components** (in code):
   ```typescript
   const player = scene.findGameObject('Player');
   player.addComponent(CharacterStats);
   player.addComponent(GamerAbility);
   ```

### **Method 2: Code Everything (Full Control)**

Create a new TypeScript file in `examples/`:

```typescript
import {
  Engine, Scene, GameObject, Camera, Vector3,
  CharacterStats, GamerAbility, PlayerController, RPGHud
} from '../dist/index.js';

async function main() {
  // Initialize
  const engine = Engine.instance;
  const canvas = document.getElementById('gameCanvas');
  engine.initialize(canvas);

  // Create scene
  const scene = engine.sceneManager.createScene('MyGame');

  // Create player
  const player = scene.createGameObject('Player');
  player.transform.position = new Vector3(0, 0.5, 0);

  const stats = player.addComponent(CharacterStats);
  stats.characterName = 'Hero';
  stats.loadData({
    level: 1,
    stats: { str: 10, vit: 10, dex: 10, int: 10, wis: 10, luck: 10 }
  });

  const gamer = player.addComponent(GamerAbility);
  const controller = player.addComponent(PlayerController);

  // Create HUD
  const hudObj = scene.createGameObject('HUD');
  const hud = hudObj.addComponent(RPGHud);
  hud.setPlayerStats(stats);

  // Load and start
  await engine.sceneManager.loadScene('MyGame');
  engine.start();
}

main();
```

Then create an HTML file:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Game</title>
</head>
<body>
    <canvas id="gameCanvas"></canvas>
    <script type="module" src="my-game.js"></script>
</body>
</html>
```

---

## 📚 **Understanding the Components**

### **CharacterStats** 📊
The core RPG stats system.

```typescript
const stats = gameObject.addComponent(CharacterStats);

// Set initial stats
stats.loadData({
  name: 'Warrior',
  level: 5,
  stats: { str: 15, vit: 12, dex: 10, int: 8, wis: 8, luck: 10 }
});

// Level up!
stats.gainExp(500);  // Auto-levels when enough EXP

// Combat
stats.takeDamage(50);
stats.heal(25);
stats.useMp(100);

// Allocate stat points
stats.addStatPoint('str', 3);
```

### **GamerAbility** 🌟
The special "Gamer" powers.

```typescript
const gamer = gameObject.addComponent(GamerAbility);

// Use abilities
gamer.showStatus();  // Show character window
const info = gamer.observe(target);  // See target info
gamer.createInstantDungeon('Goblin');  // Generate dungeon
gamer.escapeInstantDungeon();  // Exit dungeon

// Check Gamer's Mind (fear immunity)
if (gamer.isEmotionBlocked('fear')) {
  console.log('No fear!');
}
```

### **PlayerController** 🕹️
Third-person movement and camera.

```typescript
const controller = gameObject.addComponent(PlayerController);

// Configure
controller.walkSpeed = 5.0;
controller.runSpeed = 10.0;
controller.jumpForce = 8.0;

// Set camera
controller.setCamera(cameraGameObject);

// Teleport
controller.teleport(new Vector3(10, 0, 5));
```

### **NPCController** 🤖
AI for NPCs.

```typescript
const npc = gameObject.addComponent(NPCController);

// Configure NPC
npc.npcName = 'Merchant';
npc.npcType = NPCType.Merchant;

// Add dialogue
npc.addDialogue('Welcome to my shop!');
npc.addDialogue('Buy something!');

// Add patrol route
npc.addPatrolPoint(new Vector3(0, 0, 0));
npc.addPatrolPoint(new Vector3(10, 0, 0));
npc.addPatrolPoint(new Vector3(10, 0, 10));

// Combat
npc.takeAggro(player);  // Attack player
```

### **RPGHud** 📊
Visual stat display.

```typescript
const hud = gameObject.addComponent(RPGHud);

// Connect to player stats
hud.setPlayerStats(playerStats);

// Show messages
hud.showNotification('Level Up!', 3000);

// Toggle visibility
hud.setVisible(false);
```

---

## 🎯 **Common Tasks**

### **Creating Enemies**

```typescript
function createEnemy(scene, name, level, position) {
  const enemy = scene.createGameObject(name);
  enemy.transform.position = position;

  // Add visuals (cube for now)
  const renderer = enemy.addComponent(MeshRenderer);
  renderer.mesh = Mesh.createCube(1);
  renderer.material = createDefaultMaterial();

  // Add stats
  const stats = enemy.addComponent(CharacterStats);
  stats.characterName = name;
  stats.loadData({
    level: level,
    stats: {
      str: 5 + level,
      vit: 8 + level,
      dex: 6,
      int: 3,
      wis: 3,
      luck: 5
    }
  });

  // Add AI
  const ai = enemy.addComponent(NPCController);
  ai.npcType = NPCType.Enemy;
  ai.detectionRange = 10;
  ai.attackRange = 2;

  return enemy;
}

// Usage:
const zombie = createEnemy(scene, 'Zombie', 3, new Vector3(-5, 0, -5));
const goblin = createEnemy(scene, 'Goblin', 10, new Vector3(5, 0, 5));
```

### **Creating NPCs with Dialogue**

```typescript
function createFriendlyNPC(scene, name, position, dialogues) {
  const npc = scene.createGameObject(name);
  npc.transform.position = position;

  const stats = npc.addComponent(CharacterStats);
  stats.characterName = name;

  const ai = npc.addComponent(NPCController);
  ai.npcName = name;
  ai.npcType = NPCType.Friendly;

  dialogues.forEach(line => ai.addDialogue(line));

  return npc;
}

// Usage:
const merchant = createFriendlyNPC(
  scene,
  'Shop Owner',
  new Vector3(0, 0, 10),
  [
    'Welcome to my shop!',
    'I have the finest wares!',
    'Come back soon!'
  ]
);
```

### **Building Environments**

```typescript
// Ground
const ground = scene.createGameObject('Ground');
const groundRenderer = ground.addComponent(MeshRenderer);
groundRenderer.mesh = Mesh.createPlane(50, 50);
ground.transform.rotation = Quaternion.fromEuler(-90, 0, 0);

// Walls
function createWall(scene, name, pos, scale) {
  const wall = scene.createGameObject(name);
  wall.transform.position = pos;
  wall.transform.scale = scale;
  const renderer = wall.addComponent(MeshRenderer);
  renderer.mesh = Mesh.createCube(1);
  return wall;
}

// Room (10x10)
createWall(scene, 'North Wall', new Vector3(0, 2, -5), new Vector3(10, 4, 0.2));
createWall(scene, 'South Wall', new Vector3(0, 2, 5), new Vector3(10, 4, 0.2));
createWall(scene, 'East Wall', new Vector3(5, 2, 0), new Vector3(0.2, 4, 10));
createWall(scene, 'West Wall', new Vector3(-5, 2, 0), new Vector3(0.2, 4, 10));
```

---

## 🐛 **Troubleshooting**

### **Editor won't load**
```bash
# Make sure you built first
npm run build

# Then run editor
npm run editor
```

### **Demo shows black screen**
- Check browser console (F12) for errors
- Make sure you're accessing via HTTP server (not file://)
- Try: `npm run serve` then open the URL

### **Changes not showing**
```bash
# Rebuild after TypeScript changes
npm run build

# Or use watch mode (rebuilds on save)
npm run dev
```

### **"Module not found" error**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📖 **Documentation**

- **Editor Guide**: `/editor/README.md`
- **RPG System**: `/src/rpg/README.md`
- **Engine Architecture**: `/ARCHITECTURE.md`
- **Main README**: `/README.md`

---

## 🎓 **Learning Path**

### **Beginner** (Day 1)
1. ✅ Run the editor
2. ✅ Create simple scenes with primitives
3. ✅ Run Anatoly demo
4. ✅ Try console commands

### **Intermediate** (Week 1)
1. Create custom scenes in editor
2. Add CharacterStats to GameObjects
3. Build simple combat system
4. Create NPCs with dialogue

### **Advanced** (Month 1)
1. Create complex game mechanics
2. Build inventory system
3. Design quest system
4. Create skill trees

---

## 🚀 **Next Steps**

### **Ready to build "The Gamer" RPG?**

1. **Design Anatoly's apartment** in the editor
2. **Create Visaginas school** interior
3. **Build instant dungeons**
4. **Add more characters** (Katerina, Mikhail, etc.)
5. **Implement quest system**

### **Want to contribute?**

Check out:
- GitHub Issues for the project
- `/ARCHITECTURE.md` for engine internals
- `/src/rpg/README.md` for RPG system details

---

## 💡 **Tips & Tricks**

1. **Use the editor** for layout, code for logic
2. **Save often** - scenes are just JSON files
3. **Console is your friend** - test everything there first
4. **Start simple** - add one feature at a time
5. **Read the component docs** - everything is documented

---

## 🎉 **You're Ready!**

You now have everything to create "The Gamer" RPG:
- ✅ Visual editor (like Unity)
- ✅ Complete RPG system
- ✅ Character stats & leveling
- ✅ Combat system
- ✅ NPC AI
- ✅ Beautiful HUD
- ✅ Demo scene

**Start creating! 🎮✨**

---

## ❓ **Need Help?**

- Check documentation in `/editor/README.md` and `/src/rpg/README.md`
- Open browser console (F12) for debug info
- Look at `examples/anatoly-demo.ts` for code examples
- Experiment! Everything is real-time

**Happy game development! 🚀**
