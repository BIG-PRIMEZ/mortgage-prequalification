import { EventEmitter } from 'events';

interface SessionConfig {
  warningTime: number; // Time before expiry to show warning (ms)
  checkInterval: number; // How often to check session status (ms)
  maxInactivity: number; // Maximum inactivity before warning (ms)
}

export interface SessionInfo {
  id: string;
  expiresAt: number;
  createdAt: number;
  lastActivity: number;
  csrfToken?: string;
}

export class SessionManager extends EventEmitter {
  private session: SessionInfo | null = null;
  private activityTimer: NodeJS.Timeout | null = null;
  private expiryTimer: NodeJS.Timeout | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private lastUserActivity: number = Date.now();
  private config: SessionConfig = {
    warningTime: 5 * 60 * 1000, // 5 minutes before expiry
    checkInterval: 60 * 1000, // Check every minute
    maxInactivity: 25 * 60 * 1000, // 25 minutes
  };

  constructor(config?: Partial<SessionConfig>) {
    super();
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.setupActivityTracking();
  }

  private setupActivityTracking() {
    // Track user activity
    const activities = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    activities.forEach(event => {
      document.addEventListener(event, () => {
        this.lastUserActivity = Date.now();
      }, { passive: true });
    });

    // Start periodic checks
    this.checkInterval = setInterval(() => {
      this.checkSessionStatus();
    }, this.config.checkInterval);
  }

  initSession(sessionId: string, expiresIn: number, csrfToken?: string) {
    const now = Date.now();
    this.session = {
      id: sessionId,
      expiresAt: now + expiresIn,
      createdAt: now,
      lastActivity: now,
      csrfToken,
    };

    // Don't store session ID in localStorage for security
    // It should only be in httpOnly cookies
    
    // Set up expiry warning
    this.setupExpiryTimer();
    
    this.emit('session:started', this.session);
  }

  private setupExpiryTimer() {
    if (!this.session) return;

    // Clear existing timer
    if (this.expiryTimer) {
      clearTimeout(this.expiryTimer);
    }

    const timeUntilWarning = this.session.expiresAt - Date.now() - this.config.warningTime;
    
    if (timeUntilWarning > 0) {
      this.expiryTimer = setTimeout(() => {
        this.emit('session:expiry-warning', {
          expiresIn: this.config.warningTime,
        });
      }, timeUntilWarning);
    }
  }

  private checkSessionStatus() {
    if (!this.session) return;

    const now = Date.now();
    const timeSinceActivity = now - this.lastUserActivity;
    
    // Check for inactivity
    if (timeSinceActivity > this.config.maxInactivity) {
      this.emit('session:inactive', {
        inactiveFor: timeSinceActivity,
      });
    }

    // Check if expired
    if (now >= this.session.expiresAt) {
      this.handleSessionExpired();
    }
  }

  extendSession(newExpiresIn: number) {
    if (!this.session) return;

    this.session.expiresAt = Date.now() + newExpiresIn;
    this.session.lastActivity = Date.now();
    
    // Reset expiry timer
    this.setupExpiryTimer();
    
    this.emit('session:extended', this.session);
  }

  private handleSessionExpired() {
    this.emit('session:expired', this.session);
    this.clearSession();
  }

  clearSession() {
    this.session = null;
    
    // Clear timers
    if (this.expiryTimer) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
    
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
      this.activityTimer = null;
    }
    
    this.emit('session:cleared');
  }

  getCsrfToken(): string | null {
    return this.session?.csrfToken || null;
  }

  getSessionInfo(): SessionInfo | null {
    return this.session ? { ...this.session } : null;
  }

  getRemainingTime(): number {
    if (!this.session) return 0;
    const remaining = this.session.expiresAt - Date.now();
    return Math.max(0, remaining);
  }

  isActive(): boolean {
    return this.session !== null && Date.now() < this.session.expiresAt;
  }

  destroy() {
    this.clearSession();
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    this.removeAllListeners();
  }
}

// Singleton instance
export const sessionManager = new SessionManager();