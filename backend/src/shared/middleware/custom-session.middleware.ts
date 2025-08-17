import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Custom session middleware that handles session ID from headers
 * when cookies don't work (cross-domain issues)
 */
@Injectable()
export class CustomSessionMiddleware implements NestMiddleware {
  // In-memory session store (replace with Redis/DB in production)
  private static sessions = new Map<string, any>();

  use(req: Request, res: Response, next: NextFunction) {
    // Try to get session ID from cookie first
    let sessionId = req.session?.id;
    
    // If no cookie session, check custom header
    if (!sessionId && req.headers['x-session-id']) {
      sessionId = req.headers['x-session-id'] as string;
      
      // Restore session data from our store
      const storedSession = CustomSessionMiddleware.sessions.get(sessionId);
      if (storedSession) {
        // Merge stored session with current session
        Object.assign(req.session, storedSession);
        req.session.id = sessionId;
        console.log('📋 Restored session from header:', sessionId);
      }
    }
    
    // Store session after response
    const originalSend = res.json;
    res.json = function(data: any) {
      if (req.session?.id) {
        // Store session data
        CustomSessionMiddleware.sessions.set(req.session.id, {
          ...req.session,
          cookie: undefined, // Don't store cookie object
        });
        console.log('💾 Stored session:', req.session.id);
      }
      return originalSend.call(this, data);
    };
    
    next();
  }
  
  // Clean up old sessions periodically
  static cleanupSessions() {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour
    
    for (const [id, session] of this.sessions.entries()) {
      if (session.lastAccess && now - session.lastAccess > maxAge) {
        this.sessions.delete(id);
        console.log('🗑️ Cleaned up expired session:', id);
      }
    }
  }
}

// Run cleanup every 10 minutes
setInterval(() => CustomSessionMiddleware.cleanupSessions(), 600000);