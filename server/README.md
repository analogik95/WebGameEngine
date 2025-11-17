# The Gamer RPG - Backend Server

Node.js/TypeScript backend server for The Gamer RPG, featuring RESTful API and WebSocket support for real-time multiplayer.

## Features

- **Express.js** - Fast, unopinionated web framework
- **TypeScript** - Type-safe development
- **SQLite** - Embedded database (no separate server needed!)
- **JWT Authentication** - Secure token-based auth
- **Socket.IO** - Real-time multiplayer with WebSockets
- **bcrypt** - Secure password hashing
- **CORS & Helmet** - Security best practices

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and customize:

```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:8080
JWT_SECRET=your-secret-key-change-in-production
DATABASE_PATH=./data/game.db
```

### 3. Start Server

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

Server will start on `http://localhost:3000`

## API Endpoints

### Authentication

**Register**
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "anatoly",
  "email": "anatoly@example.com",
  "password": "password123",
  "characterName": "Anatoly Petrauskas"
}
```

Response:
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGc...",
  "user": { "id": 1, "username": "anatoly", "email": "..." },
  "character": { "id": 1, "name": "Anatoly Petrauskas", "level": 1, ... }
}
```

**Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "anatoly",
  "password": "password123"
}
```

**Get Current User**
```http
GET /api/auth/me
Authorization: Bearer YOUR_TOKEN
```

### Characters

All character endpoints require authentication:
```http
Authorization: Bearer YOUR_TOKEN
```

**List My Characters**
```http
GET /api/characters
```

**Create Character**
```http
POST /api/characters
Content-Type: application/json

{
  "name": "New Character",
  "stats": {
    "str": 10,
    "vit": 10,
    "dex": 10,
    "int": 10,
    "wis": 10,
    "luck": 10
  }
}
```

**Get Character**
```http
GET /api/characters/:id
```

**Update Character**
```http
PUT /api/characters/:id
Content-Type: application/json

{
  "position_x": 100,
  "position_y": 0,
  "position_z": 50
}
```

**Delete Character**
```http
DELETE /api/characters/:id
```

### Character Actions

**Gain Experience**
```http
POST /api/characters/:id/gain-exp
Content-Type: application/json

{
  "amount": 150
}
```

**Add Stat Points**
```http
POST /api/characters/:id/add-stats
Content-Type: application/json

{
  "stat": "str",
  "points": 5
}
```

**Take Damage**
```http
POST /api/characters/:id/take-damage
Content-Type: application/json

{
  "amount": 25
}
```

**Heal**
```http
POST /api/characters/:id/heal
Content-Type: application/json

{
  "amount": 50
}
```

## WebSocket Events

Connect to WebSocket at `ws://localhost:3000` with authentication:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});
```

### Client → Server Events

**Join Game**
```javascript
socket.emit('join', {
  characterId: 1,
  room: 'lobby' // optional, defaults to 'lobby'
});
```

**Move**
```javascript
socket.emit('move', {
  position: { x: 10, y: 0, z: 20 },
  rotation: { x: 0, y: 0.5, z: 0, w: 0.866 }
});
```

**Attack**
```javascript
socket.emit('attack', {
  targetId: 'socket-id-of-target', // optional
  damage: 50,
  skillName: 'Basic Attack' // optional
});
```

**Heal**
```javascript
socket.emit('heal', {
  amount: 50
});
```

**Chat**
```javascript
socket.emit('chat', {
  message: 'Hello, world!'
});
```

**Level Up**
```javascript
socket.emit('levelUp', {
  newLevel: 5
});
```

**Change Room**
```javascript
socket.emit('changeRoom', {
  roomId: 'arena'
});
```

### Server → Client Events

**Joined**
```javascript
socket.on('joined', (data) => {
  console.log('Joined game:', data);
  // { playerId, room, player }
});
```

**Players List**
```javascript
socket.on('players', (players) => {
  console.log('Other players:', players);
});
```

**Player Joined**
```javascript
socket.on('playerJoined', (player) => {
  console.log('New player:', player);
});
```

**Player Moved**
```javascript
socket.on('playerMoved', (data) => {
  console.log('Player moved:', data);
  // { playerId, position, rotation }
});
```

**Player Attacked**
```javascript
socket.on('playerAttacked', (data) => {
  console.log('Player attacked:', data);
  // { attackerId, targetId, damage, skillName, position }
});
```

**Damaged**
```javascript
socket.on('damaged', (data) => {
  console.log('You took damage:', data);
  // { attackerId, damage, currentHp }
});
```

**Player HP Changed**
```javascript
socket.on('playerHpChanged', (data) => {
  // { playerId, hp, maxHp }
});
```

**Player Died**
```javascript
socket.on('playerDied', (data) => {
  // { playerId, killerId }
});
```

**Healed**
```javascript
socket.on('healed', (data) => {
  // { amount, currentHp }
});
```

**Chat Message**
```javascript
socket.on('chatMessage', (data) => {
  console.log(`${data.username}: ${data.message}`);
  // { playerId, username, characterName, message, timestamp }
});
```

**Player Leveled Up**
```javascript
socket.on('playerLeveledUp', (data) => {
  // { playerId, characterName, level }
});
```

**Player Left**
```javascript
socket.on('playerLeft', (data) => {
  // { playerId, characterName }
});
```

**Error**
```javascript
socket.on('error', (data) => {
  console.error('Server error:', data.message);
});
```

## Database Schema

The server uses SQLite with the following tables:

- **users** - User accounts
- **characters** - Player characters with stats
- **inventory** - Character inventories
- **equipment** - Equipped items
- **character_skills** - Learned skills
- **character_quests** - Active and completed quests
- **game_sessions** - Active player sessions

Database is automatically created on first startup at `./data/game.db`

## Security Features

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens expire after 7 days
- CORS protection
- Helmet.js security headers
- SQL injection protection (parameterized queries)
- Foreign key constraints enabled

## Development

**Project Structure:**
```
server/
├── src/
│   ├── config/
│   │   └── database.ts       # SQLite setup & schema
│   ├── controllers/
│   │   ├── AuthController.ts # Authentication logic
│   │   └── CharacterController.ts # Character operations
│   ├── middleware/
│   │   └── auth.ts           # JWT middleware
│   ├── models/
│   │   ├── User.ts           # User model
│   │   └── Character.ts      # Character model
│   ├── routes/
│   │   ├── auth.ts           # Auth routes
│   │   └── characters.ts     # Character routes
│   ├── services/
│   │   └── websocket.ts      # WebSocket handlers
│   └── server.ts             # Main entry point
├── data/                     # SQLite database (created automatically)
├── dist/                     # Compiled JavaScript (after build)
├── package.json
└── tsconfig.json
```

**Available Scripts:**
- `npm run dev` - Start dev server with auto-reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run production server
- `npm run clean` - Remove build artifacts

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `CORS_ORIGIN` | `http://localhost:8080` | Allowed CORS origin |
| `JWT_SECRET` | `your-secret-key` | JWT signing secret (CHANGE IN PRODUCTION!) |
| `DATABASE_PATH` | `./data/game.db` | SQLite database path |

## Testing

**Test with curl:**

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'

# Get characters (replace TOKEN)
curl http://localhost:3000/api/characters \
  -H "Authorization: Bearer TOKEN"
```

## Production Deployment

1. Set strong `JWT_SECRET` in production environment
2. Use proper database path (persistent storage)
3. Set `NODE_ENV=production`
4. Configure proper CORS origins
5. Use HTTPS in production
6. Consider using PM2 or similar process manager

## License

MIT
