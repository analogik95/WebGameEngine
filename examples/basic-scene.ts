/**
 * Basic Scene Example
 * Demonstrates how to create a simple 3D scene with the engine
 */

import {
  Engine,
  Scene,
  GameObject,
  Camera,
  MeshRenderer,
  Light,
  LightType,
  Mesh,
  Material,
  Shader,
  ShaderLibrary,
  Vector3,
  Time,
  Input,
  Component,
} from '../src/index';

/**
 * Custom component that rotates an object
 */
class RotateComponent extends Component {
  speed: number = 1;

  protected update(deltaTime: number): void {
    if (!this.transform) return;

    const rotation = this.transform.eulerAngles;
    rotation.y += this.speed * deltaTime;
    this.transform.eulerAngles = rotation;
  }
}

/**
 * Custom component for camera controller
 */
class CameraController extends Component {
  moveSpeed: number = 5;
  rotateSpeed: number = 2;

  protected update(deltaTime: number): void {
    if (!this.transform) return;

    // Movement
    const horizontal = Input.getAxis('Horizontal');
    const vertical = Input.getAxis('Vertical');

    const movement = new Vector3(horizontal, 0, vertical);
    movement.multiplyScalar(this.moveSpeed * deltaTime);
    this.transform.translate(movement);

    // Up/Down
    if (Input.getKey('KeyQ')) {
      this.transform.position.y -= this.moveSpeed * deltaTime;
    }
    if (Input.getKey('KeyE')) {
      this.transform.position.y += this.moveSpeed * deltaTime;
    }

    // Rotation with arrow keys
    const rotation = this.transform.eulerAngles;
    if (Input.getKey('ArrowLeft')) {
      rotation.y += this.rotateSpeed * deltaTime;
    }
    if (Input.getKey('ArrowRight')) {
      rotation.y -= this.rotateSpeed * deltaTime;
    }
    if (Input.getKey('ArrowUp')) {
      rotation.x += this.rotateSpeed * deltaTime;
    }
    if (Input.getKey('ArrowDown')) {
      rotation.x -= this.rotateSpeed * deltaTime;
    }
    this.transform.eulerAngles = rotation;
  }
}

/**
 * Creates and initializes the demo scene
 */
export async function createDemoScene(canvas: HTMLCanvasElement): Promise<void> {
  // Initialize engine
  const engine = Engine.instance;
  engine.initialize(canvas);

  // Create scene
  const scene = engine.sceneManager.createScene('DemoScene');

  // Create camera
  const cameraObj = scene.createGameObject('MainCamera');
  const camera = cameraObj.addComponent(Camera);
  camera.backgroundColor = [0.1, 0.2, 0.3, 1.0];
  cameraObj.transform.position = new Vector3(0, 3, 8);
  cameraObj.transform.lookAt(Vector3.zero);

  // Add camera controller
  const cameraController = cameraObj.addComponent(CameraController);

  // Create directional light
  const lightObj = scene.createGameObject('DirectionalLight');
  const light = lightObj.addComponent(Light);
  light.type = LightType.Directional;
  light.color = new Vector3(1, 1, 1);
  light.intensity = 1;
  lightObj.transform.eulerAngles = new Vector3(-Math.PI / 4, Math.PI / 4, 0);

  // Create shader and materials
  const gl = engine.gl;
  if (!gl) throw new Error('WebGL context not available');

  const litShader = new Shader(
    gl,
    ShaderLibrary.litVertexShader,
    ShaderLibrary.litFragmentShader
  );

  const cubeMaterial = new Material(litShader);
  cubeMaterial.color = [0.5, 0.7, 1.0, 1.0];

  const sphereMaterial = new Material(litShader);
  sphereMaterial.color = [1.0, 0.5, 0.5, 1.0];

  const planeMaterial = new Material(litShader);
  planeMaterial.color = [0.3, 0.6, 0.3, 1.0];

  // Create rotating cube
  const cubeObj = scene.createGameObject('Cube');
  const cubeRenderer = cubeObj.addComponent(MeshRenderer);
  cubeRenderer.mesh = Mesh.createCube(1);
  cubeRenderer.material = cubeMaterial;
  cubeObj.transform.position = new Vector3(-2, 0.5, 0);
  const cubeRotate = cubeObj.addComponent(RotateComponent);
  cubeRotate.speed = 1;

  // Create rotating sphere
  const sphereObj = scene.createGameObject('Sphere');
  const sphereRenderer = sphereObj.addComponent(MeshRenderer);
  sphereRenderer.mesh = Mesh.createSphere(0.6, 32);
  sphereRenderer.material = sphereMaterial;
  sphereObj.transform.position = new Vector3(2, 0.6, 0);
  const sphereRotate = sphereObj.addComponent(RotateComponent);
  sphereRotate.speed = -0.5;

  // Create ground plane
  const groundObj = scene.createGameObject('Ground');
  const groundRenderer = groundObj.addComponent(MeshRenderer);
  groundRenderer.mesh = Mesh.createPlane(10, 10);
  groundRenderer.material = planeMaterial;
  groundObj.transform.position = new Vector3(0, 0, 0);

  // Load scene
  await engine.sceneManager.loadScene('DemoScene');

  // Start engine
  engine.start();

  console.log('Demo scene created and running!');
  console.log(`Scene has ${scene.gameObjects.length} game objects`);
}
