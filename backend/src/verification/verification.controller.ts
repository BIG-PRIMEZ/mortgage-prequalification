import { Controller, Post, Body, Session } from '@nestjs/common';
import { VerificationService } from './verification.service';

@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post('send')
  async sendVerificationCode(
    @Body() body: { type: 'sms' | 'email' },
    @Session() session: Record<string, any>,
  ) {
    const { email, phone } = session.conversationState?.collectedData || {};
    
    if (body.type === 'sms' && phone) {
      await this.verificationService.sendSMSCode(phone, session);
    } else if (body.type === 'email' && email) {
      await this.verificationService.sendEmailCode(email, session);
    }

    return { success: true };
  }

  @Post('verify')
  async verifyCode(
    @Body() body: { type: 'sms' | 'email'; code: string },
    @Session() session: Record<string, any>,
  ) {
    const { email, phone } = session.conversationState?.collectedData || {};
    
    // Get the appropriate identifier based on type
    const identifier = body.type === 'sms' ? phone : email;
    
    if (!identifier) {
      return { valid: false, error: `No ${body.type === 'sms' ? 'phone' : 'email'} found in session` };
    }
    
    const isValid = await this.verificationService.verifyCode(body.type, body.code, identifier, session);
    
    if (isValid && session.conversationState) {
      session.conversationState.verificationStatus[body.type] = true;
    }

    return { valid: isValid };
  }
}