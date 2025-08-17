import { Controller, Post, Body, Get, Session, Req, Res } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from '../shared/dto/send-message.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  async sendMessage(@Body() dto: SendMessageDto, @Session() session: Record<string, any>, @Req() req: any, @Res() res: any) {
    console.log('📍 Session ID:', session.id);
    console.log('📍 Session data keys:', Object.keys(session));
    console.log('🍪 Cookie header:', req.headers.cookie);
    console.log('🌐 Origin:', req.headers.origin);
    console.log('🔗 Referer:', req.headers.referer);
    console.log('📍 Has existing state?', !!session.conversationState);
    
    const result = await this.chatService.processMessage(dto, session);
    
    // Manually set cookie header for debugging
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    
    console.log('📍 Session after processing:', session.conversationState?.phase, 
                'Fields:', Object.keys(session.conversationState?.collectedData || {}));
    
    return res.json(result);
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