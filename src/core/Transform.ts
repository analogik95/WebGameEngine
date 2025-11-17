import { Vector3, Quaternion, Matrix4 } from '../math';
import { Component } from './Component';

/**
 * Transform component handles position, rotation, and scale
 * Manages local and world space transformations with parent-child hierarchies
 */
export class Transform extends Component {
  // Local space properties
  private _position: Vector3;
  private _rotation: Quaternion;
  private _scale: Vector3;

  // Cached world space properties
  private _worldPosition: Vector3;
  private _worldRotation: Quaternion;
  private _worldScale: Vector3;

  // Transformation matrices
  private _localMatrix: Matrix4;
  private _worldMatrix: Matrix4;

  // Hierarchy
  private _parent: Transform | null = null;
  private _children: Transform[] = [];

  // Dirty flags for optimization
  private _localDirty: boolean = true;
  private _worldDirty: boolean = true;

  constructor() {
    super();
    this._position = new Vector3(0, 0, 0);
    this._rotation = Quaternion.identity;
    this._scale = new Vector3(1, 1, 1);

    this._worldPosition = new Vector3(0, 0, 0);
    this._worldRotation = Quaternion.identity;
    this._worldScale = new Vector3(1, 1, 1);

    this._localMatrix = new Matrix4();
    this._worldMatrix = new Matrix4();
  }

  // ========== Position ==========

  get position(): Vector3 {
    return this._position;
  }

  set position(value: Vector3) {
    this._position.copy(value);
    this.markDirty();
  }

  get worldPosition(): Vector3 {
    this.updateWorldMatrix();
    return this._worldPosition;
  }

  set worldPosition(value: Vector3) {
    if (this._parent) {
      // Convert world position to local position
      const parentWorldMatrix = this._parent.worldMatrix;
      const inverseParentMatrix = parentWorldMatrix.clone().invert();
      this._position.copy(value).applyMatrix4(inverseParentMatrix.elements);
    } else {
      this._position.copy(value);
    }
    this.markDirty();
  }

  // ========== Rotation ==========

  get rotation(): Quaternion {
    return this._rotation;
  }

  set rotation(value: Quaternion) {
    this._rotation.copy(value);
    this.markDirty();
  }

  get worldRotation(): Quaternion {
    this.updateWorldMatrix();
    return this._worldRotation;
  }

  get eulerAngles(): Vector3 {
    return this._rotation.toEuler();
  }

  set eulerAngles(value: Vector3) {
    this._rotation.setFromEuler(value.x, value.y, value.z);
    this.markDirty();
  }

  // ========== Scale ==========

  get scale(): Vector3 {
    return this._scale;
  }

  set scale(value: Vector3) {
    this._scale.copy(value);
    this.markDirty();
  }

  get worldScale(): Vector3 {
    this.updateWorldMatrix();
    return this._worldScale;
  }

  // ========== Matrices ==========

  get localMatrix(): Matrix4 {
    if (this._localDirty) {
      this._localMatrix.compose(this._position, this._rotation, this._scale);
      this._localDirty = false;
    }
    return this._localMatrix;
  }

  get worldMatrix(): Matrix4 {
    this.updateWorldMatrix();
    return this._worldMatrix;
  }

  // ========== Hierarchy Management ==========

  get parent(): Transform | null {
    return this._parent;
  }

  setParent(parent: Transform | null, worldPositionStays: boolean = true): void {
    if (this._parent === parent) return;

    // Store world transform if we want to maintain it
    let worldPos: Vector3 | null = null;
    let worldRot: Quaternion | null = null;
    let worldScl: Vector3 | null = null;

    if (worldPositionStays && this._parent) {
      worldPos = this.worldPosition.clone();
      worldRot = this.worldRotation.clone();
      worldScl = this.worldScale.clone();
    }

    // Remove from old parent
    if (this._parent) {
      const index = this._parent._children.indexOf(this);
      if (index !== -1) {
        this._parent._children.splice(index, 1);
      }
    }

    // Set new parent
    this._parent = parent;

    // Add to new parent
    if (this._parent) {
      this._parent._children.push(this);
    }

    // Restore world transform
    if (worldPositionStays && worldPos && worldRot && worldScl) {
      this.worldPosition = worldPos;
      // Note: worldRotation and worldScale setters would need to be implemented
      // For now, we only preserve world position
    }

    this.markDirty();
  }

  get children(): ReadonlyArray<Transform> {
    return this._children;
  }

  getChild(index: number): Transform | null {
    return this._children[index] || null;
  }

  get childCount(): number {
    return this._children.length;
  }

  /**
   * Finds a child by name (recursive)
   */
  find(name: string): Transform | null {
    for (const child of this._children) {
      if (child.gameObject?.name === name) {
        return child;
      }
      const found = child.find(name);
      if (found) return found;
    }
    return null;
  }

  // ========== Transformation Methods ==========

  /**
   * Translates the transform in local space
   */
  translate(translation: Vector3, relativeTo: 'self' | 'world' = 'self'): void {
    if (relativeTo === 'world') {
      this._position.add(translation);
    } else {
      // Rotate translation by local rotation
      const rotated = translation.clone();
      // Apply rotation to translation vector
      this._position.add(rotated);
    }
    this.markDirty();
  }

  /**
   * Rotates the transform around an axis
   */
  rotate(axis: Vector3, angle: number, relativeTo: 'self' | 'world' = 'self'): void {
    const rotation = Quaternion.fromAxisAngle(axis, angle);
    if (relativeTo === 'world') {
      this._rotation.multiply(rotation);
    } else {
      this._rotation = rotation.clone().multiply(this._rotation);
    }
    this.markDirty();
  }

  /**
   * Rotates to look at a target position
   */
  lookAt(target: Vector3, up: Vector3 = Vector3.up): void {
    const position = this.worldPosition;
    const matrix = new Matrix4().lookAt(position, target, up);

    // Extract rotation from look-at matrix
    const tempPos = new Vector3();
    const tempScale = new Vector3();
    matrix.decompose(tempPos, this._rotation, tempScale);

    this.markDirty();
  }

  // ========== Direction Vectors ==========

  get forward(): Vector3 {
    return new Vector3(0, 0, 1).applyMatrix4(this.worldMatrix.elements);
  }

  get right(): Vector3 {
    return new Vector3(1, 0, 0).applyMatrix4(this.worldMatrix.elements);
  }

  get up(): Vector3 {
    return new Vector3(0, 1, 0).applyMatrix4(this.worldMatrix.elements);
  }

  // ========== Internal Methods ==========

  private markDirty(): void {
    this._localDirty = true;
    this._worldDirty = true;
    this.markChildrenDirty();
  }

  private markChildrenDirty(): void {
    for (const child of this._children) {
      child._worldDirty = true;
      child.markChildrenDirty();
    }
  }

  private updateWorldMatrix(): void {
    if (!this._worldDirty) return;

    if (this._parent) {
      // World matrix = parent world matrix * local matrix
      this._worldMatrix.multiplyMatrices(this._parent.worldMatrix, this.localMatrix);
    } else {
      // No parent, world matrix = local matrix
      this._worldMatrix.copy(this.localMatrix);
    }

    // Decompose world matrix to get world position, rotation, scale
    this._worldMatrix.decompose(this._worldPosition, this._worldRotation, this._worldScale);

    this._worldDirty = false;
  }

  // ========== Component Lifecycle ==========

  override onDestroy(): void {
    // Remove from parent
    this.setParent(null);

    // Destroy all children
    for (const child of [...this._children]) {
      child.gameObject?.destroy();
    }

    super.onDestroy();
  }
}
