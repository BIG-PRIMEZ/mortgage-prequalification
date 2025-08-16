# System Requirements and Dependencies

## Minimum System Requirements

### Development Environment
- **Operating System**: Windows 10+, macOS 10.15+, Ubuntu 20.04+
- **Node.js**: v18.0.0 or higher (LTS recommended)
- **npm**: v8.0.0 or higher
- **RAM**: 4GB minimum (8GB recommended for smooth development)
- **Storage**: 500MB available space
- **CPU**: Dual-core processor minimum
- **Network**: Stable internet connection for API services

### Production Environment
- **Server OS**: Ubuntu 20.04 LTS or similar
- **Node.js**: v18.0.0 or higher
- **RAM**: 2GB minimum (4GB recommended)
- **Storage**: 1GB available space
- **CPU**: 2 vCPUs minimum
- **Network**: Static IP with open ports 80, 443, 3000

## External Service Requirements

### OpenAI API
- **Account Type**: Pay-as-you-go or subscription
- **Model Access**: GPT-4 API access
- **Rate Limits**: 10,000 tokens/minute recommended
- **Cost Estimate**: ~$0.03 per conversation

### Twilio (SMS)
- **Account Type**: Trial or upgraded account
- **Phone Number**: One verified Twilio phone number
- **Geographic Permissions**: Enable regions for SMS delivery
- **Cost Estimate**: ~$0.0075 per SMS (US)

### SendGrid (Email)
- **Account Type**: Free tier sufficient (100 emails/day)
- **Sender Verification**: Verified sender email address
- **API Key**: Full access permissions
- **Cost Estimate**: Free for < 100 emails/day

## Browser Requirements

### Supported Browsers
- **Chrome**: v90+ (recommended)
- **Firefox**: v88+
- **Safari**: v14+
- **Edge**: v90+

### Required Features
- JavaScript enabled
- WebSocket support
- Local storage enabled
- Cookies enabled (for sessions)

## Network Requirements

### Ports
- **Frontend Dev**: 5173 (Vite default)
- **Backend**: 3000
- **WebSocket**: 3000 (same as backend)

### Firewall Rules
Allow outbound connections to:
- `api.openai.com` (HTTPS)
- `api.twilio.com` (HTTPS)
- `api.sendgrid.com` (HTTPS)

## Development Tools (Optional)

### Recommended IDE
- **VS Code** with extensions:
  - ESLint
  - Prettier
  - TypeScript Vue Plugin
  - NestJS Snippets

### Additional Tools
- **Git**: v2.30+
- **Docker**: v20+ (for containerization)
- **Redis**: v6+ (for future session persistence)
- **PostgreSQL**: v13+ (for future database integration)

## Security Requirements

### SSL/TLS
- Valid SSL certificate for production
- HTTPS enforcement
- Secure WebSocket (WSS) in production

### Environment Variables
- Secure storage for API keys
- Never commit `.env` files
- Use environment-specific configurations

## Performance Benchmarks

### Expected Performance
- **Initial Load Time**: < 3 seconds
- **Chat Response Time**: < 2 seconds
- **SMS Delivery**: < 10 seconds
- **Concurrent Users**: 100+ with current architecture

### Scalability Considerations
- Horizontal scaling possible with load balancer
- WebSocket scaling requires sticky sessions
- Database required for multi-instance deployment

## Dependency Version Matrix

### Backend Core Dependencies
```json
{
  "@nestjs/common": "^11.1.6",
  "@nestjs/core": "^11.1.6",
  "@nestjs/platform-express": "^11.1.6",
  "@nestjs/websockets": "^11.1.6",
  "openai": "^5.12.2",
  "twilio": "^5.8.0",
  "@sendgrid/mail": "^8.1.5",
  "express-session": "^1.18.2"
}
```

### Frontend Core Dependencies
```json
{
  "react": "^19.1.1",
  "react-dom": "^19.1.1",
  "@mui/material": "^7.3.1",
  "socket.io-client": "^4.8.1",
  "axios": "^1.11.0",
  "vite": "^7.0.0"
}
```

## Monitoring Requirements

### Recommended Monitoring
- **Application**: PM2 or similar process manager
- **Logs**: Centralized logging (ELK stack)
- **Metrics**: Response times, error rates
- **Uptime**: 99.9% target SLA

### Health Checks
- Backend health endpoint: `/health`
- WebSocket connection monitoring
- External service availability checks