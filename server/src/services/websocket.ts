/**
 * WebSocket Service
 * Handles real-time multiplayer communication
 */
import { Server as SocketServer, Socket } from 'socket.io';
import { verify } from 'jsonwebtoken';
import { CharacterModel } from '../models/Character';
import { UserModel } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

interface Player {
  userId: number;
  characterId: number;
  username: string;
  characterName: string;
  socketId: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number; w: number };
  hp: number;
  maxHp: number;
  level: number;
  room: string;
}

interface GameRoom {
  id: string;
  name: string;
  players: Map<string, Player>;
  maxPlayers: number;
}

// Active players by socket ID
const activePlayers = new Map<string, Player>();

// Game rooms
const gameRooms = new Map<string, GameRoom>();

// Create default lobby room
const lobbyRoom: GameRoom = {
  id: 'lobby',
  name: 'Main Lobby',
  players: new Map(),
  maxPlayers: 50
};
gameRooms.set('lobby', lobbyRoom);

/**
 * Authenticate socket connection
 */
function authenticateSocket(socket: Socket): { userId: number; username: string } | null {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      console.log('No token provided');
      return null;
    }

    const decoded = verify(token, JWT_SECRET) as { userId: number };
    const user = UserModel.findById(decoded.userId);

    if (!user) {
      console.log('User not found');
      return null;
    }

    return { userId: user.id, username: user.username };
  } catch (error) {
    console.error('Socket auth error:', error);
    return null;
  }
}

/**
 * Setup WebSocket handlers
 */
export function setupWebSocket(io: SocketServer) {
  console.log('🔌 Setting up WebSocket...');

  io.on('connection', (socket: Socket) => {
    console.log(`📡 Client connected: ${socket.id}`);

    // Authenticate
    const auth = authenticateSocket(socket);
    if (!auth) {
      console.log('❌ Authentication failed, disconnecting');
      socket.emit('error', { message: 'Authentication failed' });
      socket.disconnect();
      return;
    }

    // Handle player join
    socket.on('join', (data: { characterId: number; room?: string }) => {
      try {
        const character = CharacterModel.findById(data.characterId);

        if (!character) {
          socket.emit('error', { message: 'Character not found' });
          return;
        }

        // Verify ownership
        if (character.user_id !== auth.userId) {
          socket.emit('error', { message: 'Not your character' });
          return;
        }

        const roomId = data.room || 'lobby';
        const room = gameRooms.get(roomId);

        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        if (room.players.size >= room.maxPlayers) {
          socket.emit('error', { message: 'Room is full' });
          return;
        }

        // Create player object
        const player: Player = {
          userId: auth.userId,
          characterId: character.id,
          username: auth.username,
          characterName: character.name,
          socketId: socket.id,
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          hp: character.hp,
          maxHp: character.max_hp,
          level: character.level,
          room: roomId
        };

        // Add to active players and room
        activePlayers.set(socket.id, player);
        room.players.set(socket.id, player);

        // Join socket room
        socket.join(roomId);

        // Notify player of successful join
        socket.emit('joined', {
          playerId: socket.id,
          room: roomId,
          player
        });

        // Get all other players in room
        const otherPlayers = Array.from(room.players.values())
          .filter(p => p.socketId !== socket.id);

        // Send existing players to new player
        socket.emit('players', otherPlayers);

        // Notify other players of new player
        socket.to(roomId).emit('playerJoined', player);

        console.log(`✅ Player ${auth.username} (${character.name}) joined ${roomId}`);
      } catch (error: any) {
        console.error('Join error:', error);
        socket.emit('error', { message: 'Failed to join game' });
      }
    });

    // Handle player movement
    socket.on('move', (data: { position: any; rotation: any }) => {
      const player = activePlayers.get(socket.id);

      if (!player) {
        return;
      }

      // Update player position
      player.position = data.position;
      player.rotation = data.rotation;

      // Broadcast to other players in same room
      socket.to(player.room).emit('playerMoved', {
        playerId: socket.id,
        position: data.position,
        rotation: data.rotation
      });
    });

    // Handle attack
    socket.on('attack', (data: { targetId?: string; damage: number; skillName?: string }) => {
      const player = activePlayers.get(socket.id);

      if (!player) {
        return;
      }

      // Broadcast attack to room
      socket.to(player.room).emit('playerAttacked', {
        attackerId: socket.id,
        targetId: data.targetId,
        damage: data.damage,
        skillName: data.skillName,
        position: player.position
      });

      // If there's a target, handle damage
      if (data.targetId) {
        const target = activePlayers.get(data.targetId);

        if (target) {
          target.hp = Math.max(0, target.hp - data.damage);

          // Notify target of damage
          io.to(data.targetId).emit('damaged', {
            attackerId: socket.id,
            damage: data.damage,
            currentHp: target.hp
          });

          // Broadcast HP update
          io.to(player.room).emit('playerHpChanged', {
            playerId: data.targetId,
            hp: target.hp,
            maxHp: target.maxHp
          });

          // Check if target died
          if (target.hp <= 0) {
            io.to(player.room).emit('playerDied', {
              playerId: data.targetId,
              killerId: socket.id
            });
          }
        }
      }
    });

    // Handle heal
    socket.on('heal', (data: { amount: number }) => {
      const player = activePlayers.get(socket.id);

      if (!player) {
        return;
      }

      player.hp = Math.min(player.maxHp, player.hp + data.amount);

      // Notify player
      socket.emit('healed', {
        amount: data.amount,
        currentHp: player.hp
      });

      // Broadcast HP update
      socket.to(player.room).emit('playerHpChanged', {
        playerId: socket.id,
        hp: player.hp,
        maxHp: player.maxHp
      });
    });

    // Handle chat message
    socket.on('chat', (data: { message: string }) => {
      const player = activePlayers.get(socket.id);

      if (!player) {
        return;
      }

      // Broadcast message to room
      io.to(player.room).emit('chatMessage', {
        playerId: socket.id,
        username: player.username,
        characterName: player.characterName,
        message: data.message,
        timestamp: new Date().toISOString()
      });

      console.log(`💬 ${player.username}: ${data.message}`);
    });

    // Handle level up
    socket.on('levelUp', (data: { newLevel: number }) => {
      const player = activePlayers.get(socket.id);

      if (!player) {
        return;
      }

      player.level = data.newLevel;

      // Broadcast level up to room
      socket.to(player.room).emit('playerLeveledUp', {
        playerId: socket.id,
        characterName: player.characterName,
        level: data.newLevel
      });
    });

    // Handle room change
    socket.on('changeRoom', (data: { roomId: string }) => {
      const player = activePlayers.get(socket.id);

      if (!player) {
        return;
      }

      const newRoom = gameRooms.get(data.roomId);

      if (!newRoom) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (newRoom.players.size >= newRoom.maxPlayers) {
        socket.emit('error', { message: 'Room is full' });
        return;
      }

      const oldRoom = gameRooms.get(player.room);

      // Leave old room
      if (oldRoom) {
        oldRoom.players.delete(socket.id);
        socket.leave(player.room);

        // Notify old room
        socket.to(player.room).emit('playerLeft', {
          playerId: socket.id,
          characterName: player.characterName
        });
      }

      // Join new room
      player.room = data.roomId;
      newRoom.players.set(socket.id, player);
      socket.join(data.roomId);

      // Get players in new room
      const roomPlayers = Array.from(newRoom.players.values())
        .filter(p => p.socketId !== socket.id);

      // Send new room info to player
      socket.emit('roomChanged', {
        roomId: data.roomId,
        players: roomPlayers
      });

      // Notify new room
      socket.to(data.roomId).emit('playerJoined', player);

      console.log(`🚪 Player ${player.username} moved to ${data.roomId}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      const player = activePlayers.get(socket.id);

      if (player) {
        const room = gameRooms.get(player.room);

        if (room) {
          room.players.delete(socket.id);

          // Notify room
          socket.to(player.room).emit('playerLeft', {
            playerId: socket.id,
            characterName: player.characterName
          });
        }

        activePlayers.delete(socket.id);
        console.log(`👋 Player ${player.username} disconnected`);
      } else {
        console.log(`📡 Client disconnected: ${socket.id}`);
      }
    });
  });

  // Room management endpoints
  io.on('createRoom', (data: { name: string; maxPlayers: number }) => {
    const roomId = `room_${Date.now()}`;
    const newRoom: GameRoom = {
      id: roomId,
      name: data.name,
      players: new Map(),
      maxPlayers: data.maxPlayers || 20
    };

    gameRooms.set(roomId, newRoom);
    console.log(`🏠 Created room: ${data.name} (${roomId})`);
  });

  console.log('✅ WebSocket ready');
}

/**
 * Get room list
 */
export function getRoomList() {
  return Array.from(gameRooms.values()).map(room => ({
    id: room.id,
    name: room.name,
    playerCount: room.players.size,
    maxPlayers: room.maxPlayers
  }));
}

/**
 * Get active player count
 */
export function getPlayerCount() {
  return activePlayers.size;
}
