import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import session from 'express-session';

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
   * Uses in-memory store (consider Redis for production).
   */
  const sessionConfig: session.SessionOptions = {
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

  app.use(session(sessionConfig));

  // Start the application
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0'); // Listen on all interfaces for Render
  console.log(`Application is running on port: ${port}`);
}

// Start the application
bootstrap();