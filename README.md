# Mortgage Pre-Qualification Agent

An intelligent conversational chatbot system that guides users through mortgage pre-qualification using AI-powered natural language processing and real-time calculations.

## 🌟 Features

- **AI-Powered Conversations**: Natural language processing using OpenAI GPT-4
- **Real-time Communication**: WebSocket-based instant messaging
- **Smart Data Extraction**: Automatically extracts financial information from conversational inputs
- **SMS Verification**: Phone number verification using Twilio
- **Accurate Calculations**: Implements exact UBank Excel formula calculations
- **Professional UI**: Material-UI based responsive design with animations
- **Session Management**: Maintains conversation state across interactions
- **Email Notifications**: Sends detailed results via SendGrid

## 🛠️ Technology Stack

### Frontend
- **React 19.1.1** - UI framework
- **TypeScript 5.7** - Type safety
- **Material-UI 7.3.1** - Component library
- **Socket.io Client 4.8.1** - WebSocket communication
- **Vite 7.0** - Build tool
- **Axios 1.11.0** - HTTP client
- **Emotion** - CSS-in-JS styling

### Backend
- **NestJS 11.1.6** - Node.js framework
- **TypeScript 5.7** - Type safety
- **Socket.io 4.8.1** - WebSocket server
- **OpenAI 5.12.2** - AI integration
- **Twilio 5.8.0** - SMS service
- **SendGrid 8.1.5** - Email service
- **Express Session** - Session management
- **Class Validator** - Input validation

## 📋 System Requirements

- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **Operating System**: Windows, macOS, or Linux
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: 500MB free space

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/mortgage-prequalification.git
cd mortgage-prequalification
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

## ⚙️ Configuration

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
SESSION_SECRET=your-secure-session-secret-here

# OpenAI Configuration
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Twilio Configuration (SMS)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890  # E.164 format

# SendGrid Configuration (Email)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### Frontend Environment Variables

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

### Setting Up API Services

#### OpenAI
1. Sign up at [OpenAI Platform](https://platform.openai.com)
2. Generate an API key in the dashboard
3. Add the key to your `.env` file

#### Twilio (SMS)
1. Create account at [Twilio](https://www.twilio.com/try-twilio)
2. Get your Account SID, Auth Token, and phone number
3. Add credentials to `.env` file
4. Phone number must be in E.164 format (+1234567890)

#### SendGrid (Email)
1. Sign up at [SendGrid](https://signup.sendgrid.com/)
2. Create an API key with full access
3. Verify a sender email address
4. Add API key and verified email to `.env` file

## 🏃‍♂️ Running the Application

### Development Mode

#### Start Backend Server
```bash
cd backend
npm run start:dev
```
The backend will run on `http://localhost:3000`

#### Start Frontend Server
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:5173`

### Production Mode

#### Build and Run Backend
```bash
cd backend
npm run build
npm run start:prod
```

#### Build and Serve Frontend
```bash
cd frontend
npm run build
npm run preview
```

## 📡 API Documentation

### REST Endpoints

#### Chat Endpoints
```http
POST /chat/message
Content-Type: application/json

{
  "content": "I want to purchase a home"
}
```

```http
POST /chat/reset
# Resets the conversation session
```

#### Verification Endpoints
```http
POST /verification/send
Content-Type: application/json

{
  "type": "sms" | "email"
}
```

```http
POST /verification/verify
Content-Type: application/json

{
  "type": "sms" | "email",
  "code": "123456"
}
```

#### Calculation Endpoints
```http
POST /calculation/borrowing-capacity
Content-Type: application/json

{
  "grossAnnualIncome": 80000,
  "monthlyDebts": 500,
  "purchasePrice": 600000,
  "downPayment": 120000
}
```

### WebSocket Events

#### Client → Server
- `message`: Send a chat message
- `join`: Join a chat room

#### Server → Client
- `message`: Receive a chat message
- `connect`: Connection established
- `disconnect`: Connection terminated

## 📁 Project Structure

```
mortgage-prequalification/
├── backend/
│   ├── src/
│   │   ├── calculation/        # Borrowing capacity calculations
│   │   │   ├── calculation.service.ts
│   │   │   ├── hem-tables.ts
│   │   │   ├── tax-tables.ts
│   │   │   └── interfaces/
│   │   ├── chat/              # Chat functionality
│   │   │   ├── chat.service.ts
│   │   │   ├── chat.gateway.ts
│   │   │   ├── chat.controller.ts
│   │   │   └── data-extractor.service.ts
│   │   ├── shared/            # Shared interfaces and DTOs
│   │   ├── user/              # User management
│   │   ├── verification/      # SMS/Email verification
│   │   │   ├── verification.service.ts
│   │   │   ├── verification.controller.ts
│   │   │   └── phone-formatter.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── test/                  # Test files
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── ChatContainer.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   ├── VerificationModal.tsx
│   │   │   └── ResultsDisplay.tsx
│   │   ├── services/          # API services
│   │   │   ├── chatService.ts
│   │   │   └── socketService.ts
│   │   ├── types/             # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── index.html
│   └── package.json
├── PROGRESS.md               # Development progress tracking
└── README.md                 # This file
```

## 🧪 Testing

### Backend Tests
```bash
cd backend

# Unit tests
npm test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Custom test scripts
npm run test:sms           # Test SMS functionality
npm run test:verification  # Test verification flow
npm run test:chat-flow     # Test chat conversation
npm run test:complete      # Test complete flow
```

### Frontend Tests
Currently, frontend tests need to be implemented. Recommended testing approach:
- React Testing Library for component tests
- Cypress for E2E tests

## 🚢 Deployment

### Using Docker (Recommended)

Create a `docker-compose.yml` file:

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    env_file:
      - ./backend/.env
    
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    environment:
      - VITE_API_URL=http://backend:3000
```

### Manual Deployment

1. **Backend Deployment**
   - Use PM2 for process management
   - Configure Nginx as reverse proxy
   - Set up SSL certificates

2. **Frontend Deployment**
   - Build static files: `npm run build`
   - Serve with Nginx or CDN
   - Configure CORS headers

## 🐛 Troubleshooting

### Common Issues

#### WebSocket Connection Failed
- Ensure backend is running on port 3000
- Check CORS configuration
- Verify firewall settings

#### SMS Not Sending
- Verify Twilio credentials
- Check phone number format (must be E.164)
- Ensure geographic permissions in Twilio

#### Session Loss
- Check session secret is set
- Verify cookie settings
- Consider implementing Redis for production

#### White Screen
- Check browser console for errors
- Verify all dependencies are installed
- Clear browser cache

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Use ESLint and Prettier configurations
- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features

### Priority Areas
See [PROGRESS.md](./PROGRESS.md) for current development priorities:
1. State Persistence (Redis/Database)
2. Security & Rate Limiting
3. Enhanced Error Handling
4. Comprehensive Testing

## 📄 License

This project is proprietary software. All rights reserved.

## 🙏 Acknowledgments

- OpenAI for GPT-4 integration
- Twilio for SMS services
- SendGrid for email delivery
- Material-UI for component library
- NestJS team for the excellent framework

## 📞 Support

For issues and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check existing issues before creating new ones

---

Built with ❤️ for simplifying mortgage pre-qualification