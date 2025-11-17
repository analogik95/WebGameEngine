/**
 * The Gamer RPG - Network Manager
 * Handles communication with the game server via WebSocket
 */

export type NetworkEventType =
  | 'connected'
  | 'disconnected'
  | 'player_moved'
  | 'skill_used'
  | 'attack_result'
  | 'exp_gained'
  | 'level_up'
  | 'dungeon_created'
  | 'error';

export type NetworkEventCallback = (data: any) => void;

export interface NetworkMessage {
  type: string;
  data?: any;
}

export class NetworkManager {
  private static instance: NetworkManager;
  private socket: WebSocket | null = null;
  private eventHandlers: Map<NetworkEventType, NetworkEventCallback[]> = new Map();
  private playerId: number | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 3000; // ms

  private constructor() {}

  static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  // ========================================================================
  // Connection Management
  // ========================================================================

  connect(serverUrl: string, playerId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.playerId = playerId;
      const wsUrl = `${serverUrl}/ws/${playerId}`;

      console.log(`Connecting to server: ${wsUrl}`);

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('✅ Connected to game server');
        this.reconnectAttempts = 0;
        resolve();
      };

      this.socket.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.socket.onclose = () => {
        console.log('Disconnected from server');
        this.emit('disconnected', {});
        this.attemptReconnect(serverUrl, playerId);
      };
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  private attemptReconnect(serverUrl: string, playerId: number): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Reconnecting... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect(serverUrl, playerId).catch(err => {
        console.error('Reconnection failed:', err);
      });
    }, this.reconnectDelay);
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  // ========================================================================
  // Message Handling
  // ========================================================================

  private handleMessage(rawData: string): void {
    try {
      const message = JSON.parse(rawData) as NetworkMessage;
      this.emit(message.type as NetworkEventType, message);
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  }

  send(type: string, data: any = {}): void {
    if (!this.isConnected()) {
      console.warn('Cannot send message: Not connected to server');
      return;
    }

    const message: NetworkMessage = { type, data };
    this.socket!.send(JSON.stringify(message));
  }

  // ========================================================================
  // Event System
  // ========================================================================

  on(event: NetworkEventType, callback: NetworkEventCallback): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }

    this.eventHandlers.get(event)!.push(callback);
  }

  off(event: NetworkEventType, callback: NetworkEventCallback): void {
    const handlers = this.eventHandlers.get(event);
    if (!handlers) return;

    const index = handlers.indexOf(callback);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  private emit(event: NetworkEventType, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (!handlers) return;

    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }

  // ========================================================================
  // Game Actions
  // ========================================================================

  updatePosition(x: number, y: number, z: number, scene: string): void {
    this.send('update_position', { x, y, z, scene });
  }

  useSkill(skillId: string, targetId?: number, position?: { x: number; y: number; z: number }): void {
    this.send('use_skill', {
      skill_id: skillId,
      target_id: targetId,
      position
    });
  }

  createDungeon(dungeonType: string): void {
    this.send('create_dungeon', { dungeon_type: dungeonType });
  }

  attackEnemy(enemyId: string, skillId?: string): void {
    this.send('attack_enemy', {
      enemy_id: enemyId,
      skill_id: skillId
    });
  }

  gainExp(amount: number): void {
    this.send('gain_exp', { exp: amount });
  }
}

// Export singleton instance
export const network = NetworkManager.getInstance();
