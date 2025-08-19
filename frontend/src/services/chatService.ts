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
    const storedSessionId = localStorage.getItem('mortgage-session-id');
    
    // Only use stored session ID if it matches the expected format (not test format)
    const validSessionPattern = /^[a-zA-Z0-9\-_]{20,}$/;
    if (storedSessionId && validSessionPattern.test(storedSessionId) && !storedSessionId.startsWith('sess_')) {
      this.sessionId = storedSessionId;
      // Share existing session ID with socket service if available
      socketService.setSessionId(this.sessionId);
    } else if (storedSessionId) {
      // Clear invalid/test session ID
      console.log('🧹 Clearing invalid/test session ID:', storedSessionId);
      localStorage.removeItem('mortgage-session-id');
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

  async initializeSession(): Promise<void> {
    // Get a fresh session from the server if we don't have one
    if (!this.sessionId) {
      try {
        await this.api.get('/chat/session');
        console.log('🔄 Initialized new session from server');
      } catch (error) {
        console.error('Failed to initialize session:', error);
      }
    }
  }
}

export const chatService = new ChatService();