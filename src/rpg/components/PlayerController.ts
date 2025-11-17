/**
 * The Gamer RPG - Player Controller Component
 * Handles player movement, camera control, and input
 */

import { Component } from '../../core/Component';
import { Input } from '../../core/Input';
import { Time } from '../../core/Time';
import { Vector3 } from '../../math/Vector3';
import { Quaternion } from '../../math/Quaternion';
import { Camera } from '../../rendering/Camera';
import { PlayerStats } from '../systems/PlayerStats';
import { SkillSystem } from '../systems/SkillSystem';
import { network } from '../network/NetworkManager';

export class PlayerController extends Component {
  // Movement
  public moveSpeed: number = 5.0;
  public sprintSpeed: number = 10.0;
  public jumpForce: number = 7.0;
  public gravity: number = -20.0;

  // Camera
  public camera: Camera | null = null;
  public mouseSensitivity: number = 2.0;
  public cameraDistance: number = 5.0;
  public cameraHeight: number = 2.0;

  // State
  private velocity: Vector3 = new Vector3(0, 0, 0);
  private isGrounded: boolean = true;
  private isSprinting: boolean = false;
  private yaw: number = 0; // Horizontal rotation
  private pitch: number = -20; // Vertical rotation (camera angle)

  // RPG Systems
  public playerStats: PlayerStats | null = null;
  public skillSystem: SkillSystem | null = null;

  // Network sync
  private lastSyncTime: number = 0;
  private syncInterval: number = 0.1; // Sync position every 100ms

  protected awake(): void {
    // Lock cursor for FPS-style camera control (optional)
    // document.addEventListener('click', () => {
    //   document.body.requestPointerLock();
    // });
  }

  protected start(): void {
    // Find camera in scene
    const scene = this.gameObject?.scene;
    if (!this.camera && scene) {
      const cameraObj = scene.findGameObject('MainCamera');
      if (cameraObj) {
        this.camera = cameraObj.getComponent(Camera);
      }
    }
  }

  protected update(deltaTime: number): void {
    if (!this.transform) return;

    this.handleInput(deltaTime);
    this.handleMovement(deltaTime);
    this.handleCamera(deltaTime);
    this.syncPosition(deltaTime);
  }

  // ========================================================================
  // Input Handling
  // ========================================================================

  private handleInput(deltaTime: number): void {
    // Sprint
    this.isSprinting = Input.getKey('ShiftLeft') || Input.getKey('ShiftRight');

    // Jump
    if (Input.getKeyDown(' ') && this.isGrounded) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
    }

    // Skills (hotkeys 1-9)
    for (let i = 1; i <= 9; i++) {
      if (Input.getKeyDown(`Digit${i}`) || Input.getKeyDown(`Numpad${i}`)) {
        this.useSkillFromHotkey(i);
      }
    }

    // Special abilities
    if (Input.getKeyDown('KeyO')) {
      this.useObserve();
    }

    if (Input.getKeyDown('KeyI')) {
      this.openInventory();
    }

    if (Input.getKeyDown('KeyK')) {
      this.openSkills();
    }

    if (Input.getKeyDown('KeyM')) {
      this.openMap();
    }

    if (Input.getKeyDown('Escape')) {
      this.openMenu();
    }
  }

  // ========================================================================
  // Movement
  // ========================================================================

  private handleMovement(deltaTime: number): void {
    if (!this.transform) return;

    // Get input
    const horizontal = Input.getAxis('Horizontal'); // A/D or Left/Right
    const vertical = Input.getAxis('Vertical');     // W/S or Up/Down

    // Calculate movement direction (relative to camera yaw)
    const yawRad = this.yaw * (Math.PI / 180);

    // Forward/backward movement
    const moveX = Math.sin(yawRad) * vertical;
    const moveZ = Math.cos(yawRad) * vertical;

    // Left/right movement (perpendicular to forward)
    const strafeX = Math.sin(yawRad + Math.PI / 2) * horizontal;
    const strafeZ = Math.cos(yawRad + Math.PI / 2) * horizontal;

    // Calculate movement vector
    const moveDir = new Vector3(
      moveX + strafeX,
      0,
      moveZ + strafeZ
    );

    // Normalize to prevent faster diagonal movement
    if (moveDir.length() > 0.01) {
      moveDir.normalize();
    }

    // Apply speed
    const speed = this.isSprinting ? this.sprintSpeed : this.moveSpeed;
    this.velocity.x = moveDir.x * speed;
    this.velocity.z = moveDir.z * speed;

    // Apply gravity
    if (!this.isGrounded) {
      this.velocity.y += this.gravity * deltaTime;
    } else {
      this.velocity.y = 0;
    }

    // Move player
    const movement = this.velocity.clone().multiplyScalar(deltaTime);
    this.transform.position = this.transform.position.add(movement);

    // Simple ground check (TODO: Implement proper collision detection)
    if (this.transform.position.y <= 0) {
      this.transform.position.y = 0;
      this.isGrounded = true;
      this.velocity.y = 0;
    }

    // Rotate player to face movement direction
    if (moveDir.length() > 0.01) {
      const targetYaw = Math.atan2(moveDir.x, moveDir.z) * (180 / Math.PI);
      this.transform.eulerAngles = new Vector3(0, targetYaw, 0);
    }
  }

  // ========================================================================
  // Camera Control
  // ========================================================================

  private handleCamera(deltaTime: number): void {
    if (!this.camera || !this.transform) return;

    // Get mouse input
    const mouseDelta = Input.mouseDelta;

    // Update camera rotation
    this.yaw += mouseDelta.x * this.mouseSensitivity * deltaTime;
    this.pitch -= mouseDelta.y * this.mouseSensitivity * deltaTime;

    // Clamp pitch to prevent flipping
    this.pitch = Math.max(-89, Math.min(89, this.pitch));

    // Calculate camera position (third-person)
    const yawRad = this.yaw * (Math.PI / 180);
    const pitchRad = this.pitch * (Math.PI / 180);

    // Calculate camera offset based on yaw and pitch
    const horizontalDist = this.cameraDistance * Math.cos(pitchRad);
    const verticalDist = this.cameraDistance * Math.sin(pitchRad);

    const offsetX = horizontalDist * Math.sin(yawRad);
    const offsetZ = horizontalDist * Math.cos(yawRad);
    const offsetY = this.cameraHeight - verticalDist;

    // Position camera behind and above player
    const playerPos = this.transform.position;
    const cameraTransform = this.camera.transform;
    if (cameraTransform) {
      cameraTransform.position = new Vector3(
        playerPos.x + offsetX,
        playerPos.y + offsetY,
        playerPos.z + offsetZ
      );
    }

    // Make camera look at player
    if (cameraTransform) {
      cameraTransform.lookAt(playerPos.add(new Vector3(0, this.cameraHeight / 2, 0)));
    }
  }

  // ========================================================================
  // Network Synchronization
  // ========================================================================

  private syncPosition(deltaTime: number): void {
    if (!this.transform) return;

    this.lastSyncTime += deltaTime;

    if (this.lastSyncTime >= this.syncInterval) {
      const pos = this.transform.position;
      const sceneName = this.gameObject?.scene?.name || 'main';
      network.updatePosition(pos.x, pos.y, pos.z, sceneName);
      this.lastSyncTime = 0;
    }
  }

  // ========================================================================
  // Skills and Abilities
  // ========================================================================

  private useSkillFromHotkey(hotkey: number): void {
    if (!this.skillSystem) return;

    const skill = this.skillSystem.getSkillByHotkey(hotkey);
    if (!skill) {
      console.log(`No skill assigned to hotkey ${hotkey}`);
      return;
    }

    this.useSkill(skill.id);
  }

  useSkill(skillId: string): void {
    if (!this.skillSystem || !this.playerStats) return;

    // Check if can use skill
    const check = this.skillSystem.canUseSkill(skillId, this.playerStats.mp);

    if (!check.canUse) {
      console.log(`Cannot use skill: ${check.reason}`);
      return;
    }

    // Get skill definition
    const definition = this.skillSystem.getSkillDefinition(skillId);
    if (!definition) return;

    // Deduct MP
    const mpCost = this.skillSystem.getSkillMpCost(skillId);
    if (!this.playerStats.useMp(mpCost)) {
      console.log('Not enough MP!');
      return;
    }

    // Use skill
    this.skillSystem.useSkill(skillId);

    // Send to server
    network.useSkill(skillId);

    console.log(`Used skill: ${definition.name} (${mpCost} MP)`);

    // TODO: Execute skill effect
    this.executeSkillEffect(skillId);
  }

  private executeSkillEffect(skillId: string): void {
    // Skill effects will be implemented based on skill type
    // For now, just log
    console.log(`Executing skill: ${skillId}`);
  }

  private useObserve(): void {
    console.log('🔍 Observe activated! (Look at target and press O)');
    // TODO: Raycast to find target under crosshair
    // TODO: Show Observe window with target info
  }

  // ========================================================================
  // UI Actions
  // ========================================================================

  private openInventory(): void {
    console.log('📦 Opening inventory...');
    // TODO: Show inventory UI
  }

  private openSkills(): void {
    console.log('📖 Opening skills...');
    // TODO: Show skills UI
  }

  private openMap(): void {
    console.log('🗺️ Opening map...');
    // TODO: Show map UI
  }

  private openMenu(): void {
    console.log('⚙️ Opening menu...');
    // TODO: Show pause menu
  }

  // ========================================================================
  // Public API
  // ========================================================================

  setPlayerStats(stats: PlayerStats): void {
    this.playerStats = stats;
  }

  setSkillSystem(skillSystem: SkillSystem): void {
    this.skillSystem = skillSystem;
  }

  teleport(position: Vector3): void {
    if (this.transform) {
      this.transform.position = position.clone();
      this.velocity = new Vector3(0, 0, 0);
    }
  }

  takeDamage(amount: number): void {
    if (this.playerStats) {
      this.playerStats.takeDamage(amount);
      console.log(`❤️ Took ${amount} damage! HP: ${this.playerStats.hp}/${this.playerStats.maxHp}`);
    }
  }

  heal(amount: number): void {
    if (this.playerStats) {
      this.playerStats.heal(amount);
      console.log(`💚 Healed ${amount} HP! HP: ${this.playerStats.hp}/${this.playerStats.maxHp}`);
    }
  }
}
