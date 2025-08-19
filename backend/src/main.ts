import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as session from 'express-session';
import { RedisStore } from 'connect-redis';
import { createClient } from 'redis';
import { PersistentMemoryStore } from './shared/services/persistent-memory-store';
import { ConfigValidationService } from './shared/services/config-validation.service';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { Pool } from 'pg';
const FileStore = require('session-file-store')(session);
const pgSession = require('connect-pg-simple')(session);

/**
 * Application bootstrap function.
 * Configures middleware, validation, sessions, and starts the server.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Validate configuration
  const configService = app.get(ConfigService);
  const configValidation = new ConfigValidationService(configService);
  const validationResult = configValidation.validateConfig();
  
  configValidation.logValidationResults(validationResult);
  
  if (!validationResult.isValid) {
    console.error('❌ Application startup failed due to configuration errors');
    process.exit(1);
  }
  
  // Enable CORS for frontend-backend communication
  // IMPORTANT: Must set specific origin for cookies to work
  const corsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      
      // In production, check against allowed origins
      if (process.env.NODE_ENV === 'production') {
        const allowedOrigins = [
          process.env.FRONTEND_URL,
          'https://mortgage-prequalification.vercel.app',
        ].filter(Boolean);
        
        // Allow Vercel preview deployments
        const isVercelPreview = origin.includes('vercel.app') && 
                               origin.includes('mortgage-prequalification');
        
        if (allowedOrigins.includes(origin) || isVercelPreview) {
          callback(null, true);
        } else {
          console.warn(`⚠️ Blocked CORS request from: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      } else {
        // In development, allow localhost
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Session-Id'],
    exposedHeaders: ['set-cookie', 'X-Session-Id'],
  };
  
  app.enableCors(corsOptions);

  // IMPORTANT: Session middleware must be before other middleware
  /**
   * Session configuration for maintaining user state across requests.
   * Uses Redis in production for persistence, in-memory for development.
   */
  let sessionConfig: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'mortgage-secret-key',  // Change in production!
    resave: false,  // Don't save session if unmodified
    saveUninitialized: false,  // Don't create session until we store data
    rolling: true,  // Reset cookie expiry on each request with session
    cookie: {
      maxAge: 3600000,  // 1 hour expiry
      httpOnly: true,  // Prevent client-side JS access
      secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,  // 'none' for cross-site in production
      path: '/',  // Cookie available for all paths
      domain: undefined,  // Let browser handle domain
    },
    name: 'sessionId',  // Cookie name
  };

  // Configure session storage based on environment
  if (process.env.NODE_ENV === 'production') {
    // Check for PostgreSQL first (Render provides this)
    if (process.env.DATABASE_URL) {
      console.log('🐘 Configuring PostgreSQL session store...');
      
      try {
        const pgPool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        });
        
        // Test connection
        await pgPool.query('SELECT NOW()');
        console.log('✅ PostgreSQL connected successfully');
        
        // Create session table if it doesn't exist
        await pgPool.query(`
          CREATE TABLE IF NOT EXISTS "session" (
            "sid" varchar NOT NULL COLLATE "default",
            "sess" json NOT NULL,
            "expire" timestamp(6) NOT NULL,
            CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
          );
          CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
        `);
        
        sessionConfig.store = new pgSession({
          pool: pgPool,
          tableName: 'session',
          pruneSessionInterval: 60 * 60, // Prune expired sessions every hour
        });
        
        console.log('✅ PostgreSQL session store configured');
      } catch (error) {
        console.error('❌ Failed to configure PostgreSQL sessions:', error);
        // Fall back to file store
        sessionConfig.store = new FileStore({
          path: './sessions',
          ttl: 3600,
          retries: 5,
          secret: sessionConfig.secret,
        });
      }
    } else if (process.env.REDIS_URL) {
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
          ttl: 3600,
          retries: 5,
          secret: sessionConfig.secret,
        });
      }
    } else {
      // Use file-based store as fallback for production without Redis
      console.log('📁 Using file-based session store (production without PostgreSQL/Redis)');
      sessionConfig.store = new FileStore({
        path: './sessions',
        ttl: 3600,
        retries: 5,
        secret: sessionConfig.secret,
      });
    }
  } else {
    // Use built-in memory store for development (sessions won't persist across restarts)
    console.log('💾 Using built-in memory session store');
    // Don't set a store - express-session will use the default MemoryStore
  }

  app.use(session(sessionConfig));
  
  // Enable global validation pipe (after session middleware)
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Enable global exception filter for better error handling
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Start the application
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0'); // Listen on all interfaces for Render
  console.log(`Application is running on port: ${port}`);
}

// Start the application
bootstrap();