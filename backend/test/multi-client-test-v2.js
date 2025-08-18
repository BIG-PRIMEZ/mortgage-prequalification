/**
 * Multi-client isolation test v2 - with better verification handling
 */

const axios = require('axios');
const io = require('socket.io-client');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

const API_URL = 'http://localhost:3000';
const WS_URL = 'http://localhost:3000';

// Color codes for console output
const colors = {
  client1: '\x1b[36m', // Cyan
  client2: '\x1b[33m', // Yellow
  client3: '\x1b[35m', // Magenta
  error: '\x1b[31m',   // Red
  success: '\x1b[32m', // Green
  reset: '\x1b[0m'
};

class TestClient {
  constructor(name, userData) {
    this.name = name;
    this.userData = userData;
    this.sessionId = null;
    this.socket = null;
    this.messages = [];
    this.results = null;
    this.verificationReceived = false;
    this.color = colors[name] || colors.reset;
  }

  log(message) {
    console.log(`${this.color}[${this.name}]${colors.reset} ${message}`);
  }

  async createSession() {
    try {
      // Create a cookie jar for this client
      const jar = new CookieJar();
      
      // Create axios instance for this client with cookie support
      this.api = wrapper(axios.create({
        baseURL: API_URL,
        headers: { 'Content-Type': 'application/json' },
        jar: jar,
        withCredentials: true,
      }));

      // Get initial session
      const response = await this.api.get('/chat/session');
      this.sessionId = response.data.sessionId;
      this.log(`Session created: ${this.sessionId}`);

      // Add interceptors to maintain session
      this.api.interceptors.request.use((config) => {
        if (this.sessionId) {
          config.headers['X-Session-Id'] = this.sessionId;
        }
        return config;
      });

      this.api.interceptors.response.use((response) => {
        const newSessionId = response.data?.sessionId || response.headers['x-session-id'];
        if (newSessionId && newSessionId !== this.sessionId) {
          this.sessionId = newSessionId;
          this.log(`Session updated: ${this.sessionId}`);
        }
        return response;
      });

    } catch (error) {
      this.log(`${colors.error}Failed to create session: ${error.message}${colors.reset}`);
      throw error;
    }
  }

  connectWebSocket() {
    return new Promise((resolve, reject) => {
      this.socket = io(WS_URL, {
        transports: ['websocket'],
        query: { sessionId: this.sessionId },
        auth: { sessionId: this.sessionId }
      });

      this.socket.on('connect', () => {
        this.log('WebSocket connected');
        resolve();
      });

      this.socket.on('message', (message) => {
        this.messages.push(message);
        this.log(`Received message: ${message.content.substring(0, 50)}...`);
        
        // Check if this is a verification request
        if (message.content.includes('verification code')) {
          this.verificationReceived = true;
        }
      });

      this.socket.on('error', (error) => {
        this.log(`${colors.error}WebSocket error: ${error.message || error}${colors.reset}`);
      });

      this.socket.on('connect_error', (error) => {
        this.log(`${colors.error}Connection error: ${error.message}${colors.reset}`);
        reject(error);
      });
    });
  }

  async sendMessage(content) {
    try {
      this.log(`Sending: "${content}"`);
      const response = await this.api.post('/chat/message', { content });
      
      // Check conversation state
      if (response.data.phase) {
        this.log(`Phase: ${response.data.phase}`);
      }
      
      if (response.data.results) {
        this.results = response.data.results;
        this.log(`${colors.success}Got results! Borrowing capacity: $${this.results.maxBorrowingCapacity.toLocaleString()}${colors.reset}`);
      }
      
      return response.data;
    } catch (error) {
      this.log(`${colors.error}Failed to send message: ${error.message}${colors.reset}`);
      if (error.response && error.response.data) {
        this.log(`${colors.error}Error details: ${JSON.stringify(error.response.data)}${colors.reset}`);
      }
      throw error;
    }
  }

  async runConversation() {
    const messages = [
      `I want to ${this.userData.intent}`,
      `My annual income is $${this.userData.income}`,
      `I pay $${this.userData.monthlyDebts} per month in debts`,
      this.userData.intent === 'purchase' 
        ? `The purchase price is $${this.userData.purchasePrice}` 
        : `My property is worth $${this.userData.propertyValue}`,
      this.userData.intent === 'purchase'
        ? `I have $${this.userData.downPayment} for down payment`
        : `I want to borrow $${this.userData.loanAmount}`,
      `My name is ${this.userData.name}`,
      `My email is ${this.userData.email}`,
      `My phone is ${this.userData.phone}`
    ];

    for (const msg of messages) {
      const response = await this.sendMessage(msg);
      // Wait a bit between messages
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // If we've entered verification phase, break
      if (response.phase === 'verification') {
        this.log('Entered verification phase');
        break;
      }
    }
  }

  async checkSessionState() {
    try {
      const response = await this.api.get('/chat/session');
      this.log(`Session state - Phase: ${response.data.conversationState?.phase}, Verified: ${response.data.conversationState?.verificationStatus?.sms}`);
      return response.data;
    } catch (error) {
      this.log(`${colors.error}Failed to check session state${colors.reset}`);
      return null;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.log('WebSocket disconnected');
    }
  }

  async reset() {
    try {
      await this.api.post('/chat/reset');
      this.log('Session reset');
    } catch (error) {
      this.log(`${colors.error}Failed to reset session${colors.reset}`);
    }
  }
}

// Test data for different clients
const testClients = [
  {
    name: 'client1',
    data: {
      intent: 'purchase',
      income: 75000,
      monthlyDebts: 500,
      purchasePrice: 300000,
      downPayment: 60000,
      name: 'John Smith',
      email: 'john@example.com',
      phone: '4155551234'
    }
  },
  {
    name: 'client2',
    data: {
      intent: 'refinance',
      income: 120000,
      monthlyDebts: 1200,
      propertyValue: 450000,
      loanAmount: 350000,
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '4155555678'
    }
  },
  {
    name: 'client3',
    data: {
      intent: 'purchase',
      income: 95000,
      monthlyDebts: 800,
      purchasePrice: 400000,
      downPayment: 80000,
      name: 'Bob Wilson',
      email: 'bob@example.com',
      phone: '4155559999'
    }
  }
];

async function runMultiClientTest() {
  console.log(`${colors.success}=== Starting Multi-Client Isolation Test v2 ===${colors.reset}\n`);

  const clients = [];

  try {
    // Step 1: Create all clients and establish sessions
    console.log('Step 1: Creating client sessions...\n');
    for (const clientData of testClients) {
      const client = new TestClient(clientData.name, clientData.data);
      await client.createSession();
      await client.connectWebSocket();
      clients.push(client);
    }

    console.log(`\n${colors.success}All clients connected successfully${colors.reset}\n`);

    // Step 2: Run conversations in parallel
    console.log('Step 2: Running conversations in parallel...\n');
    await Promise.all(clients.map(client => client.runConversation()));

    console.log(`\n${colors.success}All conversations completed${colors.reset}\n`);

    // Step 3: Check session states
    console.log('Step 3: Checking session states...\n');
    await Promise.all(clients.map(client => client.checkSessionState()));

    // Wait for verification messages
    console.log('\nWaiting for verification messages...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 4: Check isolation
    console.log('\nStep 4: Checking data isolation...\n');
    
    let isolationPassed = true;
    
    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      client.log(`Isolation check:`);
      
      // Check that messages are isolated
      const otherClientsNames = clients.filter((c, idx) => idx !== i).map(c => c.userData.name);
      const hasOtherClientData = client.messages.some(msg => 
        otherClientsNames.some(name => msg.content.includes(name))
      );
      
      if (hasOtherClientData) {
        client.log(`${colors.error}ERROR: Found other client's data in messages!${colors.reset}`);
        isolationPassed = false;
      } else {
        client.log(`${colors.success}✓ No cross-client data contamination${colors.reset}`);
      }
      
      // Check session isolation
      const sessionData = await client.checkSessionState();
      if (sessionData?.conversationState?.collectedData) {
        const data = sessionData.conversationState.collectedData;
        if (data.fullName === client.userData.name) {
          client.log(`${colors.success}✓ Session data matches client${colors.reset}`);
        } else {
          client.log(`${colors.error}ERROR: Session data mismatch!${colors.reset}`);
          isolationPassed = false;
        }
      }
    }

    console.log('\n' + '='.repeat(50) + '\n');
    
    if (isolationPassed) {
      console.log(`${colors.success}✅ MULTI-CLIENT ISOLATION TEST PASSED!${colors.reset}`);
      console.log('All clients maintained separate sessions and data');
      console.log('\nNote: Results calculation requires actual SMS verification,');
      console.log('which cannot be automated in this test.');
    } else {
      console.log(`${colors.error}❌ MULTI-CLIENT ISOLATION TEST FAILED!${colors.reset}`);
      console.log('Data leakage detected between clients');
    }

  } catch (error) {
    console.error(`${colors.error}Test failed with error:${colors.reset}`, error.message);
  } finally {
    // Cleanup
    console.log('\nCleaning up...');
    for (const client of clients) {
      await client.reset();
      client.disconnect();
    }
  }
}

// Run the test
runMultiClientTest().catch(console.error);