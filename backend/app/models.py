"""
The Gamer RPG - Database Models
"""
from datetime import datetime
from typing import Optional, List, Dict
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from pydantic import BaseModel

Base = declarative_base()

# ============================================================================
# SQLAlchemy ORM Models (Database)
# ============================================================================

class Player(Base):
    """Player account and character data"""
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(255), nullable=False)

    # Character info
    character_name = Column(String(50), default="Anatoly Petrauskas")
    level = Column(Integer, default=1)
    exp = Column(Integer, default=0)
    exp_to_next = Column(Integer, default=100)

    # Core stats
    strength = Column(Integer, default=8)
    vitality = Column(Integer, default=9)
    dexterity = Column(Integer, default=11)
    intelligence = Column(Integer, default=14)
    wisdom = Column(Integer, default=10)
    luck = Column(Integer, default=12)

    # Resources
    hp = Column(Integer, default=90)
    max_hp = Column(Integer, default=90)
    mp = Column(Integer, default=140)
    max_mp = Column(Integer, default=140)
    money = Column(Integer, default=500)  # Lithuanian Litas/Euros

    # Position in world
    pos_x = Column(Float, default=0.0)
    pos_y = Column(Float, default=2.0)
    pos_z = Column(Float, default=5.0)
    scene = Column(String(50), default="apartment")

    # Game progress
    current_quest_id = Column(Integer, ForeignKey("quests.id"), nullable=True)
    game_day = Column(Integer, default=1)  # Day 1 = Monday
    game_time = Column(Float, default=7.0)  # 7:00 AM

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, default=datetime.utcnow)
    playtime_seconds = Column(Integer, default=0)

    # Relationships
    inventory_items = relationship("InventoryItem", back_populates="player")
    skills = relationship("PlayerSkill", back_populates="player")
    quest_progress = relationship("QuestProgress", back_populates="player")


class InventoryItem(Base):
    """Items in player's inventory"""
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    item_id = Column(String(50), nullable=False)  # item template ID
    quantity = Column(Integer, default=1)
    equipped = Column(Boolean, default=False)
    slot = Column(String(20), nullable=True)  # weapon, helmet, chest, etc.

    # Item stats (JSON for flexibility)
    stats = Column(JSON, default={})

    player = relationship("Player", back_populates="inventory_items")


class PlayerSkill(Base):
    """Skills learned by player"""
    __tablename__ = "player_skills"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    skill_id = Column(String(50), nullable=False)  # skill template ID
    level = Column(Integer, default=1)
    exp = Column(Integer, default=0)
    hotkey = Column(Integer, nullable=True)  # 1-9 for quick access

    player = relationship("Player", back_populates="skills")


class Quest(Base):
    """Quest definitions"""
    __tablename__ = "quests"

    id = Column(Integer, primary_key=True, index=True)
    quest_id = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(String(500))
    quest_type = Column(String(20))  # main, side, daily
    required_level = Column(Integer, default=1)
    exp_reward = Column(Integer, default=0)
    money_reward = Column(Integer, default=0)
    item_rewards = Column(JSON, default=[])


class QuestProgress(Base):
    """Player's progress on quests"""
    __tablename__ = "quest_progress"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    quest_id = Column(Integer, ForeignKey("quests.id"), nullable=False)
    status = Column(String(20), default="active")  # active, completed, failed
    objectives_completed = Column(JSON, default=[])
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    player = relationship("Player", back_populates="quest_progress")


class DungeonRun(Base):
    """Track instant dungeon runs for statistics"""
    __tablename__ = "dungeon_runs"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    dungeon_type = Column(String(50), nullable=False)
    level_entered = Column(Integer)
    completed = Column(Boolean, default=False)
    monsters_killed = Column(Integer, default=0)
    exp_gained = Column(Integer, default=0)
    loot_gained = Column(JSON, default=[])
    time_spent_seconds = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


# ============================================================================
# Pydantic Models (API Request/Response)
# ============================================================================

class PlayerStats(BaseModel):
    """Player statistics response"""
    level: int
    exp: int
    exp_to_next: int

    strength: int
    vitality: int
    dexterity: int
    intelligence: int
    wisdom: int
    luck: int

    hp: int
    max_hp: int
    mp: int
    max_mp: int
    money: int

    class Config:
        from_attributes = True


class PlayerPosition(BaseModel):
    """Player position in world"""
    x: float
    y: float
    z: float
    scene: str


class SkillData(BaseModel):
    """Skill information"""
    skill_id: str
    name: str
    level: int
    exp: int
    hotkey: Optional[int] = None
    mp_cost: int
    cooldown: float
    damage: Optional[int] = None
    description: str


class ItemData(BaseModel):
    """Item information"""
    item_id: str
    name: str
    quantity: int
    equipped: bool
    slot: Optional[str] = None
    rarity: str
    stats: Dict


class PlayerResponse(BaseModel):
    """Complete player data response"""
    id: int
    username: str
    character_name: str
    stats: PlayerStats
    position: PlayerPosition

    class Config:
        from_attributes = True


class CreatePlayerRequest(BaseModel):
    """Request to create new player"""
    username: str
    email: str
    password: str
    character_name: Optional[str] = "Anatoly Petrauskas"


class LoginRequest(BaseModel):
    """Login request"""
    username: str
    password: str


class UpdatePositionRequest(BaseModel):
    """Update player position"""
    x: float
    y: float
    z: float
    scene: str


class UseSkillRequest(BaseModel):
    """Request to use a skill"""
    skill_id: str
    target_id: Optional[int] = None
    position: Optional[Dict[str, float]] = None


class CreateDungeonRequest(BaseModel):
    """Request to create instant dungeon"""
    dungeon_type: str  # "zombie_zone", "goblin_cave", etc.


class LevelUpResponse(BaseModel):
    """Level up notification"""
    new_level: int
    stat_points: int
    hp_gained: int
    mp_gained: int
