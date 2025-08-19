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
    const clientSessionId = req.headers['x-session-id'] as string;
    
    // Log detailed debug info only in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('📍 Client Session ID from header:', clientSessionId);
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
    
    // For WebSocket routing, prefer the client's session ID if available
    // This ensures we send to the WebSocket that the client is actually connected with
    const sessionIdForWebSocket = clientSessionId || initialSessionId;
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('📍 Session ID for WebSocket:', sessionIdForWebSocket);
      console.log('📍 Express Session ID:', req.sessionID);
      if (clientSessionId && clientSessionId !== initialSessionId) {
        console.log('📍 Client and server session IDs differ - using client session for WebSocket');
      }
    }
    
    // Process the message with session ID for WebSocket routing
    const result = await this.chatService.processMessage(dto, req.session, sessionIdForWebSocket);
    
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
    
    // Send the Express session ID in response for consistency
    res.setHeader('X-Session-Id', initialSessionId);
    res.json({
      ...result,
      sessionId: initialSessionId, // Always return the Express session ID
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
  async resetSession(@Session() session: Record<string, any>, @Req() req: any) {
    // Only clear conversation state and user data, keep session alive
    delete session.conversationState;
    
    // Keep session ID but clear only user-specific data
    const sessionId = req.sessionID;
    console.log('🔄 Resetting conversation data for session:', sessionId);
    
    // Force save the session with cleared conversation data
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error('Error saving session after reset:', err);
          reject(err);
        } else {
          console.log('✅ Session reset successfully, ID preserved:', sessionId);
          resolve();
        }
      });
    });
    
    return { 
      success: true, 
      message: 'Conversation data cleared successfully',
      sessionId: sessionId // Return the preserved session ID
    };
  }
}