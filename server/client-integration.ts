/**
 * Client Integration Example
 * How to connect your WebGameEngine frontend to the backend server
 */

import { io, Socket } from 'socket.io-client';

// ===================
// Configuration
// ===================

const API_URL = 'http://localhost:3000';
const WS_URL = 'http://localhost:3000';

// ===================
// API Client
// ===================

class GameAPI {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('gameToken', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('gameToken');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('gameToken');
  }

  private async fetch(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token && !endpoint.includes('login') && !endpoint.includes('register')) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Authentication
  async register(username: string, email: string, password: string, characterName?: string) {
    const data = await this.fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, characterName }),
    });
    this.setToken(data.token);
    return data;
  }

  async login(username: string, password: string) {
    const data = await this.fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async getMe() {
    return this.fetch('/api/auth/me');
  }

  // Characters
  async getCharacters() {
    return this.fetch('/api/characters');
  }

  async getCharacter(id: number) {
    return this.fetch(`/api/characters/${id}`);
  }

  async createCharacter(name: string, stats?: any) {
    return this.fetch('/api/characters', {
      method: 'POST',
      body: JSON.stringify({ name, stats }),
    });
  }

  async updateCharacter(id: number, data: any) {
    return this.fetch(`/api/characters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCharacter(id: number) {
    return this.fetch(`/api/characters/${id}`, {
      method: 'DELETE',
    });
  }

  // Character Actions
  async gainExp(characterId: number, amount: number) {
    return this.fetch(`/api/characters/${characterId}/gain-exp`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  async addStats(characterId: number, stat: string, points: number) {
    return this.fetch(`/api/characters/${characterId}/add-stats`, {
      method: 'POST',
      body: JSON.stringify({ stat, points }),
    });
  }

  async takeDamage(characterId: number, amount: number) {
    return this.fetch(`/api/characters/${characterId}/take-damage`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  async heal(characterId: number, amount: number) {
    return this.fetch(`/api/characters/${characterId}/heal`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }
}

// ===================
// WebSocket Client
// ===================

class GameSocket {
  private socket: Socket | null = null;
  private api: GameAPI;

  constructor(api: GameAPI) {
    this.api = api;
  }

  connect() {
    const token = this.api.getToken();
    if (!token) {
      throw new Error('No authentication token. Please login first.');
    }

    this.socket = io(WS_URL, {
      auth: { token },
    });

    this.setupEventHandlers();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Connected to game server');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from game server');
    });

    this.socket.on('error', (data: any) => {
      console.error('Server error:', data.message);
    });

    this.socket.on('joined', (data: any) => {
      console.log('Joined game:', data);
      this.onJoined?.(data);
    });

    this.socket.on('players', (players: any[]) => {
      console.log('Other players:', players);
      this.onPlayers?.(players);
    });

    this.socket.on('playerJoined', (player: any) => {
      console.log('Player joined:', player);
      this.onPlayerJoined?.(player);
    });

    this.socket.on('playerLeft', (data: any) => {
      console.log('Player left:', data);
      this.onPlayerLeft?.(data);
    });

    this.socket.on('playerMoved', (data: any) => {
      this.onPlayerMoved?.(data);
    });

    this.socket.on('playerAttacked', (data: any) => {
      this.onPlayerAttacked?.(data);
    });

    this.socket.on('damaged', (data: any) => {
      console.log('You took damage:', data);
      this.onDamaged?.(data);
    });

    this.socket.on('playerHpChanged', (data: any) => {
      this.onPlayerHpChanged?.(data);
    });

    this.socket.on('playerDied', (data: any) => {
      console.log('Player died:', data);
      this.onPlayerDied?.(data);
    });

    this.socket.on('healed', (data: any) => {
      console.log('You were healed:', data);
      this.onHealed?.(data);
    });

    this.socket.on('chatMessage', (data: any) => {
      console.log(`[Chat] ${data.username}: ${data.message}`);
      this.onChatMessage?.(data);
    });

    this.socket.on('playerLeveledUp', (data: any) => {
      console.log(`${data.characterName} leveled up to ${data.level}!`);
      this.onPlayerLeveledUp?.(data);
    });
  }

  // Emit events
  join(characterId: number, room: string = 'lobby') {
    this.socket?.emit('join', { characterId, room });
  }

  move(position: { x: number; y: number; z: number }, rotation: { x: number; y: number; z: number; w: number }) {
    this.socket?.emit('move', { position, rotation });
  }

  attack(damage: number, targetId?: string, skillName?: string) {
    this.socket?.emit('attack', { damage, targetId, skillName });
  }

  heal(amount: number) {
    this.socket?.emit('heal', { amount });
  }

  chat(message: string) {
    this.socket?.emit('chat', { message });
  }

  levelUp(newLevel: number) {
    this.socket?.emit('levelUp', { newLevel });
  }

  changeRoom(roomId: string) {
    this.socket?.emit('changeRoom', { roomId });
  }

  // Event callbacks (override these in your game)
  onJoined?: (data: any) => void;
  onPlayers?: (players: any[]) => void;
  onPlayerJoined?: (player: any) => void;
  onPlayerLeft?: (data: any) => void;
  onPlayerMoved?: (data: any) => void;
  onPlayerAttacked?: (data: any) => void;
  onDamaged?: (data: any) => void;
  onPlayerHpChanged?: (data: any) => void;
  onPlayerDied?: (data: any) => void;
  onHealed?: (data: any) => void;
  onChatMessage?: (data: any) => void;
  onPlayerLeveledUp?: (data: any) => void;
}

// ===================
// Example Usage
// ===================

// Initialize API and Socket clients
const api = new GameAPI();
const socket = new GameSocket(api);

// Example: Login and connect
async function loginAndConnect() {
  try {
    // Login
    const loginData = await api.login('anatoly', 'password123');
    console.log('Logged in:', loginData);

    // Connect to WebSocket
    socket.connect();

    // Join game with character
    socket.join(loginData.characters[0].id);

    // Set up event handlers
    socket.onPlayerMoved = (data) => {
      // Update player position in your game engine
      console.log('Player moved:', data);
      // updatePlayerPosition(data.playerId, data.position, data.rotation);
    };

    socket.onChatMessage = (data) => {
      // Display chat message in your UI
      console.log(`${data.characterName}: ${data.message}`);
    };

  } catch (error) {
    console.error('Error:', error);
  }
}

// Example: Send player movement to server
function sendMovement(x: number, y: number, z: number) {
  socket.move(
    { x, y, z },
    { x: 0, y: 0, z: 0, w: 1 }
  );
}

// Example: Send chat message
function sendChat(message: string) {
  socket.chat(message);
}

// Example: Attack
function attackEnemy(targetSocketId: string, damage: number) {
  socket.attack(damage, targetSocketId, 'Basic Attack');
}

// ===================
// Integration with WebGameEngine
// ===================

/**
 * Add this to your PlayerController component update() method
 */
/*
class PlayerController extends Component {
  private lastSyncTime = 0;
  private syncInterval = 50; // ms (20 times per second)

  update(deltaTime: number): void {
    // ... existing movement code ...

    // Sync position to server
    this.lastSyncTime += deltaTime * 1000;
    if (this.lastSyncTime >= this.syncInterval) {
      const pos = this.transform.position;
      const rot = this.transform.rotation;
      
      socket.move(
        { x: pos.x, y: pos.y, z: pos.z },
        { x: rot.x, y: rot.y, z: rot.z, w: rot.w }
      );
      
      this.lastSyncTime = 0;
    }
  }
}
*/

/**
 * Handle other players in your game
 */
/*
const otherPlayers = new Map<string, GameObject>();

socket.onPlayerJoined = (player) => {
  // Create GameObject for other player
  const playerObj = new GameObject(player.characterName);
  playerObj.transform.position.set(
    player.position.x,
    player.position.y,
    player.position.z
  );
  
  // Add visual components
  const mesh = playerObj.addComponent(MeshRenderer);
  mesh.mesh = createPlayerMesh();
  
  otherPlayers.set(player.socketId, playerObj);
  scene.add(playerObj);
};

socket.onPlayerMoved = (data) => {
  const playerObj = otherPlayers.get(data.playerId);
  if (playerObj) {
    playerObj.transform.position.set(
      data.position.x,
      data.position.y,
      data.position.z
    );
    playerObj.transform.rotation.set(
      data.rotation.x,
      data.rotation.y,
      data.rotation.z,
      data.rotation.w
    );
  }
};

socket.onPlayerLeft = (data) => {
  const playerObj = otherPlayers.get(data.playerId);
  if (playerObj) {
    scene.remove(playerObj);
    otherPlayers.delete(data.playerId);
  }
};
*/

export { GameAPI, GameSocket, api, socket };
