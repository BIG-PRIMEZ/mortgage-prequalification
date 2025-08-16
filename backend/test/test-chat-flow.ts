import * as dotenv from 'dotenv';
import * as path from 'path';
import axios from 'axios';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Create axios instance with cookie support
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Store cookies manually
let sessionCookie: string = '';

api.interceptors.request.use((config) => {
  if (sessionCookie) {
    config.headers.Cookie = sessionCookie;
  }
  return config;
});

api.interceptors.response.use((response) => {
  const setCookie = response.headers['set-cookie'];
  if (setCookie) {
    sessionCookie = setCookie[0].split(';')[0];
    console.log('📍 Session cookie set');
  }
  return response;
});

async function testChatFlow() {
  console.log('🚀 Testing Chat Flow with Phone Extraction\n');

  try {
    // Test 1: Send initial message
    console.log('1️⃣ Sending initial message: "I want to purchase a home"');
    const response1 = await api.post('/chat/message', {
      content: 'I want to purchase a home'
    });
    const state1 = response1.data;
    console.log('Phase:', state1.phase);
    console.log('Intent:', state1.intent);
    console.log('AI Response:', state1.messages[state1.messages.length - 1].content);
    console.log('---\n');

    // Test 2: Send financial info
    console.log('2️⃣ Sending: "My annual income is $80000 and I have $500 in monthly debts"');
    const response2 = await api.post('/chat/message', {
      content: 'My annual income is $80000 and I have $500 in monthly debts'
    });
    const state2 = response2.data;
    console.log('Phase:', state2.phase);
    console.log('Collected data:', state2.collectedData);
    console.log('---\n');

    // Test 3: Send purchase details
    console.log('3️⃣ Sending: "The purchase price is $250000 and I have $50000 for down payment"');
    const response3 = await api.post('/chat/message', {
      content: 'The purchase price is $250000 and I have $50000 for down payment'
    });
    const state3 = response3.data;
    console.log('Phase:', state3.phase);
    console.log('Collected data:', state3.collectedData);
    console.log('---\n');

    // Test 4: Send contact info with Nigerian phone
    console.log('4️⃣ Sending contact information...');
    console.log('Message: "My full name is David Thompson. My phone number is 08108616884. My email address is obayomiabraham@gmail.com"');
    const response4 = await api.post('/chat/message', {
      content: 'My full name is David Thompson. My phone number is 08108616884. My email address is obayomiabraham@gmail.com'
    });
    const state4 = response4.data;
    console.log('\n📊 Final state:');
    console.log('Phase:', state4.phase);
    console.log('Collected data:', JSON.stringify(state4.collectedData, null, 2));
    
    if (state4.collectedData.phone) {
      console.log('\n✅ Phone extracted:', state4.collectedData.phone);
    } else {
      console.log('\n❌ Phone NOT extracted');
    }
    
    if (state4.collectedData.email) {
      console.log('✅ Email extracted:', state4.collectedData.email);
    } else {
      console.log('❌ Email NOT extracted');
    }
    
    if (state4.collectedData.fullName) {
      console.log('✅ Name extracted:', state4.collectedData.fullName);
    } else {
      console.log('❌ Name NOT extracted');
    }
    
    // Check if verification was triggered
    if (state4.phase === 'verification') {
      console.log('\n🎯 Verification phase reached!');
      console.log('Verification status:', state4.verificationStatus);
      console.log('\n📱 Check your phone and email for verification codes.');
      
      // Show the last AI message
      const lastMessage = state4.messages[state4.messages.length - 1];
      if (lastMessage.sender === 'agent') {
        console.log('\n🤖 AI Response:', lastMessage.content);
      }
    } else {
      console.log('\n❌ Verification phase NOT reached');
      console.log('Current phase:', state4.phase);
      console.log('Missing data?', {
        hasIncome: !!state4.collectedData.grossAnnualIncome,
        hasDebts: !!state4.collectedData.monthlyDebts,
        hasPrice: !!state4.collectedData.purchasePrice,
        hasDown: !!state4.collectedData.downPayment,
        hasEmail: !!state4.collectedData.email,
        hasPhone: !!state4.collectedData.phone,
      });
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
      console.error('Status:', error.response.status);
    }
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(API_URL);
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🔍 Checking if server is running at', API_URL);
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.error('❌ Server is not running!');
    console.log('Please start the server with: npm run start:dev');
    process.exit(1);
  }
  
  console.log('✅ Server is running\n');
  
  console.log('📝 Note: Watch the backend console for detailed logs including:');
  console.log('  - Phone extraction logs');
  console.log('  - SMS sending attempts');
  console.log('  - Twilio responses\n');
  
  await testChatFlow();
}

main().catch(console.error);