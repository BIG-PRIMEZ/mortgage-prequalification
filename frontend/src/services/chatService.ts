import axios from 'axios';
import type { ConversationState } from '../types';
import { socketService } from './socketService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ChatService {
  private api = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
  
  private sessionId: string | null = null;

  constructor() {
    // Load session ID from localStorage
    this.sessionId = localStorage.getItem('mortgage-session-id');
    
    // Share existing session ID with socket service if available
    if (this.sessionId) {
      socketService.setSessionId(this.sessionId);
    }
    
    // Add request interceptor to include session ID
    this.api.interceptors.request.use((config) => {
      if (this.sessionId) {
        config.headers['X-Session-Id'] = this.sessionId;
      }
      return config;
    });
    
    // Add response interceptor to save session ID
    this.api.interceptors.response.use((response) => {
      const newSessionId = response.data?.sessionId || response.headers['x-session-id'];
      
      if (newSessionId) {
        if (!this.sessionId) {
          // Initial session creation
          this.sessionId = newSessionId;
          localStorage.setItem('mortgage-session-id', newSessionId);
          console.log('📋 Initial session ID saved:', newSessionId);
          // Share session ID with socket service
          socketService.setSessionId(newSessionId);
        } else if (newSessionId !== this.sessionId) {
          // Session ID actually changed (this should be rare)
          console.warn('⚠️ Session ID changed unexpectedly:', {
            old: this.sessionId,
            new: newSessionId
          });
          // Update to new session ID
          this.sessionId = newSessionId;
          localStorage.setItem('mortgage-session-id', newSessionId);
          socketService.setSessionId(newSessionId);
        }
        // If newSessionId === this.sessionId, do nothing (expected case)
      }
      
      return response;
    });
  }

  async sendMessage(content: string, _state: ConversationState) {
    const response = await this.api.post('/chat/message', {
      content,
    });

    return response.data;
  }

  async verifySMS(code: string): Promise<boolean> {
    const response = await this.api.post('/verification/verify', {
      type: 'sms',
      code,
    });

    return response.data.valid;
  }

  async verifyEmail(code: string): Promise<boolean> {
    const response = await this.api.post('/verification/verify', {
      type: 'email',
      code,
    });

    return response.data.valid;
  }

  async resendVerificationCode(type: 'sms' | 'email'): Promise<void> {
    await this.api.post('/verification/send', { type });
  }

  async calculateBorrowingCapacity(userData: any) {
    const response = await this.api.post('/calculation/borrowing-capacity', userData);
    return response.data;
  }

  async resetSession(): Promise<void> {
    await this.api.post('/chat/reset');
  }
}

export const chatService = new ChatService();