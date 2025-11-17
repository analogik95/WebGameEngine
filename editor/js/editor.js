/**
 * Web Game Engine Editor
 * Unity-like editor interface for scene creation
 */

import {
    Engine,
    Scene,
    GameObject,
    Camera,
    MeshRenderer,
    Light,
    LightType,
    Mesh,
    Material,
    Shader,
    ShaderLibrary,
    Vector3,
    Quaternion,
    Input,
    Time
} from '../../dist/index.js';

class GameEditor {
    constructor() {
        this.engine = null;
        this.scene = null;
        this.selectedObject = null;
        this.editorCamera = null;
        this.isPlaying = false;
        this.isPaused = false;
        this.currentTool = 'select';
        this.showGrid = true;
        this.clipboard = null;

        // Editor state
        this.cameraDistance = 10;
        this.cameraYaw = 0;
        this.cameraPitch = 30;
        this.cameraTarget = new Vector3(0, 0, 0);

        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
    }

    async initialize() {
        console.log('Initializing editor...');

        try {
            // Get canvas
            const canvas = document.getElementById('gameCanvas');
            if (!canvas) {
                throw new Error('Canvas not found');
            }

            // Initialize engine
            this.engine = Engine.instance;
            this.engine.initialize(canvas);

            // Create default scene
            await this.createDefaultScene();

            // Setup editor controls
            this.setupControls();

            // Start editor loop
            this.engine.start();

            // Update UI
            this.updateHierarchy();
            this.updateInspector();

            // Start FPS counter
            this.startFPSCounter();

            this.log('Editor initialized successfully', 'info');
        } catch (error) {
            this.log('Failed to initialize editor: ' + error.message, 'error');
            console.error(error);
        }
    }

    async createDefaultScene() {
        console.log('Creating default scene...');

        // Create scene
        this.scene = this.engine.sceneManager.createScene('NewScene');

        // Create editor camera
        const cameraObj = this.scene.createGameObject('EditorCamera');
        this.editorCamera = cameraObj.addComponent(Camera);
        cameraObj.transform.position = new Vector3(5, 5, 5);
        cameraObj.transform.lookAt(new Vector3(0, 0, 0));

        // Create default light
        const lightObj = this.scene.createGameObject('Directional Light');
        const light = lightObj.addComponent(Light);
        light.type = LightType.Directional;
        light.color = new Vector3(1, 1, 1);
        light.intensity = 1;
        lightObj.transform.rotation = Quaternion.fromEuler(-45, 45, 0);

        // Load scene
        await this.engine.sceneManager.loadScene('NewScene');

        console.log('Default scene created');
    }

    setupControls() {
        const canvas = document.getElementById('gameCanvas');

        // Mouse controls for camera
        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        canvas.addEventListener('wheel', (e) => this.onMouseWheel(e));
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.onKeyDown(e));

        // Resize handling
        window.addEventListener('resize', () => this.onResize());

        // Context menu
        document.addEventListener('click', (e) => {
            const contextMenu = document.getElementById('contextMenu');
            if (!contextMenu.contains(e.target)) {
                contextMenu.style.display = 'none';
            }
        });
    }

    onMouseDown(e) {
        const canvas = document.getElementById('gameCanvas');
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            // Middle mouse or Alt+Left = Orbit camera
            this.isDragging = true;
            this.dragMode = 'orbit';
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            canvas.style.cursor = 'grab';
        } else if (e.button === 2) {
            // Right mouse = Rotate view
            this.isDragging = true;
            this.dragMode = 'rotate';
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            canvas.style.cursor = 'grabbing';
        } else if (e.button === 0) {
            // Left mouse = Select object or gizmo manipulation
            this.selectObjectAtPoint(x, y);
        }
    }

    onMouseMove(e) {
        if (!this.isDragging) return;

        const canvas = document.getElementById('gameCanvas');
        const deltaX = e.clientX - this.lastMouseX;
        const deltaY = e.clientY - this.lastMouseY;

        if (this.dragMode === 'orbit') {
            // Orbit camera around target
            this.cameraYaw -= deltaX * 0.5;
            this.cameraPitch -= deltaY * 0.5;
            this.cameraPitch = Math.max(-89, Math.min(89, this.cameraPitch));
            this.updateEditorCamera();
        } else if (this.dragMode === 'rotate') {
            // Free look
            this.cameraYaw -= deltaX * 0.5;
            this.cameraPitch -= deltaY * 0.5;
            this.cameraPitch = Math.max(-89, Math.min(89, this.cameraPitch));
            this.updateEditorCamera();
        }

        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
    }

    onMouseUp(e) {
        this.isDragging = false;
        this.dragMode = null;
        const canvas = document.getElementById('gameCanvas');
        canvas.style.cursor = 'default';
    }

    onMouseWheel(e) {
        e.preventDefault();
        this.cameraDistance += e.deltaY * 0.01;
        this.cameraDistance = Math.max(1, Math.min(100, this.cameraDistance));
        this.updateEditorCamera();
    }

    updateEditorCamera() {
        if (!this.editorCamera) return;

        const yawRad = this.cameraYaw * Math.PI / 180;
        const pitchRad = this.cameraPitch * Math.PI / 180;

        const x = this.cameraTarget.x + this.cameraDistance * Math.cos(pitchRad) * Math.sin(yawRad);
        const y = this.cameraTarget.y + this.cameraDistance * Math.sin(pitchRad);
        const z = this.cameraTarget.z + this.cameraDistance * Math.cos(pitchRad) * Math.cos(yawRad);

        this.editorCamera.gameObject.transform.position = new Vector3(x, y, z);
        this.editorCamera.gameObject.transform.lookAt(this.cameraTarget);
    }

    onKeyDown(e) {
        // Tool shortcuts
        if (e.key === 'q' || e.key === 'Q') this.selectTool('select');
        if (e.key === 'w' || e.key === 'W') this.selectTool('move');
        if (e.key === 'e' || e.key === 'E') this.selectTool('rotate');
        if (e.key === 'r' || e.key === 'R') this.selectTool('scale');

        // Delete selected
        if (e.key === 'Delete' && this.selectedObject) {
            this.deleteSelected();
        }

        // Duplicate
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            this.duplicateSelected();
        }

        // Copy/Paste
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
            e.preventDefault();
            this.copySelected();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
            e.preventDefault();
            this.pasteSelected();
        }

        // Save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.saveScene();
        }

        // Focus on selected (F key)
        if (e.key === 'f' || e.key === 'F') {
            if (this.selectedObject) {
                this.focusOnObject(this.selectedObject);
            }
        }
    }

    onResize() {
        const canvas = document.getElementById('gameCanvas');
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        if (this.editorCamera) {
            this.editorCamera.aspect = canvas.width / canvas.height;
        }
    }

    selectObjectAtPoint(x, y) {
        // TODO: Implement ray casting to select objects
        // For now, just log
        console.log('Click at', x, y);
    }

    focusOnObject(obj) {
        this.cameraTarget = obj.transform.position.clone();
        this.updateEditorCamera();
    }

    // UI Update Methods

    updateHierarchy() {
        const hierarchyTree = document.getElementById('hierarchyTree');
        hierarchyTree.innerHTML = '';

        if (!this.scene) return;

        this.scene.gameObjects.forEach(obj => {
            if (!obj.transform.parent) {
                this.addHierarchyItem(obj, hierarchyTree);
            }
        });
    }

    addHierarchyItem(obj, parent) {
        const item = document.createElement('div');
        item.className = 'hierarchy-item';
        if (obj === this.selectedObject) {
            item.classList.add('selected');
        }

        const icon = obj.getComponent(Camera) ? 'fa-camera' :
                    obj.getComponent(Light) ? 'fa-lightbulb' :
                    obj.getComponent(MeshRenderer) ? 'fa-cube' : 'fa-square';

        item.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${obj.name}</span>
        `;

        item.onclick = () => {
            this.selectObject(obj);
        };

        parent.appendChild(item);
    }

    selectObject(obj) {
        this.selectedObject = obj;
        this.updateHierarchy();
        this.updateInspector();
    }

    updateInspector() {
        const inspectorContent = document.getElementById('inspectorContent');

        if (!this.selectedObject) {
            inspectorContent.innerHTML = `
                <div class="no-selection">
                    <i class="fas fa-cube"></i>
                    <p>Select a GameObject to view its properties</p>
                </div>
            `;
            return;
        }

        const obj = this.selectedObject;
        const transform = obj.transform;

        let html = `
            <div class="inspector-section">
                <div class="inspector-section-header">
                    <i class="fas fa-cube"></i> ${obj.name}
                </div>
                <div class="inspector-field">
                    <div class="inspector-label">Name</div>
                    <input type="text" class="inspector-input" value="${obj.name}"
                           onchange="editor.renameObject('${obj.name}', this.value)">
                </div>
            </div>

            <div class="inspector-section">
                <div class="inspector-section-header">
                    <i class="fas fa-arrows-alt"></i> Transform
                </div>
                <div class="inspector-field">
                    <div class="inspector-label">Position</div>
                    <div class="inspector-vector">
                        <input type="number" class="inspector-input" value="${transform.position.x.toFixed(2)}"
                               onchange="editor.setPosition('x', parseFloat(this.value))" step="0.1">
                        <input type="number" class="inspector-input" value="${transform.position.y.toFixed(2)}"
                               onchange="editor.setPosition('y', parseFloat(this.value))" step="0.1">
                        <input type="number" class="inspector-input" value="${transform.position.z.toFixed(2)}"
                               onchange="editor.setPosition('z', parseFloat(this.value))" step="0.1">
                    </div>
                </div>
                <div class="inspector-field">
                    <div class="inspector-label">Rotation</div>
                    <div class="inspector-vector">
                        <input type="number" class="inspector-input" value="${transform.eulerAngles.x.toFixed(2)}"
                               onchange="editor.setRotation('x', parseFloat(this.value))" step="1">
                        <input type="number" class="inspector-input" value="${transform.eulerAngles.y.toFixed(2)}"
                               onchange="editor.setRotation('y', parseFloat(this.value))" step="1">
                        <input type="number" class="inspector-input" value="${transform.eulerAngles.z.toFixed(2)}"
                               onchange="editor.setRotation('z', parseFloat(this.value))" step="1">
                    </div>
                </div>
                <div class="inspector-field">
                    <div class="inspector-label">Scale</div>
                    <div class="inspector-vector">
                        <input type="number" class="inspector-input" value="${transform.scale.x.toFixed(2)}"
                               onchange="editor.setScale('x', parseFloat(this.value))" step="0.1">
                        <input type="number" class="inspector-input" value="${transform.scale.y.toFixed(2)}"
                               onchange="editor.setScale('y', parseFloat(this.value))" step="0.1">
                        <input type="number" class="inspector-input" value="${transform.scale.z.toFixed(2)}"
                               onchange="editor.setScale('z', parseFloat(this.value))" step="0.1">
                    </div>
                </div>
            </div>
        `;

        // Add component sections
        obj.components.forEach(comp => {
            if (comp.constructor.name !== 'Transform') {
                html += this.getComponentHTML(comp);
            }
        });

        html += `
            <div class="inspector-section">
                <button class="add-component-btn" onclick="editor.addComponentMenu()">
                    <i class="fas fa-plus"></i> Add Component
                </button>
            </div>
        `;

        inspectorContent.innerHTML = html;
    }

    getComponentHTML(component) {
        const name = component.constructor.name;
        return `
            <div class="inspector-section">
                <div class="inspector-section-header">
                    <i class="fas fa-cog"></i> ${name}
                </div>
                <div class="inspector-field">
                    <div class="inspector-label">Component active</div>
                    <input type="checkbox" checked>
                </div>
            </div>
        `;
    }

    // GameObject Creation Methods

    createGameObject(type) {
        if (!this.scene) {
            this.log('No scene loaded', 'error');
            return;
        }

        let obj;
        const gl = this.engine.gl;

        switch (type) {
            case 'Empty':
                obj = this.scene.createGameObject('GameObject');
                break;

            case 'Cube':
                obj = this.scene.createGameObject('Cube');
                const cubeRenderer = obj.addComponent(MeshRenderer);
                cubeRenderer.mesh = Mesh.createCube(1);
                cubeRenderer.material = this.createDefaultMaterial();
                break;

            case 'Sphere':
                obj = this.scene.createGameObject('Sphere');
                const sphereRenderer = obj.addComponent(MeshRenderer);
                sphereRenderer.mesh = Mesh.createSphere(1, 32, 32);
                sphereRenderer.material = this.createDefaultMaterial();
                break;

            case 'Plane':
                obj = this.scene.createGameObject('Plane');
                const planeRenderer = obj.addComponent(MeshRenderer);
                planeRenderer.mesh = Mesh.createPlane(10, 10);
                planeRenderer.material = this.createDefaultMaterial();
                break;

            case 'Light':
                obj = this.scene.createGameObject('Light');
                const light = obj.addComponent(Light);
                light.type = LightType.Point;
                light.intensity = 1;
                obj.transform.position = new Vector3(0, 3, 0);
                break;

            case 'Camera':
                obj = this.scene.createGameObject('Camera');
                obj.addComponent(Camera);
                obj.transform.position = new Vector3(0, 2, 5);
                break;
        }

        if (obj) {
            this.selectObject(obj);
            this.updateHierarchy();
            this.log(`Created ${type}`, 'info');
        }
    }

    createDefaultMaterial() {
        const gl = this.engine.gl;
        const shader = new Shader(gl, ShaderLibrary.litVertexShader, ShaderLibrary.litFragmentShader);
        return new Material(shader);
    }

    // Transform Manipulation

    setPosition(axis, value) {
        if (!this.selectedObject) return;
        const pos = this.selectedObject.transform.position;
        pos[axis] = value;
        this.selectedObject.transform.position = pos;
        this.updateInspector();
    }

    setRotation(axis, value) {
        if (!this.selectedObject) return;
        const rot = this.selectedObject.transform.eulerAngles;
        rot[axis] = value;
        this.selectedObject.transform.eulerAngles = rot;
        this.updateInspector();
    }

    setScale(axis, value) {
        if (!this.selectedObject) return;
        const scale = this.selectedObject.transform.scale;
        scale[axis] = value;
        this.selectedObject.transform.scale = scale;
        this.updateInspector();
    }

    renameObject(oldName, newName) {
        const obj = this.scene.gameObjects.find(o => o.name === oldName);
        if (obj) {
            obj.name = newName;
            this.updateHierarchy();
        }
    }

    // Tool Selection

    selectTool(tool) {
        this.currentTool = tool;

        // Update UI
        ['select', 'move', 'rotate', 'scale'].forEach(t => {
            const btn = document.getElementById(`tool${t.charAt(0).toUpperCase() + t.slice(1)}`);
            if (btn) {
                if (t === tool) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            }
        });

        this.log(`Tool: ${tool}`, 'info');
    }

    // Scene Management

    newScene() {
        if (confirm('Create new scene? Unsaved changes will be lost.')) {
            this.createDefaultScene().then(() => {
                this.updateHierarchy();
                this.updateInspector();
                this.log('New scene created', 'info');
            });
        }
    }

    saveScene() {
        if (!this.scene) return;

        const sceneData = {
            name: this.scene.name,
            gameObjects: []
        };

        this.scene.gameObjects.forEach(obj => {
            const objData = {
                name: obj.name,
                position: {
                    x: obj.transform.position.x,
                    y: obj.transform.position.y,
                    z: obj.transform.position.z
                },
                rotation: {
                    x: obj.transform.eulerAngles.x,
                    y: obj.transform.eulerAngles.y,
                    z: obj.transform.eulerAngles.z
                },
                scale: {
                    x: obj.transform.scale.x,
                    y: obj.transform.scale.y,
                    z: obj.transform.scale.z
                },
                components: []
            };

            obj.components.forEach(comp => {
                if (comp.constructor.name !== 'Transform') {
                    objData.components.push({
                        type: comp.constructor.name
                    });
                }
            });

            sceneData.gameObjects.push(objData);
        });

        const json = JSON.stringify(sceneData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.scene.name}.json`;
        a.click();

        this.log(`Scene saved: ${this.scene.name}.json`, 'info');
    }

    openScene() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const sceneData = JSON.parse(event.target.result);
                    this.loadSceneData(sceneData);
                    this.log(`Scene loaded: ${file.name}`, 'info');
                } catch (error) {
                    this.log(`Failed to load scene: ${error.message}`, 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    loadSceneData(sceneData) {
        // TODO: Implement scene loading from JSON
        this.log('Scene loading not fully implemented yet', 'warning');
    }

    // Play Mode

    togglePlay() {
        this.isPlaying = !this.isPlaying;

        const playBtn = document.getElementById('playButton');
        const pauseBtn = document.getElementById('pauseButton');
        const stopBtn = document.getElementById('stopButton');

        if (this.isPlaying) {
            playBtn.innerHTML = '<i class="fas fa-play"></i> Playing';
            playBtn.style.background = 'var(--accent-green)';
            pauseBtn.disabled = false;
            stopBtn.disabled = false;
            this.log('Play mode started', 'info');
        } else {
            playBtn.innerHTML = '<i class="fas fa-play"></i> Play';
            playBtn.style.background = '';
            pauseBtn.disabled = true;
            stopBtn.disabled = true;
            this.log('Play mode stopped', 'info');
        }
    }

    pause() {
        this.isPaused = !this.isPaused;
        // TODO: Implement pause logic
        this.log(this.isPaused ? 'Paused' : 'Resumed', 'info');
    }

    stop() {
        this.isPlaying = false;
        this.isPaused = false;
        this.togglePlay();
    }

    // Utilities

    duplicateSelected() {
        if (!this.selectedObject) return;
        // TODO: Implement duplication
        this.log('Duplication not implemented yet', 'warning');
    }

    deleteSelected() {
        if (!this.selectedObject) return;
        const name = this.selectedObject.name;
        this.scene.destroyGameObject(this.selectedObject);
        this.selectedObject = null;
        this.updateHierarchy();
        this.updateInspector();
        this.log(`Deleted: ${name}`, 'info');
    }

    copySelected() {
        if (!this.selectedObject) {
            this.clipboard = null;
            return;
        }
        this.clipboard = this.selectedObject;
        this.log('Copied to clipboard', 'info');
    }

    pasteSelected() {
        if (!this.clipboard) return;
        // TODO: Implement paste
        this.log('Paste not implemented yet', 'warning');
    }

    toggleGrid() {
        this.showGrid = !this.showGrid;
        this.log(`Grid: ${this.showGrid ? 'ON' : 'OFF'}`, 'info');
    }

    toggleWireframe() {
        // TODO: Implement wireframe mode
        this.log('Wireframe mode not implemented yet', 'warning');
    }

    setCameraView(view) {
        // TODO: Implement camera view presets
        this.log(`Camera view: ${view}`, 'info');
    }

    switchBottomTab(tab) {
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        event.target.classList.add('active');
        document.getElementById(`${tab}Tab`).classList.add('active');
    }

    refreshHierarchy() {
        this.updateHierarchy();
        this.log('Hierarchy refreshed', 'info');
    }

    addComponentMenu() {
        // TODO: Show component selection menu
        this.log('Add component menu not implemented yet', 'warning');
    }

    importAsset() {
        // TODO: Implement asset import
        this.log('Asset import not implemented yet', 'warning');
    }

    createFolder() {
        // TODO: Implement folder creation
        this.log('Folder creation not implemented yet', 'warning');
    }

    searchAssets(query) {
        // TODO: Implement asset search
        console.log('Search:', query);
    }

    clearConsole() {
        document.getElementById('consoleOutput').innerHTML = '';
    }

    log(message, type = 'info') {
        const consoleOutput = document.getElementById('consoleOutput');
        const messageDiv = document.createElement('div');
        messageDiv.className = `console-message ${type}`;

        const icon = type === 'error' ? 'fa-times-circle' :
                    type === 'warning' ? 'fa-exclamation-triangle' :
                    'fa-info-circle';

        messageDiv.innerHTML = `
            <span class="console-icon"><i class="fas ${icon}"></i></span>
            <span class="console-text">${message}</span>
        `;

        consoleOutput.appendChild(messageDiv);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;

        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    startFPSCounter() {
        setInterval(() => {
            const fps = Math.round(1 / Time.deltaTime);
            document.getElementById('fpsCounter').textContent = `FPS: ${fps}`;
        }, 500);
    }
}

// Create global editor instance
const editor = new GameEditor();
window.editor = editor;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    editor.initialize();
});

export default editor;
