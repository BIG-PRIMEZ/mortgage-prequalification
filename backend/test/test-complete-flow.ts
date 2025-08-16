import * as dotenv from 'dotenv';
import * as path from 'path';
import axios from 'axios';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Create axios instance
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
    sessionCookie = setCookie[0];
  }
  return response;
});

async function sendMessage(content: string, stepName: string) {
  console.log(`\n${stepName}`);
  console.log('Sending:', content);
  
  const response = await api.post('/chat/message', { content });
  const state = response.data;
  
  console.log('Phase:', state.phase);
  console.log('Collected data:', state.collectedData);
  
  // Show AI response
  const lastMessage = state.messages[state.messages.length - 1];
  if (lastMessage.sender === 'agent') {
    console.log('AI says:', lastMessage.content.substring(0, 100) + '...');
  }
  
  return state;
}

async function testCompleteFlow() {
  console.log('🚀 Testing Complete Flow with All Required Data\n');

  try {
    // Step 1: Intent
    await sendMessage(
      'I want to purchase a home',
      '1️⃣ Setting Intent'
    );

    // Step 2: Financial info
    await sendMessage(
      'My annual income is $80000 and I have $500 in monthly debts',
      '2️⃣ Providing Income and Debts'
    );

    // Step 3: Purchase details - BOTH price and down payment
    await sendMessage(
      'The purchase price is $250000 and I have $50000 for down payment',
      '3️⃣ Providing Purchase Price and Down Payment'
    );

    // Step 4: Contact info
    const finalState = await sendMessage(
      'My full name is David Thompson. My phone number is 08108616884. My email address is obayomiabraham@gmail.com',
      '4️⃣ Providing Contact Information'
    );

    // Final analysis
    console.log('\n📊 FINAL ANALYSIS:');
    console.log('=================');
    console.log('Phase:', finalState.phase);
    console.log('Intent:', finalState.intent);
    console.log('\nCollected Data:');
    console.log('- Income:', finalState.collectedData.grossAnnualIncome);
    console.log('- Debts:', finalState.collectedData.monthlyDebts);
    console.log('- Purchase Price:', finalState.collectedData.purchasePrice);
    console.log('- Down Payment:', finalState.collectedData.downPayment);
    console.log('- Name:', finalState.collectedData.fullName);
    console.log('- Email:', finalState.collectedData.email);
    console.log('- Phone:', finalState.collectedData.phone);
    console.log('\nVerification Status:', finalState.verificationStatus);

    if (finalState.phase === 'verification') {
      console.log('\n✅ SUCCESS! Verification phase reached.');
      console.log('📱 Check your phone (+234' + finalState.collectedData.phone.substring(1) + ') for SMS');
      console.log('📧 Check your email (' + finalState.collectedData.email + ') for verification code');
    } else {
      console.log('\n❌ FAILED to reach verification phase');
      console.log('Still in phase:', finalState.phase);
      
      // Check what's missing
      const required = ['grossAnnualIncome', 'monthlyDebts', 'purchasePrice', 'downPayment'];
      const missing = required.filter(field => !finalState.collectedData[field]);
      if (missing.length > 0) {
        console.log('Missing fields:', missing);
      }
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Alternative: Send all data in one message
async function testSingleMessage() {
  console.log('\n\n🚀 Testing Single Message with All Data\n');
  
  try {
    // First set intent
    await sendMessage('I want to purchase a home', '1️⃣ Setting Intent');
    
    // Send all data at once
    const state = await sendMessage(
      'My annual income is $80000, monthly debts are $500, purchase price is $250000, down payment is $50000. My name is David Thompson, phone 08108616884, email obayomiabraham@gmail.com',
      '2️⃣ Sending All Data at Once'
    );
    
    console.log('\n📊 Result:', {
      phase: state.phase,
      hasAllData: !['grossAnnualIncome', 'monthlyDebts', 'purchasePrice', 'downPayment'].some(
        field => !state.collectedData[field]
      ),
      hasContact: !!(state.collectedData.email && state.collectedData.phone)
    });
    
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

async function main() {
  console.log('🔍 Checking server at', API_URL);
  
  try {
    await axios.get(API_URL);
  } catch (error) {
    console.error('❌ Server not running! Start with: npm run start:dev');
    return;
  }
  
  console.log('✅ Server is running');
  console.log('\n📝 Watch the backend console for SMS logs!\n');
  
  // Test complete flow
  await testCompleteFlow();
  
  // Optional: Test single message approach
  // await testSingleMessage();
}

main().catch(console.error);