/**
 * Shader class manages WebGL shader programs
 */
export class Shader {
  private _program: WebGLProgram | null = null;
  private _gl: WebGL2RenderingContext;
  private _uniformLocations: Map<string, WebGLUniformLocation> = new Map();
  private _attributeLocations: Map<string, number> = new Map();

  constructor(
    gl: WebGL2RenderingContext,
    vertexSource: string,
    fragmentSource: string
  ) {
    this._gl = gl;
    this.compile(vertexSource, fragmentSource);
  }

  /**
   * Compiles the shader program
   */
  private compile(vertexSource: string, fragmentSource: string): void {
    const gl = this._gl;

    // Create and compile vertex shader
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    if (!vertexShader) throw new Error('Failed to create vertex shader');

    gl.shaderSource(vertexShader, vertexSource);
    gl.compileShader(vertexShader);

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(vertexShader);
      gl.deleteShader(vertexShader);
      throw new Error(`Vertex shader compilation failed: ${error}`);
    }

    // Create and compile fragment shader
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fragmentShader) throw new Error('Failed to create fragment shader');

    gl.shaderSource(fragmentShader, fragmentSource);
    gl.compileShader(fragmentShader);

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(fragmentShader);
      gl.deleteShader(fragmentShader);
      gl.deleteShader(vertexShader);
      throw new Error(`Fragment shader compilation failed: ${error}`);
    }

    // Create and link program
    const program = gl.createProgram();
    if (!program) throw new Error('Failed to create shader program');

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const error = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      throw new Error(`Shader program linking failed: ${error}`);
    }

    // Clean up shaders (they're now in the program)
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    this._program = program;

    // Cache uniform and attribute locations
    this.cacheLocations();
  }

  /**
   * Caches uniform and attribute locations for faster access
   */
  private cacheLocations(): void {
    if (!this._program) return;

    const gl = this._gl;

    // Get all active uniforms
    const uniformCount = gl.getProgramParameter(this._program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < uniformCount; i++) {
      const uniformInfo = gl.getActiveUniform(this._program, i);
      if (uniformInfo) {
        const location = gl.getUniformLocation(this._program, uniformInfo.name);
        if (location) {
          this._uniformLocations.set(uniformInfo.name, location);
        }
      }
    }

    // Get all active attributes
    const attributeCount = gl.getProgramParameter(this._program, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < attributeCount; i++) {
      const attributeInfo = gl.getActiveAttrib(this._program, i);
      if (attributeInfo) {
        const location = gl.getAttribLocation(this._program, attributeInfo.name);
        this._attributeLocations.set(attributeInfo.name, location);
      }
    }
  }

  /**
   * Binds this shader for rendering
   */
  use(): void {
    if (this._program) {
      this._gl.useProgram(this._program);
    }
  }

  /**
   * Gets a uniform location
   */
  getUniformLocation(name: string): WebGLUniformLocation | null {
    return this._uniformLocations.get(name) || null;
  }

  /**
   * Gets an attribute location
   */
  getAttributeLocation(name: string): number {
    return this._attributeLocations.get(name) ?? -1;
  }

  /**
   * Sets a uniform float value
   */
  setFloat(name: string, value: number): void {
    const location = this.getUniformLocation(name);
    if (location) {
      this._gl.uniform1f(location, value);
    }
  }

  /**
   * Sets a uniform vec2 value
   */
  setVec2(name: string, x: number, y: number): void {
    const location = this.getUniformLocation(name);
    if (location) {
      this._gl.uniform2f(location, x, y);
    }
  }

  /**
   * Sets a uniform vec3 value
   */
  setVec3(name: string, x: number, y: number, z: number): void {
    const location = this.getUniformLocation(name);
    if (location) {
      this._gl.uniform3f(location, x, y, z);
    }
  }

  /**
   * Sets a uniform vec4 value
   */
  setVec4(name: string, x: number, y: number, z: number, w: number): void {
    const location = this.getUniformLocation(name);
    if (location) {
      this._gl.uniform4f(location, x, y, z, w);
    }
  }

  /**
   * Sets a uniform mat4 value
   */
  setMat4(name: string, matrix: Float32Array): void {
    const location = this.getUniformLocation(name);
    if (location) {
      this._gl.uniformMatrix4fv(location, false, matrix);
    }
  }

  /**
   * Sets a uniform int value
   */
  setInt(name: string, value: number): void {
    const location = this.getUniformLocation(name);
    if (location) {
      this._gl.uniform1i(location, value);
    }
  }

  /**
   * Destroys the shader program
   */
  destroy(): void {
    if (this._program) {
      this._gl.deleteProgram(this._program);
      this._program = null;
    }
    this._uniformLocations.clear();
    this._attributeLocations.clear();
  }

  get program(): WebGLProgram | null {
    return this._program;
  }
}

/**
 * Library of default shaders
 */
export class ShaderLibrary {
  /**
   * Basic unlit shader
   */
  static get unlitVertexShader(): string {
    return `#version 300 es
      precision highp float;

      in vec3 aPosition;
      in vec3 aNormal;
      in vec2 aTexCoord;

      uniform mat4 uModelMatrix;
      uniform mat4 uViewMatrix;
      uniform mat4 uProjectionMatrix;

      out vec3 vNormal;
      out vec2 vTexCoord;
      out vec3 vWorldPosition;

      void main() {
        vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
        vWorldPosition = worldPosition.xyz;
        vNormal = mat3(uModelMatrix) * aNormal;
        vTexCoord = aTexCoord;
        gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
      }
    `;
  }

  static get unlitFragmentShader(): string {
    return `#version 300 es
      precision highp float;

      in vec3 vNormal;
      in vec2 vTexCoord;
      in vec3 vWorldPosition;

      uniform vec4 uColor;

      out vec4 fragColor;

      void main() {
        fragColor = uColor;
      }
    `;
  }

  /**
   * Basic lit shader with Phong lighting
   */
  static get litVertexShader(): string {
    return `#version 300 es
      precision highp float;

      in vec3 aPosition;
      in vec3 aNormal;
      in vec2 aTexCoord;

      uniform mat4 uModelMatrix;
      uniform mat4 uViewMatrix;
      uniform mat4 uProjectionMatrix;
      uniform mat3 uNormalMatrix;

      out vec3 vNormal;
      out vec2 vTexCoord;
      out vec3 vWorldPosition;

      void main() {
        vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
        vWorldPosition = worldPosition.xyz;
        vNormal = normalize(uNormalMatrix * aNormal);
        vTexCoord = aTexCoord;
        gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
      }
    `;
  }

  static get litFragmentShader(): string {
    return `#version 300 es
      precision highp float;

      in vec3 vNormal;
      in vec2 vTexCoord;
      in vec3 vWorldPosition;

      uniform vec4 uColor;
      uniform vec3 uLightDirection;
      uniform vec3 uLightColor;
      uniform vec3 uAmbientColor;
      uniform vec3 uCameraPosition;

      out vec4 fragColor;

      void main() {
        vec3 normal = normalize(vNormal);
        vec3 lightDir = normalize(-uLightDirection);

        // Ambient
        vec3 ambient = uAmbientColor;

        // Diffuse
        float diff = max(dot(normal, lightDir), 0.0);
        vec3 diffuse = diff * uLightColor;

        // Specular
        vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
        vec3 specular = spec * uLightColor * 0.5;

        vec3 result = (ambient + diffuse + specular) * uColor.rgb;
        fragColor = vec4(result, uColor.a);
      }
    `;
  }
}
