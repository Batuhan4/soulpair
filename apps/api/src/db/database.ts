import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../soulpair.db');

const db: InstanceType<typeof Database> = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ===== Schema =====

db.exec(`
  CREATE TABLE IF NOT EXISTS profiles (
    wallet_address TEXT PRIMARY KEY,
    flirt_md_cid TEXT NOT NULL,
    flirt_md_content TEXT,
    twitter_handle TEXT,
    instagram_handle TEXT,
    linkedin_handle TEXT,
    match_count INTEGER DEFAULT 0,
    total_conversations INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    match_queue_id TEXT,
    agent1_address TEXT NOT NULL,
    agent2_address TEXT NOT NULL,
    result_outcome TEXT,
    result_confidence REAL,
    result_commonalities TEXT,
    result_differences TEXT,
    result_reasoning TEXT,
    result_feedback TEXT,
    status TEXT DEFAULT 'waiting',
    started_at TEXT DEFAULT (datetime('now')),
    ended_at TEXT,
    FOREIGN KEY (agent1_address) REFERENCES profiles(wallet_address),
    FOREIGN KEY (agent2_address) REFERENCES profiles(wallet_address)
  );

  CREATE TABLE IF NOT EXISTS conversation_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    from_address TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
  );

  CREATE TABLE IF NOT EXISTS match_queue (
    id TEXT PRIMARY KEY,
    agent1_address TEXT NOT NULL,
    agent2_address TEXT NOT NULL,
    conversation_id TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now')),
    processed_at TEXT,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
  );

  CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    user1_address TEXT NOT NULL,
    user2_address TEXT NOT NULL,
    conversation_cid TEXT,
    match_fee TEXT,
    user1_approved INTEGER DEFAULT 0,
    user2_approved INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending_approval',
    on_chain_match_id INTEGER,
    matched_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
  );

  CREATE TABLE IF NOT EXISTS agent_heartbeats (
    wallet_address TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    status TEXT DEFAULT 'offline',
    active_conversations INTEGER DEFAULT 0,
    active_matches INTEGER DEFAULT 0,
    last_heartbeat TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (wallet_address) REFERENCES profiles(wallet_address)
  );

  CREATE TABLE IF NOT EXISTS match_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent1_address TEXT NOT NULL,
    agent2_address TEXT NOT NULL,
    matched_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
  CREATE INDEX IF NOT EXISTS idx_match_queue_status ON match_queue(status);
  CREATE INDEX IF NOT EXISTS idx_agent_heartbeats_status ON agent_heartbeats(status);
  CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
  CREATE INDEX IF NOT EXISTS idx_conversation_messages_conv ON conversation_messages(conversation_id);
`);

export default db;
