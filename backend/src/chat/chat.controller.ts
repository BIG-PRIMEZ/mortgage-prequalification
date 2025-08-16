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
    // Clear all session data by iterating through all keys
    Object.keys(session).forEach(key => {
      delete session[key];
    });
    
    // Ensure session is saved empty
    session.save = true;
    
    return { success: true, message: 'Session cleared successfully' };
  }
}