import { Controller, Post, Body, Get, Session, Req, Res } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from '../shared/dto/send-message.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  async sendMessage(@Body() dto: SendMessageDto, @Session() session: Record<string, any>, @Req() req: any) {
    console.log('📍 Session ID:', session.id);
    console.log('📍 Session data keys:', Object.keys(session));
    console.log('🍪 Cookie header:', req.headers.cookie);
    console.log('🌐 Origin:', req.headers.origin);
    console.log('📍 Has existing state?', !!session.conversationState);
    
    // Process the message
    const result = await this.chatService.processMessage(dto, session);
    
    // Force session save
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error('❌ Session save error:', err);
          reject(err);
        } else {
          console.log('✅ Session saved successfully');
          resolve();
        }
      });
    });
    
    console.log('📍 Session after processing:', session.conversationState?.phase, 
                'Fields:', Object.keys(session.conversationState?.collectedData || {}));
    
    return result;
  }

  @Get('session')
  async getSession(@Session() session: Record<string, any>, @Req() req: any) {
    console.log('🔍 GET Session ID:', session.id);
    console.log('🍪 GET Cookie header:', req.headers.cookie);
    return {
      sessionId: session.id,
      conversationState: session.conversationState || null,
      hasCookie: !!req.headers.cookie,
    };
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