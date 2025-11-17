import { Vector3 } from '../math';

/**
 * Input system for handling keyboard, mouse, and touch input
 */
export class Input {
  private static _instance: Input;

  private _keys: Set<string> = new Set();
  private _keysDown: Set<string> = new Set();
  private _keysUp: Set<string> = new Set();

  private _mouseButtons: Set<number> = new Set();
  private _mouseButtonsDown: Set<number> = new Set();
  private _mouseButtonsUp: Set<number> = new Set();

  private _mousePosition: Vector3 = new Vector3(0, 0, 0);
  private _mouseDelta: Vector3 = new Vector3(0, 0, 0);
  private _lastMousePosition: Vector3 = new Vector3(0, 0, 0);
  private _mouseWheel: number = 0;

  private _touchPositions: Map<number, Vector3> = new Map();

  private constructor() {
    this.initializeEventListeners();
  }

  static get instance(): Input {
    if (!Input._instance) {
      Input._instance = new Input();
    }
    return Input._instance;
  }

  /**
   * Initialize event listeners
   */
  private initializeEventListeners(): void {
    // Keyboard events
    window.addEventListener('keydown', (e) => {
      if (!this._keys.has(e.code)) {
        this._keysDown.add(e.code);
      }
      this._keys.add(e.code);
    });

    window.addEventListener('keyup', (e) => {
      this._keys.delete(e.code);
      this._keysUp.add(e.code);
    });

    // Mouse events
    window.addEventListener('mousedown', (e) => {
      if (!this._mouseButtons.has(e.button)) {
        this._mouseButtonsDown.add(e.button);
      }
      this._mouseButtons.add(e.button);
    });

    window.addEventListener('mouseup', (e) => {
      this._mouseButtons.delete(e.button);
      this._mouseButtonsUp.add(e.button);
    });

    window.addEventListener('mousemove', (e) => {
      this._mousePosition.set(e.clientX, e.clientY, 0);
    });

    window.addEventListener('wheel', (e) => {
      this._mouseWheel = e.deltaY;
    });

    // Touch events
    window.addEventListener('touchstart', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        this._touchPositions.set(touch.identifier, new Vector3(touch.clientX, touch.clientY, 0));
      }
    });

    window.addEventListener('touchmove', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const pos = this._touchPositions.get(touch.identifier);
        if (pos) {
          pos.set(touch.clientX, touch.clientY, 0);
        }
      }
    });

    window.addEventListener('touchend', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        this._touchPositions.delete(touch.identifier);
      }
    });
  }

  // ========== Keyboard Input ==========

  /**
   * Returns true while a key is held down
   */
  static getKey(key: string): boolean {
    return Input.instance._keys.has(key);
  }

  /**
   * Returns true during the frame the user pressed down the key
   */
  static getKeyDown(key: string): boolean {
    return Input.instance._keysDown.has(key);
  }

  /**
   * Returns true during the frame the user released the key
   */
  static getKeyUp(key: string): boolean {
    return Input.instance._keysUp.has(key);
  }

  // ========== Mouse Input ==========

  /**
   * Returns true while a mouse button is held down
   */
  static getMouseButton(button: number): boolean {
    return Input.instance._mouseButtons.has(button);
  }

  /**
   * Returns true during the frame the user pressed the mouse button
   */
  static getMouseButtonDown(button: number): boolean {
    return Input.instance._mouseButtonsDown.has(button);
  }

  /**
   * Returns true during the frame the user released the mouse button
   */
  static getMouseButtonUp(button: number): boolean {
    return Input.instance._mouseButtonsUp.has(button);
  }

  /**
   * The current mouse position in screen coordinates
   */
  static get mousePosition(): Vector3 {
    return Input.instance._mousePosition.clone();
  }

  /**
   * The mouse movement delta since last frame
   */
  static get mouseDelta(): Vector3 {
    return Input.instance._mouseDelta.clone();
  }

  /**
   * The mouse wheel delta
   */
  static get mouseWheel(): number {
    return Input.instance._mouseWheel;
  }

  // ========== Touch Input ==========

  /**
   * Number of active touches
   */
  static get touchCount(): number {
    return Input.instance._touchPositions.size;
  }

  /**
   * Gets a touch position by index
   */
  static getTouch(index: number): Vector3 | null {
    const touches = Array.from(Input.instance._touchPositions.values());
    return touches[index]?.clone() || null;
  }

  // ========== Virtual Axes ==========

  /**
   * Returns the value of a virtual axis
   */
  static getAxis(axisName: string): number {
    switch (axisName) {
      case 'Horizontal':
        let h = 0;
        if (Input.getKey('KeyA') || Input.getKey('ArrowLeft')) h -= 1;
        if (Input.getKey('KeyD') || Input.getKey('ArrowRight')) h += 1;
        return h;

      case 'Vertical':
        let v = 0;
        if (Input.getKey('KeyS') || Input.getKey('ArrowDown')) v -= 1;
        if (Input.getKey('KeyW') || Input.getKey('ArrowUp')) v += 1;
        return v;

      default:
        return 0;
    }
  }

  /**
   * @internal - Called by Engine at the end of each frame
   */
  static internal_update(): void {
    const instance = Input.instance;

    // Clear frame-specific input states
    instance._keysDown.clear();
    instance._keysUp.clear();
    instance._mouseButtonsDown.clear();
    instance._mouseButtonsUp.clear();

    // Update mouse delta
    instance._mouseDelta.copy(
      Vector3.subtract(instance._mousePosition, instance._lastMousePosition)
    );
    instance._lastMousePosition.copy(instance._mousePosition);

    // Reset mouse wheel
    instance._mouseWheel = 0;
  }
}
