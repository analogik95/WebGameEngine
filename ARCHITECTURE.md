# Web Game Engine - Architecture Documentation

This document provides an in-depth look at the architecture and design patterns used in the Web Game Engine.

## Overview

The Web Game Engine follows a **component-based architecture** similar to Unity, where game objects are containers that hold modular, reusable components. This architecture provides flexibility and promotes code reuse.

## Core Architecture Patterns

### 1. Entity-Component-System (ECS)

**GameObjects** are entities that serve as containers for components. They have minimal logic themselves and delegate behavior to their attached components.

**Components** are modular behaviors and data that can be attached to GameObjects. Each component handles a specific aspect of functionality (rendering, physics, audio, etc.).

**Systems** (like the rendering system, physics system) operate on components to provide engine-wide functionality.

```typescript
// Example: A game object with multiple components
const player = scene.createGameObject('Player');
player.addComponent(MeshRenderer);  // Visual representation
player.addComponent(RigidBody);     // Physics simulation
player.addComponent(AudioSource);   // Sound effects
player.addComponent(PlayerController); // Custom logic
```

### 2. Transform Hierarchy

Every GameObject has a Transform component that manages its position, rotation, and scale. Transforms can be organized in parent-child hierarchies:

- **Local Space**: Position/rotation/scale relative to parent
- **World Space**: Absolute position/rotation/scale in the scene
- **Matrix Caching**: Transformation matrices are cached and only recalculated when needed
- **Dirty Flagging**: Changes propagate down the hierarchy efficiently

```
Parent Transform
├── Child 1 Transform
│   ├── Grandchild 1
│   └── Grandchild 2
└── Child 2 Transform
```

When a parent moves, all children automatically move with it through matrix multiplication.

### 3. Scene Management

Scenes are self-contained environments that hold all GameObjects for a particular level or menu:

- **Scene Loading**: Scenes can be loaded synchronously or asynchronously
- **Additive Loading**: Multiple scenes can be loaded simultaneously
- **Scene Transitions**: Old scenes are unloaded before new ones load (or kept for additive loading)
- **Persistent Objects**: Objects can be marked to survive scene transitions

### 4. Component Lifecycle

Components follow a well-defined lifecycle managed by the engine:

```
Creation → Awake → OnEnable → Start → Update Loop → OnDisable → OnDestroy
                                  ↓
                            Update/FixedUpdate/LateUpdate
```

- **Awake**: Initialize component data (runs once)
- **Start**: Setup that depends on other components (runs before first update)
- **Update**: Per-frame game logic
- **FixedUpdate**: Fixed-timestep physics logic
- **LateUpdate**: Post-update logic (e.g., camera following)

## Major Systems

### Rendering Pipeline

The rendering system processes scene data through multiple stages:

1. **Culling**: Determine what's visible to each camera
2. **Sorting**: Group objects by material to minimize state changes
3. **Rendering**: Issue draw calls to WebGL
4. **Post-Processing**: Apply screen-space effects

```
Camera → Culling → Sorting → Draw Calls → Post-Processing → Screen
```

**Camera System**:
- Multiple cameras can render to different parts of screen
- Cameras are sorted by depth (higher depth renders on top)
- Each camera has its own projection matrix (perspective/orthographic)
- View matrix is calculated from camera's transform

**Material System**:
- Materials combine shaders with properties (colors, textures)
- Shader programs run on GPU to calculate pixel colors
- Uniforms pass data from CPU to GPU (matrices, colors, etc.)

**Mesh System**:
- Vertex data (positions, normals, UVs) stored in GPU buffers
- Vertex Array Objects (VAOs) cache attribute configurations
- Index buffers reduce memory usage for shared vertices

### Main Engine Loop

The engine runs a continuous loop coordinating all systems:

```typescript
function gameLoop(timestamp) {
  updateTime(timestamp);

  // Physics (fixed timestep)
  while (accumulator >= fixedDeltaTime) {
    fixedUpdate();
    accumulator -= fixedDeltaTime;
  }

  // Game logic (variable timestep)
  update(deltaTime);

  // Post-update logic
  lateUpdate(deltaTime);

  // Rendering
  render();

  // Input cleanup
  inputUpdate();

  requestAnimationFrame(gameLoop);
}
```

**Fixed Timestep Physics**:
- Physics runs at a fixed rate (default 50 times per second)
- Accumulates frame time and runs multiple physics steps if needed
- Prevents "spiral of death" with maximum iteration limit
- Ensures deterministic physics simulation

### Time Management

Time system provides frame-independent movement:

- **deltaTime**: Time since last frame (scaled by timeScale)
- **fixedDeltaTime**: Fixed physics timestep
- **time**: Total elapsed time
- **timeScale**: Global time multiplier (for slow-motion/fast-forward)
- **FPS Counter**: Tracks frames per second

### Input System

Input abstraction layer supporting multiple input devices:

**Keyboard**:
```typescript
Input.getKey('Space');      // Held down
Input.getKeyDown('Space');  // Just pressed
Input.getKeyUp('Space');    // Just released
```

**Mouse**:
```typescript
Input.getMouseButton(0);    // Left button
Input.mousePosition;        // Screen coordinates
Input.mouseDelta;           // Movement since last frame
Input.mouseWheel;           // Scroll amount
```

**Virtual Axes**:
```typescript
Input.getAxis('Horizontal'); // -1 to 1 (A/D or Left/Right)
Input.getAxis('Vertical');   // -1 to 1 (W/S or Up/Down)
```

Input state is cleared at the end of each frame to properly detect "down" and "up" events.

### Audio System

3D spatial audio using Web Audio API:

**AudioSource Component**:
- Plays audio from GameObject position
- Supports loop, pitch, and volume control
- 3D panning based on listener position
- Distance attenuation for realistic falloff

**AudioManager**:
- Manages global audio context
- Updates listener position from main camera
- Handles audio context state (for browser autoplay policies)

## Mathematics Library

### Vector3

3D vector with x, y, z components:
- Arithmetic operations (add, subtract, multiply, divide)
- Dot product (for angle between vectors)
- Cross product (for perpendicular vector)
- Length and normalization
- Linear interpolation (lerp)
- Matrix transformation

### Quaternion

Rotation representation avoiding gimbal lock:
- Conversion to/from Euler angles
- Conversion to/from axis-angle
- Multiplication for combining rotations
- Spherical interpolation (slerp) for smooth rotation
- No gimbal lock issues unlike Euler angles

### Matrix4

4x4 transformation matrix (column-major order for WebGL):
- Compose from position, rotation (quaternion), and scale
- Decompose into position, rotation, scale
- Matrix multiplication
- Inversion
- Perspective and orthographic projection matrices
- Look-at view matrix

## Memory Management

### Object Lifecycle

- **Creation**: Objects are created via constructors or factory methods
- **References**: GameObjects hold references to components
- **Destruction**: Explicit destroy() calls remove objects
- **Cleanup**: onDestroy() hooks allow proper resource cleanup

### GPU Resources

- **Buffers**: Created for mesh data, destroyed when mesh is destroyed
- **Shaders**: Compiled once, shared across materials
- **VAOs**: Cached to avoid redundant GPU state changes
- **Textures**: (Future) Reference counted for sharing

### Future Optimizations

- **Object Pooling**: Reuse frequently created/destroyed objects
- **Memory Pools**: Reduce allocation overhead
- **Batch Rendering**: Combine multiple objects into single draw calls
- **Instanced Rendering**: Draw many copies of same mesh efficiently

## Design Patterns

### 1. Singleton Pattern

Used for global managers:
- Engine
- SceneManager
- Time
- Input
- AudioManager

These exist once per application and are accessed via static `.instance` property.

### 2. Component Pattern

GameObjects are composed of components rather than using inheritance:
- Promotes code reuse
- Allows runtime composition
- Avoids diamond inheritance problem
- Easy to add/remove behaviors

### 3. Observer Pattern

Event system allows loose coupling:
- Components subscribe to events
- Events fire when conditions met
- No direct dependencies between systems

### 4. State Pattern

Used in animation systems (future):
- Animation states
- Transitions between states
- State machines for AI

### 5. Object Pool Pattern

For performance-critical objects (future):
- Reuse objects instead of creating new ones
- Reduces garbage collection pressure
- Important for particles, bullets, etc.

## Performance Considerations

### Rendering

- **Frustum Culling**: Skip objects outside camera view
- **Batching**: Combine objects with same material
- **Level of Detail**: Use simpler meshes for distant objects
- **Occlusion Culling**: Skip objects hidden behind others

### Update Loop

- **Dirty Flags**: Only recalculate when needed (transforms, matrices)
- **Spatial Partitioning**: Quick lookup of nearby objects (octrees, grids)
- **Early Exits**: Skip disabled components and inactive objects

### Memory

- **Object Pooling**: Reuse objects to avoid allocations
- **Typed Arrays**: Use Float32Array, Uint16Array for performance
- **Shared Resources**: Materials and meshes shared between objects

## Extensibility

### Creating Custom Components

```typescript
import { Component } from 'web-game-engine';

export class CustomComponent extends Component {
  // Properties
  myProperty: number = 0;

  // Lifecycle methods
  protected awake(): void {
    // Initialize
  }

  protected start(): void {
    // Setup that depends on other components
  }

  protected update(deltaTime: number): void {
    // Per-frame logic
  }

  protected onDestroy(): void {
    // Cleanup
  }
}
```

### Creating Custom Shaders

```typescript
const vertexShader = `#version 300 es
  // Your vertex shader code
`;

const fragmentShader = `#version 300 es
  // Your fragment shader code
`;

const shader = new Shader(gl, vertexShader, fragmentShader);
const material = new Material(shader);
```

### Extending the Engine

The engine is designed to be extended:
- Add new component types
- Create custom rendering pipelines
- Implement new input devices
- Add physics systems
- Build editor tools

## Future Architecture Improvements

### Physics System
- Broad phase collision detection (spatial partitioning)
- Narrow phase collision (SAT, GJK)
- Constraint solver for joints
- Continuous collision detection

### Animation System
- Skeletal animation with bone hierarchies
- Animation state machines
- Blend trees for smooth transitions
- Inverse kinematics (IK)

### Asset Pipeline
- GLTF/GLB model loading
- Texture compression
- Async asset streaming
- Asset bundles for web delivery

### Editor
- Visual scene editor
- Component inspector
- Asset browser
- Play mode testing

## Conclusion

This architecture provides a solid foundation for building 3D web games. It balances flexibility, performance, and ease of use while remaining extensible for future enhancements. The component-based design allows developers to build complex behaviors from simple, reusable pieces.
