# Web Game Engine - Editor

A Unity-like visual editor for creating 3D games in the browser!

## 🎮 Features

### Visual Scene Editor
- **Hierarchy Panel**: View and organize all GameObjects in your scene
- **Inspector Panel**: Edit GameObject properties, transform, and components
- **3D Viewport**: Navigate and view your scene in real-time 3D
- **Asset Browser**: Manage game assets and resources
- **Console**: View logs, warnings, and errors

### Tools & Controls
- **Select Tool (Q)**: Select and focus GameObjects
- **Move Tool (W)**: Translate objects in 3D space
- **Rotate Tool (E)**: Rotate objects
- **Scale Tool (R)**: Scale objects uniformly or per-axis

### GameObject Creation
- Create Empty GameObjects
- Built-in primitives: Cube, Sphere, Plane
- Add Cameras and Lights
- Component-based architecture

### Camera Controls
- **Orbit**: Middle Mouse Button or Alt + Left Click
- **Rotate View**: Right Mouse Button
- **Zoom**: Mouse Wheel
- **Focus (F)**: Focus camera on selected object

### Scene Management
- Create new scenes
- Save scenes as JSON
- Load existing scenes
- Play/Pause/Stop mode for testing

## 🚀 Quick Start

### Installation

1. Install dependencies:
```bash
npm install
```

2. Build the engine:
```bash
npm run build
```

3. Start the editor:
```bash
npm run editor
```

The editor will open automatically in your browser at `http://localhost:8080/editor/index.html`

### Alternative: Manual Start

```bash
# Build and watch for changes
npm run dev

# In another terminal, serve the files
npm run serve
```

Then navigate to `http://localhost:8080/editor/index.html`

## 📋 Editor Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Menu Bar [New | Open | Save | Play | Stop | Create Objects]     │
├──────────┬────────────────────────────────────┬─────────────────┤
│          │                                    │                 │
│ Hierarchy│         3D Viewport                │   Inspector     │
│          │                                    │                 │
│  ├─Camera│    [Your 3D Scene Here]           │  ┌───────────┐  │
│  ├─Light │                                    │  │ Transform │  │
│  └─Cube  │                                    │  │  Pos: XYZ │  │
│          │                                    │  │  Rot: XYZ │  │
│          │                                    │  │  Scl: XYZ │  │
│          │                                    │  └───────────┘  │
├──────────┴────────────────────────────────────┴─────────────────┤
│  Assets / Console                                               │
│  [Asset thumbnails...] | [Console messages...]                  │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Creating Your First Scene

### 1. Create GameObjects

Click on the menu bar buttons to create objects:
- **Cube**: Creates a 3D cube
- **Sphere**: Creates a 3D sphere
- **Plane**: Creates a flat plane (good for ground)
- **Light**: Creates a light source
- **Camera**: Creates a camera

### 2. Select and Edit

- Click on objects in the **Hierarchy** to select them
- Use the **Inspector** to edit properties:
  - **Position**: Move object in X, Y, Z
  - **Rotation**: Rotate object in degrees
  - **Scale**: Resize object

### 3. Navigate the Scene

- **Orbit Camera**: Hold Middle Mouse and drag
- **Rotate View**: Hold Right Mouse and drag
- **Zoom**: Scroll mouse wheel
- **Focus on Object**: Select object and press **F**

### 4. Save Your Work

- Click **Save** in the menu bar
- Scene is exported as JSON
- Can be loaded later

## ⌨️ Keyboard Shortcuts

### Tools
- **Q**: Select Tool
- **W**: Move Tool
- **E**: Rotate Tool
- **R**: Scale Tool

### Actions
- **F**: Focus on selected object
- **Delete**: Delete selected object
- **Ctrl+D**: Duplicate selected object
- **Ctrl+C**: Copy selected object
- **Ctrl+V**: Paste object
- **Ctrl+S**: Save scene

## 🎨 Creating The Gamer RPG

This editor is the foundation for building "The Gamer" RPG! Here's how to use it:

### 1. Build Visaginas City
- Create terrain with Planes
- Add buildings with scaled Cubes
- Place lights for day/night
- Position cameras for different views

### 2. Create Characters
- Import 3D models (when asset system is ready)
- Add MeshRenderer components
- Position in scene

### 3. Design Dungeons
- Layout dungeon rooms with primitives
- Add lighting for atmosphere
- Place spawn points for enemies

### 4. Test Gameplay
- Click **Play** to test in the editor
- Use **Pause** to inspect state
- Click **Stop** to return to editing

## 🔧 Component System

GameObjects are composed of Components:

### Built-in Components
- **Transform**: Position, rotation, scale (every GameObject has this)
- **MeshRenderer**: Renders a 3D mesh
- **Camera**: Views the scene
- **Light**: Illuminates the scene

### Adding Components (Coming Soon)
- Click "Add Component" in Inspector
- Select component type
- Configure properties

## 📦 Asset Management

### Supported Asset Types (Coming Soon)
- **3D Models**: .obj, .gltf, .glb
- **Textures**: .png, .jpg
- **Materials**: Custom materials
- **Audio**: .mp3, .wav
- **Scripts**: Custom behaviors

### Importing Assets
1. Click "Import" in Assets panel
2. Select files
3. Assets appear in browser
4. Drag onto GameObjects to apply

## 🎮 Play Mode

### Testing Your Game
1. Click **Play** button
2. Game runs in viewport
3. Use **Pause** to freeze
4. Click **Stop** to return to editing

**Note**: Changes made in Play mode are NOT saved!

## 🐛 Console

The console shows:
- **Info**: General messages (blue)
- **Warnings**: Non-critical issues (orange)
- **Errors**: Critical problems (red)

Filter messages with checkboxes. Click "Clear" to reset.

## 🚧 Roadmap

### Phase 1: Core Editor ✅
- [x] Basic UI layout
- [x] Hierarchy panel
- [x] Inspector panel
- [x] Viewport with camera controls
- [x] GameObject creation (primitives)
- [x] Scene save/load

### Phase 2: Advanced Editing (In Progress)
- [ ] Gizmos (visual transform handles)
- [ ] Grid snapping
- [ ] Undo/Redo system
- [ ] Prefab system
- [ ] Component adding UI

### Phase 3: Asset Pipeline
- [ ] Model importing (.gltf, .glb)
- [ ] Texture importing
- [ ] Material editor
- [ ] Audio import

### Phase 4: Game-Specific Features
- [ ] Character controller component
- [ ] Inventory system UI
- [ ] Quest editor
- [ ] Dialogue system
- [ ] Instant Dungeon designer

### Phase 5: RPG Editor Extensions
- [ ] NPC editor
- [ ] Stats editor
- [ ] Skill tree designer
- [ ] Map editor for Visaginas
- [ ] Combat encounter designer

## 💡 Tips & Tricks

1. **Performance**: Keep GameObjects under 1000 for good editor performance
2. **Organization**: Use empty GameObjects as folders in hierarchy
3. **Naming**: Give descriptive names to GameObjects
4. **Backups**: Save often! Scenes are just JSON files
5. **Testing**: Use Play mode frequently to test changes

## 🤝 Contributing

This editor is part of the Web Game Engine project. To contribute:

1. Check the GitHub issues
2. Create a feature branch
3. Make your changes
4. Test in the editor
5. Submit a pull request

## 📝 Technical Details

### Architecture
- **Frontend**: Pure JavaScript + WebGL2
- **UI**: Custom CSS with modern layout
- **3D Engine**: Custom engine (see `/src`)
- **Scene Format**: JSON

### Browser Support
- Chrome 56+ (recommended)
- Firefox 51+
- Safari 15+
- Edge 79+

Requires WebGL2 support.

### File Structure
```
editor/
├── index.html          # Main editor page
├── css/
│   └── editor.css     # Editor styles
├── js/
│   └── editor.js      # Editor logic
└── README.md          # This file
```

## 🎓 Learning Resources

### For Unity Users
This editor mimics Unity's workflow:
- Hierarchy = Unity Hierarchy
- Inspector = Unity Inspector
- Scene View = Unity Scene View
- Console = Unity Console

Most Unity concepts translate directly!

### For Beginners
1. Start by creating simple scenes
2. Experiment with primitives
3. Learn transform manipulation
4. Progress to complex scenes

## 🆘 Troubleshooting

### Editor Won't Load
- Check browser console for errors
- Ensure you ran `npm run build`
- Try clearing browser cache

### Can't See Objects
- Check camera position
- Ensure objects aren't at 0,0,0 with camera
- Adjust camera distance (zoom)

### Performance Issues
- Reduce number of GameObjects
- Simplify meshes
- Close other browser tabs

### Save/Load Not Working
- Check browser console
- Ensure file system permissions
- Try different browser

## 📧 Support

For issues or questions:
1. Check this README
2. Check main project README
3. Open a GitHub issue
4. Check console for error messages

## 📄 License

MIT License - Same as the main Web Game Engine project

---

**Happy game creation! Now let's build "The Gamer" RPG! 🎮**
