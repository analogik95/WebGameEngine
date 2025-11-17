import { Component } from '../../core/Component';
import { Vector3 } from '../../math/Vector3';
import { CharacterStats } from './CharacterStats';

/**
 * NPC Types
 */
export enum NPCType {
  Friendly = 'friendly',
  Neutral = 'neutral',
  Enemy = 'enemy',
  Merchant = 'merchant',
  QuestGiver = 'quest_giver'
}

/**
 * NPC AI States
 */
export enum AIState {
  Idle = 'idle',
  Patrol = 'patrol',
  Chase = 'chase',
  Attack = 'attack',
  Flee = 'flee',
  Dead = 'dead'
}

/**
 * NPC Controller Component
 * Handles NPC behavior, AI, and interactions
 */
export class NPCController extends Component {
  // NPC Properties
  public npcName: string = 'NPC';
  public npcType: NPCType = NPCType.Neutral;
  public dialogueLines: string[] = [];

  // AI Settings
  public detectionRange: number = 10.0;
  public attackRange: number = 2.0;
  public moveSpeed: number = 3.0;
  public patrolPoints: Vector3[] = [];
  public aggroOnAttack: boolean = true;

  // State
  private currentState: AIState = AIState.Idle;
  private targetEnemy: any = null;
  private currentPatrolIndex: number = 0;
  private idleTimer: number = 0;
  private nextIdleAction: number = 2.0;

  private stats: CharacterStats | null = null;

  protected override awake(): void {
    this.stats = this.getComponent(CharacterStats);
    if (this.stats) {
      this.stats.characterName = this.npcName;

      // Listen to death event
      this.stats.onDeath = () => this.onDeath();
    }
  }

  protected override start(): void {
    console.log(`[NPC] ${this.npcName} (${this.npcType}) initialized`);
  }

  /**
   * Main AI update
   */
  protected override update(deltaTime: number): void {
    if (!this.transform || !this.stats) return;

    switch (this.currentState) {
      case AIState.Idle:
        this.updateIdle(deltaTime);
        break;
      case AIState.Patrol:
        this.updatePatrol(deltaTime);
        break;
      case AIState.Chase:
        this.updateChase(deltaTime);
        break;
      case AIState.Attack:
        this.updateAttack(deltaTime);
        break;
      case AIState.Flee:
        this.updateFlee(deltaTime);
        break;
      case AIState.Dead:
        // Do nothing when dead
        break;
    }

    // Check for nearby threats if enemy type
    if (this.npcType === NPCType.Enemy && this.currentState !== AIState.Dead) {
      this.detectThreats();
    }
  }

  /**
   * Idle behavior
   */
  private updateIdle(deltaTime: number): void {
    this.idleTimer += deltaTime;

    if (this.idleTimer >= this.nextIdleAction) {
      this.idleTimer = 0;
      this.nextIdleAction = 2 + Math.random() * 3;

      // Randomly decide to patrol if patrol points exist
      if (this.patrolPoints.length > 0 && Math.random() > 0.5) {
        this.setState(AIState.Patrol);
      }
    }
  }

  /**
   * Patrol behavior
   */
  private updatePatrol(deltaTime: number): void {
    if (this.patrolPoints.length === 0) {
      this.setState(AIState.Idle);
      return;
    }

    const targetPoint = this.patrolPoints[this.currentPatrolIndex];
    const currentPos = this.transform!.position;
    const direction = targetPoint.clone().subtract(currentPos);
    const distance = direction.length();

    if (distance < 0.5) {
      // Reached patrol point, move to next
      this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
      this.setState(AIState.Idle);
    } else {
      // Move toward patrol point
      direction.normalize();
      const movement = direction.clone().multiplyScalar(this.moveSpeed * deltaTime);
      this.transform!.position = currentPos.clone().add(movement);

      // Face movement direction
      const angle = Math.atan2(direction.x, direction.z) * 180 / Math.PI;
      const euler = this.transform!.eulerAngles;
      euler.y = angle;
      this.transform!.eulerAngles = euler;
    }
  }

  /**
   * Chase behavior
   */
  private updateChase(deltaTime: number): void {
    if (!this.targetEnemy || !this.targetEnemy.transform) {
      this.setState(AIState.Idle);
      return;
    }

    const currentPos = this.transform!.position;
    const targetPos = this.targetEnemy.transform.position;
    const direction = targetPos.subtract(currentPos);
    const distance = direction.magnitude();

    if (distance > this.detectionRange * 1.5) {
      // Lost target
      console.log(`[${this.npcName}] Lost target`);
      this.targetEnemy = null;
      this.setState(AIState.Idle);
    } else if (distance <= this.attackRange) {
      // In attack range
      this.setState(AIState.Attack);
    } else {
      // Move toward target
      direction.normalize();
      const chaseSpeed = this.moveSpeed * 1.5; // Chase faster
      const movement = direction.multiply(chaseSpeed * deltaTime);
      this.transform!.position = currentPos.add(movement);

      // Face target
      const angle = Math.atan2(direction.x, direction.z) * 180 / Math.PI;
      const euler = this.transform!.eulerAngles;
      euler.y = angle;
      this.transform!.eulerAngles = euler;
    }
  }

  /**
   * Attack behavior
   */
  private updateAttack(deltaTime: number): void {
    if (!this.targetEnemy || !this.targetEnemy.transform) {
      this.setState(AIState.Idle);
      return;
    }

    const currentPos = this.transform!.position;
    const targetPos = this.targetEnemy.transform.position;
    const distance = targetPos.subtract(currentPos).magnitude();

    if (distance > this.attackRange * 1.2) {
      // Target moved away, chase again
      this.setState(AIState.Chase);
    } else {
      // Perform attack
      // In a real implementation, this would have attack cooldowns, animations, etc.
      const targetStats = this.targetEnemy.getComponent(CharacterStats);
      if (targetStats && this.stats) {
        const damage = Math.floor(10 + (this.stats.str * 0.5));
        targetStats.takeDamage(damage);
        console.log(`[${this.npcName}] Attacked target for ${damage} damage!`);
      }
    }
  }

  /**
   * Flee behavior (for low health)
   */
  private updateFlee(deltaTime: number): void {
    if (!this.targetEnemy || !this.targetEnemy.transform) {
      this.setState(AIState.Idle);
      return;
    }

    // Run away from target
    const currentPos = this.transform!.position;
    const targetPos = this.targetEnemy.transform.position;
    const direction = currentPos.subtract(targetPos);
    direction.normalize();

    const movement = direction.multiply(this.moveSpeed * 1.5 * deltaTime);
    this.transform!.position = currentPos.add(movement);

    // Check if safe distance
    if (currentPos.subtract(targetPos).magnitude() > this.detectionRange * 2) {
      this.targetEnemy = null;
      this.setState(AIState.Idle);
    }
  }

  /**
   * Detect nearby threats
   */
  private detectThreats(): void {
    // TODO: In a full implementation, raycast or check for player in range
    // For now, this is a placeholder
  }

  /**
   * Change AI state
   */
  private setState(newState: AIState): void {
    if (this.currentState === newState) return;

    console.log(`[${this.npcName}] State: ${this.currentState} -> ${newState}`);
    this.currentState = newState;

    // Reset timers on state change
    this.idleTimer = 0;
  }

  /**
   * Take aggro (be attacked)
   */
  public takeAggro(attacker: any): void {
    if (this.npcType === NPCType.Enemy && this.aggroOnAttack) {
      this.targetEnemy = attacker;
      this.setState(AIState.Chase);
      console.log(`[${this.npcName}] Aggroed on attacker!`);
    }
  }

  /**
   * Handle death
   */
  private onDeath(): void {
    this.setState(AIState.Dead);
    console.log(`[${this.npcName}] has been defeated!`);

    // Drop loot
    this.dropLoot();

    // TODO: Disable collision, play death animation, despawn after delay
  }

  /**
   * Drop loot on death
   */
  private dropLoot(): void {
    // TODO: Implement loot system
    console.log(`[${this.npcName}] dropped loot!`);
  }

  /**
   * Interact with NPC (dialogue, shop, etc.)
   */
  public interact(player: any): void {
    if (this.npcType === NPCType.Friendly || this.npcType === NPCType.QuestGiver) {
      this.showDialogue();
    } else if (this.npcType === NPCType.Merchant) {
      this.openShop();
    }
  }

  /**
   * Show NPC dialogue
   */
  private showDialogue(): void {
    if (this.dialogueLines.length === 0) {
      console.log(`[${this.npcName}]: "..."`);
      return;
    }

    const randomLine = this.dialogueLines[Math.floor(Math.random() * this.dialogueLines.length)];
    console.log(`[${this.npcName}]: "${randomLine}"`);
  }

  /**
   * Open merchant shop
   */
  private openShop(): void {
    console.log(`[${this.npcName}]: "Welcome to my shop!"`);
    // TODO: Implement shop UI
  }

  /**
   * Add patrol point
   */
  public addPatrolPoint(point: Vector3): void {
    this.patrolPoints.push(point);
  }

  /**
   * Add dialogue line
   */
  public addDialogue(line: string): void {
    this.dialogueLines.push(line);
  }

  // Getters
  get state(): AIState { return this.currentState; }
  get isAlive(): boolean { return this.currentState !== AIState.Dead; }
}
