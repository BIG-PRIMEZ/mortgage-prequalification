/**
 * Load test to verify system handles many concurrent users
 */

const axios = require('axios');
const io = require('socket.io-client');

const API_URL = 'http://localhost:3000';
const WS_URL = 'http://localhost:3000';
const CONCURRENT_CLIENTS = 10;

class LoadTestClient {
  constructor(id) {
    this.id = id;
    this.sessionId = null;
    this.socket = null;
    this.connected = false;
    this.messageCount = 0;
    this.errors = [];
  }

  async initialize() {
    try {
      // Create session
      const api = axios.create({
        baseURL: API_URL,
        headers: { 'Content-Type': 'application/json' }
      });

      const sessionResponse = await api.get('/chat/session');
      this.sessionId = sessionResponse.data.sessionId;

      // Connect WebSocket
      return new Promise((resolve, reject) => {
        this.socket = io(WS_URL, {
          transports: ['websocket'],
          query: { sessionId: this.sessionId }
        });

        this.socket.on('connect', () => {
          this.connected = true;
          resolve();
        });

        this.socket.on('message', () => {
          this.messageCount++;
        });

        this.socket.on('error', (error) => {
          this.errors.push(error);
        });

        this.socket.on('connect_error', (error) => {
          reject(error);
        });

        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });
    } catch (error) {
      this.errors.push(error);
      throw error;
    }
  }

  async sendTestMessage() {
    if (!this.sessionId) return;
    
    try {
      const api = axios.create({
        baseURL: API_URL,
        headers: { 
          'Content-Type': 'application/json',
          'X-Session-Id': this.sessionId 
        }
      });

      await api.post('/chat/message', {
        content: `Test message from client ${this.id}`
      });
    } catch (error) {
      this.errors.push(error);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

async function runLoadTest() {
  console.log(`\n🚀 Starting Load Test with ${CONCURRENT_CLIENTS} concurrent clients\n`);

  const clients = [];
  const startTime = Date.now();

  try {
    // Create and connect all clients
    console.log('Creating clients...');
    const connectionPromises = [];
    
    for (let i = 0; i < CONCURRENT_CLIENTS; i++) {
      const client = new LoadTestClient(i);
      clients.push(client);
      connectionPromises.push(
        client.initialize()
          .then(() => console.log(`✓ Client ${i} connected`))
          .catch(err => console.log(`✗ Client ${i} failed: ${err.message}`))
      );
    }

    await Promise.allSettled(connectionPromises);

    const connectedClients = clients.filter(c => c.connected);
    console.log(`\n✅ Connected: ${connectedClients.length}/${CONCURRENT_CLIENTS} clients\n`);

    // Send messages from all clients
    console.log('Sending test messages...');
    const messagePromises = connectedClients.map(client => 
      client.sendTestMessage()
    );
    
    await Promise.allSettled(messagePromises);

    // Wait for messages to be received
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Collect statistics
    const stats = {
      totalClients: CONCURRENT_CLIENTS,
      connectedClients: connectedClients.length,
      failedConnections: CONCURRENT_CLIENTS - connectedClients.length,
      totalMessages: connectedClients.reduce((sum, c) => sum + c.messageCount, 0),
      totalErrors: clients.reduce((sum, c) => sum + c.errors.length, 0),
      duration: Date.now() - startTime
    };

    // Display results
    console.log('\n📊 Load Test Results:');
    console.log('═'.repeat(40));
    console.log(`Total Clients: ${stats.totalClients}`);
    console.log(`Connected: ${stats.connectedClients} (${(stats.connectedClients/stats.totalClients*100).toFixed(1)}%)`);
    console.log(`Failed: ${stats.failedConnections}`);
    console.log(`Messages Received: ${stats.totalMessages}`);
    console.log(`Errors: ${stats.totalErrors}`);
    console.log(`Duration: ${stats.duration}ms`);
    console.log('═'.repeat(40));

    if (stats.connectedClients === stats.totalClients && stats.totalErrors === 0) {
      console.log('\n✅ Load test PASSED! All clients connected successfully.');
    } else {
      console.log('\n⚠️  Load test completed with some issues.');
    }

  } catch (error) {
    console.error('Load test failed:', error);
  } finally {
    // Cleanup
    console.log('\nCleaning up...');
    clients.forEach(client => client.disconnect());
  }
}

// Run the test
runLoadTest().catch(console.error);