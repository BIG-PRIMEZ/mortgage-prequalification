import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

/**
 * Rate limiting guard for WebSocket connections
 * Prevents spam and abuse by limiting message frequency
 */
@Injectable()
export class WsRateLimitGuard implements CanActivate {
  private messageTimestamps = new Map<string, number[]>();
  private readonly maxMessagesPerMinute = 30;
  private readonly cleanupInterval = 60000; // 1 minute

  constructor() {
    // Cleanup old entries periodically
    setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient();
    const clientId = client.id;
    const now = Date.now();
    
    // Get or create timestamp array for this client
    if (!this.messageTimestamps.has(clientId)) {
      this.messageTimestamps.set(clientId, []);
    }
    
    const timestamps = this.messageTimestamps.get(clientId)!;
    
    // Remove timestamps older than 1 minute
    const oneMinuteAgo = now - 60000;
    const recentTimestamps = timestamps.filter(ts => ts > oneMinuteAgo);
    
    // Check if client has exceeded rate limit
    if (recentTimestamps.length >= this.maxMessagesPerMinute) {
      throw new WsException('Rate limit exceeded. Please slow down.');
    }
    
    // Add current timestamp
    recentTimestamps.push(now);
    this.messageTimestamps.set(clientId, recentTimestamps);
    
    return true;
  }
  
  private cleanup() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Remove entries for disconnected clients or with only old timestamps
    for (const [clientId, timestamps] of this.messageTimestamps.entries()) {
      const recentTimestamps = timestamps.filter(ts => ts > oneMinuteAgo);
      if (recentTimestamps.length === 0) {
        this.messageTimestamps.delete(clientId);
      } else {
        this.messageTimestamps.set(clientId, recentTimestamps);
      }
    }
  }
}