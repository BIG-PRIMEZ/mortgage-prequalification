# Production Deployment Guide

## Prerequisites

### Required Services
- **Database**: PostgreSQL or Redis for session storage
- **OpenAI**: API key for AI conversations
- **Twilio**: Account for SMS verification (recommended)
- **SendGrid**: Account for email delivery (recommended)

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Required
DATABASE_URL=postgresql://user:pass@host:5432/dbname
SESSION_SECRET=your-super-secret-64-character-key-change-this-in-production
OPENAI_API_KEY=sk-your-openai-api-key

# Recommended for full functionality
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Frontend
FRONTEND_URL=https://yourdomain.com

# System
NODE_ENV=production
PORT=3000
```

## Deployment Steps

### 1. Environment Setup

```bash
# Install dependencies
npm ci --only=production

# Build the application
npm run build

# Verify configuration
npm run start:prod
# Should show: ✅ Configuration validation passed
```

### 2. Database Setup

**PostgreSQL (Recommended)**:
```sql
-- Sessions table is created automatically
-- No manual setup required
```

**Redis (Alternative)**:
```bash
# Redis URL format
REDIS_URL=redis://username:password@host:port
```

### 3. Security Checklist

- [ ] `SESSION_SECRET` is 64+ characters and unique
- [ ] `NODE_ENV=production` is set
- [ ] Database credentials are secure
- [ ] API keys are not logged or exposed
- [ ] HTTPS is enabled (reverse proxy)
- [ ] CORS origins are restricted to your domain

### 4. Health Checks

Monitor these endpoints:
- `GET /health` - Basic health check
- `GET /health/detailed` - Comprehensive system status

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-08-18T20:30:00.000Z",
  "service": "mortgage-prequalification-backend",
  "version": "1.0.0",
  "environment": "production",
  "uptime": 3600,
  "services": {
    "database": "configured",
    "openai": "configured",
    "twilio": "configured"
  }
}
```

### 5. Monitoring & Logging

**Application Logs**:
- Errors are logged with minimal sensitive info
- Request logs include IP and user agent
- Debug logs are disabled in production

**Key Metrics to Monitor**:
- Response times (`/health/detailed`)
- Error rates (500 errors)
- Session creation rate
- Memory usage
- Database connection health

### 6. Scaling Considerations

**Session Storage**:
- PostgreSQL: Can handle thousands of concurrent sessions
- Redis: Excellent for high-traffic scenarios

**Rate Limiting**:
- Current: 100 requests per IP per 15 minutes
- Adjust in `HttpRateLimitGuard` if needed

**Memory**:
- Base usage: ~50MB
- Scales with concurrent sessions
- Monitor heap usage via `/health/detailed`

## Common Deployment Platforms

### Render (Recommended)

1. Connect your GitHub repository
2. Set environment variables in Render dashboard
3. Deploy automatically on push to main branch

### Heroku

```bash
# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set SESSION_SECRET=your-secret
heroku config:set OPENAI_API_KEY=sk-your-key
# ... other vars

# Deploy
git push heroku main
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
```

### VPS/Cloud Server

```bash
# Using PM2 for production
npm install -g pm2
pm2 start dist/main.js --name mortgage-backend
pm2 startup  # Auto-restart on server reboot
pm2 save
```

## Security Best Practices

### Network Security
- Use HTTPS (TLS 1.2+)
- Configure proper CORS origins
- Enable rate limiting
- Use a reverse proxy (nginx, Cloudflare)

### Application Security
- Keep dependencies updated
- Use strong session secrets
- Validate all inputs
- Don't log sensitive data

### Database Security
- Use connection pooling
- Enable SSL connections
- Regular backups
- Access control (firewall rules)

## Troubleshooting

### Configuration Issues
```bash
# Check configuration
curl https://yourdomain.com/health
```

### Common Errors
- **500 Error on startup**: Check environment variables
- **Session issues**: Verify DATABASE_URL or REDIS_URL
- **CORS errors**: Check FRONTEND_URL setting
- **Rate limiting**: Adjust limits in HttpRateLimitGuard

### Debug Mode
```bash
# Temporarily enable debug logs
NODE_ENV=development npm run start:prod
```

## Performance Optimization

### Database Optimization
- Use connection pooling (default in PostgreSQL driver)
- Index session tables for better performance
- Regular cleanup of expired sessions

### Memory Management
- Monitor `/health/detailed` for memory usage
- Restart if memory consumption grows unexpectedly
- Use PM2 or similar for automatic restarts

### Caching
- Sessions are automatically cached in database/Redis
- Consider Redis for better session performance
- CDN for static assets (if serving any)

## Maintenance

### Regular Tasks
- Monitor health endpoints
- Check application logs
- Update dependencies monthly
- Backup database regularly

### Updates
```bash
# Update dependencies
npm update
npm audit fix

# Test thoroughly before deploying
npm test
npm run build
```

## Support

For production issues:
1. Check health endpoints
2. Review application logs
3. Verify environment variables
4. Test with development environment
5. Check service status (OpenAI, Twilio, etc.)

## Success Criteria

Your deployment is successful when:
- [ ] Health check returns status: "ok"
- [ ] Multi-client isolation test passes
- [ ] SMS verification works (if Twilio configured)
- [ ] Email delivery works (if SendGrid configured)
- [ ] Sessions persist across server restarts
- [ ] Rate limiting prevents abuse
- [ ] Error handling provides user-friendly messages