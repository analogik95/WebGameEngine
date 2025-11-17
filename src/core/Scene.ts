import { GameObject } from './GameObject';

/**
 * Scene represents a level or environment in the game
 * Contains all GameObjects and manages their lifecycle
 */
export class Scene {
  public readonly name: string;
  private _gameObjects: GameObject[] = [];
  private _rootGameObjects: GameObject[] = [];
  private _loaded: boolean = false;

  constructor(name: string) {
    this.name = name;
  }

  /**
   * Whether this scene is loaded
   */
  get isLoaded(): boolean {
    return this._loaded;
  }

  /**
   * Gets all GameObjects in the scene
   */
  get gameObjects(): readonly GameObject[] {
    return this._gameObjects;
  }

  /**
   * Gets all root GameObjects (objects without parents) in the scene
   */
  get rootGameObjects(): readonly GameObject[] {
    return this._rootGameObjects;
  }

  /**
   * Adds a GameObject to the scene
   */
  addGameObject(gameObject: GameObject): void {
    if (this._gameObjects.includes(gameObject)) return;

    this._gameObjects.push(gameObject);
    gameObject.setScene(this);

    // Track root objects
    if (!gameObject.transform.parent) {
      this._rootGameObjects.push(gameObject);
    }

    // If scene is already loaded, awake and start the object
    if (this._loaded) {
      gameObject.internal_awake();
      gameObject.internal_start();
    }
  }

  /**
   * Removes a GameObject from the scene
   */
  removeGameObject(gameObject: GameObject): void {
    const index = this._gameObjects.indexOf(gameObject);
    if (index !== -1) {
      this._gameObjects.splice(index, 1);
      gameObject.setScene(null);
    }

    const rootIndex = this._rootGameObjects.indexOf(gameObject);
    if (rootIndex !== -1) {
      this._rootGameObjects.splice(rootIndex, 1);
    }
  }

  /**
   * Finds a GameObject by name
   */
  findGameObject(name: string): GameObject | null {
    return this._gameObjects.find(obj => obj.name === name) || null;
  }

  /**
   * Finds all GameObjects with a specific name
   */
  findGameObjects(name: string): GameObject[] {
    return this._gameObjects.filter(obj => obj.name === name);
  }

  /**
   * Creates a new GameObject in this scene
   */
  createGameObject(name?: string): GameObject {
    const gameObject = new GameObject(name);
    this.addGameObject(gameObject);
    return gameObject;
  }

  /**
   * @internal - Called when scene is loaded
   */
  internal_load(): void {
    if (this._loaded) return;
    this._loaded = true;

    // Awake all objects
    for (const gameObject of this._gameObjects) {
      gameObject.internal_awake();
    }

    // Start all objects
    for (const gameObject of this._gameObjects) {
      gameObject.internal_start();
    }

    this.onLoad();
  }

  /**
   * @internal - Called when scene is unloaded
   */
  internal_unload(): void {
    if (!this._loaded) return;
    this._loaded = false;

    this.onUnload();

    // Destroy all objects (make a copy as destroy modifies the array)
    for (const gameObject of [...this._gameObjects]) {
      gameObject.destroy();
    }

    this._gameObjects = [];
    this._rootGameObjects = [];
  }

  /**
   * @internal - Called by Engine every frame
   */
  internal_update(deltaTime: number): void {
    // Update all objects (make a copy as update might destroy objects)
    for (const gameObject of [...this._gameObjects]) {
      if (!gameObject.isDestroyed) {
        gameObject.internal_update(deltaTime);
      }
    }
  }

  /**
   * @internal - Called by Engine at fixed intervals
   */
  internal_fixedUpdate(fixedDeltaTime: number): void {
    for (const gameObject of [...this._gameObjects]) {
      if (!gameObject.isDestroyed) {
        gameObject.internal_fixedUpdate(fixedDeltaTime);
      }
    }
  }

  /**
   * @internal - Called by Engine after all updates
   */
  internal_lateUpdate(deltaTime: number): void {
    for (const gameObject of [...this._gameObjects]) {
      if (!gameObject.isDestroyed) {
        gameObject.internal_lateUpdate(deltaTime);
      }
    }
  }

  // ========== Lifecycle Hooks (Override in subclasses) ==========

  /**
   * Called when the scene is loaded
   */
  protected onLoad(): void {}

  /**
   * Called when the scene is unloaded
   */
  protected onUnload(): void {}
}

/**
 * SceneManager handles loading, unloading, and transitioning between scenes
 */
export class SceneManager {
  private static _instance: SceneManager;
  private _scenes: Map<string, Scene> = new Map();
  private _activeScene: Scene | null = null;
  private _loadedScenes: Scene[] = [];

  private constructor() {}

  static get instance(): SceneManager {
    if (!SceneManager._instance) {
      SceneManager._instance = new SceneManager();
    }
    return SceneManager._instance;
  }

  /**
   * Gets the currently active scene
   */
  get activeScene(): Scene | null {
    return this._activeScene;
  }

  /**
   * Gets all loaded scenes
   */
  get loadedScenes(): readonly Scene[] {
    return this._loadedScenes;
  }

  /**
   * Registers a scene
   */
  registerScene(scene: Scene): void {
    this._scenes.set(scene.name, scene);
  }

  /**
   * Loads a scene by name
   */
  async loadScene(name: string, mode: 'single' | 'additive' = 'single'): Promise<Scene> {
    const scene = this._scenes.get(name);
    if (!scene) {
      throw new Error(`Scene '${name}' not found. Did you register it?`);
    }

    if (mode === 'single') {
      // Unload all currently loaded scenes
      await this.unloadAllScenes();
    }

    // Load the scene
    if (!scene.isLoaded) {
      scene.internal_load();
      this._loadedScenes.push(scene);
    }

    // Set as active scene
    this._activeScene = scene;

    return scene;
  }

  /**
   * Unloads a scene by name
   */
  async unloadScene(name: string): Promise<void> {
    const scene = this._scenes.get(name);
    if (!scene || !scene.isLoaded) {
      return;
    }

    scene.internal_unload();

    const index = this._loadedScenes.indexOf(scene);
    if (index !== -1) {
      this._loadedScenes.splice(index, 1);
    }

    // If this was the active scene, set a new active scene
    if (this._activeScene === scene) {
      this._activeScene = this._loadedScenes[0] || null;
    }
  }

  /**
   * Unloads all scenes
   */
  async unloadAllScenes(): Promise<void> {
    for (const scene of [...this._loadedScenes]) {
      await this.unloadScene(scene.name);
    }
  }

  /**
   * Creates and registers a new scene
   */
  createScene(name: string): Scene {
    const scene = new Scene(name);
    this.registerScene(scene);
    return scene;
  }

  /**
   * Gets a scene by name
   */
  getScene(name: string): Scene | undefined {
    return this._scenes.get(name);
  }

  /**
   * @internal - Called by Engine every frame
   */
  internal_update(deltaTime: number): void {
    for (const scene of this._loadedScenes) {
      scene.internal_update(deltaTime);
    }
  }

  /**
   * @internal - Called by Engine at fixed intervals
   */
  internal_fixedUpdate(fixedDeltaTime: number): void {
    for (const scene of this._loadedScenes) {
      scene.internal_fixedUpdate(fixedDeltaTime);
    }
  }

  /**
   * @internal - Called by Engine after all updates
   */
  internal_lateUpdate(deltaTime: number): void {
    for (const scene of this._loadedScenes) {
      scene.internal_lateUpdate(deltaTime);
    }
  }
}
