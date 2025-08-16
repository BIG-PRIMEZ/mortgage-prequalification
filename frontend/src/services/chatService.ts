import axios from 'axios';
import type { ConversationState, Message } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ChatService {
  private api = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });

  async sendMessage(content: string, state: ConversationState) {
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