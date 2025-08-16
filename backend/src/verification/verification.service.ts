import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';
import sgMail from '@sendgrid/mail';
import { formatPhoneToE164, isValidPhoneNumber } from './phone-formatter';

@Injectable()
export class VerificationService {
  private twilioClient: twilio.Twilio;
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

  async sendVerificationCodes(email: string, phone: string) {
    // Only send SMS verification, skip email
    await this.sendSMSCode(phone);
    
    // Store email for records but don't send verification
    console.log('📧 Email stored (no verification required):', email);
  }

  async sendSMSCode(phone: string): Promise<void> {
    console.log('📱 sendSMSCode called with phone:', phone);
    console.log('Phone type:', typeof phone);
    console.log('Phone length:', phone.length);
    
    // Validate phone number
    if (!isValidPhoneNumber(phone)) {
      console.error('❌ Invalid phone number format:', phone);
      throw new Error('Invalid phone number format');
    }
    
    // Convert to E.164 format for Twilio
    // Default to Nigerian country code if you're primarily serving Nigerian users
    const formattedPhone = formatPhoneToE164(phone, '+234');
    console.log('📱 Formatted phone for Twilio:', formattedPhone);
    
    const code = this.generateCode();
    console.log('🔑 Generated code:', code);
    
    this.storeCode(`sms:${phone}`, code); // Store with original format for verification
    console.log('💾 Stored code with key:', `sms:${phone}`);
    
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
      // Development mode - just log the code
      console.log('Twilio client not initialized. Fallback mode.');
      console.log(`SMS Code for ${phone}: ${code}`);
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

  async verifyCode(type: 'sms' | 'email', code: string, identifier: string): Promise<boolean> {
    // Build the key using type and identifier (phone or email)
    const key = `${type}:${identifier}`;
    const storedData = this.verificationCodes.get(key);

    if (!storedData) {
      console.log(`No verification code found for ${key}`);
      return false;
    }

    if (storedData.expiry < new Date()) {
      console.log(`Verification code expired for ${key}`);
      this.verificationCodes.delete(key); // Clean up expired codes
      return false;
    }

    const isValid = storedData.code === code;
    if (isValid) {
      this.verificationCodes.delete(key); // Remove used code
    }
    
    console.log(`Verification attempt for ${key}: ${isValid ? 'success' : 'failed'}`);
    return isValid;
  }

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private storeCode(key: string, code: string): void {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10); // 10 minute expiry
    this.verificationCodes.set(key, { code, expiry });
  }
}