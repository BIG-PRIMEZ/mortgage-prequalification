import { Controller, Post, Body, Get, Session } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from '../shared/dto/send-message.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  async sendMessage(@Body() dto: SendMessageDto, @Session() session: Record<string, any>) {
    return this.chatService.processMessage(dto, session);
  }

  @Get('session')
  async getSession(@Session() session: Record<string, any>) {
    return session.conversationState || null;
  }

  @Post('reset')
  async resetSession(@Session() session: Record<string, any>) {
    // Clear conversation state specifically
    delete session.conversationState;
    
    // Clear all other session data
    Object.keys(session).forEach(key => {
      if (key !== 'cookie') { // Don't delete the cookie object itself
        delete session[key];
      }
    });
    
    // Force save the empty session
    if (session.save && typeof session.save === 'function') {
      session.save((err) => {
        if (err) console.error('Error saving session:', err);
      });
    }
    
    return { success: true, message: 'Session cleared successfully' };
  }
}