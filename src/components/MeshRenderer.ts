import { Component } from '../core/Component';
import { Mesh } from '../rendering/Mesh';
import { Material } from '../rendering/Material';

/**
 * MeshRenderer component renders a mesh with a material
 */
export class MeshRenderer extends Component {
  private _mesh: Mesh | null = null;
  private _material: Material | null = null;

  get mesh(): Mesh | null {
    return this._mesh;
  }

  set mesh(value: Mesh | null) {
    this._mesh = value;
  }

  get material(): Material | null {
    return this._material;
  }

  set material(value: Material | null) {
    this._material = value;
  }

  /**
   * @internal - Called by the rendering system
   */
  render(gl: WebGL2RenderingContext, viewMatrix: Float32Array, projectionMatrix: Float32Array): void {
    if (!this._mesh || !this._material || !this.transform) return;

    // Apply material
    this._material.apply();

    // Set matrices
    const modelMatrix = this.transform.worldMatrix.elements;
    this._material.shader.setMat4('uModelMatrix', modelMatrix);
    this._material.shader.setMat4('uViewMatrix', viewMatrix);
    this._material.shader.setMat4('uProjectionMatrix', projectionMatrix);

    // Calculate and set normal matrix (transpose of inverse of model matrix)
    // For now, we'll use a simplified version
    const normalMatrix = this.transform.worldMatrix.clone().invert();
    const normalMat3 = new Float32Array([
      normalMatrix.elements[0], normalMatrix.elements[1], normalMatrix.elements[2],
      normalMatrix.elements[4], normalMatrix.elements[5], normalMatrix.elements[6],
      normalMatrix.elements[8], normalMatrix.elements[9], normalMatrix.elements[10],
    ]);

    const normalMatLocation = this._material.shader.getUniformLocation('uNormalMatrix');
    if (normalMatLocation) {
      gl.uniformMatrix3fv(normalMatLocation, false, normalMat3);
    }

    // Draw mesh
    this._mesh.draw(gl);
  }

  protected override onDestroy(): void {
    // Clean up mesh GPU resources if this is the last renderer using it
    // For now, we'll leave the mesh intact as it might be shared
    super.onDestroy();
  }
}
