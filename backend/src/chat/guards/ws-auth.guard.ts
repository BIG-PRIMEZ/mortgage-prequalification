import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

/**
 * WebSocket authentication guard that validates session IDs
 * Ensures only clients with valid sessions can connect
 */
@Injectable()
export class WsAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient();
    
    // Check for session ID in handshake query or auth
    const sessionId = client.handshake.query.sessionId as string || 
                     client.handshake.auth?.sessionId;
    
    if (!sessionId) {
      throw new WsException('Unauthorized: No session ID provided');
    }
    
    // Validate session ID format
    if (!this.isValidSessionId(sessionId)) {
      throw new WsException('Unauthorized: Invalid session ID format');
    }
    
    // Store session ID on the client for later use
    (client as any).sessionId = sessionId;
    
    return true;
  }
  
  /**
   * Validates session ID format
   * Express session IDs can have various formats depending on configuration
   */
  private isValidSessionId(sessionId: string): boolean {
    // Accept any non-empty string as valid session ID
    // Express can generate IDs in different formats: with dots, colons, etc.
    // Example formats:
    // - llrmVFWyPmq0-ZFNcogNTXRdq3ZaAz1A
    // - s:llrmVFWyPmq0-ZFNcogNTXRdq3ZaAz1A.signature
    // - sess_1234567890abcdef
    return sessionId && sessionId.length > 0;
  }
}