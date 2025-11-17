/**
 * Database configuration using better-sqlite3
 * Simple, fast, and embedded - no separate database server needed!
 */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_PATH || './db/gamer_rpg.db';
const dbDir = path.dirname(dbPath);

// Ensure database directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database
export const db: Database.Database = new Database(dbPath, { verbose: console.log });

// Enable foreign keys
db.pragma('foreign_keys = ON');

/**
 * Initialize database tables
 */
export function initializeDatabase() {
  console.log('📦 Initializing database...');

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      is_admin INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `);

  // Characters table
  db.exec(`
    CREATE TABLE IF NOT EXISTS characters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      level INTEGER DEFAULT 1,
      exp INTEGER DEFAULT 0,

      -- Core Stats
      str INTEGER DEFAULT 8,
      vit INTEGER DEFAULT 9,
      dex INTEGER DEFAULT 11,
      int INTEGER DEFAULT 14,
      wis INTEGER DEFAULT 10,
      luck INTEGER DEFAULT 12,

      -- Derived Stats
      hp INTEGER DEFAULT 90,
      max_hp INTEGER DEFAULT 90,
      mp INTEGER DEFAULT 140,
      max_mp INTEGER DEFAULT 140,

      -- Resources
      money INTEGER DEFAULT 1000,
      stat_points INTEGER DEFAULT 0,
      skill_points INTEGER DEFAULT 0,

      -- Position
      position_x REAL DEFAULT 0,
      position_y REAL DEFAULT 0,
      position_z REAL DEFAULT 0,
      scene_name TEXT DEFAULT 'Mikro15_Home',

      -- Metadata
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Inventory table
  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL,
      item_id TEXT NOT NULL,
      item_name TEXT NOT NULL,
      item_type TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      slot_index INTEGER,
      item_data TEXT,

      FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
    )
  `);

  // Equipment table
  db.exec(`
    CREATE TABLE IF NOT EXISTS equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL UNIQUE,
      weapon_id TEXT,
      shield_id TEXT,
      helmet_id TEXT,
      chest_id TEXT,
      legs_id TEXT,
      gloves_id TEXT,
      boots_id TEXT,
      accessory1_id TEXT,
      accessory2_id TEXT,
      accessory3_id TEXT,

      FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
    )
  `);

  // Skills table
  db.exec(`
    CREATE TABLE IF NOT EXISTS character_skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL,
      skill_id TEXT NOT NULL,
      skill_name TEXT NOT NULL,
      skill_level INTEGER DEFAULT 1,
      skill_exp INTEGER DEFAULT 0,

      FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
    )
  `);

  // Quests table
  db.exec(`
    CREATE TABLE IF NOT EXISTS character_quests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL,
      quest_id TEXT NOT NULL,
      quest_name TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      progress TEXT,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,

      FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
    )
  `);

  // Game sessions table (for tracking online players)
  db.exec(`
    CREATE TABLE IF NOT EXISTS game_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      character_id INTEGER NOT NULL,
      session_token TEXT UNIQUE NOT NULL,
      socket_id TEXT,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
    )
  `);

  console.log('✅ Database initialized successfully!');
}

/**
 * Close database connection
 */
export function closeDatabase() {
  db.close();
  console.log('📦 Database connection closed');
}

export default db;
