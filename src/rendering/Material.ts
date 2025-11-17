import { Shader } from './Shader';
import { Vector3 } from '../math';

/**
 * Material defines how a surface is rendered
 */
export class Material {
  private _shader: Shader;
  private _color: [number, number, number, number] = [1, 1, 1, 1];
  private _properties: Map<string, any> = new Map();

  constructor(shader: Shader) {
    this._shader = shader;
  }

  get shader(): Shader {
    return this._shader;
  }

  set shader(value: Shader) {
    this._shader = value;
  }

  get color(): [number, number, number, number] {
    return this._color;
  }

  set color(value: [number, number, number, number]) {
    this._color = value;
  }

  /**
   * Sets a material property
   */
  setProperty(name: string, value: any): void {
    this._properties.set(name, value);
  }

  /**
   * Gets a material property
   */
  getProperty(name: string): any {
    return this._properties.get(name);
  }

  /**
   * Applies the material properties to the shader
   */
  apply(): void {
    this._shader.use();
    this._shader.setVec4('uColor', this._color[0], this._color[1], this._color[2], this._color[3]);

    // Apply custom properties
    for (const [name, value] of this._properties) {
      if (typeof value === 'number') {
        this._shader.setFloat(name, value);
      } else if (value instanceof Vector3) {
        this._shader.setVec3(name, value.x, value.y, value.z);
      }
      // Add more type handling as needed
    }
  }
}
