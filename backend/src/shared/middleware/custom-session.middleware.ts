import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Custom session middleware that handles session ID from headers
 * when cookies don't work (cross-domain issues)
 */
@Injectable()
export class CustomSessionMiddleware implements NestMiddleware {
  // In-memory session store (replace with Redis/DB in production)
  static sessions = new Map<string, any>();

  use(req: Request & { session: any }, res: Response, next: NextFunction) {
    const customSessionId = req.headers['x-session-id'] as string;
    
    // If we have a custom session ID from the header
    if (customSessionId) {
      // Check if we have stored data for this session
      const storedSession = CustomSessionMiddleware.sessions.get(customSessionId);
      
      if (storedSession && storedSession.conversationState) {
        // Restore the session data (without trying to change the ID)
        console.log('📋 Restoring session from store:', customSessionId);
        console.log('📋 Stored phase:', storedSession.conversationState.phase);
        
        // Merge the stored conversation state into the current session
        req.session.conversationState = storedSession.conversationState;
        req.session.customSessionId = customSessionId; // Store custom ID separately
        req.session.restored = true;
        
        console.log('✅ Session restored successfully');
      } else {
        console.log('📋 No stored session for:', customSessionId);
      }
    }
    
    // Store session after response
    const originalJson = res.json.bind(res);
    res.json = function(data: any) {
      // Use custom session ID if available, otherwise use express session ID
      const sessionToStore = customSessionId || req.session?.id;
      
      if (sessionToStore && req.session?.conversationState) {
        // Store the current session state
        CustomSessionMiddleware.sessions.set(sessionToStore, {
          conversationState: req.session.conversationState,
          lastAccess: Date.now(),
        });
        console.log('💾 Stored session data:', sessionToStore);
        console.log('💾 Conversation phase:', req.session.conversationState?.phase);
      }
      
      return originalJson(data);
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