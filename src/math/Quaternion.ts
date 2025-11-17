import { Vector3 } from './Vector3';

/**
 * Represents a rotation using quaternions (x, y, z, w)
 * Quaternions avoid gimbal lock and are efficient for interpolation
 */
export class Quaternion {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public z: number = 0,
    public w: number = 1
  ) {}

  // Static constants
  static get identity(): Quaternion {
    return new Quaternion(0, 0, 0, 1);
  }

  /**
   * Creates a copy of this quaternion
   */
  clone(): Quaternion {
    return new Quaternion(this.x, this.y, this.z, this.w);
  }

  /**
   * Copies values from another quaternion
   */
  copy(q: Quaternion): Quaternion {
    this.x = q.x;
    this.y = q.y;
    this.z = q.z;
    this.w = q.w;
    return this;
  }

  /**
   * Sets the components of this quaternion
   */
  set(x: number, y: number, z: number, w: number): Quaternion {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    return this;
  }

  /**
   * Sets this quaternion from Euler angles (in radians)
   */
  setFromEuler(x: number, y: number, z: number, order: string = 'XYZ'): Quaternion {
    const c1 = Math.cos(x / 2);
    const c2 = Math.cos(y / 2);
    const c3 = Math.cos(z / 2);
    const s1 = Math.sin(x / 2);
    const s2 = Math.sin(y / 2);
    const s3 = Math.sin(z / 2);

    switch (order) {
      case 'XYZ':
        this.x = s1 * c2 * c3 + c1 * s2 * s3;
        this.y = c1 * s2 * c3 - s1 * c2 * s3;
        this.z = c1 * c2 * s3 + s1 * s2 * c3;
        this.w = c1 * c2 * c3 - s1 * s2 * s3;
        break;
      case 'YXZ':
        this.x = s1 * c2 * c3 + c1 * s2 * s3;
        this.y = c1 * s2 * c3 - s1 * c2 * s3;
        this.z = c1 * c2 * s3 - s1 * s2 * c3;
        this.w = c1 * c2 * c3 + s1 * s2 * s3;
        break;
      case 'ZXY':
        this.x = s1 * c2 * c3 - c1 * s2 * s3;
        this.y = c1 * s2 * c3 + s1 * c2 * s3;
        this.z = c1 * c2 * s3 + s1 * s2 * c3;
        this.w = c1 * c2 * c3 - s1 * s2 * s3;
        break;
      default:
        console.warn(`Quaternion: .setFromEuler() unknown order: ${order}`);
    }

    return this;
  }

  /**
   * Sets this quaternion from an axis and angle
   */
  setFromAxisAngle(axis: Vector3, angle: number): Quaternion {
    const halfAngle = angle / 2;
    const s = Math.sin(halfAngle);

    this.x = axis.x * s;
    this.y = axis.y * s;
    this.z = axis.z * s;
    this.w = Math.cos(halfAngle);

    return this;
  }

  /**
   * Multiplies this quaternion by another
   */
  multiply(q: Quaternion): Quaternion {
    const qax = this.x, qay = this.y, qaz = this.z, qaw = this.w;
    const qbx = q.x, qby = q.y, qbz = q.z, qbw = q.w;

    this.x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
    this.y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
    this.z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
    this.w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

    return this;
  }

  /**
   * Calculates the length of this quaternion
   */
  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
  }

  /**
   * Normalizes this quaternion
   */
  normalize(): Quaternion {
    let l = this.length();
    if (l === 0) {
      this.x = 0;
      this.y = 0;
      this.z = 0;
      this.w = 1;
    } else {
      l = 1 / l;
      this.x *= l;
      this.y *= l;
      this.z *= l;
      this.w *= l;
    }
    return this;
  }

  /**
   * Computes the conjugate of this quaternion
   */
  conjugate(): Quaternion {
    this.x *= -1;
    this.y *= -1;
    this.z *= -1;
    return this;
  }

  /**
   * Computes the inverse of this quaternion
   */
  invert(): Quaternion {
    return this.conjugate().normalize();
  }

  /**
   * Spherical linear interpolation between this and another quaternion
   */
  slerp(q: Quaternion, t: number): Quaternion {
    if (t === 0) return this;
    if (t === 1) return this.copy(q);

    const x = this.x, y = this.y, z = this.z, w = this.w;

    let cosHalfTheta = w * q.w + x * q.x + y * q.y + z * q.z;

    if (cosHalfTheta < 0) {
      this.w = -q.w;
      this.x = -q.x;
      this.y = -q.y;
      this.z = -q.z;
      cosHalfTheta = -cosHalfTheta;
    } else {
      this.copy(q);
    }

    if (cosHalfTheta >= 1.0) {
      this.w = w;
      this.x = x;
      this.y = y;
      this.z = z;
      return this;
    }

    const sqrSinHalfTheta = 1.0 - cosHalfTheta * cosHalfTheta;

    if (sqrSinHalfTheta <= Number.EPSILON) {
      const s = 1 - t;
      this.w = s * w + t * this.w;
      this.x = s * x + t * this.x;
      this.y = s * y + t * this.y;
      this.z = s * z + t * this.z;
      return this.normalize();
    }

    const sinHalfTheta = Math.sqrt(sqrSinHalfTheta);
    const halfTheta = Math.atan2(sinHalfTheta, cosHalfTheta);
    const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
    const ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

    this.w = w * ratioA + this.w * ratioB;
    this.x = x * ratioA + this.x * ratioB;
    this.y = y * ratioA + this.y * ratioB;
    this.z = z * ratioA + this.z * ratioB;

    return this;
  }

  /**
   * Converts quaternion to Euler angles
   */
  toEuler(): Vector3 {
    const euler = new Vector3();

    // Roll (x-axis rotation)
    const sinr_cosp = 2 * (this.w * this.x + this.y * this.z);
    const cosr_cosp = 1 - 2 * (this.x * this.x + this.y * this.y);
    euler.x = Math.atan2(sinr_cosp, cosr_cosp);

    // Pitch (y-axis rotation)
    const sinp = 2 * (this.w * this.y - this.z * this.x);
    if (Math.abs(sinp) >= 1) {
      euler.y = Math.sign(sinp) * Math.PI / 2;
    } else {
      euler.y = Math.asin(sinp);
    }

    // Yaw (z-axis rotation)
    const siny_cosp = 2 * (this.w * this.z + this.x * this.y);
    const cosy_cosp = 1 - 2 * (this.y * this.y + this.z * this.z);
    euler.z = Math.atan2(siny_cosp, cosy_cosp);

    return euler;
  }

  /**
   * Checks if this quaternion equals another
   */
  equals(q: Quaternion, epsilon: number = 0.000001): boolean {
    return (
      Math.abs(this.x - q.x) < epsilon &&
      Math.abs(this.y - q.y) < epsilon &&
      Math.abs(this.z - q.z) < epsilon &&
      Math.abs(this.w - q.w) < epsilon
    );
  }

  /**
   * Converts this quaternion to an array
   */
  toArray(): [number, number, number, number] {
    return [this.x, this.y, this.z, this.w];
  }

  /**
   * String representation
   */
  toString(): string {
    return `Quaternion(${this.x}, ${this.y}, ${this.z}, ${this.w})`;
  }

  // Static methods
  static slerp(qa: Quaternion, qb: Quaternion, t: number): Quaternion {
    return qa.clone().slerp(qb, t);
  }

  static fromEuler(x: number, y: number, z: number, order?: string): Quaternion {
    return new Quaternion().setFromEuler(x, y, z, order);
  }

  static fromAxisAngle(axis: Vector3, angle: number): Quaternion {
    return new Quaternion().setFromAxisAngle(axis, angle);
  }
}
