/**
 * SQLite database for storing messages when supervisor approval is required
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'data', 'messages.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    
    // Create messages table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        recipient_email TEXT NOT NULL,
        recipient_name TEXT NOT NULL,
        worker_name TEXT,
        topic TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Add topic column if it doesn't exist (for existing databases)
    try {
      db.exec(`ALTER TABLE messages ADD COLUMN topic TEXT`);
    } catch (e) {
      // Column already exists, ignore
    }
    
    // Add worker_email column if it doesn't exist (for existing databases)
    try {
      db.exec(`ALTER TABLE messages ADD COLUMN worker_email TEXT`);
    } catch (e) {
      // Column already exists, ignore
    }
  }
  
  return db;
}

export interface Message {
  id: number;
  category: string;
  recipient_email: string;
  recipient_name: string;
  worker_name: string | null;
  worker_email: string | null;
  topic: string;
  message: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected' | 'sent';
  created_at: string;
}

export function insertMessage(data: Omit<Message, 'id' | 'status' | 'created_at'>): number {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO messages (category, recipient_email, recipient_name, worker_name, worker_email, topic, message, timestamp, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `);
  
  const result = stmt.run(
    data.category,
    data.recipient_email,
    data.recipient_name,
    data.worker_name || null,
    data.worker_email || null,
    data.topic,
    data.message,
    data.timestamp
  );
  
  return result.lastInsertRowid as number;
}

export function getPendingMessages(): Message[] {
  const db = getDb();
  return db.prepare('SELECT * FROM messages WHERE status = ? ORDER BY created_at DESC').all('pending') as Message[];
}

export function getMessageById(id: number): Message | null {
  const db = getDb();
  return db.prepare('SELECT * FROM messages WHERE id = ?').get(id) as Message | null;
}

export function updateMessageStatus(id: number, status: Message['status']): void {
  const db = getDb();
  db.prepare('UPDATE messages SET status = ? WHERE id = ?').run(status, id);
}

