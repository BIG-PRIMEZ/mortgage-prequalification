import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import type { Message } from '../shared/interfaces/conversation.interface';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Store client-to-session mapping
  private clientSessions = new Map<string, string>();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    // Each client gets their own room based on their socket ID
    client.join(client.id);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.clientSessions.delete(client.id);
  }

  @SubscribeMessage('message')
  handleMessage(client: Socket, payload: Message) {
    // Send message only to the specific client
    client.emit('message', payload);
  }

  sendMessage(message: Message, clientId?: string) {
    if (clientId) {
      // Send to specific client
      this.server.to(clientId).emit('message', message);
    } else {
      // Fallback: broadcast to all (shouldn't happen)
      this.server.emit('message', message);
    }
  }

  // Method to associate client with session
  associateClientSession(clientId: string, sessionId: string) {
    this.clientSessions.set(clientId, sessionId);
  }
}