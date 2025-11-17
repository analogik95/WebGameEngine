"""
The Gamer RPG - Core Game Logic
"""
from typing import Dict, List, Optional, Tuple
import math
import random

# ============================================================================
# STAT CALCULATIONS
# ============================================================================

def calculate_max_hp(vitality: int, level: int) -> int:
    """Calculate maximum HP based on VIT and level"""
    base_hp = 50
    hp_per_vit = 10
    hp_per_level = 10
    return base_hp + (vitality * hp_per_vit) + (level * hp_per_level)


def calculate_max_mp(intelligence: int, level: int) -> int:
    """Calculate maximum MP based on INT and level"""
    base_mp = 50
    mp_per_int = 10
    mp_per_level = 10
    return base_mp + (intelligence * mp_per_int) + (level * mp_per_level)


def calculate_exp_to_next_level(current_level: int) -> int:
    """Calculate EXP needed for next level"""
    return current_level * 100


def calculate_physical_damage(strength: int, weapon_damage: int = 0) -> Tuple[int, int]:
    """Calculate physical damage range (min, max)"""
    base_damage = 5
    damage_per_str = 2
    min_damage = base_damage + (strength // 2) + (weapon_damage // 2)
    max_damage = base_damage + strength + weapon_damage
    return (min_damage, max_damage)


def calculate_magic_damage(intelligence: int, spell_power: int = 0) -> Tuple[int, int]:
    """Calculate magic damage range (min, max)"""
    base_damage = 10
    damage_per_int = 3
    min_damage = base_damage + (intelligence // 2) + (spell_power // 2)
    max_damage = base_damage + (intelligence * 2) + spell_power
    return (min_damage, max_damage)


def calculate_defense(vitality: int, armor: int = 0) -> int:
    """Calculate damage reduction"""
    defense_per_vit = 1
    return (vitality * defense_per_vit) + armor


def calculate_dodge_chance(dexterity: int, luck: int) -> float:
    """Calculate dodge chance (0.0 to 1.0)"""
    base_dodge = 0.05
    dodge_per_dex = 0.002
    dodge_per_luck = 0.001
    dodge = base_dodge + (dexterity * dodge_per_dex) + (luck * dodge_per_luck)
    return min(dodge, 0.75)  # Cap at 75%


def calculate_crit_chance(dexterity: int, luck: int) -> float:
    """Calculate critical hit chance (0.0 to 1.0)"""
    base_crit = 0.05
    crit_per_dex = 0.001
    crit_per_luck = 0.002
    crit = base_crit + (dexterity * crit_per_dex) + (luck * crit_per_luck)
    return min(crit, 0.50)  # Cap at 50%


# ============================================================================
# LEVEL UP SYSTEM
# ============================================================================

def check_level_up(current_exp: int, current_level: int) -> Tuple[bool, int, int]:
    """
    Check if player should level up
    Returns: (leveled_up, new_level, remaining_exp)
    """
    exp_needed = calculate_exp_to_next_level(current_level)

    if current_exp >= exp_needed:
        new_level = current_level + 1
        remaining_exp = current_exp - exp_needed
        return (True, new_level, remaining_exp)

    return (False, current_level, current_exp)


def apply_level_up(player_data: Dict) -> Dict:
    """
    Apply level up bonuses
    Returns: Dictionary with level up rewards
    """
    level = player_data["level"]

    # Stat points to allocate
    stat_points = 5

    # HP/MP increases
    hp_increase = 10 + (player_data["vitality"] * 2)
    mp_increase = 10 + (player_data["intelligence"] * 2)

    # Update max values
    player_data["max_hp"] += hp_increase
    player_data["max_mp"] += mp_increase

    # Restore HP/MP to full on level up
    player_data["hp"] = player_data["max_hp"]
    player_data["mp"] = player_data["max_mp"]

    # Update EXP requirement
    player_data["exp_to_next"] = calculate_exp_to_next_level(level)

    return {
        "stat_points": stat_points,
        "hp_gained": hp_increase,
        "mp_gained": mp_increase,
        "new_max_hp": player_data["max_hp"],
        "new_max_mp": player_data["max_mp"]
    }


# ============================================================================
# SKILL SYSTEM
# ============================================================================

SKILL_DATABASE = {
    "observe": {
        "name": "Observe",
        "description": "View detailed information about targets",
        "type": "utility",
        "mp_cost": 5,
        "cooldown": 1.0,
        "max_level": 10,
        "unlocked_at_level": 1
    },
    "energy_bolt": {
        "name": "Energy Bolt",
        "description": "Fire a bolt of pure mana energy",
        "type": "magic_attack",
        "mp_cost": 20,
        "cooldown": 2.0,
        "base_damage": 50,
        "damage_per_level": 10,
        "max_level": 100,
        "unlocked_at_level": 1
    },
    "power_strike": {
        "name": "Power Strike",
        "description": "Powerful melee attack with 200% damage",
        "type": "physical_attack",
        "mp_cost": 15,
        "cooldown": 5.0,
        "damage_multiplier": 2.0,
        "max_level": 100,
        "unlocked_at_level": 3
    },
    "heal": {
        "name": "Heal",
        "description": "Restore HP",
        "type": "healing",
        "mp_cost": 30,
        "cooldown": 10.0,
        "base_healing": 50,
        "healing_per_level": 5,
        "max_level": 100,
        "unlocked_at_level": 5
    },
    "fireball": {
        "name": "Fireball",
        "description": "Explosive AoE fire damage",
        "type": "magic_attack",
        "mp_cost": 50,
        "cooldown": 8.0,
        "base_damage": 100,
        "damage_per_level": 15,
        "aoe_radius": 5.0,
        "max_level": 100,
        "unlocked_at_level": 10
    },
    "id_create": {
        "name": "ID Create",
        "description": "Create an Instant Dungeon",
        "type": "special",
        "mp_cost": 50,
        "cooldown": 1.0,
        "max_level": 10,
        "unlocked_at_level": 1
    },
    "id_escape": {
        "name": "ID Escape",
        "description": "Exit current Instant Dungeon",
        "type": "special",
        "mp_cost": 10,
        "cooldown": 1.0,
        "max_level": 1,
        "unlocked_at_level": 1
    }
}


def get_skill_damage(skill_id: str, skill_level: int, player_int: int) -> int:
    """Calculate damage for a skill"""
    skill = SKILL_DATABASE.get(skill_id)
    if not skill or skill["type"] not in ["magic_attack", "physical_attack"]:
        return 0

    base_damage = skill.get("base_damage", 0)
    damage_per_level = skill.get("damage_per_level", 0)
    damage_multiplier = skill.get("damage_multiplier", 1.0)

    # Base skill damage
    skill_damage = base_damage + (skill_level * damage_per_level)

    # Apply INT scaling for magic
    if skill["type"] == "magic_attack":
        skill_damage += player_int * 2

    # Apply multiplier
    skill_damage = int(skill_damage * damage_multiplier)

    return skill_damage


def get_skill_mp_cost(skill_id: str, skill_level: int) -> int:
    """Calculate MP cost (decreases with level)"""
    skill = SKILL_DATABASE.get(skill_id)
    if not skill:
        return 0

    base_cost = skill["mp_cost"]
    # Reduce MP cost by 1% per skill level (max 50% reduction)
    reduction = min(skill_level * 0.01, 0.50)
    return int(base_cost * (1.0 - reduction))


# ============================================================================
# COMBAT SYSTEM
# ============================================================================

def calculate_damage(
    attacker_stats: Dict,
    defender_stats: Dict,
    skill_id: Optional[str] = None,
    skill_level: int = 1
) -> Dict:
    """
    Calculate damage dealt in an attack
    Returns dict with damage, is_crit, is_dodged, etc.
    """
    # Check for dodge
    dodge_chance = calculate_dodge_chance(
        defender_stats.get("dexterity", 10),
        defender_stats.get("luck", 10)
    )

    if random.random() < dodge_chance:
        return {
            "damage": 0,
            "is_dodged": True,
            "is_crit": False,
            "message": "Attack dodged!"
        }

    # Calculate base damage
    if skill_id:
        damage = get_skill_damage(
            skill_id,
            skill_level,
            attacker_stats.get("intelligence", 10)
        )
    else:
        # Basic attack
        min_dmg, max_dmg = calculate_physical_damage(
            attacker_stats.get("strength", 10),
            attacker_stats.get("weapon_damage", 0)
        )
        damage = random.randint(min_dmg, max_dmg)

    # Check for critical hit
    crit_chance = calculate_crit_chance(
        attacker_stats.get("dexterity", 10),
        attacker_stats.get("luck", 10)
    )

    is_crit = random.random() < crit_chance
    if is_crit:
        damage = int(damage * 1.5)

    # Apply defense reduction
    defense = calculate_defense(
        defender_stats.get("vitality", 10),
        defender_stats.get("armor", 0)
    )

    damage = max(1, damage - defense)  # Minimum 1 damage

    return {
        "damage": damage,
        "is_dodged": False,
        "is_crit": is_crit,
        "message": f"Critical hit! {damage} damage!" if is_crit else f"{damage} damage"
    }


# ============================================================================
# INSTANT DUNGEON SYSTEM
# ============================================================================

DUNGEON_TYPES = {
    "empty_zone": {
        "name": "Empty Zone",
        "mp_cost": 50,
        "min_level": 1,
        "monsters": [],
        "description": "Safe practice area"
    },
    "zombie_zone": {
        "name": "Zombie Zone",
        "mp_cost": 50,
        "min_level": 1,
        "monsters": ["zombie", "zombie_brute"],
        "monster_count": (5, 15),
        "boss": "zombie_lord",
        "description": "Abandoned building filled with zombies"
    },
    "goblin_cave": {
        "name": "Goblin Cave",
        "mp_cost": 100,
        "min_level": 10,
        "monsters": ["goblin_warrior", "goblin_archer", "goblin_shaman"],
        "monster_count": (10, 20),
        "boss": "goblin_chieftain",
        "description": "Underground cave system inhabited by goblins"
    },
    "shadow_realm": {
        "name": "Shadow Realm",
        "mp_cost": 150,
        "min_level": 20,
        "monsters": ["shadow_beast", "dark_spirit"],
        "monster_count": (8, 15),
        "boss": "shadow_lord",
        "description": "Distorted reality filled with shadow creatures"
    }
}


def can_create_dungeon(player_level: int, player_mp: int, dungeon_type: str) -> Tuple[bool, str]:
    """Check if player can create dungeon"""
    dungeon = DUNGEON_TYPES.get(dungeon_type)

    if not dungeon:
        return (False, "Unknown dungeon type")

    if player_level < dungeon["min_level"]:
        return (False, f"Requires level {dungeon['min_level']}")

    if player_mp < dungeon["mp_cost"]:
        return (False, f"Not enough MP (need {dungeon['mp_cost']})")

    return (True, "OK")


def generate_dungeon_instance(dungeon_type: str, player_level: int) -> Dict:
    """Generate a dungeon instance with monsters"""
    dungeon = DUNGEON_TYPES.get(dungeon_type)
    if not dungeon:
        return {}

    # Generate monster spawns
    if "monster_count" in dungeon:
        min_count, max_count = dungeon["monster_count"]
        monster_count = random.randint(min_count, max_count)

        monsters = []
        for i in range(monster_count):
            monster_type = random.choice(dungeon["monsters"])
            monsters.append({
                "id": f"monster_{i}",
                "type": monster_type,
                "level": player_level + random.randint(-2, 2)
            })
    else:
        monsters = []

    # Boss
    boss = None
    if "boss" in dungeon:
        boss = {
            "id": "boss",
            "type": dungeon["boss"],
            "level": player_level + 5
        }

    return {
        "dungeon_type": dungeon_type,
        "monsters": monsters,
        "boss": boss,
        "completed": False
    }
