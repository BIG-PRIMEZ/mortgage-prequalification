import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

@Injectable()
export class ConfigValidationService {
  private readonly logger = new Logger(ConfigValidationService.name);

  constructor(private configService: ConfigService) {}

  validateConfig(): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required environment variables
    const requiredVars = [
      'OPENAI_API_KEY',
      'SESSION_SECRET',
    ];

    // Production-specific required variables
    const productionRequiredVars = [
      'FRONTEND_URL',
      'DATABASE_URL', // or REDIS_URL
    ];

    // Optional but recommended variables
    const recommendedVars = [
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN', 
      'TWILIO_PHONE_NUMBER',
      'SENDGRID_API_KEY',
      'SENDGRID_FROM_EMAIL',
    ];

    // Check required variables
    for (const varName of requiredVars) {
      const value = this.configService.get<string>(varName);
      if (!value) {
        errors.push(`Missing required environment variable: ${varName}`);
      }
    }

    // Check production-specific variables
    if (process.env.NODE_ENV === 'production') {
      for (const varName of productionRequiredVars) {
        const value = this.configService.get<string>(varName);
        if (!value) {
          if (varName === 'DATABASE_URL' && this.configService.get<string>('REDIS_URL')) {
            // Redis can be used instead of PostgreSQL
            continue;
          }
          errors.push(`Missing production environment variable: ${varName}`);
        }
      }

      // Check session storage
      const hasDatabase = !!this.configService.get<string>('DATABASE_URL');
      const hasRedis = !!this.configService.get<string>('REDIS_URL');
      if (!hasDatabase && !hasRedis) {
        errors.push('Production requires either DATABASE_URL or REDIS_URL for session storage');
      }

      // Check session secret strength
      const sessionSecret = this.configService.get<string>('SESSION_SECRET');
      if (sessionSecret && sessionSecret.length < 32) {
        warnings.push('SESSION_SECRET should be at least 32 characters long for production');
      }
      if (sessionSecret === 'mortgage-secret-key') {
        errors.push('SESSION_SECRET must be changed from default value in production');
      }
    }

    // Check recommended variables
    for (const varName of recommendedVars) {
      const value = this.configService.get<string>(varName);
      if (!value) {
        warnings.push(`Missing recommended environment variable: ${varName}`);
      }
    }

    // Validate specific formats
    this.validateSpecificFormats(errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateSpecificFormats(errors: string[], warnings: string[]) {
    // Validate OpenAI API key format
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (openaiKey && !openaiKey.startsWith('sk-')) {
      warnings.push('OPENAI_API_KEY should start with "sk-"');
    }

    // Validate Twilio phone number format
    const twilioPhone = this.configService.get<string>('TWILIO_PHONE_NUMBER');
    if (twilioPhone && !twilioPhone.startsWith('+')) {
      warnings.push('TWILIO_PHONE_NUMBER should start with "+" (e.g., +1234567890)');
    }

    // Validate email format
    const fromEmail = this.configService.get<string>('SENDGRID_FROM_EMAIL');
    if (fromEmail && !fromEmail.includes('@')) {
      warnings.push('SENDGRID_FROM_EMAIL should be a valid email address');
    }

    // Validate URLs
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    if (frontendUrl && !frontendUrl.startsWith('http')) {
      warnings.push('FRONTEND_URL should start with "http://" or "https://"');
    }

    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    if (databaseUrl && !databaseUrl.startsWith('postgresql://')) {
      warnings.push('DATABASE_URL should start with "postgresql://"');
    }

    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (redisUrl && !redisUrl.startsWith('redis://')) {
      warnings.push('REDIS_URL should start with "redis://"');
    }
  }

  logValidationResults(result: ConfigValidationResult) {
    if (result.isValid) {
      this.logger.log('✅ Configuration validation passed');
    } else {
      this.logger.error('❌ Configuration validation failed');
      for (const error of result.errors) {
        this.logger.error(`  • ${error}`);
      }
    }

    if (result.warnings.length > 0) {
      this.logger.warn('⚠️ Configuration warnings:');
      for (const warning of result.warnings) {
        this.logger.warn(`  • ${warning}`);
      }
    }

    if (!result.isValid) {
      this.logger.error('Please check your environment variables and try again');
      this.logger.error('See .env.example for reference');
    }
  }
}