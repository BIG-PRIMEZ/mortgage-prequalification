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
  // In-memory storage for verification codes with expiry times
  private verificationCodes: Map<string, { code: string; expiry: Date }> = new Map();

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
   */
  async sendVerificationCodes(email: string, phone: string) {
    // Only send SMS verification, skip email
    await this.sendSMSCode(phone);
    
    // Store email for records but don't send verification
    console.log('📧 Email stored (no verification required):', email);
  }

  /**
   * Sends SMS verification code to the user's phone.
   * Handles phone number formatting and Twilio API integration.
   * 
   * @param phone - Phone number (can be in various formats)
   * @throws Error if phone number is invalid or SMS fails to send
   */
  async sendSMSCode(phone: string): Promise<void> {
    console.log('📱 sendSMSCode called with phone:', phone);
    console.log('Phone type:', typeof phone);
    console.log('Phone length:', phone.length);
    
    // Validate phone number format
    if (!isValidPhoneNumber(phone)) {
      console.error('❌ Invalid phone number format:', phone);
      throw new Error('Invalid phone number format');
    }
    
    // Convert to E.164 format required by Twilio (e.g., +2348012345678)
    // Default to Nigerian country code (+234) if not specified
    const formattedPhone = formatPhoneToE164(phone, '+234');
    console.log('📱 Formatted phone for Twilio:', formattedPhone);
    
    // Generate 6-digit verification code
    const code = this.generateCode();
    console.log('🔑 Generated code:', code);
    
    // Store code with original phone format (for verification matching)
    this.storeCode(`sms:${phone}`, code);
    console.log('💾 Stored code with key:', `sms:${phone}`);
    
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
        // In development, log the code
        console.log(`SMS Code for ${phone}: ${code}`);
        throw new Error(`Failed to send SMS: ${error.message}`);
      }
    } else {
      // Development/testing mode - log code to console when Twilio not configured
      console.log('⚠️ Twilio client not initialized. Development mode.');
      console.log(`📱 SMS Code for ${phone}: ${code}`);
    }
  }

  async sendEmailCode(email: string): Promise<void> {
    const code = this.generateCode();
    this.storeCode(`email:${email}`, code);

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
   * @returns true if code is valid and not expired
   */
  async verifyCode(type: 'sms' | 'email', code: string, identifier: string): Promise<boolean> {
    // Build the key using type and identifier (phone or email)
    const key = `${type}:${identifier}`;
    const storedData = this.verificationCodes.get(key);

    if (!storedData) {
      console.log(`No verification code found for ${key}`);
      return false;
    }

    // Check if code has expired (10 minute validity)
    if (storedData.expiry < new Date()) {
      console.log(`⏰ Verification code expired for ${key}`);
      this.verificationCodes.delete(key); // Clean up expired codes
      return false;
    }

    const isValid = storedData.code === code;
    if (isValid) {
      // Mark as verified but keep for checking
      this.verificationCodes.set(`verified:${key}`, { code: 'verified', expiry: storedData.expiry });
      this.verificationCodes.delete(key); // Remove the code
    }
    
    console.log(`Verification attempt for ${key}: ${isValid ? 'success' : 'failed'}`);
    return isValid;
  }
  
  /**
   * Check if a phone/email has already been verified
   */
  async checkIfVerified(type: 'sms' | 'email', identifier: string): Promise<boolean> {
    const key = `verified:${type}:${identifier}`;
    const verified = this.verificationCodes.has(key);
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
   * Stores verification code with expiry time.
   * Codes expire after 10 minutes for security.
   * 
   * @param key - Storage key (format: "type:identifier")
   * @param code - The verification code to store
   */
  private storeCode(key: string, code: string): void {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10); // 10 minute expiry
    this.verificationCodes.set(key, { code, expiry });
  }
}