import { Controller, Post, Body, Get, Session, Req, Res, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from '../shared/dto/send-message.dto';
import { HttpRateLimitGuard } from '../shared/guards/http-rate-limit.guard';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(HttpRateLimitGuard)
  @Post('message')
  async sendMessage(@Body() dto: SendMessageDto, @Session() session: Record<string, any>, @Req() req: any, @Res() res: any) {
    // Capture session ID at the start
    const initialSessionId = req.sessionID;
    
    // Log detailed debug info only in development
    if (process.env.NODE_ENV !== 'production') {
      const customSessionId = req.headers['x-session-id'] as string;
      console.log('📍 Custom Session ID from header:', customSessionId);
      console.log('📍 Express Session ID at start:', initialSessionId);
      console.log('📍 Session data keys:', Object.keys(session));
      console.log('🍪 Cookie header:', req.headers.cookie);
      console.log('🌐 Origin:', req.headers.origin);
      console.log('📍 Has existing state?', !!session.conversationState);
      
      // If session has conversationState, log its phase
      if (session.conversationState) {
        console.log('📍 Current phase:', session.conversationState.phase);
        console.log('📍 Collected fields:', Object.keys(session.conversationState.collectedData || {}));
      }
    }
    
    // For custom session IDs, we'll use the Express session ID as the stable identifier
    // The custom session ID helps us identify returning clients, but we still use Express sessions
    // Use the initial session ID captured at the start to ensure consistency
    const sessionIdToUse = initialSessionId;
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('📍 Session ID to use:', sessionIdToUse);
      console.log('📍 Session ID now:', req.sessionID);
      if (sessionIdToUse !== req.sessionID) {
        console.warn('⚠️ Session ID changed during request!', {
          initial: sessionIdToUse,
          current: req.sessionID
        });
      }
    }
    
    // Process the message with session ID for WebSocket routing
    const result = await this.chatService.processMessage(dto, req.session, sessionIdToUse);
    
    // Force session save
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error('❌ Session save error:', err);
          reject(err);
        } else {
          if (process.env.NODE_ENV !== 'production') {
            console.log('✅ Session saved successfully');
          }
          resolve();
        }
      });
    });
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('📍 Session after processing:', req.session.conversationState?.phase, 
                  'Fields:', Object.keys(req.session.conversationState?.collectedData || {}));
      console.log('📍 Final session ID check:', req.sessionID);
      if (initialSessionId !== req.sessionID) {
        console.error('❌ Session ID changed during processing!', {
          initial: initialSessionId,
          final: req.sessionID
        });
      }
    }
    
    // Send the INITIAL session ID in response to maintain consistency
    res.setHeader('X-Session-Id', sessionIdToUse);
    res.json({
      ...result,
      sessionId: sessionIdToUse, // Always return the initial session ID
    });
  }

  @Get('session')
  async getSession(@Session() session: Record<string, any>, @Req() req: any) {
    // IMPORTANT: Always use req.sessionID for consistency
    const sessionId = req.sessionID;
    console.log('🔍 GET Session ID:', sessionId);
    console.log('🍪 GET Cookie header:', req.headers.cookie);
    
    return {
      sessionId: sessionId,
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