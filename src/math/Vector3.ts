/**
 * Represents a 3D vector with x, y, and z components
 */
export class Vector3 {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public z: number = 0
  ) {}

  // Static constants
  static get zero(): Vector3 { return new Vector3(0, 0, 0); }
  static get one(): Vector3 { return new Vector3(1, 1, 1); }
  static get up(): Vector3 { return new Vector3(0, 1, 0); }
  static get down(): Vector3 { return new Vector3(0, -1, 0); }
  static get left(): Vector3 { return new Vector3(-1, 0, 0); }
  static get right(): Vector3 { return new Vector3(1, 0, 0); }
  static get forward(): Vector3 { return new Vector3(0, 0, 1); }
  static get back(): Vector3 { return new Vector3(0, 0, -1); }

  /**
   * Creates a copy of this vector
   */
  clone(): Vector3 {
    return new Vector3(this.x, this.y, this.z);
  }

  /**
   * Copies values from another vector
   */
  copy(v: Vector3): Vector3 {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }

  /**
   * Sets the components of this vector
   */
  set(x: number, y: number, z: number): Vector3 {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  /**
   * Adds another vector to this one
   */
  add(v: Vector3): Vector3 {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }

  /**
   * Subtracts another vector from this one
   */
  subtract(v: Vector3): Vector3 {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    return this;
  }

  /**
   * Multiplies this vector by a scalar
   */
  multiplyScalar(scalar: number): Vector3 {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
    return this;
  }

  /**
   * Divides this vector by a scalar
   */
  divideScalar(scalar: number): Vector3 {
    return this.multiplyScalar(1 / scalar);
  }

  /**
   * Computes the dot product with another vector
   */
  dot(v: Vector3): number {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  /**
   * Computes the cross product with another vector
   */
  cross(v: Vector3): Vector3 {
    const x = this.y * v.z - this.z * v.y;
    const y = this.z * v.x - this.x * v.z;
    const z = this.x * v.y - this.y * v.x;
    return this.set(x, y, z);
  }

  /**
   * Calculates the length (magnitude) of this vector
   */
  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  /**
   * Calculates the squared length (useful for comparisons to avoid sqrt)
   */
  lengthSquared(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  /**
   * Normalizes this vector (makes it unit length)
   */
  normalize(): Vector3 {
    const len = this.length();
    if (len > 0) {
      this.divideScalar(len);
    }
    return this;
  }

  /**
   * Returns a normalized copy of this vector
   */
  normalized(): Vector3 {
    return this.clone().normalize();
  }

  /**
   * Calculates the distance to another vector
   */
  distanceTo(v: Vector3): number {
    return Math.sqrt(this.distanceToSquared(v));
  }

  /**
   * Calculates the squared distance to another vector
   */
  distanceToSquared(v: Vector3): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    const dz = this.z - v.z;
    return dx * dx + dy * dy + dz * dz;
  }

  /**
   * Linearly interpolates between this vector and another
   */
  lerp(v: Vector3, alpha: number): Vector3 {
    this.x += (v.x - this.x) * alpha;
    this.y += (v.y - this.y) * alpha;
    this.z += (v.z - this.z) * alpha;
    return this;
  }

  /**
   * Checks if this vector equals another (within epsilon)
   */
  equals(v: Vector3, epsilon: number = 0.000001): boolean {
    return (
      Math.abs(this.x - v.x) < epsilon &&
      Math.abs(this.y - v.y) < epsilon &&
      Math.abs(this.z - v.z) < epsilon
    );
  }

  /**
   * Applies a matrix transformation to this vector
   */
  applyMatrix4(m: Float32Array): Vector3 {
    const x = this.x, y = this.y, z = this.z;
    const w = 1 / (m[3] * x + m[7] * y + m[11] * z + m[15]);

    this.x = (m[0] * x + m[4] * y + m[8] * z + m[12]) * w;
    this.y = (m[1] * x + m[5] * y + m[9] * z + m[13]) * w;
    this.z = (m[2] * x + m[6] * y + m[10] * z + m[14]) * w;

    return this;
  }

  /**
   * Converts this vector to an array
   */
  toArray(): [number, number, number] {
    return [this.x, this.y, this.z];
  }

  /**
   * String representation
   */
  toString(): string {
    return `Vector3(${this.x}, ${this.y}, ${this.z})`;
  }

  // Static methods
  static add(a: Vector3, b: Vector3): Vector3 {
    return new Vector3(a.x + b.x, a.y + b.y, a.z + b.z);
  }

  static subtract(a: Vector3, b: Vector3): Vector3 {
    return new Vector3(a.x - b.x, a.y - b.y, a.z - b.z);
  }

  static multiply(v: Vector3, scalar: number): Vector3 {
    return new Vector3(v.x * scalar, v.y * scalar, v.z * scalar);
  }

  static dot(a: Vector3, b: Vector3): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  static cross(a: Vector3, b: Vector3): Vector3 {
    return new Vector3(
      a.y * b.z - a.z * b.y,
      a.z * b.x - a.x * b.z,
      a.x * b.y - a.y * b.x
    );
  }

  static distance(a: Vector3, b: Vector3): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
  }

  static lerp(a: Vector3, b: Vector3, alpha: number): Vector3 {
    return new Vector3(
      a.x + (b.x - a.x) * alpha,
      a.y + (b.y - a.y) * alpha,
      a.z + (b.z - a.z) * alpha
    );
  }
}
