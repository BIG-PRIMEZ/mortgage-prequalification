import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class SessionSecurityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Regenerate session ID after authentication
    if (req.session && req.body && req.body.verificationSuccess) {
      const oldSession = { ...req.session };
      req.session.regenerate((err) => {
        if (err) {
          return next(err);
        }
        // Restore session data
        Object.assign(req.session, oldSession);
        next();
      });
      return;
    }

    // Track session activity for timeout
    if (req.session) {
      req.session.lastActivity = Date.now();
      
      // Check for session timeout (30 minutes of inactivity)
      if (req.session.createdAt) {
        const inactiveTime = Date.now() - (req.session.lastActivity || req.session.createdAt);
        if (inactiveTime > 30 * 60 * 1000) {
          req.session.destroy((err) => {
            if (err) console.error('Session destruction error:', err);
          });
          return res.status(401).json({ 
            error: 'Session expired due to inactivity',
            code: 'SESSION_TIMEOUT'
          });
        }
      } else {
        req.session.createdAt = Date.now();
      }
    }

    // Add CSRF token if not present
    if (req.session && !req.session.csrfToken) {
      req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    }

    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    next();
  }
}

@Injectable()
export class CsrfValidationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF for GET requests and WebSocket upgrades
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
      return next();
    }

    // Skip for health checks
    if (req.path === '/health' || req.path === '/ready') {
      return next();
    }

    const sessionToken = req.session?.csrfToken;
    const headerToken = req.headers['x-csrf-token'];
    const bodyToken = req.body?._csrf;

    const providedToken = headerToken || bodyToken;

    if (!sessionToken || !providedToken || sessionToken !== providedToken) {
      return res.status(403).json({ 
        error: 'Invalid CSRF token',
        code: 'CSRF_VALIDATION_FAILED'
      });
    }

    next();
  }
}