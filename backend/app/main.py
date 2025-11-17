"""
The Gamer RPG - Main FastAPI Application
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Dict, List
import json
import asyncio

from app.database import get_db, init_db
from app.models import (
    Player, PlayerResponse, CreatePlayerRequest, LoginRequest,
    UpdatePositionRequest, UseSkillRequest, CreateDungeonRequest
)
from app.game_logic import (
    calculate_max_hp, calculate_max_mp, check_level_up, apply_level_up,
    can_create_dungeon, generate_dungeon_instance, SKILL_DATABASE,
    get_skill_mp_cost, calculate_damage
)
from passlib.context import CryptContext

# ============================================================================
# APP INITIALIZATION
# ============================================================================

app = FastAPI(title="The Gamer RPG API", version="1.0.0")

# CORS middleware for web client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Active WebSocket connections
active_connections: Dict[int, WebSocket] = {}

# Active dungeon instances
active_dungeons: Dict[int, Dict] = {}


# ============================================================================
# STARTUP/SHUTDOWN
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    print("Starting The Gamer RPG server...")
    init_db()
    print("Server ready!")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    print("Shutting down...")


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password"""
    return pwd_context.verify(plain_password, hashed_password)


def get_player_by_username(db: Session, username: str):
    """Get player by username"""
    return db.query(Player).filter(Player.username == username).first()


async def broadcast_to_nearby_players(player_id: int, message: Dict, radius: float = 50.0):
    """Broadcast message to nearby players (for multiplayer)"""
    # TODO: Implement spatial partitioning for efficient nearby player lookup
    # For now, broadcast to all connected players except sender
    for conn_id, websocket in active_connections.items():
        if conn_id != player_id:
            try:
                await websocket.send_json(message)
            except:
                pass


# ============================================================================
# REST API ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """API health check"""
    return {"message": "The Gamer RPG API", "status": "online"}


@app.post("/api/players/register")
async def register_player(request: CreatePlayerRequest, db: Session = Depends(get_db)):
    """Create a new player account"""
    # Check if username exists
    existing = get_player_by_username(db, request.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    # Create player
    hashed_pw = get_password_hash(request.password)

    player = Player(
        username=request.username,
        email=request.email,
        hashed_password=hashed_pw,
        character_name=request.character_name
    )

    db.add(player)
    db.commit()
    db.refresh(player)

    return {"message": "Player created successfully", "player_id": player.id}


@app.post("/api/players/login")
async def login_player(request: LoginRequest, db: Session = Depends(get_db)):
    """Login and get player data"""
    player = get_player_by_username(db, request.username)

    if not player or not verify_password(request.password, player.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Update last login
    from datetime import datetime
    player.last_login = datetime.utcnow()
    db.commit()

    # Return player data
    return {
        "message": "Login successful",
        "player": {
            "id": player.id,
            "username": player.username,
            "character_name": player.character_name,
            "level": player.level,
            "hp": player.hp,
            "max_hp": player.max_hp,
            "mp": player.mp,
            "max_mp": player.max_mp,
            "stats": {
                "strength": player.strength,
                "vitality": player.vitality,
                "dexterity": player.dexterity,
                "intelligence": player.intelligence,
                "wisdom": player.wisdom,
                "luck": player.luck
            },
            "position": {
                "x": player.pos_x,
                "y": player.pos_y,
                "z": player.pos_z,
                "scene": player.scene
            }
        }
    }


@app.get("/api/players/{player_id}")
async def get_player(player_id: int, db: Session = Depends(get_db)):
    """Get player data by ID"""
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    return {
        "id": player.id,
        "character_name": player.character_name,
        "level": player.level,
        "hp": player.hp,
        "max_hp": player.max_hp
    }


@app.get("/api/skills")
async def get_skills():
    """Get list of all available skills"""
    return {"skills": SKILL_DATABASE}


# ============================================================================
# WEBSOCKET - REAL-TIME GAME CONNECTION
# ============================================================================

@app.websocket("/ws/{player_id}")
async def websocket_endpoint(websocket: WebSocket, player_id: int, db: Session = Depends(get_db)):
    """
    WebSocket connection for real-time game updates

    Message format:
    {
        "type": "action_name",
        "data": {...}
    }
    """
    await websocket.accept()
    active_connections[player_id] = websocket

    # Get player from database
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        await websocket.close(code=1008, reason="Player not found")
        return

    print(f"Player {player.character_name} (ID: {player_id}) connected")

    try:
        # Send welcome message
        await websocket.send_json({
            "type": "connected",
            "message": f"Welcome back, {player.character_name}!",
            "player_data": {
                "level": player.level,
                "hp": player.hp,
                "max_hp": player.max_hp,
                "mp": player.mp,
                "max_mp": player.max_mp
            }
        })

        # Listen for messages
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            msg_type = message.get("type")
            msg_data = message.get("data", {})

            # Handle different message types
            if msg_type == "update_position":
                await handle_update_position(player, msg_data, db, websocket)

            elif msg_type == "use_skill":
                await handle_use_skill(player, msg_data, db, websocket)

            elif msg_type == "create_dungeon":
                await handle_create_dungeon(player, msg_data, db, websocket)

            elif msg_type == "attack_enemy":
                await handle_attack_enemy(player, msg_data, db, websocket)

            elif msg_type == "gain_exp":
                await handle_gain_exp(player, msg_data, db, websocket)

            else:
                await websocket.send_json({
                    "type": "error",
                    "message": f"Unknown message type: {msg_type}"
                })

    except WebSocketDisconnect:
        print(f"Player {player.character_name} (ID: {player_id}) disconnected")
        del active_connections[player_id]

    except Exception as e:
        print(f"Error in WebSocket: {e}")
        del active_connections[player_id]


# ============================================================================
# WEBSOCKET MESSAGE HANDLERS
# ============================================================================

async def handle_update_position(player: Player, data: Dict, db: Session, websocket: WebSocket):
    """Handle player position update"""
    player.pos_x = data.get("x", player.pos_x)
    player.pos_y = data.get("y", player.pos_y)
    player.pos_z = data.get("z", player.pos_z)
    player.scene = data.get("scene", player.scene)

    db.commit()

    # Broadcast to nearby players
    await broadcast_to_nearby_players(player.id, {
        "type": "player_moved",
        "player_id": player.id,
        "position": {"x": player.pos_x, "y": player.pos_y, "z": player.pos_z}
    })


async def handle_use_skill(player: Player, data: Dict, db: Session, websocket: WebSocket):
    """Handle skill usage"""
    skill_id = data.get("skill_id")
    skill = SKILL_DATABASE.get(skill_id)

    if not skill:
        await websocket.send_json({"type": "error", "message": "Unknown skill"})
        return

    # Check MP cost
    mp_cost = get_skill_mp_cost(skill_id, 1)  # TODO: Get actual skill level
    if player.mp < mp_cost:
        await websocket.send_json({"type": "error", "message": "Not enough MP"})
        return

    # Deduct MP
    player.mp -= mp_cost
    db.commit()

    # Execute skill effect
    await websocket.send_json({
        "type": "skill_used",
        "skill_id": skill_id,
        "skill_name": skill["name"],
        "mp_cost": mp_cost,
        "current_mp": player.mp
    })


async def handle_create_dungeon(player: Player, data: Dict, db: Session, websocket: WebSocket):
    """Handle instant dungeon creation"""
    dungeon_type = data.get("dungeon_type", "zombie_zone")

    can_create, message = can_create_dungeon(player.level, player.mp, dungeon_type)

    if not can_create:
        await websocket.send_json({"type": "error", "message": message})
        return

    # Generate dungeon instance
    dungeon = generate_dungeon_instance(dungeon_type, player.level)
    active_dungeons[player.id] = dungeon

    # Deduct MP
    from app.game_logic import DUNGEON_TYPES
    mp_cost = DUNGEON_TYPES[dungeon_type]["mp_cost"]
    player.mp -= mp_cost
    db.commit()

    await websocket.send_json({
        "type": "dungeon_created",
        "dungeon": dungeon,
        "current_mp": player.mp
    })


async def handle_attack_enemy(player: Player, data: Dict, db: Session, websocket: WebSocket):
    """Handle player attacking enemy"""
    enemy_id = data.get("enemy_id")
    skill_id = data.get("skill_id")

    # Get player stats
    attacker_stats = {
        "strength": player.strength,
        "vitality": player.vitality,
        "dexterity": player.dexterity,
        "intelligence": player.intelligence,
        "wisdom": player.wisdom,
        "luck": player.luck
    }

    # Mock enemy stats (TODO: Get from dungeon instance)
    defender_stats = {
        "vitality": 10,
        "dexterity": 8,
        "luck": 5,
        "armor": 0
    }

    # Calculate damage
    damage_result = calculate_damage(attacker_stats, defender_stats, skill_id, 1)

    await websocket.send_json({
        "type": "attack_result",
        "enemy_id": enemy_id,
        "damage": damage_result["damage"],
        "is_crit": damage_result["is_crit"],
        "is_dodged": damage_result["is_dodged"],
        "message": damage_result["message"]
    })


async def handle_gain_exp(player: Player, data: Dict, db: Session, websocket: WebSocket):
    """Handle player gaining EXP"""
    exp_gained = data.get("exp", 0)
    player.exp += exp_gained

    # Check for level up
    leveled_up, new_level, remaining_exp = check_level_up(player.exp, player.level)

    if leveled_up:
        player.level = new_level
        player.exp = remaining_exp

        # Apply level up bonuses
        level_up_rewards = apply_level_up({
            "level": player.level,
            "max_hp": player.max_hp,
            "max_mp": player.max_mp,
            "vitality": player.vitality,
            "intelligence": player.intelligence
        })

        player.max_hp = level_up_rewards["new_max_hp"]
        player.max_mp = level_up_rewards["new_max_mp"]
        player.hp = player.max_hp
        player.mp = player.max_mp
        player.exp_to_next = level_up_rewards

        db.commit()

        await websocket.send_json({
            "type": "level_up",
            "new_level": new_level,
            "stat_points": level_up_rewards["stat_points"],
            "hp_gained": level_up_rewards["hp_gained"],
            "mp_gained": level_up_rewards["mp_gained"],
            "current_hp": player.hp,
            "current_mp": player.mp
        })
    else:
        db.commit()

        await websocket.send_json({
            "type": "exp_gained",
            "exp": exp_gained,
            "total_exp": player.exp,
            "exp_to_next": player.exp_to_next
        })


# ============================================================================
# GAME SYSTEMS
# ============================================================================

@app.post("/api/game/heal")
async def heal_player(player_id: int, amount: int, db: Session = Depends(get_db)):
    """Heal player (for testing)"""
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    player.hp = min(player.hp + amount, player.max_hp)
    db.commit()

    return {"current_hp": player.hp, "max_hp": player.max_hp}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
