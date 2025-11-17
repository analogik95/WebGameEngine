# Web Game Engine

A Unity-like 3D game engine for the web, built with TypeScript and WebGL2. **Now with a complete visual editor and RPG system for creating "The Gamer" style games!** 🎮✨

This engine provides a component-based architecture for creating interactive 3D experiences that run directly in web browsers.

## 🌟 What's New!

### **Visual Editor** (Unity-like)
- **Browser-based scene editor** - Create 3D games visually!
- Hierarchy, Inspector, Viewport, Assets, and Console panels
- Real-time editing with instant feedback
- GameObject creation (primitives, lights, cameras)
- Transform manipulation (position, rotation, scale)
- Scene save/load (JSON format)
- Play/Pause/Stop mode for testing

**Try it:** `npm run editor`

### **Complete RPG System** ("The Gamer" Edition)
- **CharacterStats**: Full RPG stats (STR, VIT, DEX, INT, WIS, LUCK), leveling, HP/MP
- **GamerAbility**: Special powers (Observe, ID Create/Escape, Gamer's Mind/Body)
- **PlayerController**: Third-person action RPG controls with camera
- **NPCController**: AI with states (Idle, Patrol, Chase, Attack, Flee)
- **RPGHud**: Beautiful HTML overlay with HP/MP bars, stats, notifications

**Try it:** `npm run serve` → Open `examples/anatoly-demo.html`

### **Demo: Anatoly's Story**
Experience a playable demo featuring:
- Anatoly (player with Gamer abilities)
- Babushka (friendly NPC)
- Zombie (enemy NPC)
- Apartment environment
- Full working HUD

See `/GETTING_STARTED.md` for a complete guide!

### **Backend Server** (Node.js + TypeScript)
- **REST API**: Full authentication and character management
- **SQLite Database**: Embedded database (no separate server needed!)
- **JWT Authentication**: Secure token-based auth with bcrypt
- **Real-time Multiplayer**: Socket.IO WebSocket support
- **Character System**: Save/load characters, stats, inventory
- **Multiplayer Events**: Position sync, combat, chat, rooms

**Start Backend:** `cd server && npm install && npm run dev`
**Documentation:** See `server/README.md` for complete API docs

## Features

### Core Systems

- **Entity-Component System (ECS)**: Modular, reusable component architecture
- **Scene Management**: Load, unload, and transition between scenes
- **Transform Hierarchy**: Parent-child relationships with local/world space transformations
- **Game Loop**: Fixed timestep physics updates and variable timestep rendering

### Rendering

- **WebGL2 Rendering Pipeline**: Modern graphics API support
- **Camera System**: Perspective and orthographic cameras with multiple camera support
- **Shader System**: Customizable vertex and fragment shaders
- **Material System**: PBR-ready material properties
- **Mesh Rendering**: Built-in primitives (cube, sphere, plane) and custom mesh support
- **Lighting**: Directional, point, and spot lights

### Mathematics

- **Vector3**: 3D vector operations
- **Quaternion**: Rotation with quaternions (no gimbal lock)
- **Matrix4**: 4x4 transformation matrices for graphics

### Input

- **Keyboard Input**: Key press, hold, and release detection
- **Mouse Input**: Button states, position, delta, and wheel
- **Touch Input**: Multi-touch support
- **Virtual Axes**: Abstract input mapping (e.g., WASD for movement)

### Audio

- **3D Spatial Audio**: Positional audio with Web Audio API
- **Audio Sources**: Play, pause, loop, and volume control
- **Audio Listener**: Automatic listener positioning from camera

### Time Management

- **Delta Time**: Frame-independent movement
- **Fixed Delta Time**: Consistent physics simulation
- **Time Scale**: Slow-motion and fast-forward effects
- **FPS Counter**: Performance monitoring

## 🚀 Quick Start

### Installation
```bash
npm install
npm run build
```

### Launch the Visual Editor
```bash
npm run editor
```
Opens at: `http://localhost:8080/editor/index.html`

### Run the RPG Demo
```bash
npm run serve
```
Then open: `http://localhost:8080/examples/anatoly-demo.html`

**📖 Complete Guide:** See `/GETTING_STARTED.md` for detailed instructions!

## Building

```bash
npm run build        # Compile TypeScript to JavaScript
npm run dev          # Watch mode (rebuilds on save)
npm run serve        # Start HTTP server
npm run editor       # Build & launch visual editor
```

This compiles the TypeScript source to JavaScript in the `dist/` directory.

## Quick Start

```typescript
import {
  Engine,
  Scene,
  GameObject,
  Camera,
  MeshRenderer,
  Mesh,
  Material,
  Shader,
  ShaderLibrary,
  Vector3,
} from 'web-game-engine';

// Initialize engine
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const engine = Engine.instance;
engine.initialize(canvas);

// Create scene
const scene = engine.sceneManager.createScene('MainScene');

// Create camera
const cameraObj = scene.createGameObject('MainCamera');
const camera = cameraObj.addComponent(Camera);
cameraObj.transform.position = new Vector3(0, 2, 5);

// Create shader and material
const gl = engine.gl!;
const shader = new Shader(gl, ShaderLibrary.litVertexShader, ShaderLibrary.litFragmentShader);
const material = new Material(shader);

// Create a cube
const cubeObj = scene.createGameObject('Cube');
const renderer = cubeObj.addComponent(MeshRenderer);
renderer.mesh = Mesh.createCube(1);
renderer.material = material;

// Load and start
await engine.sceneManager.loadScene('MainScene');
engine.start();
```

## Architecture

### Component Lifecycle

Components follow a specific lifecycle:

1. **Awake**: Called once when the component is created
2. **Start**: Called before the first frame update
3. **Update**: Called every frame for game logic
4. **FixedUpdate**: Called at fixed intervals for physics
5. **LateUpdate**: Called after all updates (useful for camera following)
6. **OnDestroy**: Called when the component is destroyed

### Creating Custom Components

```typescript
import { Component } from 'web-game-engine';

class RotateComponent extends Component {
  speed: number = 1;

  protected update(deltaTime: number): void {
    if (!this.transform) return;

    const rotation = this.transform.eulerAngles;
    rotation.y += this.speed * deltaTime;
    this.transform.eulerAngles = rotation;
  }
}

// Use the component
const obj = scene.createGameObject('RotatingCube');
const rotator = obj.addComponent(RotateComponent);
rotator.speed = 2;
```

### Transform System

Every GameObject has a Transform component that handles position, rotation, and scale:

```typescript
// Position
transform.position = new Vector3(1, 2, 3);
transform.worldPosition; // Get world-space position

// Rotation
transform.rotation = Quaternion.fromEuler(0, Math.PI / 2, 0);
transform.eulerAngles = new Vector3(0, 90, 0); // Degrees

// Scale
transform.scale = new Vector3(2, 2, 2);

// Hierarchy
child.transform.setParent(parent.transform);

// Direction vectors
const forward = transform.forward;
const right = transform.right;
const up = transform.up;
```

### Scene Management

```typescript
const sceneManager = engine.sceneManager;

// Create scenes
const mainMenu = sceneManager.createScene('MainMenu');
const level1 = sceneManager.createScene('Level1');

// Load scene (unloads current)
await sceneManager.loadScene('Level1');

// Load scene additively
await sceneManager.loadScene('UI', 'additive');

// Unload scene
await sceneManager.unloadScene('UI');
```

### Input System

```typescript
import { Input } from 'web-game-engine';

// In your update method
if (Input.getKey('Space')) {
  // Jump
}

if (Input.getMouseButtonDown(0)) {
  // Left click
}

const horizontal = Input.getAxis('Horizontal'); // WASD/Arrow keys
const vertical = Input.getAxis('Vertical');

const mousePos = Input.mousePosition;
const mouseDelta = Input.mouseDelta;
```

### Lighting

```typescript
import { Light, LightType } from 'web-game-engine';

// Directional light (sun)
const sunObj = scene.createGameObject('Sun');
const sun = sunObj.addComponent(Light);
sun.type = LightType.Directional;
sun.color = new Vector3(1, 1, 1);
sun.intensity = 1;

// Point light
const bulbObj = scene.createGameObject('Bulb');
const bulb = bulbObj.addComponent(Light);
bulb.type = LightType.Point;
bulb.range = 10;
bulb.intensity = 2;
```

### Audio

```typescript
import { AudioSource } from 'web-game-engine';

const audioObj = scene.createGameObject('AudioPlayer');
const audio = audioObj.addComponent(AudioSource);

await audio.loadAudio('sounds/music.mp3');
audio.volume = 0.8;
audio.loop = true;
audio.play();
```

## Examples

See the `examples/` directory for complete examples:

- `demo.html`: Interactive demo scene
- `basic-scene.ts`: Programmatic scene creation

## Project Structure

```
src/
├── core/           # Core engine systems
│   ├── Component.ts
│   ├── GameObject.ts
│   ├── Transform.ts
│   ├── Scene.ts
│   ├── Engine.ts
│   ├── Time.ts
│   └── Input.ts
├── math/           # Math library
│   ├── Vector3.ts
│   ├── Quaternion.ts
│   └── Matrix4.ts
├── rendering/      # Rendering system
│   ├── Camera.ts
│   ├── Shader.ts
│   ├── Material.ts
│   └── Mesh.ts
├── components/     # Built-in components
│   ├── MeshRenderer.ts
│   └── Light.ts
├── audio/          # Audio system
│   └── AudioSource.ts
└── index.ts        # Main exports
```

## Browser Support

Requires WebGL2 support. Compatible with:

- Chrome 56+
- Firefox 51+
- Safari 15+
- Edge 79+

## Development

### Watch Mode

```bash
npm run dev
```

### Testing

```bash
npm test
```

### Local Development Server

```bash
npm run serve
```

Then open `http://localhost:8080/examples/demo.html`

## Roadmap

### Completed Features ✅

- **Editor**: Visual scene editor (Unity-like browser editor)
- **Networking**: Multiplayer support (Node.js backend with Socket.IO)
- **RPG System**: Character stats, abilities, AI, HUD

### Planned Features

- **Physics System**: Collision detection, rigid body dynamics, raycasting
- **Animation System**: Skeletal animation, animation state machines
- **Particle System**: GPU-accelerated particle effects
- **UI System**: Canvas-based UI with layout system
- **Asset Loading**: GLTF/GLB model loading, texture loading
- **Post-Processing**: Bloom, depth of field, SSAO
- **Shadows**: Shadow mapping for lights
- **Terrain System**: Height-map based terrain

### Optimization Systems

- **Frustum Culling**: Don't render objects outside camera view
- **Occlusion Culling**: Skip objects hidden behind others
- **LOD System**: Level-of-detail for distant objects
- **Object Pooling**: Reuse objects to reduce allocation
- **Batching**: Combine draw calls for better performance

## Performance Tips

1. **Use Object Pooling**: For frequently created/destroyed objects
2. **Minimize Draw Calls**: Batch objects with the same material
3. **Optimize Meshes**: Use appropriate polygon counts
4. **Fixed Timestep**: Keep physics updates consistent
5. **Cull Invisible Objects**: Don't render what you can't see

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Credits

Inspired by Unity's architecture and API design, built from scratch for the web platform.

## Support

For issues, questions, or suggestions, please open an issue on GitHub.
