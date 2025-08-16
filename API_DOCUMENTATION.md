# API Documentation

## Base URL

```
Development: http://localhost:3000
Production: https://api.yourdomain.com
```

## Authentication

The API uses session-based authentication with cookies. Sessions are maintained server-side using express-session.

```javascript
// Sessions are automatically handled via cookies
// No additional headers required after initial session creation
```

## REST API Endpoints

### Chat Module

#### Send Message
Sends a message to the chat agent and receives a response.

```http
POST /chat/message
Content-Type: application/json
Cookie: connect.sid=<session-id>

{
  "content": "I want to purchase a home for $500,000"
}
```

**Response:**
```json
{
  "id": "msg_123456",
  "content": "I understand you're looking to purchase a home for $500,000. To help determine your borrowing capacity, could you tell me about your annual income?",
  "sender": "agent",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "conversationState": {
    "phase": "collection",
    "intent": "purchase",
    "collectedData": {
      "purchasePrice": 500000
    }
  }
}
```

#### Reset Conversation
Clears the current session and starts fresh.

```http
POST /chat/reset
Cookie: connect.sid=<session-id>
```

**Response:**
```json
{
  "success": true,
  "message": "Conversation reset successfully"
}
```

### Verification Module

#### Send Verification Code
Triggers sending a verification code via SMS or email.

```http
POST /verification/send
Content-Type: application/json
Cookie: connect.sid=<session-id>

{
  "type": "sms"  // or "email"
}
```

**Response:**
```json
{
  "success": true
}
```

#### Verify Code
Validates the verification code entered by the user.

```http
POST /verification/verify
Content-Type: application/json
Cookie: connect.sid=<session-id>

{
  "type": "sms",  // or "email"
  "code": "123456"
}
```

**Response:**
```json
{
  "valid": true
}
```

**Error Response:**
```json
{
  "valid": false,
  "error": "Invalid code or code expired"
}
```

### Calculation Module

#### Calculate Borrowing Capacity
Calculates the borrowing capacity based on provided financial data.

```http
POST /calculation/borrowing-capacity
Content-Type: application/json

{
  "grossAnnualIncome": 120000,
  "monthlyDebts": 1500,
  "purchasePrice": 600000,
  "downPayment": 120000,
  "overtime": 10000,
  "bonus": 15000,
  "hasHECS": false,
  "householdType": "Couple",
  "numberOfChildren": 2,
  "creditCardLimits": 10000,
  "loanTerm": 30,
  "interestRate": 0.045
}
```

**Response:**
```json
{
  "minAmount": 450000,
  "maxAmount": 520000
}
```

## WebSocket API

The application uses Socket.IO for real-time communication.

### Connection

```javascript
const socket = io('http://localhost:3000', {
  transports: ['websocket']
});

socket.on('connect', () => {
  console.log('Connected to WebSocket');
});
```

### Events

#### Client → Server Events

##### Join Room
```javascript
socket.emit('join', { room: 'chat_room_123' });
```

##### Send Message
```javascript
socket.emit('message', {
  id: 'msg_123',
  content: 'User message content',
  sender: 'user',
  timestamp: new Date()
});
```

#### Server → Client Events

##### Receive Message
```javascript
socket.on('message', (message) => {
  console.log('New message:', message);
  // message: { id, content, sender, timestamp }
});
```

##### Connection Status
```javascript
socket.on('connect', () => {
  console.log('Connected');
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});
```

## Data Models

### ConversationState
```typescript
interface ConversationState {
  phase: 'intent' | 'collection' | 'verification' | 'results';
  intent: 'purchase' | 'refinance' | null;
  collectedData: UserData;
  verificationStatus: {
    sms: boolean;
    email: boolean;
  };
  messages: Message[];
}
```

### UserData
```typescript
interface UserData {
  // Personal Information
  fullName?: string;
  email?: string;
  phone?: string;
  
  // Financial Information
  grossAnnualIncome?: number;
  employmentDetails?: string;
  monthlyDebts?: number;
  overtime?: number;
  bonus?: number;
  hasHECS?: boolean;
  
  // Property Information
  propertyValue?: number;
  purchasePrice?: number;
  downPayment?: number;
  desiredLoanAmount?: number;
  
  // Household Information
  householdType?: 'Single' | 'Couple';
  numberOfChildren?: number;
  
  // Other Debts
  creditCardLimits?: number;
  personalLoans?: number;
  otherLoans?: number;
  
  // Loan Details
  loanTerm?: number;
  interestRate?: number;
}
```

### Message
```typescript
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}
```

### BorrowingCapacityResult
```typescript
interface BorrowingCapacityResult {
  minAmount: number;
  maxAmount: number;
}
```

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

### Common Error Codes

- `400` - Bad Request (invalid input)
- `401` - Unauthorized (session expired)
- `404` - Not Found
- `422` - Unprocessable Entity (validation error)
- `500` - Internal Server Error

## Rate Limiting

Currently not implemented, but planned for production:
- Chat messages: 30 requests per minute
- Verification: 5 requests per hour
- Calculations: 100 requests per hour

## CORS Configuration

Development CORS settings:
```javascript
{
  origin: true,
  credentials: true
}
```

Production should specify allowed origins:
```javascript
{
  origin: ['https://yourdomain.com'],
  credentials: true
}
```

## Session Management

Sessions are managed using express-session with the following configuration:
- Cookie name: `connect.sid`
- Expiry: 24 hours
- HttpOnly: true
- Secure: true (in production)
- SameSite: 'strict'

## Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "services": {
    "openai": "connected",
    "twilio": "connected",
    "sendgrid": "connected"
  }
}
```

## Postman Collection

Import this collection to test the API:

```json
{
  "info": {
    "name": "Mortgage Pre-Qualification API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Chat - Send Message",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"content\": \"I want to purchase a home\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/chat/message",
          "host": ["{{baseUrl}}"],
          "path": ["chat", "message"]
        }
      }
    },
    {
      "name": "Verification - Send Code",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"type\": \"sms\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/verification/send",
          "host": ["{{baseUrl}}"],
          "path": ["verification", "send"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000",
      "type": "string"
    }
  ]
}
```

## SDK Examples

### JavaScript/TypeScript
```typescript
import axios from 'axios';
import io from 'socket.io-client';

class MortgageAPI {
  private api = axios.create({
    baseURL: 'http://localhost:3000',
    withCredentials: true
  });
  
  private socket = io('http://localhost:3000');
  
  async sendMessage(content: string) {
    const response = await this.api.post('/chat/message', { content });
    return response.data;
  }
  
  async verifyCode(type: 'sms' | 'email', code: string) {
    const response = await this.api.post('/verification/verify', { type, code });
    return response.data;
  }
  
  onMessage(callback: (message: any) => void) {
    this.socket.on('message', callback);
  }
}
```

### Python
```python
import requests
import socketio

class MortgageAPI:
    def __init__(self, base_url='http://localhost:3000'):
        self.base_url = base_url
        self.session = requests.Session()
        self.sio = socketio.Client()
        self.sio.connect(base_url)
    
    def send_message(self, content):
        response = self.session.post(
            f'{self.base_url}/chat/message',
            json={'content': content}
        )
        return response.json()
    
    def verify_code(self, type, code):
        response = self.session.post(
            f'{self.base_url}/verification/verify',
            json={'type': type, 'code': code}
        )
        return response.json()
```