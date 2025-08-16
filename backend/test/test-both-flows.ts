import * as dotenv from 'dotenv';
import * as path from 'path';
import axios from 'axios';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const API_URL = process.env.API_URL || 'http://localhost:3000';

class ChatTester {
  private api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
  });
  
  private sessionCookie: string = '';

  constructor() {
    this.api.interceptors.request.use((config) => {
      if (this.sessionCookie) {
        config.headers.Cookie = this.sessionCookie;
      }
      return config;
    });

    this.api.interceptors.response.use((response) => {
      const setCookie = response.headers['set-cookie'];
      if (setCookie) {
        this.sessionCookie = setCookie[0];
      }
      return response;
    });
  }

  async sendMessage(content: string) {
    const response = await this.api.post('/chat/message', { content });
    return response.data;
  }

  async testPurchaseFlow() {
    console.log('\n🏠 TESTING PURCHASE FLOW\n');
    
    // 1. Intent
    console.log('Step 1: Setting intent...');
    let state = await this.sendMessage('I want to purchase a home');
    console.log('Intent:', state.intent);
    console.log('AI says:', this.getLastAgentMessage(state));
    
    // 2. Financial info - Send all at once
    console.log('\nStep 2: Providing all financial information...');
    state = await this.sendMessage(
      'My annual income is $85000, monthly debts are $600, the purchase price is $300000, and I have $60000 for down payment'
    );
    console.log('Phase after financial info:', state.phase);
    console.log('Collected:', {
      income: state.collectedData.grossAnnualIncome,
      debts: state.collectedData.monthlyDebts,
      price: state.collectedData.purchasePrice,
      down: state.collectedData.downPayment
    });
    
    // 3. Contact info
    console.log('\nStep 3: Providing contact information...');
    state = await this.sendMessage(
      'My name is John Smith, email is john@example.com, phone is 08108616884'
    );
    console.log('Final phase:', state.phase);
    console.log('Contact info:', {
      name: state.collectedData.fullName,
      email: state.collectedData.email,
      phone: state.collectedData.phone
    });
    
    if (state.phase === 'verification') {
      console.log('\n✅ Purchase flow successful! Verification phase reached.');
      console.log('SMS will be sent to: +234' + state.collectedData.phone.substring(1));
    } else {
      console.log('\n❌ Failed to reach verification. Phase:', state.phase);
      this.debugMissingData(state.collectedData, 'purchase');
    }
    
    return state;
  }

  async testRefinanceFlow() {
    console.log('\n\n💰 TESTING REFINANCE FLOW\n');
    
    // Reset session
    this.sessionCookie = '';
    
    // 1. Intent
    console.log('Step 1: Setting intent...');
    let state = await this.sendMessage('I want to refinance my mortgage');
    console.log('Intent:', state.intent);
    console.log('AI says:', this.getLastAgentMessage(state));
    
    // 2. Financial info for refinance
    console.log('\nStep 2: Providing refinance information...');
    state = await this.sendMessage(
      'My income is $95000 per year, monthly debts are $700, my property is worth $400000, and I want to borrow $320000'
    );
    console.log('Phase after financial info:', state.phase);
    console.log('Collected:', {
      income: state.collectedData.grossAnnualIncome,
      debts: state.collectedData.monthlyDebts,
      propertyValue: state.collectedData.propertyValue,
      desiredLoan: state.collectedData.desiredLoanAmount
    });
    
    // 3. Contact info
    console.log('\nStep 3: Providing contact information...');
    state = await this.sendMessage(
      'I am Sarah Johnson, my email is sarah@example.com and my phone number is 08023456789'
    );
    console.log('Final phase:', state.phase);
    console.log('Contact info:', {
      name: state.collectedData.fullName,
      email: state.collectedData.email,
      phone: state.collectedData.phone
    });
    
    if (state.phase === 'verification') {
      console.log('\n✅ Refinance flow successful! Verification phase reached.');
      console.log('SMS will be sent to: +234' + state.collectedData.phone.substring(1));
    } else {
      console.log('\n❌ Failed to reach verification. Phase:', state.phase);
      this.debugMissingData(state.collectedData, 'refinance');
    }
    
    return state;
  }

  private getLastAgentMessage(state: any): string {
    const agentMessages = state.messages.filter((m: any) => m.sender === 'agent');
    return agentMessages[agentMessages.length - 1]?.content.substring(0, 100) + '...' || 'No response';
  }

  private debugMissingData(data: any, intent: string) {
    const required = ['grossAnnualIncome', 'monthlyDebts'];
    
    if (intent === 'purchase') {
      required.push('purchasePrice', 'downPayment');
    } else {
      required.push('propertyValue', 'desiredLoanAmount');
    }
    
    const missing = required.filter(field => !data[field]);
    if (missing.length > 0) {
      console.log('Missing required fields:', missing);
    }
    
    const contactMissing = ['fullName', 'email', 'phone'].filter(field => !data[field]);
    if (contactMissing.length > 0) {
      console.log('Missing contact fields:', contactMissing);
    }
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
  console.log('\n📝 IMPORTANT: Watch the backend console for:');
  console.log('  - Data extraction logs');
  console.log('  - Missing field logs');
  console.log('  - SMS sending attempts\n');
  
  const tester = new ChatTester();
  
  // Test both flows
  const purchaseResult = await tester.testPurchaseFlow();
  const refinanceResult = await tester.testRefinanceFlow();
  
  // Summary
  console.log('\n\n📊 SUMMARY');
  console.log('===========');
  console.log('Purchase flow:', purchaseResult.phase === 'verification' ? '✅ Success' : '❌ Failed');
  console.log('Refinance flow:', refinanceResult.phase === 'verification' ? '✅ Success' : '❌ Failed');
}

main().catch(console.error);