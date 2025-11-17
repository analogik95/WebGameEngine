import { Vector3 } from '../math';

/**
 * Mesh holds geometry data (vertices, normals, UVs, indices)
 */
export class Mesh {
  private _vertices: Float32Array;
  private _normals: Float32Array | null = null;
  private _uvs: Float32Array | null = null;
  private _indices: Uint16Array | null = null;

  private _vao: WebGLVertexArrayObject | null = null;
  private _vertexBuffer: WebGLBuffer | null = null;
  private _normalBuffer: WebGLBuffer | null = null;
  private _uvBuffer: WebGLBuffer | null = null;
  private _indexBuffer: WebGLBuffer | null = null;

  private _gl: WebGL2RenderingContext | null = null;

  constructor(vertices: Float32Array) {
    this._vertices = vertices;
  }

  get vertices(): Float32Array {
    return this._vertices;
  }

  set vertices(value: Float32Array) {
    this._vertices = value;
    this._vao = null; // Force rebuild
  }

  get normals(): Float32Array | null {
    return this._normals;
  }

  set normals(value: Float32Array | null) {
    this._normals = value;
    this._vao = null;
  }

  get uvs(): Float32Array | null {
    return this._uvs;
  }

  set uvs(value: Float32Array | null) {
    this._uvs = value;
    this._vao = null;
  }

  get indices(): Uint16Array | null {
    return this._indices;
  }

  set indices(value: Uint16Array | null) {
    this._indices = value;
    this._vao = null;
  }

  /**
   * Uploads mesh data to GPU
   */
  upload(gl: WebGL2RenderingContext): void {
    if (this._vao && this._gl === gl) return; // Already uploaded

    this._gl = gl;

    // Create VAO
    this._vao = gl.createVertexArray();
    if (!this._vao) throw new Error('Failed to create VAO');

    gl.bindVertexArray(this._vao);

    // Upload vertices
    this._vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this._vertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    // Upload normals if present
    if (this._normals) {
      this._normalBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this._normalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this._normals, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
    }

    // Upload UVs if present
    if (this._uvs) {
      this._uvBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this._uvBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this._uvs, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(2);
      gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
    }

    // Upload indices if present
    if (this._indices) {
      this._indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this._indices, gl.STATIC_DRAW);
    }

    gl.bindVertexArray(null);
  }

  /**
   * Binds the mesh for rendering
   */
  bind(gl: WebGL2RenderingContext): void {
    if (!this._vao) {
      this.upload(gl);
    }
    gl.bindVertexArray(this._vao);
  }

  /**
   * Draws the mesh
   */
  draw(gl: WebGL2RenderingContext): void {
    this.bind(gl);

    if (this._indices) {
      gl.drawElements(gl.TRIANGLES, this._indices.length, gl.UNSIGNED_SHORT, 0);
    } else {
      gl.drawArrays(gl.TRIANGLES, 0, this._vertices.length / 3);
    }
  }

  /**
   * Destroys GPU resources
   */
  destroy(): void {
    if (!this._gl) return;

    const gl = this._gl;

    if (this._vao) gl.deleteVertexArray(this._vao);
    if (this._vertexBuffer) gl.deleteBuffer(this._vertexBuffer);
    if (this._normalBuffer) gl.deleteBuffer(this._normalBuffer);
    if (this._uvBuffer) gl.deleteBuffer(this._uvBuffer);
    if (this._indexBuffer) gl.deleteBuffer(this._indexBuffer);

    this._vao = null;
    this._vertexBuffer = null;
    this._normalBuffer = null;
    this._uvBuffer = null;
    this._indexBuffer = null;
    this._gl = null;
  }

  // ========== Primitive Meshes ==========

  /**
   * Creates a cube mesh
   */
  static createCube(size: number = 1): Mesh {
    const s = size / 2;

    const vertices = new Float32Array([
      // Front face
      -s, -s, s,   s, -s, s,   s, s, s,   -s, s, s,
      // Back face
      -s, -s, -s,  -s, s, -s,  s, s, -s,  s, -s, -s,
      // Top face
      -s, s, -s,   -s, s, s,   s, s, s,   s, s, -s,
      // Bottom face
      -s, -s, -s,  s, -s, -s,  s, -s, s,  -s, -s, s,
      // Right face
      s, -s, -s,   s, s, -s,   s, s, s,   s, -s, s,
      // Left face
      -s, -s, -s,  -s, -s, s,  -s, s, s,  -s, s, -s,
    ]);

    const normals = new Float32Array([
      // Front
      0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1,
      // Back
      0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1,
      // Top
      0, 1, 0,   0, 1, 0,   0, 1, 0,   0, 1, 0,
      // Bottom
      0, -1, 0,  0, -1, 0,  0, -1, 0,  0, -1, 0,
      // Right
      1, 0, 0,   1, 0, 0,   1, 0, 0,   1, 0, 0,
      // Left
      -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0,
    ]);

    const indices = new Uint16Array([
      0, 1, 2,   0, 2, 3,    // Front
      4, 5, 6,   4, 6, 7,    // Back
      8, 9, 10,  8, 10, 11,  // Top
      12, 13, 14, 12, 14, 15, // Bottom
      16, 17, 18, 16, 18, 19, // Right
      20, 21, 22, 20, 22, 23, // Left
    ]);

    const mesh = new Mesh(vertices);
    mesh.normals = normals;
    mesh.indices = indices;

    return mesh;
  }

  /**
   * Creates a plane mesh
   */
  static createPlane(width: number = 1, height: number = 1): Mesh {
    const w = width / 2;
    const h = height / 2;

    const vertices = new Float32Array([
      -w, 0, -h,
      w, 0, -h,
      w, 0, h,
      -w, 0, h,
    ]);

    const normals = new Float32Array([
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
    ]);

    const uvs = new Float32Array([
      0, 0,
      1, 0,
      1, 1,
      0, 1,
    ]);

    const indices = new Uint16Array([
      0, 1, 2,
      0, 2, 3,
    ]);

    const mesh = new Mesh(vertices);
    mesh.normals = normals;
    mesh.uvs = uvs;
    mesh.indices = indices;

    return mesh;
  }

  /**
   * Creates a sphere mesh
   */
  static createSphere(radius: number = 1, segments: number = 32): Mesh {
    const vertices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let lat = 0; lat <= segments; lat++) {
      const theta = (lat * Math.PI) / segments;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      for (let lon = 0; lon <= segments; lon++) {
        const phi = (lon * 2 * Math.PI) / segments;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);

        const x = cosPhi * sinTheta;
        const y = cosTheta;
        const z = sinPhi * sinTheta;

        vertices.push(radius * x, radius * y, radius * z);
        normals.push(x, y, z);
        uvs.push(lon / segments, lat / segments);
      }
    }

    for (let lat = 0; lat < segments; lat++) {
      for (let lon = 0; lon < segments; lon++) {
        const first = lat * (segments + 1) + lon;
        const second = first + segments + 1;

        indices.push(first, second, first + 1);
        indices.push(second, second + 1, first + 1);
      }
    }

    const mesh = new Mesh(new Float32Array(vertices));
    mesh.normals = new Float32Array(normals);
    mesh.uvs = new Float32Array(uvs);
    mesh.indices = new Uint16Array(indices);

    return mesh;
  }
}
