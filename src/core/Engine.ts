import { SceneManager } from './Scene';
import { Time } from './Time';
import { Input } from './Input';

/**
 * Main game engine class
 * Manages the game loop and coordinates all engine systems
 */
export class Engine {
  private static _instance: Engine;

  private _running: boolean = false;
  private _canvas: HTMLCanvasElement | null = null;
  private _gl: WebGL2RenderingContext | null = null;

  private _sceneManager: SceneManager;

  // Fixed timestep accumulator for physics
  private _fixedTimeAccumulator: number = 0;
  private _maxFixedUpdatesPerFrame: number = 5; // Prevent spiral of death

  private _animationFrameId: number | null = null;

  private constructor() {
    this._sceneManager = SceneManager.instance;
  }

  static get instance(): Engine {
    if (!Engine._instance) {
      Engine._instance = new Engine();
    }
    return Engine._instance;
  }

  /**
   * Gets the canvas element
   */
  get canvas(): HTMLCanvasElement | null {
    return this._canvas;
  }

  /**
   * Gets the WebGL2 rendering context
   */
  get gl(): WebGL2RenderingContext | null {
    return this._gl;
  }

  /**
   * Whether the engine is currently running
   */
  get isRunning(): boolean {
    return this._running;
  }

  /**
   * Initializes the engine with a canvas element
   */
  initialize(canvas: HTMLCanvasElement): void {
    this._canvas = canvas;

    // Get WebGL2 context
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: true,
      depth: true,
      stencil: true,
      premultipliedAlpha: false,
    });

    if (!gl) {
      throw new Error('WebGL2 not supported');
    }

    this._gl = gl;

    // Set initial WebGL state
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    console.log('Engine initialized');
  }

  /**
   * Starts the game loop
   */
  start(): void {
    if (this._running) {
      console.warn('Engine is already running');
      return;
    }

    if (!this._canvas || !this._gl) {
      throw new Error('Engine not initialized. Call initialize() first.');
    }

    this._running = true;
    Time.reset();

    console.log('Engine started');
    this.gameLoop(0);
  }

  /**
   * Stops the game loop
   */
  stop(): void {
    if (!this._running) return;

    this._running = false;

    if (this._animationFrameId !== null) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }

    console.log('Engine stopped');
  }

  /**
   * Main game loop
   */
  private gameLoop = (timestamp: number): void => {
    if (!this._running) return;

    // Update time
    Time.internal_update(timestamp);

    // Process fixed updates (physics)
    this.processFixedUpdate();

    // Process regular updates (game logic)
    this.processUpdate();

    // Process late updates (camera following, etc.)
    this.processLateUpdate();

    // Render the scene
    this.processRender();

    // Request next frame
    this._animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  /**
   * Processes fixed timestep updates (physics)
   */
  private processFixedUpdate(): void {
    const fixedDeltaTime = Time.fixedDeltaTime;
    this._fixedTimeAccumulator += Time.unscaledDeltaTime;

    let iterations = 0;
    while (this._fixedTimeAccumulator >= fixedDeltaTime && iterations < this._maxFixedUpdatesPerFrame) {
      this._sceneManager.internal_fixedUpdate(fixedDeltaTime * Time.timeScale);
      this._fixedTimeAccumulator -= fixedDeltaTime;
      iterations++;
    }

    // If we're too far behind, reset the accumulator to prevent spiral of death
    if (this._fixedTimeAccumulator > fixedDeltaTime * this._maxFixedUpdatesPerFrame) {
      this._fixedTimeAccumulator = 0;
    }
  }

  /**
   * Processes regular updates (game logic)
   */
  private processUpdate(): void {
    const deltaTime = Time.deltaTime;
    this._sceneManager.internal_update(deltaTime);
  }

  /**
   * Processes late updates (after all regular updates)
   */
  private processLateUpdate(): void {
    const deltaTime = Time.deltaTime;
    this._sceneManager.internal_lateUpdate(deltaTime);
  }

  /**
   * Processes rendering
   */
  private processRender(): void {
    if (!this._gl || !this._canvas) return;

    const gl = this._gl;

    // Set viewport
    gl.viewport(0, 0, this._canvas.width, this._canvas.height);

    // Get all cameras and sort by depth
    const Camera = require('../rendering/Camera').Camera;
    const cameras = [...Camera.allCameras].sort((a, b) => a.depth - b.depth);

    if (cameras.length === 0) {
      // No cameras, just clear the screen
      gl.clearColor(0.2, 0.2, 0.2, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      return;
    }

    // Render from each camera
    for (const camera of cameras) {
      if (!camera.enabled || !camera.gameObject?.activeInHierarchy) continue;

      // Clear based on camera settings
      const bgColor = camera.backgroundColor;
      gl.clearColor(bgColor[0], bgColor[1], bgColor[2], bgColor[3]);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // Update camera aspect ratio
      camera.aspect = this._canvas.width / this._canvas.height;

      // Get view and projection matrices
      const viewMatrix = camera.viewMatrix.elements;
      const projectionMatrix = camera.projectionMatrix.elements;

      // Render all mesh renderers in the active scene
      const MeshRenderer = require('../components/MeshRenderer').MeshRenderer;
      const activeScene = this._sceneManager.activeScene;

      if (activeScene) {
        for (const gameObject of activeScene.gameObjects) {
          if (!gameObject.activeInHierarchy) continue;

          const meshRenderer = gameObject.getComponent(MeshRenderer);
          if (meshRenderer && meshRenderer.enabled) {
            meshRenderer.render(gl, viewMatrix, projectionMatrix);
          }
        }
      }
    }

    // Update input at end of frame
    Input.internal_update();
  }

  /**
   * Gets the scene manager
   */
  get sceneManager(): SceneManager {
    return this._sceneManager;
  }
}
