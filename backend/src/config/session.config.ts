import { SessionOptions } from 'express-session';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class SessionConfigService {
  constructor(private configService: ConfigService) {}

  getSessionConfig(): SessionOptions {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Validate session secret
    const sessionSecret = this.configService.get<string>('SESSION_SECRET');
    if (!sessionSecret || sessionSecret.length < 64) {
      throw new Error('SESSION_SECRET must be at least 64 characters long');
    }
    
    if (sessionSecret === 'mortgage-secret-key' || sessionSecret.includes('change-this')) {
      throw new Error('SESSION_SECRET must be changed from default value');
    }

    const config: SessionOptions = {
      secret: sessionSecret,
      name: this.generateSecureSessionName(),
      resave: false,
      saveUninitialized: false, // Don't create sessions until needed
      rolling: true, // Reset expiry on activity
      proxy: isProduction, // Trust proxy in production
      cookie: {
        maxAge: this.configService.get<number>('SESSION_TIMEOUT_MS') || 30 * 60 * 1000, // 30 min
        httpOnly: true,
        secure: isProduction, // HTTPS only in production
        sameSite: isProduction ? 'strict' : 'lax',
        path: '/',
        domain: this.configService.get<string>('COOKIE_DOMAIN'),
      },
    };

    return config;
  }

  private generateSecureSessionName(): string {
    // Generate a random session cookie name to prevent fingerprinting
    const prefix = 'sid';
    const randomSuffix = crypto.randomBytes(4).toString('hex');
    return `${prefix}_${randomSuffix}`;
  }

  validateProductionConfig(): void {
    const isProduction = process.env.NODE_ENV === 'production';
    if (!isProduction) return;

    const required = [
      'SESSION_SECRET',
      'DATABASE_URL',
      'FRONTEND_URL',
    ];

    const missing = required.filter(key => !this.configService.get(key));
    if (missing.length > 0) {
      throw new Error(`Missing required production configuration: ${missing.join(', ')}`);
    }

    // Validate database URL
    const dbUrl = this.configService.get<string>('DATABASE_URL');
    if (dbUrl && !dbUrl.includes('ssl=')) {
      console.warn('WARNING: DATABASE_URL should include SSL configuration for production');
    }

    // Validate frontend URL
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    if (frontendUrl && !frontendUrl.startsWith('https://')) {
      throw new Error('FRONTEND_URL must use HTTPS in production');
    }
  }
}