import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsAuthGuard } from './guards/ws-auth.guard';
import { WsRateLimitGuard } from './guards/ws-rate-limit.guard';
import type { Message } from '../shared/interfaces/conversation.interface';

@WebSocketGateway({
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps)
      if (!origin) return callback(null, true);
      
      // In production, check against allowed origins
      if (process.env.NODE_ENV === 'production') {
        const allowedOrigins = [
          process.env.FRONTEND_URL,
          'https://mortgage-prequalification.vercel.app',
        ].filter(Boolean);
        
        // Allow Vercel preview deployments
        const isVercelPreview = origin.includes('vercel.app') && 
                               origin.includes('mortgage-prequalification');
        
        if (allowedOrigins.includes(origin) || isVercelPreview) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      } else {
        // In development, allow localhost
        callback(null, true);
      }
    },
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Store bidirectional mappings
  private clientToSession = new Map<string, string>(); // socketId -> sessionId
  private sessionToClients = new Map<string, Set<string>>(); // sessionId -> Set of socketIds

  afterInit(server: Server) {
    console.log('WebSocket Gateway initialized');
    
    // Add authentication middleware
    server.use((socket, next) => {
      const sessionId = socket.handshake.query.sessionId as string || 
                       socket.handshake.auth?.sessionId;
      
      if (!sessionId) {
        return next(new Error('Authentication failed: No session ID'));
      }
      
      // Accept any non-empty session ID - Express formats vary
      if (!sessionId || sessionId.length === 0) {
        return next(new Error('Authentication failed: Invalid session ID'));
      }
      
      // Store session ID on socket for later use
      (socket as any).sessionId = sessionId;
      next();
    });
  }

  handleConnection(client: Socket) {
    // Get session ID that was validated in middleware
    const sessionId = (client as any).sessionId;
    
    if (!sessionId) {
      console.error('Client connected without session ID - disconnecting');
      client.disconnect();
      return;
    }
    
    console.log(`Client ${client.id} connected with session ${sessionId}`);
    this.associateClientWithSession(client.id, sessionId);
    
    // Send connection confirmation
    client.emit('connected', { 
      message: 'Connected to chat server',
      sessionId: sessionId 
    });
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    
    // Clean up session associations
    const sessionId = this.clientToSession.get(client.id);
    if (sessionId) {
      this.clientToSession.delete(client.id);
      
      const clients = this.sessionToClients.get(sessionId);
      if (clients) {
        clients.delete(client.id);
        if (clients.size === 0) {
          this.sessionToClients.delete(sessionId);
        }
      }
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('register-session')
  handleRegisterSession(client: Socket, payload: { sessionId: string }) {
    const { sessionId } = payload;
    if (sessionId) {
      // Accept any non-empty session ID
      if (!sessionId || sessionId.length === 0) {
        client.emit('error', { message: 'Invalid session ID' });
        return;
      }
      
      this.associateClientWithSession(client.id, sessionId);
      console.log(`Client ${client.id} registered with session ${sessionId}`);
      client.emit('session-registered', { sessionId });
    }
  }

  @UseGuards(WsAuthGuard, WsRateLimitGuard)
  @SubscribeMessage('message')
  handleMessage(client: Socket, payload: Message) {
    // Get the client's session ID
    const sessionId = this.clientToSession.get(client.id);
    if (!sessionId) {
      client.emit('error', { message: 'No session associated with client' });
      return;
    }
    
    // Send message only to clients with the same session
    this.sendMessageToSession(payload, sessionId);
  }

  // Send message to all clients associated with a session
  sendMessageToSession(message: Message, sessionId: string) {
    const clients = this.sessionToClients.get(sessionId);
    if (clients && clients.size > 0) {
      // Send to all clients with this session ID
      clients.forEach(clientId => {
        this.server.to(clientId).emit('message', message);
      });
      console.log(`Message sent to ${clients.size} client(s) for session ${sessionId}`);
    } else {
      console.warn(`No clients found for session ${sessionId}`);
    }
  }

  // Associate a client socket with a session
  private associateClientWithSession(clientId: string, sessionId: string) {
    // Store client -> session mapping
    this.clientToSession.set(clientId, sessionId);
    
    // Store session -> clients mapping
    if (!this.sessionToClients.has(sessionId)) {
      this.sessionToClients.set(sessionId, new Set());
    }
    this.sessionToClients.get(sessionId)!.add(clientId);
    
    // Join socket.io room based on session ID
    const client = this.server.sockets.sockets.get(clientId);
    if (client) {
      client.join(`session:${sessionId}`);
    }
  }
}