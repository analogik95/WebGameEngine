import { GameObject } from './GameObject';

/**
 * Base class for all components
 * Components are modular behaviors that can be attached to GameObjects
 */
export abstract class Component {
  private _gameObject: GameObject | null = null;
  private _enabled: boolean = true;
  private _started: boolean = false;

  /**
   * The GameObject this component is attached to
   */
  get gameObject(): GameObject | null {
    return this._gameObject;
  }

  /**
   * @internal - Used by GameObject to set the reference
   */
  setGameObject(gameObject: GameObject): void {
    this._gameObject = gameObject;
  }

  /**
   * The Transform component of the GameObject
   */
  get transform(): any {
    return this._gameObject?.transform || null;
  }

  /**
   * Whether this component is enabled
   */
  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(value: boolean) {
    if (this._enabled === value) return;
    this._enabled = value;

    if (value) {
      this.onEnable();
    } else {
      this.onDisable();
    }
  }

  /**
   * Whether the GameObject is active in the scene
   */
  get isActiveAndEnabled(): boolean {
    return this._enabled && (this._gameObject?.activeInHierarchy ?? false);
  }

  /**
   * @internal - Called by GameObject when component is first added
   */
  internal_awake(): void {
    this.awake();
  }

  /**
   * @internal - Called by Engine before first Update
   */
  internal_start(): void {
    if (!this._started) {
      this._started = true;
      this.start();
    }
  }

  /**
   * @internal - Called by Engine every frame
   */
  internal_update(deltaTime: number): void {
    if (this.isActiveAndEnabled) {
      this.update(deltaTime);
    }
  }

  /**
   * @internal - Called by Engine at fixed time intervals
   */
  internal_fixedUpdate(fixedDeltaTime: number): void {
    if (this.isActiveAndEnabled) {
      this.fixedUpdate(fixedDeltaTime);
    }
  }

  /**
   * @internal - Called by Engine after all updates
   */
  internal_lateUpdate(deltaTime: number): void {
    if (this.isActiveAndEnabled) {
      this.lateUpdate(deltaTime);
    }
  }

  // ========== Lifecycle Methods (Override in subclasses) ==========

  /**
   * Called when the component is created (before Start)
   * Use for initialization that doesn't depend on other components
   */
  protected awake(): void {}

  /**
   * Called before the first frame update (after all Awake calls)
   * Use for initialization that depends on other components
   */
  protected start(): void {}

  /**
   * Called every frame
   * Use for game logic
   */
  protected update(deltaTime: number): void {}

  /**
   * Called at fixed time intervals (used for physics)
   * Use for physics-related code
   */
  protected fixedUpdate(fixedDeltaTime: number): void {}

  /**
   * Called after all Update methods
   * Use for things like camera following (after character has moved)
   */
  protected lateUpdate(deltaTime: number): void {}

  /**
   * Called when the component is enabled
   */
  protected onEnable(): void {}

  /**
   * Called when the component is disabled
   */
  protected onDisable(): void {}

  /**
   * Called when the component is destroyed
   * Use for cleanup
   */
  protected onDestroy(): void {}

  /**
   * Gets a component of the specified type from the GameObject
   */
  getComponent<T extends Component>(type: new (...args: any[]) => T): T | null {
    return this._gameObject?.getComponent(type) || null;
  }

  /**
   * Gets all components of the specified type from the GameObject
   */
  getComponents<T extends Component>(type: new (...args: any[]) => T): T[] {
    return this._gameObject?.getComponents(type) || [];
  }

  /**
   * Gets a component in the children of this GameObject
   */
  getComponentInChildren<T extends Component>(type: new (...args: any[]) => T): T | null {
    return this._gameObject?.getComponentInChildren(type) || null;
  }

  /**
   * Gets a component in the parent of this GameObject
   */
  getComponentInParent<T extends Component>(type: new (...args: any[]) => T): T | null {
    return this._gameObject?.getComponentInParent(type) || null;
  }

  /**
   * Destroys this component
   */
  destroy(): void {
    if (this._gameObject) {
      this._gameObject.removeComponent(this);
    }
    this.onDestroy();
  }
}
