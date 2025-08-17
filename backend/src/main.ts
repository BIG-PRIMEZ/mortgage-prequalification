import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import { createClient } from 'redis';
import { PersistentMemoryStore } from './shared/services/persistent-memory-store';
import { Pool } from 'pg';
const FileStore = require('session-file-store')(session);
const pgSession = require('connect-pg-simple')(session);

/**
 * Application bootstrap function.
 * Configures middleware, validation, sessions, and starts the server.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend-backend communication
  // credentials: true enables cookies/sessions across domains
  const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL || true  // Use specific frontend URL in production
      : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['set-cookie'],
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
    saveUninitialized: true,  // Create session immediately for each client
    genid: (req) => {
      // Generate unique session ID for each client
      return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },
    cookie: {
      maxAge: 3600000,  // 1 hour expiry
      httpOnly: true,  // Prevent client-side JS access
      secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,  // 'none' required for cross-origin in production
      path: '/',  // Cookie available for all paths
      // Remove domain to let browser handle it automatically
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
    // Use persistent memory store for development
    console.log('💾 Using persistent in-memory session store');
    sessionConfig.store = new PersistentMemoryStore({
      path: './sessions',
      saveInterval: 30000,
    }) as any;
  }

  app.use(session(sessionConfig));
  
  // Enable global validation pipe (after session middleware)
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Start the application
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0'); // Listen on all interfaces for Render
  console.log(`Application is running on port: ${port}`);
}

// Start the application
bootstrap();