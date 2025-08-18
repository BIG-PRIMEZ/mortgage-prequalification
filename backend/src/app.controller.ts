import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async getHealth() {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'mortgage-prequalification-backend',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: Math.floor(process.uptime()),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
      services: {
        database: 'unknown',
        redis: 'unknown',
        openai: process.env.OPENAI_API_KEY ? 'configured' : 'not configured',
        twilio: process.env.TWILIO_ACCOUNT_SID ? 'configured' : 'not configured',
        sendgrid: process.env.SENDGRID_API_KEY ? 'configured' : 'not configured',
      }
    };

    // Quick service checks (non-blocking)
    if (process.env.DATABASE_URL) {
      health.services.database = 'configured';
    }
    if (process.env.REDIS_URL) {
      health.services.redis = 'configured';
    }

    return health;
  }

  @Get('health/detailed')
  async getDetailedHealth() {
    // More comprehensive health check for monitoring systems
    const start = Date.now();
    
    try {
      const health = await this.getHealth();
      
      return {
        ...health,
        checks: {
          response_time: Date.now() - start,
          session_store: process.env.DATABASE_URL || process.env.REDIS_URL ? 'available' : 'memory',
        }
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: process.env.NODE_ENV === 'production' ? 'Health check failed' : error.message,
        response_time: Date.now() - start,
      };
    }
  }
}
