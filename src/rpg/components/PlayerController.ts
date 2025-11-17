import { Component } from '../../core/Component';
import { Input } from '../../core/Input';
import { Vector3 } from '../../math/Vector3';
import { CharacterStats } from './CharacterStats';

/**
 * Player Controller Component
 * Handles player movement, camera control, and input
 * Third-person action RPG style
 */
export class PlayerController extends Component {
  // Movement settings
  public walkSpeed: number = 5.0;
  public runSpeed: number = 10.0;
  public jumpForce: number = 8.0;
  public gravity: number = -20.0;

  // Camera settings
  public cameraSensitivity: number = 2.0;
  public cameraDistance: number = 5.0;
  public cameraHeight: number = 2.0;
  public cameraMinDistance: number = 2.0;
  public cameraMaxDistance: number = 10.0;

  // State
  private velocity: Vector3 = new Vector3(0, 0, 0);
  private isGrounded: boolean = true;
  private isRunning: boolean = false;
  private cameraYaw: number = 0;
  private cameraPitch: number = 30;

  private stats: CharacterStats | null = null;
  private cameraTarget: any = null; // Will be set to camera GameObject

  protected override awake(): void {
    this.stats = this.getComponent(CharacterStats);
  }

  protected override start(): void {
    // Try to find main camera
    // In a full implementation, we'd use a camera reference
    console.log('[PlayerController] Player controller initialized');
  }

  /**
   * Update player movement and camera
   */
  protected override update(deltaTime: number): void {
    if (!this.transform) return;

    this.handleInput(deltaTime);
    this.handleMovement(deltaTime);
    this.handleCamera(deltaTime);
  }

  /**
   * Handle keyboard and mouse input
   */
  private handleInput(deltaTime: number): void {
    // Check if running (Shift key)
    this.isRunning = Input.getKey('Shift');

    // Camera rotation with mouse
    if (Input.getMouseButton(1)) { // Right mouse button
      const mouseDelta = Input.mouseDelta;
      this.cameraYaw += mouseDelta.x * this.cameraSensitivity * deltaTime;
      this.cameraPitch -= mouseDelta.y * this.cameraSensitivity * deltaTime;
      this.cameraPitch = Math.max(-89, Math.min(89, this.cameraPitch));
    }

    // Camera zoom with mouse wheel
    const wheel = Input.mouseWheel;
    if (wheel !== 0) {
      this.cameraDistance -= wheel * 0.5;
      this.cameraDistance = Math.max(
        this.cameraMinDistance,
        Math.min(this.cameraMaxDistance, this.cameraDistance)
      );
    }

    // Jump
    if (Input.getKeyDown('Space') && this.isGrounded) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
      console.log('[Player] Jump!');
    }

    // Shortcut to show status (Tab key)
    if (Input.getKeyDown('Tab')) {
      if (this.stats) {
        console.log('\n' + '='.repeat(50));
        console.log(this.stats.getInfo());
        console.log('='.repeat(50) + '\n');
      }
    }
  }

  /**
   * Handle character movement
   */
  private handleMovement(deltaTime: number): void {
    if (!this.transform) return;

    // Get movement input
    const horizontal = Input.getAxis('Horizontal'); // A/D or Left/Right arrows
    const vertical = Input.getAxis('Vertical');     // W/S or Up/Down arrows

    // Calculate movement direction relative to camera
    const yawRad = this.cameraYaw * Math.PI / 180;
    const moveDir = new Vector3(
      horizontal * Math.cos(yawRad) + vertical * Math.sin(yawRad),
      0,
      -horizontal * Math.sin(yawRad) + vertical * Math.cos(yawRad)
    );

    // Normalize if diagonal movement
    if (moveDir.length() > 0.1) {
      moveDir.normalize();
    }

    // Calculate current speed (based on running state and DEX)
    const baseSpeed = this.isRunning ? this.runSpeed : this.walkSpeed;
    const dexBonus = this.stats ? (this.stats.dex - 10) * 0.1 : 0;
    const currentSpeed = baseSpeed * (1 + dexBonus);

    // Apply movement
    const movement = moveDir.clone().multiplyScalar(currentSpeed * deltaTime);
    this.transform.position = this.transform.position.clone().add(movement);

    // Apply gravity
    if (!this.isGrounded) {
      this.velocity.y += this.gravity * deltaTime;
    }

    // Apply vertical velocity
    this.transform.position = this.transform.position.clone().add(
      new Vector3(0, this.velocity.y * deltaTime, 0)
    );

    // Simple ground check (y <= 0)
    if (this.transform.position.y <= 0) {
      this.transform.position = new Vector3(
        this.transform.position.x,
        0,
        this.transform.position.z
      );
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    // Rotate character to face movement direction
    if (moveDir.length() > 0.1) {
      const targetAngle = Math.atan2(moveDir.x, moveDir.z) * 180 / Math.PI;
      // Smooth rotation would go here
      const euler = this.transform.eulerAngles;
      euler.y = targetAngle;
      this.transform.eulerAngles = euler;
    }
  }

  /**
   * Update camera position to follow player
   */
  private handleCamera(deltaTime: number): void {
    if (!this.transform || !this.cameraTarget) return;

    // Calculate camera position based on player position and angles
    const yawRad = this.cameraYaw * Math.PI / 180;
    const pitchRad = this.cameraPitch * Math.PI / 180;

    const playerPos = this.transform.position;

    const cameraX = playerPos.x - this.cameraDistance * Math.cos(pitchRad) * Math.sin(yawRad);
    const cameraY = playerPos.y + this.cameraHeight + this.cameraDistance * Math.sin(pitchRad);
    const cameraZ = playerPos.z - this.cameraDistance * Math.cos(pitchRad) * Math.cos(yawRad);

    // Set camera position
    if (this.cameraTarget.transform) {
      this.cameraTarget.transform.position = new Vector3(cameraX, cameraY, cameraZ);
      this.cameraTarget.transform.lookAt(
        new Vector3(playerPos.x, playerPos.y + this.cameraHeight, playerPos.z)
      );
    }
  }

  /**
   * Set the camera to follow
   */
  public setCamera(camera: any): void {
    this.cameraTarget = camera;
  }

  /**
   * Teleport player to position
   */
  public teleport(position: Vector3): void {
    if (!this.transform) return;
    this.transform.position = position;
    this.velocity = new Vector3(0, 0, 0);
    console.log(`[Player] Teleported to (${position.x}, ${position.y}, ${position.z})`);
  }

  /**
   * Get current speed
   */
  public getCurrentSpeed(): number {
    const baseSpeed = this.isRunning ? this.runSpeed : this.walkSpeed;
    const dexBonus = this.stats ? (this.stats.dex - 10) * 0.1 : 0;
    return baseSpeed * (1 + dexBonus);
  }
}
