import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';
const FileStore = require('session-file-store')(session);

/**
 * Application bootstrap function.
 * Configures middleware, validation, sessions, and starts the server.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend-backend communication
  // origin: true allows any origin (adjust for production)
  // credentials: true enables cookies/sessions across domains
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Enable global validation pipe
  // whitelist: true strips non-whitelisted properties from DTOs
  // transform: true enables automatic type transformation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  /**
   * Session configuration for maintaining user state across requests.
   * Uses Redis in production for persistence, in-memory for development.
   */
  let sessionConfig: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'mortgage-secret-key',  // Change in production!
    resave: false,  // Don't save session if unmodified
    saveUninitialized: false,  // Don't create session until data is stored
    cookie: {
      maxAge: 3600000,  // 1 hour expiry
      httpOnly: true,  // Prevent client-side JS access
      secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
      sameSite: 'lax' as const,  // CSRF protection
    },
    name: 'sessionId',  // Cookie name
  };

  // Configure session storage based on environment
  if (process.env.NODE_ENV === 'production') {
    if (process.env.REDIS_URL) {
      // Use Redis if available
      console.log('🔧 Configuring Redis session store...');
      
      try {
        const redisClient = createClient({
          url: process.env.REDIS_URL,
        });
        
        redisClient.on('error', (err) => {
          console.error('Redis Client Error:', err);
        });
        
        await redisClient.connect();
        console.log('✅ Redis connected successfully');
        
        sessionConfig.store = new RedisStore({
          client: redisClient,
          prefix: 'mortgage:',
        });
      } catch (error) {
        console.error('❌ Failed to connect to Redis:', error);
        console.log('⚠️  Falling back to file-based session store');
        sessionConfig.store = new FileStore({
          path: './sessions',
          ttl: 3600, // 1 hour
          retries: 5,
          secret: sessionConfig.secret,
        });
      }
    } else {
      // Use file-based store as fallback for production without Redis
      console.log('📁 Using file-based session store (production without Redis)');
      sessionConfig.store = new FileStore({
        path: './sessions',
        ttl: 3600, // 1 hour
        retries: 5,
        secret: sessionConfig.secret,
      });
    }
  } else {
    console.log('💾 Using in-memory session store (development mode)');
  }

  app.use(session(sessionConfig));

  // Start the application
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0'); // Listen on all interfaces for Render
  console.log(`Application is running on port: ${port}`);
}

// Start the application
bootstrap();