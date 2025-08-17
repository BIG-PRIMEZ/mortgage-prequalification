import { Controller, Post, Body, Get, Session, Req, Res } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from '../shared/dto/send-message.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  async sendMessage(@Body() dto: SendMessageDto, @Session() session: Record<string, any>, @Req() req: any, @Res() res: any) {
    // Check for custom session ID header (fallback for when cookies don't work)
    const customSessionId = req.headers['x-session-id'];
    console.log('📍 Custom Session ID from header:', customSessionId);
    console.log('📍 Express Session ID:', session.id);
    console.log('📍 Session data keys:', Object.keys(session));
    console.log('🍪 Cookie header:', req.headers.cookie);
    console.log('🌐 Origin:', req.headers.origin);
    console.log('📍 Has existing state?', !!session.conversationState);
    console.log('📍 Session restored?', !!req.session.restored);
    
    // If session has conversationState, log its phase
    if (session.conversationState) {
      console.log('📍 Current phase:', session.conversationState.phase);
      console.log('📍 Collected fields:', Object.keys(session.conversationState.collectedData || {}));
    }
    
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
    
    // Send session ID in response for client to store
    // Use custom session ID if available, otherwise use express session ID
    const sessionIdToUse = customSessionId || session.id;
    res.setHeader('X-Session-Id', sessionIdToUse);
    res.json({
      ...result,
      sessionId: sessionIdToUse, // Include session ID in response body
    });
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