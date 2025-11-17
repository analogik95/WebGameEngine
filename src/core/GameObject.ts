import { Component } from './Component';
import { Transform } from './Transform';
import { Scene } from './Scene';

let nextId = 0;

/**
 * GameObject is a container for components
 * Every object in a scene is a GameObject with various components attached
 */
export class GameObject {
  private static nextId = 0;

  public readonly id: number;
  public name: string;

  private _transform: Transform;
  private _components: Component[] = [];
  private _active: boolean = true;
  private _scene: Scene | null = null;
  private _destroyed: boolean = false;

  constructor(name: string = 'GameObject') {
    this.id = GameObject.nextId++;
    this.name = name;

    // Every GameObject has a Transform component
    this._transform = new Transform();
    this._transform.setGameObject(this);
    this._components.push(this._transform);
  }

  /**
   * The Transform component (every GameObject has one)
   */
  get transform(): Transform {
    return this._transform;
  }

  /**
   * The scene this GameObject belongs to
   */
  get scene(): Scene | null {
    return this._scene;
  }

  /**
   * @internal - Set by Scene
   */
  setScene(scene: Scene | null): void {
    this._scene = scene;
  }

  /**
   * Whether this GameObject is active in the scene
   */
  get activeSelf(): boolean {
    return this._active;
  }

  set activeSelf(value: boolean) {
    if (this._active === value) return;
    this._active = value;

    // Notify components
    for (const component of this._components) {
      if (value) {
        component['onEnable']?.();
      } else {
        component['onDisable']?.();
      }
    }
  }

  /**
   * Whether this GameObject is active in the hierarchy
   * (takes parent active state into account)
   */
  get activeInHierarchy(): boolean {
    if (!this._active) return false;

    const parent = this._transform.parent;
    if (parent && parent.gameObject) {
      return parent.gameObject.activeInHierarchy;
    }

    return true;
  }

  // ========== Component Management ==========

  /**
   * Adds a component to this GameObject
   */
  addComponent<T extends Component>(componentClass: new () => T): T {
    const component = new componentClass();
    component.setGameObject(this);
    this._components.push(component);

    // Call awake immediately
    component.internal_awake();

    // If we're already in a scene, start the component
    if (this._scene) {
      component.internal_start();
    }

    return component;
  }

  /**
   * Gets a component of the specified type
   */
  getComponent<T extends Component>(type: new (...args: any[]) => T): T | null {
    for (const component of this._components) {
      if (component instanceof type) {
        return component as T;
      }
    }
    return null;
  }

  /**
   * Gets all components of the specified type
   */
  getComponents<T extends Component>(type: new (...args: any[]) => T): T[] {
    const result: T[] = [];
    for (const component of this._components) {
      if (component instanceof type) {
        result.push(component as T);
      }
    }
    return result;
  }

  /**
   * Gets a component in the children of this GameObject
   */
  getComponentInChildren<T extends Component>(type: new (...args: any[]) => T, includeInactive: boolean = false): T | null {
    // Check this GameObject first
    const component = this.getComponent(type);
    if (component) return component;

    // Check children
    for (const child of this._transform.children) {
      if (child.gameObject) {
        if (includeInactive || child.gameObject.activeInHierarchy) {
          const childComponent = child.gameObject.getComponentInChildren(type, includeInactive);
          if (childComponent) return childComponent;
        }
      }
    }

    return null;
  }

  /**
   * Gets all components in the children of this GameObject
   */
  getComponentsInChildren<T extends Component>(type: new (...args: any[]) => T, includeInactive: boolean = false): T[] {
    const result: T[] = [];

    // Check this GameObject
    result.push(...this.getComponents(type));

    // Check children
    for (const child of this._transform.children) {
      if (child.gameObject) {
        if (includeInactive || child.gameObject.activeInHierarchy) {
          result.push(...child.gameObject.getComponentsInChildren(type, includeInactive));
        }
      }
    }

    return result;
  }

  /**
   * Gets a component in the parent of this GameObject
   */
  getComponentInParent<T extends Component>(type: new (...args: any[]) => T): T | null {
    // Check this GameObject first
    const component = this.getComponent(type);
    if (component) return component;

    // Check parent
    const parent = this._transform.parent;
    if (parent && parent.gameObject) {
      return parent.gameObject.getComponentInParent(type);
    }

    return null;
  }

  /**
   * Removes a component from this GameObject
   */
  removeComponent(component: Component): void {
    const index = this._components.indexOf(component);
    if (index !== -1) {
      this._components.splice(index, 1);
      component['onDestroy']?.();
    }
  }

  /**
   * Gets all components on this GameObject
   */
  getAllComponents(): readonly Component[] {
    return this._components;
  }

  // ========== Lifecycle Methods ==========

  /**
   * @internal - Called by Scene when GameObject is added
   */
  internal_awake(): void {
    for (const component of this._components) {
      component.internal_awake();
    }
  }

  /**
   * @internal - Called by Engine before first update
   */
  internal_start(): void {
    for (const component of this._components) {
      component.internal_start();
    }
  }

  /**
   * @internal - Called by Engine every frame
   */
  internal_update(deltaTime: number): void {
    if (!this.activeInHierarchy) return;

    for (const component of this._components) {
      component.internal_update(deltaTime);
    }
  }

  /**
   * @internal - Called by Engine at fixed intervals
   */
  internal_fixedUpdate(fixedDeltaTime: number): void {
    if (!this.activeInHierarchy) return;

    for (const component of this._components) {
      component.internal_fixedUpdate(fixedDeltaTime);
    }
  }

  /**
   * @internal - Called by Engine after all updates
   */
  internal_lateUpdate(deltaTime: number): void {
    if (!this.activeInHierarchy) return;

    for (const component of this._components) {
      component.internal_lateUpdate(deltaTime);
    }
  }

  // ========== Destruction ==========

  /**
   * Destroys this GameObject and all its components
   */
  destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;

    // Destroy all children first
    for (const child of [...this._transform.children]) {
      child.gameObject?.destroy();
    }

    // Destroy all components
    for (const component of [...this._components]) {
      component.destroy();
    }

    // Remove from scene
    if (this._scene) {
      this._scene.removeGameObject(this);
    }

    // Remove from parent
    this._transform.setParent(null);
  }

  /**
   * Whether this GameObject has been destroyed
   */
  get isDestroyed(): boolean {
    return this._destroyed;
  }

  // ========== Static Factory Methods ==========

  /**
   * Creates a new empty GameObject
   */
  static create(name?: string): GameObject {
    return new GameObject(name);
  }

  /**
   * Finds a GameObject by name in the scene
   */
  static find(name: string): GameObject | null {
    // This would need to search the active scene
    // Implementation depends on Scene management system
    return null;
  }

  /**
   * Finds GameObjects with a specific tag
   */
  static findGameObjectsWithTag(tag: string): GameObject[] {
    // This would need to search the active scene
    // Implementation depends on Scene management and tag system
    return [];
  }
}
