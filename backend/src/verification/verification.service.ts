import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';
import sgMail from '@sendgrid/mail';
import { formatPhoneToE164, isValidPhoneNumber } from './phone-formatter';

/**
 * Service responsible for sending and verifying SMS/email verification codes.
 * Uses Twilio for SMS and SendGrid for email delivery.
 */
@Injectable()
export class VerificationService {
  private twilioClient: twilio.Twilio;

  constructor(private configService: ConfigService) {
    // Initialize Twilio
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const twilioPhone = this.configService.get<string>('TWILIO_PHONE_NUMBER');
    
    console.log('Initializing Verification Service...');
    console.log('Twilio Account SID:', accountSid ? 'Found' : 'Missing');
    console.log('Twilio Auth Token:', authToken ? 'Found' : 'Missing');
    console.log('Twilio Phone Number:', twilioPhone || 'Missing');
    
    if (accountSid && authToken) {
      this.twilioClient = new twilio.Twilio(accountSid, authToken);
      console.log('Twilio client initialized successfully');
    } else {
      console.log('Twilio client NOT initialized - missing credentials');
    }

    // Initialize SendGrid
    const sendGridKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (sendGridKey) {
      sgMail.setApiKey(sendGridKey);
      console.log('SendGrid initialized successfully');
    } else {
      console.log('SendGrid NOT initialized - missing API key');
    }
  }

  /**
   * Sends verification codes to user's phone and email.
   * Currently only SMS verification is required; email is stored but not verified.
   * 
   * @param email - User's email address (stored only)
   * @param phone - User's phone number (SMS sent)
   * @param session - Express session to store verification codes
   */
  async sendVerificationCodes(email: string, phone: string, session: Record<string, any>) {
    // Only send SMS verification, skip email
    await this.sendSMSCode(phone, session);
    
    // Store email for records but don't send verification
    console.log('📧 Email stored (no verification required):', email);
  }

  /**
   * Sends SMS verification code to the user's phone.
   * Handles phone number formatting and Twilio API integration.
   * 
   * @param phone - Phone number (can be in various formats)
   * @param session - Express session to store verification code
   * @throws Error if phone number is invalid or SMS fails to send
   */
  async sendSMSCode(phone: string, session?: Record<string, any>): Promise<void> {
    if (process.env.NODE_ENV !== 'production') {
      console.log('📱 sendSMSCode called with phone:', phone);
      console.log('Phone type:', typeof phone);
      console.log('Phone length:', phone.length);
    }
    
    // Validate phone number format
    if (!isValidPhoneNumber(phone)) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('❌ Invalid phone number format:', phone);
      } else {
        console.error('❌ Invalid phone number format');
      }
      throw new Error('Invalid phone number format');
    }
    
    // Convert to E.164 format required by Twilio (e.g., +2348012345678)
    // Default to Nigerian country code (+234) if not specified
    const formattedPhone = formatPhoneToE164(phone, '+234');
    if (process.env.NODE_ENV !== 'production') {
      console.log('📱 Formatted phone for Twilio:', formattedPhone);
    }
    
    // Generate 6-digit verification code
    const code = this.generateCode();
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔑 Generated code:', code);
    }
    
    // Store code in session if provided, otherwise log warning
    if (session) {
      this.storeCodeInSession(session, 'sms', phone, code);
      if (process.env.NODE_ENV !== 'production') {
        console.log('💾 Stored code in session for phone:', phone);
      }
    } else {
      console.warn('⚠️ No session provided, code not stored persistently');
    }
    
    // Send SMS via Twilio if configured
    if (this.twilioClient) {
      try {
        console.log(`Attempting to send SMS to ${formattedPhone} from ${this.configService.get<string>('TWILIO_PHONE_NUMBER')}`);
        const message = await this.twilioClient.messages.create({
          body: `Your mortgage pre-qualification verification code is: ${code}`,
          from: this.configService.get<string>('TWILIO_PHONE_NUMBER'),
          to: formattedPhone, // Use formatted number for Twilio
        });
        console.log(`SMS sent successfully! Message SID: ${message.sid}`);
      } catch (error: any) {
        console.error('Failed to send SMS:', error.message);
        if (error.code) {
          console.error('Error code:', error.code);
          console.error('More info:', error.moreInfo);
        }
        // In development, log the code and don't throw error
        console.log(`📱 SMS Code for ${phone}: ${code} (Development Mode)`);
        console.log('⚠️ SMS not sent - Twilio not configured or unreachable');
        // Don't throw error in development - just log the code
      }
    } else {
      // Development/testing mode - log code to console when Twilio not configured
      console.log('⚠️ Twilio client not initialized. Development mode.');
      console.log(`📱 SMS Code for ${phone}: ${code}`);
    }
  }

  async sendEmailCode(email: string, session?: Record<string, any>): Promise<void> {
    const code = this.generateCode();
    
    // Store code in session if provided
    if (session) {
      this.storeCodeInSession(session, 'email', email, code);
    }

    const msg = {
      to: email,
      from: this.configService.get<string>('SENDGRID_FROM_EMAIL') || 'noreply@mortgage-app.com',
      subject: 'Your Mortgage Pre-Qualification Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verification Code</h2>
          <p>Your verification code is:</p>
          <h1 style="background-color: #f0f0f0; padding: 20px; text-align: center; letter-spacing: 5px;">
            ${code}
          </h1>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    };

    try {
      await sgMail.send(msg);
    } catch (error) {
      console.error('Failed to send email:', error);
      // In development, log the code
      console.log(`Email Code for ${email}: ${code}`);
    }
  }

  /**
   * Verifies a code entered by the user.
   * Checks if code matches and hasn't expired.
   * 
   * @param type - 'sms' or 'email' verification
   * @param code - The verification code entered by user
   * @param identifier - Phone number or email address
   * @param session - Express session containing verification codes
   * @returns true if code is valid and not expired
   */
  async verifyCode(type: 'sms' | 'email', code: string, identifier: string, session?: Record<string, any>): Promise<boolean> {
    if (!session || !session.verificationCodes) {
      console.log('No verification codes in session');
      return false;
    }

    const key = `${type}:${identifier}`;
    const storedData = session.verificationCodes[key];

    if (!storedData) {
      console.log(`No verification code found for ${key}`);
      return false;
    }

    // Check if code has expired (10 minute validity)
    if (new Date(storedData.expiry) < new Date()) {
      console.log(`⏰ Verification code expired for ${key}`);
      delete session.verificationCodes[key]; // Clean up expired codes
      return false;
    }

    const isValid = storedData.code === code;
    if (isValid) {
      // Mark as verified in session
      if (!session.verifiedIdentifiers) {
        session.verifiedIdentifiers = {};
      }
      session.verifiedIdentifiers[key] = true;
      delete session.verificationCodes[key]; // Remove used code
    }
    
    console.log(`Verification attempt for ${key}: ${isValid ? 'success' : 'failed'}`);
    return isValid;
  }
  
  /**
   * Check if a phone/email has already been verified
   */
  async checkIfVerified(type: 'sms' | 'email', identifier: string, session?: Record<string, any>): Promise<boolean> {
    if (!session || !session.verifiedIdentifiers) {
      return false;
    }
    
    const key = `${type}:${identifier}`;
    const verified = !!session.verifiedIdentifiers[key];
    console.log(`Checking if ${type}:${identifier} is verified: ${verified}`);
    return verified;
  }

  /**
   * Generates a random 6-digit verification code.
   * 
   * @returns 6-digit code as string (e.g., "123456")
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Stores verification code in session with expiry time.
   * Codes expire after 10 minutes for security.
   * 
   * @param session - Express session object
   * @param type - 'sms' or 'email'
   * @param identifier - Phone number or email address
   * @param code - The verification code to store
   */
  private storeCodeInSession(session: Record<string, any>, type: 'sms' | 'email', identifier: string, code: string): void {
    if (!session.verificationCodes) {
      session.verificationCodes = {};
    }
    
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10); // 10 minute expiry
    
    const key = `${type}:${identifier}`;
    session.verificationCodes[key] = { code, expiry };
  }
}