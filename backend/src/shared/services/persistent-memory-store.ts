import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';

/**
 * Simple in-memory session store with file persistence
 * Saves sessions to disk periodically and on shutdown
 */
export class PersistentMemoryStore {
  private sessions: Map<string, any> = new Map();
  private saveInterval: NodeJS.Timeout;
  private sessionsPath: string;
  private isDirty = false;

  constructor(options: { path?: string; saveInterval?: number } = {}) {
    this.sessionsPath = path.join(options.path || './sessions', 'sessions.json');
    
    // Load existing sessions from disk
    this.loadSessions();
    
    // Save sessions every 30 seconds if there are changes
    const interval = options.saveInterval || 30000;
    this.saveInterval = setInterval(() => {
      if (this.isDirty) {
        this.saveSessions();
      }
    }, interval);
    
    // Save on process exit
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  async loadSessions() {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.sessionsPath);
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
      }
      
      // Load sessions if file exists
      try {
        const data = await fs.readFile(this.sessionsPath, 'utf8');
        const sessions = JSON.parse(data);
        
        // Restore sessions, filtering out expired ones
        const now = Date.now();
        Object.entries(sessions).forEach(([sid, session]: [string, any]) => {
          if (session.cookie && session.cookie.expires) {
            const expires = new Date(session.cookie.expires).getTime();
            if (expires > now) {
              this.sessions.set(sid, session);
            }
          }
        });
        
        console.log(`📂 Loaded ${this.sessions.size} sessions from disk`);
      } catch (fileError) {
        // File doesn't exist yet, that's okay
        console.log('📂 No existing sessions file, starting fresh');
      }
    } catch (error) {
      console.error('❌ Error loading sessions:', error);
    }
  }

  async saveSessions() {
    try {
      const sessions: Record<string, any> = {};
      
      // Convert Map to object for JSON serialization
      this.sessions.forEach((session, sid) => {
        sessions[sid] = session;
      });
      
      // Ensure directory exists
      const dir = path.dirname(this.sessionsPath);
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
      }
      
      // Write sessions to disk
      await fs.writeFile(this.sessionsPath, JSON.stringify(sessions, null, 2));
      this.isDirty = false;
      
      console.log(`💾 Saved ${this.sessions.size} sessions to disk`);
    } catch (error) {
      console.error('❌ Error saving sessions:', error);
    }
  }

  // Express-session store methods
  get(sid: string, callback: (err: any, session?: any) => void) {
    const session = this.sessions.get(sid);
    callback(null, session);
  }

  set(sid: string, session: any, callback?: (err?: any) => void) {
    this.sessions.set(sid, session);
    this.isDirty = true;
    if (callback) callback();
  }

  destroy(sid: string, callback?: (err?: any) => void) {
    this.sessions.delete(sid);
    this.isDirty = true;
    if (callback) callback();
  }

  touch(sid: string, session: any, callback?: (err?: any) => void) {
    if (this.sessions.has(sid)) {
      this.sessions.set(sid, session);
      this.isDirty = true;
    }
    if (callback) callback();
  }

  clear(callback?: (err?: any) => void) {
    this.sessions.clear();
    this.isDirty = true;
    if (callback) callback();
  }

  length(callback: (err: any, length?: number) => void) {
    callback(null, this.sessions.size);
  }

  private shutdown() {
    clearInterval(this.saveInterval);
    this.saveSessions().then(() => {
      console.log('✅ Sessions saved before shutdown');
      process.exit(0);
    });
  }
}