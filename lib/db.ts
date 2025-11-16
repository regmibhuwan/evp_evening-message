/**
 * SQLite database utilities (currently not used, kept for future features)
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Determine database path - use /tmp for serverless environments (Vercel)
function getDbPath(): string {
  // Check if we're in a serverless environment
  if (process.env.VERCEL === '1') {
    return path.join('/tmp', 'messages.db');
  }

  // Try to use local data directory
  const localDataDir = path.join(process.cwd(), 'data');
  try {
    if (!fs.existsSync(localDataDir)) {
      fs.mkdirSync(localDataDir, { recursive: true });
    }
    return path.join(localDataDir, 'messages.db');
  } catch (error) {
    // If we can't create local directory, fallback to /tmp
    console.warn('Failed to create local data directory, using /tmp:', error);
    return path.join('/tmp', 'messages.db');
  }
}

const dbPath = getDbPath();

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

    // Create users table for verified Gmail accounts
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        google_id TEXT UNIQUE,
        verified_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create carpool_posts table
    db.exec(`
      CREATE TABLE IF NOT EXISTS carpool_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('offer', 'request')),
        starting_point TEXT NOT NULL,
        destination TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        price TEXT,
        availability TEXT,
        additional_info TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create housing_posts table
    db.exec(`
      CREATE TABLE IF NOT EXISTS housing_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        location TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('shared', 'private')),
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        price TEXT,
        contact_info TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create chat_messages table
    db.exec(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        post_id INTEGER NOT NULL,
        post_type TEXT NOT NULL CHECK(post_type IN ('carpool', 'housing')),
        message TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id),
        FOREIGN KEY (receiver_id) REFERENCES users(id)
      )
    `);

    // Create contact_exchanges table
    db.exec(`
      CREATE TABLE IF NOT EXISTS contact_exchanges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user1_id INTEGER NOT NULL,
        user2_id INTEGER NOT NULL,
        post_id INTEGER NOT NULL,
        post_type TEXT NOT NULL CHECK(post_type IN ('carpool', 'housing')),
        contact_shared_by INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user1_id) REFERENCES users(id),
        FOREIGN KEY (user2_id) REFERENCES users(id),
        FOREIGN KEY (contact_shared_by) REFERENCES users(id)
      )
    `);
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

// User interfaces and functions
export interface User {
  id: number;
  email: string;
  name: string;
  google_id: string | null;
  verified_at: string;
  created_at: string;
}

export function createOrUpdateUser(email: string, name: string, googleId?: string): User {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
  
  if (existing) {
    if (googleId) {
      db.prepare('UPDATE users SET google_id = ?, name = ? WHERE email = ?').run(googleId, name, email);
    }
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User;
  }
  
  const stmt = db.prepare('INSERT INTO users (email, name, google_id) VALUES (?, ?, ?)');
  stmt.run(email, name, googleId || null);
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User;
}

export function getUserByEmail(email: string): User | null {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | null;
}

export function getUserById(id: number): User | null {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | null;
}

// Carpool interfaces and functions
export interface CarpoolPost {
  id: number;
  user_id: number;
  type: 'offer' | 'request';
  starting_point: string;
  destination: string;
  date: string;
  time: string;
  price: string | null;
  availability: string | null;
  additional_info: string | null;
  created_at: string;
}

export function createCarpoolPost(data: Omit<CarpoolPost, 'id' | 'created_at'>): number {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO carpool_posts (user_id, type, starting_point, destination, date, time, price, availability, additional_info)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.user_id,
    data.type,
    data.starting_point,
    data.destination,
    data.date,
    data.time,
    data.price || null,
    data.availability || null,
    data.additional_info || null
  );
  return result.lastInsertRowid as number;
}

export function getCarpoolPosts(): CarpoolPost[] {
  const db = getDb();
  return db.prepare('SELECT * FROM carpool_posts ORDER BY created_at DESC').all() as CarpoolPost[];
}

export function getCarpoolPostById(id: number): CarpoolPost | null {
  const db = getDb();
  return db.prepare('SELECT * FROM carpool_posts WHERE id = ?').get(id) as CarpoolPost | null;
}

export function deleteCarpoolPost(id: number, userId: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM carpool_posts WHERE id = ? AND user_id = ?').run(id, userId);
  return result.changes > 0;
}

// Housing interfaces and functions
export interface HousingPost {
  id: number;
  user_id: number;
  location: string;
  type: 'shared' | 'private';
  title: string;
  description: string;
  price: string | null;
  contact_info: string | null;
  created_at: string;
}

export function createHousingPost(data: Omit<HousingPost, 'id' | 'created_at'>): number {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO housing_posts (user_id, location, type, title, description, price, contact_info)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.user_id,
    data.location,
    data.type,
    data.title,
    data.description,
    data.price || null,
    data.contact_info || null
  );
  return result.lastInsertRowid as number;
}

export function getHousingPosts(): HousingPost[] {
  const db = getDb();
  return db.prepare('SELECT * FROM housing_posts ORDER BY created_at DESC').all() as HousingPost[];
}

export function getHousingPostById(id: number): HousingPost | null {
  const db = getDb();
  return db.prepare('SELECT * FROM housing_posts WHERE id = ?').get(id) as HousingPost | null;
}

export function deleteHousingPost(id: number, userId: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM housing_posts WHERE id = ? AND user_id = ?').run(id, userId);
  return result.changes > 0;
}

// Chat interfaces and functions
export interface ChatMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  post_id: number;
  post_type: 'carpool' | 'housing';
  message: string;
  created_at: string;
}

export function createChatMessage(data: Omit<ChatMessage, 'id' | 'created_at'>): number {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO chat_messages (sender_id, receiver_id, post_id, post_type, message)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.sender_id,
    data.receiver_id,
    data.post_id,
    data.post_type,
    data.message
  );
  return result.lastInsertRowid as number;
}

export function getChatMessages(postId: number, postType: 'carpool' | 'housing'): ChatMessage[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM chat_messages 
    WHERE post_id = ? AND post_type = ? 
    ORDER BY created_at ASC
  `).all(postId, postType) as ChatMessage[];
}

// Contact exchange interfaces and functions
export interface ContactExchange {
  id: number;
  user1_id: number;
  user2_id: number;
  post_id: number;
  post_type: 'carpool' | 'housing';
  contact_shared_by: number;
  created_at: string;
}

export function createContactExchange(data: Omit<ContactExchange, 'id' | 'created_at'>): number {
  const db = getDb();
  // Check if exchange already exists
  const existing = db.prepare(`
    SELECT * FROM contact_exchanges 
    WHERE ((user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?))
    AND post_id = ? AND post_type = ?
  `).get(
    data.user1_id, data.user2_id,
    data.user2_id, data.user1_id,
    data.post_id, data.post_type
  );
  
  if (existing) {
    return (existing as ContactExchange).id;
  }
  
  const stmt = db.prepare(`
    INSERT INTO contact_exchanges (user1_id, user2_id, post_id, post_type, contact_shared_by)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.user1_id,
    data.user2_id,
    data.post_id,
    data.post_type,
    data.contact_shared_by
  );
  return result.lastInsertRowid as number;
}

export function getContactExchange(user1Id: number, user2Id: number, postId: number, postType: 'carpool' | 'housing'): ContactExchange | null {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM contact_exchanges 
    WHERE ((user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?))
    AND post_id = ? AND post_type = ?
  `).get(
    user1Id, user2Id,
    user2Id, user1Id,
    postId, postType
  ) as ContactExchange | null;
}

