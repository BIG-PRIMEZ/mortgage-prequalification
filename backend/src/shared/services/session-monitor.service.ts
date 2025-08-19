import { Injectable, Logger } from '@nestjs/common';

interface SessionMetrics {
  totalSessions: number;
  activeSessions: number;
  expiredSessions: number;
  averageLifetime: number;
  failedAuths: number;
  suspiciousActivity: number;
}

interface SessionEvent {
  type: 'created' | 'destroyed' | 'expired' | 'auth_failed' | 'suspicious';
  sessionId: string;
  ip?: string;
  userAgent?: string;
  reason?: string;
  timestamp: Date;
}

@Injectable()
export class SessionMonitorService {
  private readonly logger = new Logger(SessionMonitorService.name);
  private metrics: SessionMetrics = {
    totalSessions: 0,
    activeSessions: 0,
    expiredSessions: 0,
    averageLifetime: 0,
    failedAuths: 0,
    suspiciousActivity: 0,
  };
  
  private sessionEvents: SessionEvent[] = [];
  private sessionLifetimes: number[] = [];
  private failedAuthAttempts = new Map<string, number>();

  constructor() {
    // Set up periodic metrics reporting
    setInterval(() => {
      this.reportMetrics();
    }, 300000); // Every 5 minutes
  }

  logSessionEvent(event: SessionEvent) {
    this.sessionEvents.push(event);
    
    // Keep only last 1000 events
    if (this.sessionEvents.length > 1000) {
      this.sessionEvents.shift();
    }

    // Update metrics based on event type
    switch (event.type) {
      case 'created':
        this.metrics.totalSessions++;
        this.metrics.activeSessions++;
        break;
      case 'destroyed':
        this.metrics.activeSessions--;
        break;
      case 'expired':
        this.metrics.expiredSessions++;
        this.metrics.activeSessions--;
        break;
      case 'auth_failed':
        this.metrics.failedAuths++;
        this.trackFailedAuth(event.ip || 'unknown');
        break;
      case 'suspicious':
        this.metrics.suspiciousActivity++;
        this.alertSuspiciousActivity(event);
        break;
    }

    // Log security-relevant events
    if (['auth_failed', 'suspicious'].includes(event.type)) {
      this.logger.warn(`Security event: ${event.type}`, {
        sessionId: event.sessionId,
        ip: event.ip,
        reason: event.reason,
      });
    }
  }

  trackSessionLifetime(sessionId: string, lifetime: number) {
    this.sessionLifetimes.push(lifetime);
    
    // Keep only last 100 lifetimes for average calculation
    if (this.sessionLifetimes.length > 100) {
      this.sessionLifetimes.shift();
    }
    
    // Recalculate average
    const sum = this.sessionLifetimes.reduce((a, b) => a + b, 0);
    this.metrics.averageLifetime = sum / this.sessionLifetimes.length;
  }

  private trackFailedAuth(ip: string) {
    const attempts = this.failedAuthAttempts.get(ip) || 0;
    this.failedAuthAttempts.set(ip, attempts + 1);
    
    // Alert if too many failed attempts from same IP
    if (attempts + 1 >= 5) {
      this.logSessionEvent({
        type: 'suspicious',
        sessionId: 'N/A',
        ip,
        reason: `${attempts + 1} failed authentication attempts`,
        timestamp: new Date(),
      });
    }
  }

  private alertSuspiciousActivity(event: SessionEvent) {
    // Log suspicious activity with high priority
    this.logger.error(`SECURITY ALERT: ${event.type}`, {
      level: 'warning',
      type: event.type,
      details: event,
    });
    
    // In production, this would trigger alerts via monitoring service
    // For now, just log it prominently
  }

  reportMetrics() {
    this.logger.log('Session Metrics Report', this.metrics);
    
    // Check for anomalies
    if (this.metrics.failedAuths > 50) {
      this.logger.error('High number of failed authentication attempts detected');
    }
    
    if (this.metrics.suspiciousActivity > 10) {
      this.logger.error('Suspicious activity threshold exceeded');
    }
    
    // Reset rolling counters
    this.metrics.failedAuths = 0;
    this.metrics.suspiciousActivity = 0;
    this.failedAuthAttempts.clear();
  }

  getMetrics(): SessionMetrics {
    return { ...this.metrics };
  }

  getRecentEvents(limit: number = 50): SessionEvent[] {
    return this.sessionEvents.slice(-limit);
  }

  // Check if session pattern is suspicious
  isSessionPatternSuspicious(sessionData: any): boolean {
    // Multiple rapid session creations from same IP
    const recentFromIp = this.sessionEvents.filter(
      e => e.ip === sessionData.ip && 
      e.type === 'created' &&
      Date.now() - e.timestamp.getTime() < 60000 // Last minute
    );
    
    if (recentFromIp.length > 5) {
      return true;
    }

    // Session with unusual user agent
    const suspiciousAgents = ['bot', 'crawler', 'spider', 'scraper'];
    if (sessionData.userAgent) {
      const agent = sessionData.userAgent.toLowerCase();
      if (suspiciousAgents.some(s => agent.includes(s))) {
        return true;
      }
    }

    return false;
  }
}