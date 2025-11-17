# Examples

This directory contains example scenes and demos for the Web Game Engine.

## 🎮 Available Demos

### **Anatoly Demo** - "The Gamer" RPG
**File:** `anatoly-demo.html`

A complete RPG demo featuring:
- **Playable character** (Anatoly) with full RPG stats
- **Gamer abilities** (Observe, ID Create, Status window)
- **NPCs** (Babushka - friendly, Zombie - enemy)
- **Environment** (Mikro-15 apartment)
- **Combat system** with AI
- **Full HUD** with HP/MP bars, stats, level display
- **Console commands** for testing

**How to run:**
```bash
# From project root
npm run build
npm run serve

# Open in browser
http://localhost:8080/examples/anatoly-demo.html
```

**Controls:**
- **WASD** - Move
- **Shift** - Run
- **Space** - Jump
- **Right Mouse** - Rotate camera
- **Mouse Wheel** - Zoom
- **Tab** - Show status

**Console Commands** (F12):
```javascript
// View character info
gamerAbility.showStatus()
anatolyStats.getInfo()

// Gain experience
anatolyStats.gainExp(100)

// Add stat points
anatolyStats.addStatPoint('str', 5)

// Use abilities
gamerAbility.observe(zombie)
gamerAbility.createInstantDungeon('Zombie')

// Combat
anatolyStats.takeDamage(50)
anatolyStats.heal(100)

// Fun
hud.showNotification('Custom message!', 3000)
```

## 📁 Files

### TypeScript Source Files
- `anatoly-demo.ts` - Main demo scene code
- Compile with: `npm run build`

### HTML Files
- `anatoly-demo.html` - Demo page with styling
- `demo.html` - Basic engine demo

## 🎯 Creating Your Own Example

1. **Create TypeScript file:**
   ```typescript
   // examples/my-game.ts
   import { Engine, Scene, GameObject } from '../dist/index.js';

   async function main() {
     const engine = Engine.instance;
     const canvas = document.getElementById('gameCanvas');
     engine.initialize(canvas);

     const scene = engine.sceneManager.createScene('MyGame');

     // Your game code here...

     await engine.sceneManager.loadScene('MyGame');
     engine.start();
   }

   main();
   ```

2. **Create HTML file:**
   ```html
   <!-- examples/my-game.html -->
   <!DOCTYPE html>
   <html>
   <head>
       <title>My Game</title>
       <style>
           body { margin: 0; overflow: hidden; }
           #gameCanvas { width: 100vw; height: 100vh; }
       </style>
   </head>
   <body>
       <canvas id="gameCanvas"></canvas>
       <script type="module" src="my-game.js"></script>
   </body>
   </html>
   ```

3. **Build and run:**
   ```bash
   npm run build
   npm run serve
   # Open http://localhost:8080/examples/my-game.html
   ```

## 🎨 Example Templates

### Basic 3D Scene
```typescript
import { Engine, Scene, GameObject, Camera, Light, LightType,
         MeshRenderer, Mesh, Material, Shader, ShaderLibrary,
         Vector3, Quaternion } from '../dist/index.js';

async function createBasicScene() {
  const engine = Engine.instance;
  const canvas = document.getElementById('gameCanvas');
  engine.initialize(canvas);

  const scene = engine.sceneManager.createScene('Basic');

  // Camera
  const cameraObj = scene.createGameObject('Camera');
  const camera = cameraObj.addComponent(Camera);
  cameraObj.transform.position = new Vector3(0, 2, 5);
  cameraObj.transform.lookAt(new Vector3(0, 0, 0));

  // Light
  const lightObj = scene.createGameObject('Light');
  const light = lightObj.addComponent(Light);
  light.type = LightType.Directional;
  lightObj.transform.rotation = Quaternion.fromEuler(-45, 45, 0);

  // Cube
  const cube = scene.createGameObject('Cube');
  const renderer = cube.addComponent(MeshRenderer);
  renderer.mesh = Mesh.createCube(1);
  const gl = engine.gl;
  const shader = new Shader(gl, ShaderLibrary.litVertexShader, ShaderLibrary.litFragmentShader);
  renderer.material = new Material(shader);

  await engine.sceneManager.loadScene('Basic');
  engine.start();
}

createBasicScene();
```

### RPG Character
```typescript
import { CharacterStats, GamerAbility, PlayerController,
         RPGHud } from '../dist/index.js';

function createRPGCharacter(scene) {
  const player = scene.createGameObject('Player');

  // Stats
  const stats = player.addComponent(CharacterStats);
  stats.characterName = 'Hero';
  stats.loadData({
    level: 1,
    stats: { str: 10, vit: 10, dex: 10, int: 10, wis: 10, luck: 10 }
  });

  // Gamer abilities
  const gamer = player.addComponent(GamerAbility);

  // Controller
  const controller = player.addComponent(PlayerController);

  // HUD
  const hudObj = scene.createGameObject('HUD');
  const hud = hudObj.addComponent(RPGHud);
  hud.setPlayerStats(stats);

  return player;
}
```

### Enemy NPC
```typescript
import { CharacterStats, NPCController, NPCType } from '../dist/index.js';

function createEnemy(scene, name, level, position) {
  const enemy = scene.createGameObject(name);
  enemy.transform.position = position;

  const stats = enemy.addComponent(CharacterStats);
  stats.characterName = name;
  stats.loadData({
    level: level,
    stats: { str: 5 + level, vit: 8 + level, dex: 6, int: 3, wis: 3, luck: 5 }
  });

  const ai = enemy.addComponent(NPCController);
  ai.npcType = NPCType.Enemy;
  ai.detectionRange = 10;
  ai.attackRange = 2;

  return enemy;
}
```

## 📖 Documentation

- **Getting Started:** `/GETTING_STARTED.md`
- **Editor Guide:** `/editor/README.md`
- **RPG System:** `/src/rpg/README.md`
- **Main README:** `/README.md`

## 💡 Tips

1. **Use the visual editor** for scene layout
2. **Write code** for game logic
3. **Test in browser** with console commands
4. **Save often** - scenes are JSON files
5. **Check console** (F12) for errors

## 🎯 What to Build Next

- Create more enemies with different behaviors
- Design your own levels in the editor
- Build an inventory system
- Add quest system
- Create skill trees
- Design Visaginas city map
- Build instant dungeons

**Have fun creating! 🎮✨**
