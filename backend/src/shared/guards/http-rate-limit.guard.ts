import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';

/**
 * Simple HTTP rate limiter
 * Prevents abuse by limiting requests per IP
 */
@Injectable()
export class HttpRateLimitGuard implements CanActivate {
  private requests = new Map<string, { count: number; resetTime: number }>();
  private readonly maxRequests = 100; // requests per window
  private readonly windowMs = 15 * 60 * 1000; // 15 minutes

  canActivate(context: ExecutionContext): boolean {
    if (process.env.NODE_ENV !== 'production') {
      return true; // Skip rate limiting in development
    }

    const request = context.switchToHttp().getRequest<Request>();
    const clientIp = this.getClientIp(request);
    
    const now = Date.now();
    const clientData = this.requests.get(clientIp) || { count: 0, resetTime: now + this.windowMs };
    
    // Reset count if window has expired
    if (now > clientData.resetTime) {
      clientData.count = 0;
      clientData.resetTime = now + this.windowMs;
    }
    
    // Check if limit exceeded
    if (clientData.count >= this.maxRequests) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    
    // Increment counter
    clientData.count++;
    this.requests.set(clientIp, clientData);
    
    // Cleanup old entries periodically
    if (Math.random() < 0.01) { // 1% chance
      this.cleanup();
    }
    
    return true;
  }
  
  private getClientIp(request: Request): string {
    return (
      request.headers['x-forwarded-for']?.toString().split(',')[0] ||
      request.headers['x-real-ip']?.toString() ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }
  
  private cleanup() {
    const now = Date.now();
    for (const [ip, data] of this.requests.entries()) {
      if (now > data.resetTime) {
        this.requests.delete(ip);
      }
    }
  }
}