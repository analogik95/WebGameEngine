import { Component } from '../core/Component';
import { Matrix4, Vector3 } from '../math';

export enum CameraProjection {
  Perspective,
  Orthographic,
}

export enum CameraClearFlags {
  SolidColor,
  Skybox,
  DepthOnly,
  DontClear,
}

/**
 * Camera component for rendering the scene
 */
export class Camera extends Component {
  // Projection settings
  private _projection: CameraProjection = CameraProjection.Perspective;
  private _fieldOfView: number = 60; // degrees
  private _near: number = 0.1;
  private _far: number = 1000;
  private _aspect: number = 16 / 9;

  // Orthographic settings
  private _orthographicSize: number = 5;

  // Clear settings
  private _clearFlags: CameraClearFlags = CameraClearFlags.SolidColor;
  private _backgroundColor: [number, number, number, number] = [0.2, 0.3, 0.4, 1.0];

  // Render settings
  private _depth: number = 0; // Higher depth cameras render on top
  private _cullingMask: number = 0xFFFFFFFF; // Which layers to render

  // Cached matrices
  private _projectionMatrix: Matrix4 = new Matrix4();
  private _viewMatrix: Matrix4 = new Matrix4();
  private _viewProjectionMatrix: Matrix4 = new Matrix4();
  private _projectionDirty: boolean = true;

  // Static camera tracking
  private static _mainCamera: Camera | null = null;
  private static _allCameras: Camera[] = [];

  /**
   * The main camera in the scene
   */
  static get main(): Camera | null {
    return Camera._mainCamera;
  }

  /**
   * All cameras in the scene
   */
  static get allCameras(): readonly Camera[] {
    return Camera._allCameras;
  }

  constructor() {
    super();
    Camera._allCameras.push(this);

    // Set as main camera if none exists
    if (!Camera._mainCamera) {
      Camera._mainCamera = this;
    }
  }

  // ========== Projection Settings ==========

  get projection(): CameraProjection {
    return this._projection;
  }

  set projection(value: CameraProjection) {
    if (this._projection !== value) {
      this._projection = value;
      this._projectionDirty = true;
    }
  }

  get fieldOfView(): number {
    return this._fieldOfView;
  }

  set fieldOfView(value: number) {
    if (this._fieldOfView !== value) {
      this._fieldOfView = value;
      this._projectionDirty = true;
    }
  }

  get near(): number {
    return this._near;
  }

  set near(value: number) {
    if (this._near !== value) {
      this._near = value;
      this._projectionDirty = true;
    }
  }

  get far(): number {
    return this._far;
  }

  set far(value: number) {
    if (this._far !== value) {
      this._far = value;
      this._projectionDirty = true;
    }
  }

  get aspect(): number {
    return this._aspect;
  }

  set aspect(value: number) {
    if (this._aspect !== value) {
      this._aspect = value;
      this._projectionDirty = true;
    }
  }

  get orthographicSize(): number {
    return this._orthographicSize;
  }

  set orthographicSize(value: number) {
    if (this._orthographicSize !== value) {
      this._orthographicSize = value;
      this._projectionDirty = true;
    }
  }

  // ========== Clear Settings ==========

  get clearFlags(): CameraClearFlags {
    return this._clearFlags;
  }

  set clearFlags(value: CameraClearFlags) {
    this._clearFlags = value;
  }

  get backgroundColor(): [number, number, number, number] {
    return this._backgroundColor;
  }

  set backgroundColor(value: [number, number, number, number]) {
    this._backgroundColor = value;
  }

  // ========== Render Settings ==========

  get depth(): number {
    return this._depth;
  }

  set depth(value: number) {
    this._depth = value;
  }

  get cullingMask(): number {
    return this._cullingMask;
  }

  set cullingMask(value: number) {
    this._cullingMask = value;
  }

  // ========== Matrix Calculations ==========

  get projectionMatrix(): Matrix4 {
    if (this._projectionDirty) {
      this.updateProjectionMatrix();
      this._projectionDirty = false;
    }
    return this._projectionMatrix;
  }

  get viewMatrix(): Matrix4 {
    this.updateViewMatrix();
    return this._viewMatrix;
  }

  get viewProjectionMatrix(): Matrix4 {
    this._viewProjectionMatrix.multiplyMatrices(this.projectionMatrix, this.viewMatrix);
    return this._viewProjectionMatrix;
  }

  private updateProjectionMatrix(): void {
    if (this._projection === CameraProjection.Perspective) {
      const fov = (this._fieldOfView * Math.PI) / 180;
      this._projectionMatrix.makePerspective(fov, this._aspect, this._near, this._far);
    } else {
      const height = this._orthographicSize;
      const width = height * this._aspect;
      this._projectionMatrix.makeOrthographic(
        -width, width,
        height, -height,
        this._near, this._far
      );
    }
  }

  private updateViewMatrix(): void {
    if (!this.transform) return;

    // Get the world matrix and invert it to get the view matrix
    const worldMatrix = this.transform.worldMatrix.clone();
    this._viewMatrix.copy(worldMatrix).invert();
  }

  // ========== Screen/World Conversion ==========

  /**
   * Converts a screen point to a ray in world space
   */
  screenPointToRay(x: number, y: number, canvas: HTMLCanvasElement): {
    origin: Vector3;
    direction: Vector3;
  } {
    // Normalize to NDC space (-1 to 1)
    const ndcX = (x / canvas.width) * 2 - 1;
    const ndcY = -(y / canvas.height) * 2 + 1;

    // Unproject the point
    const near = new Vector3(ndcX, ndcY, -1);
    const far = new Vector3(ndcX, ndcY, 1);

    const invViewProj = this.viewProjectionMatrix.clone().invert();

    near.applyMatrix4(invViewProj.elements);
    far.applyMatrix4(invViewProj.elements);

    const direction = Vector3.subtract(far, near).normalize();

    return {
      origin: this.transform?.worldPosition || Vector3.zero,
      direction,
    };
  }

  /**
   * Converts a world point to screen space
   */
  worldToScreenPoint(worldPoint: Vector3, canvas: HTMLCanvasElement): Vector3 {
    const point = worldPoint.clone();
    point.applyMatrix4(this.viewProjectionMatrix.elements);

    // Convert from NDC to screen space
    const x = (point.x + 1) * 0.5 * canvas.width;
    const y = (1 - point.y) * 0.5 * canvas.height;

    return new Vector3(x, y, point.z);
  }

  // ========== Component Lifecycle ==========

  protected override onDestroy(): void {
    // Remove from camera list
    const index = Camera._allCameras.indexOf(this);
    if (index !== -1) {
      Camera._allCameras.splice(index, 1);
    }

    // If this was the main camera, assign a new one
    if (Camera._mainCamera === this) {
      Camera._mainCamera = Camera._allCameras[0] || null;
    }

    super.onDestroy();
  }

  /**
   * Sets this camera as the main camera
   */
  setAsMainCamera(): void {
    Camera._mainCamera = this;
  }
}
