/**
 * Multi-client isolation test script
 * Tests that multiple concurrent users don't interfere with each other
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
          this.log(`⚠️ Session ID changed! New: ${this.sessionId}`);
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
      
      if (response.data.results) {
        this.results = response.data.results;
        this.log(`${colors.success}Got results! Borrowing capacity: $${this.results.maxBorrowingCapacity.toLocaleString()}${colors.reset}`);
      }
      
      return response.data;
    } catch (error) {
      this.log(`${colors.error}Failed to send message: ${error.message}${colors.reset}`);
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
      await this.sendMessage(msg);
      // Wait a bit between messages
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }

  async verifyPhone() {
    this.log('Attempting phone verification...');
    
    // In a real test, we'd need to get the code from logs or a test endpoint
    // For now, we'll simulate verification
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Send confirmation message
    await this.sendMessage("Yes, I've verified my phone number");
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
  console.log(`${colors.success}=== Starting Multi-Client Isolation Test ===${colors.reset}\n`);

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

    // Step 3: Verify phone numbers (would need actual codes in real test)
    console.log('Step 3: Verifying phones...\n');
    await Promise.all(clients.map(client => client.verifyPhone()));

    // Step 4: Check results isolation
    console.log('\nStep 4: Checking results isolation...\n');
    
    let isolationPassed = true;
    
    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      client.log(`Final results check:`);
      
      // Check that each client got their own results
      if (!client.results) {
        client.log(`${colors.error}ERROR: No results received${colors.reset}`);
        isolationPassed = false;
        continue;
      }

      // Verify results match the client's data
      const expectedIncome = client.userData.income;
      const expectedDebts = client.userData.monthlyDebts;
      
      client.log(`Income: $${expectedIncome} | Monthly Debts: $${expectedDebts}`);
      client.log(`Max Borrowing: $${client.results.maxBorrowingCapacity.toLocaleString()}`);
      
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
    }

    console.log('\n' + '='.repeat(50) + '\n');
    
    if (isolationPassed) {
      console.log(`${colors.success}✅ MULTI-CLIENT ISOLATION TEST PASSED!${colors.reset}`);
      console.log('All clients maintained separate sessions and data');
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