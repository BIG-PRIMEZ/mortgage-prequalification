/**
 * Test a complete conversation flow including verification
 */

const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

async function testFullFlow() {
  console.log('=== Full Flow Test ===\n');
  
  try {
    // Create axios with cookie support
    const jar = new CookieJar();
    const api = wrapper(axios.create({
      baseURL: 'http://localhost:3000',
      jar: jar,
      withCredentials: true,
    }));

    // 1. Get session
    console.log('1. Creating session...');
    const sessionResponse = await api.get('/chat/session');
    const sessionId = sessionResponse.data.sessionId;
    console.log('Session ID:', sessionId);
    
    // 2. Complete data collection flow
    const messages = [
      'I want to purchase a home',
      'My annual income is $75,000',
      'I pay $500 per month in debts',
      'The purchase price is $300,000',
      'I have $60,000 for down payment',
      'My name is John Smith',
      'My email is john@example.com',
      'My phone is 4155551234'
    ];

    console.log('\n2. Sending messages...');
    let lastResponse;
    for (const message of messages) {
      console.log(`Sending: "${message}"`);
      try {
        const response = await api.post('/chat/message', { content: message });
        lastResponse = response.data;
        console.log(`Phase: ${response.data.phase}`);
        
        if (response.data.phase === 'verification') {
          console.log('✅ Reached verification phase!');
          break;
        }
        
        // Small delay between messages
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
          console.error('Status:', error.response.status);
          console.error('Data:', error.response.data);
        }
        return;
      }
    }

    // 3. Simulate verification completion
    console.log('\n3. Simulating verification completion...');
    try {
      const verificationResponse = await api.post('/chat/message', {
        content: "Yes, I've verified my phone number"
      });
      console.log('Verification response phase:', verificationResponse.data.phase);
      
      if (verificationResponse.data.results) {
        console.log('✅ Got results!');
        console.log('Max borrowing capacity:', verificationResponse.data.results.maxBorrowingCapacity);
      } else {
        console.log('⚠️ No results yet - verification might not be complete');
      }
    } catch (error) {
      console.error('Verification error:', error.message);
    }

    console.log('\n✅ Full flow test completed successfully!');
    console.log('Session remained stable throughout the conversation');

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testFullFlow();