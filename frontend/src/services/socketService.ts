import { io, Socket } from 'socket.io-client';
import type { Message } from '../types';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;
  private sessionId: string | null = null;

  setSessionId(sessionId: string) {
    // Don't re-register if we already have this session ID
    if (this.sessionId === sessionId) {
      return;
    }
    
    this.sessionId = sessionId || null;
    // If already connected and session ID is provided, register it
    if (this.socket?.connected && sessionId) {
      console.log('🔌 Registering WebSocket with session:', sessionId);
      this.socket.emit('register-session', { sessionId });
    }
  }

  connect() {
    if (!this.sessionId) {
      console.warn('No session ID available, WebSocket connection may fail');
    }
    
    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      // Send session ID as query parameter if available
      query: this.sessionId ? { sessionId: this.sessionId } : {},
      // Also send in auth for compatibility
      auth: this.sessionId ? { sessionId: this.sessionId } : {}
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket');
      // Register session after connection if we have a session ID
      if (this.sessionId) {
        this.socket!.emit('register-session', { sessionId: this.sessionId });
      }
    });
    
    this.socket.on('connected', (data) => {
      console.log('WebSocket authenticated:', data);
    });
    
    this.socket.on('session-registered', (data) => {
      console.log('Session registered:', data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket:', reason);
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
      if (error.message.includes('Authentication failed')) {
        console.error('Session ID is invalid or missing');
      }
    });
    
    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  onMessage(callback: (message: Message) => void) {
    if (this.socket) {
      this.socket.on('message', callback);
    }
  }

  sendMessage(message: Message) {
    if (this.socket) {
      this.socket.emit('message', message);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();