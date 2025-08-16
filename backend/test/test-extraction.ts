import { ChatService } from '../src/chat/chat.service';

// Simulate the extraction logic
function extractDataFromMessage(message: string, phase: string): any {
  const extracted: any = {};
  const lowerMessage = message.toLowerCase();
  
  console.log('\n🔍 Testing extraction for:', message);
  console.log('Phase:', phase);
  
  // Intent extraction
  if (phase === 'intent') {
    if (lowerMessage.includes('purchase') || lowerMessage.includes('buy')) {
      extracted.intent = 'purchase';
    } else if (lowerMessage.includes('refinance')) {
      extracted.intent = 'refinance';
    }
  }

  // Extract numbers with better context matching
  const patterns = [
    // Income patterns
    { regex: /(?:annual income|income|salary|earn|make)\s*(?:is|of|about)?\s*\$?(\d{1,3}(?:,\d{3})*|\d+)/i, field: 'grossAnnualIncome' },
    { regex: /\$?(\d{1,3}(?:,\d{3})*|\d+)\s*(?:per year|annually|annual|yearly)/i, field: 'grossAnnualIncome' },
    
    // Monthly debt patterns
    { regex: /\$?(\d{1,3}(?:,\d{3})*|\d+)\s*(?:in\s*)?(?:monthly|per month)\s*(?:debts?|payments?|obligations?)/i, field: 'monthlyDebts' },
    { regex: /(?:monthly|per month)\s*(?:debts?|payments?|obligations?)\s*(?:are|is|of|about)?\s*\$?(\d{1,3}(?:,\d{3})*|\d+)/i, field: 'monthlyDebts' },
    { regex: /(?:debts?|payments?)\s*(?:are|is)?\s*\$?(\d{1,3}(?:,\d{3})*|\d+)\s*(?:monthly|per month|a month)/i, field: 'monthlyDebts' },
    
    // Purchase price patterns
    { regex: /purchase\s*price\s*(?:is|of|about)?\s*\$?(\d{1,3}(?:,\d{3})*|\d+)/i, field: 'purchasePrice' },
    { regex: /(?:home|house|property)\s*(?:costs?|price)\s*(?:is|of)?\s*\$?(\d{1,3}(?:,\d{3})*|\d+)/i, field: 'purchasePrice' },
    { regex: /(?:looking at|considering)\s*(?:a\s*)?\$?(\d{1,3}(?:,\d{3})*|\d+)\s*(?:home|house|property)/i, field: 'purchasePrice' },
    
    // Down payment patterns
    { regex: /(?:have|saved)\s*\$?(\d{1,3}(?:,\d{3})*|\d+)\s*(?:for\s*)?down\s*payment/i, field: 'downPayment' },
    { regex: /down\s*payment\s*(?:is|of|about)?\s*\$?(\d{1,3}(?:,\d{3})*|\d+)/i, field: 'downPayment' },
    { regex: /\$?(\d{1,3}(?:,\d{3})*|\d+)\s*down/i, field: 'downPayment' },
  ];

  patterns.forEach(({ regex, field }) => {
    const match = message.match(regex);
    if (match && match[1]) {
      const value = parseInt(match[1].replace(/[$,]/g, ''));
      extracted[field] = value;
      console.log(`  ✅ Matched ${field}: ${value} (pattern: ${regex})`);
    } else {
      console.log(`  ❌ No match for ${field} (pattern: ${regex})`);
    }
  });

  // Email extraction
  const emailMatch = message.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    extracted.email = emailMatch[0];
    console.log(`  ✅ Email: ${extracted.email}`);
  }

  // Phone extraction
  const phoneMatch = message.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,6}/);
  if (!phoneMatch) {
    const simplePhoneMatch = message.match(/\b\d{10,11}\b/);
    if (simplePhoneMatch) {
      extracted.phone = simplePhoneMatch[0];
      console.log(`  ✅ Phone: ${extracted.phone}`);
    }
  } else {
    extracted.phone = phoneMatch[0].replace(/[-.\s()]/g, '');
    console.log(`  ✅ Phone: ${extracted.phone}`);
  }

  // Name extraction
  if (lowerMessage.includes('my name is') || lowerMessage.includes('my full name is') || lowerMessage.includes('i am')) {
    const nameMatch = message.match(/(?:my (?:full )?name is|i am)\s+([A-Za-z]+(?:\s+[A-Za-z]+)*)/i);
    if (nameMatch) {
      extracted.fullName = nameMatch[1].trim();
      console.log(`  ✅ Name: ${extracted.fullName}`);
    }
  }

  console.log('\n📊 Final extracted:', extracted);
  return extracted;
}

// Test cases
const testCases = [
  // Test income and debts
  { message: "My annual income is $80000 and I have $500 in monthly debts", phase: "collection" },
  { message: "I make $80,000 per year and have $500 monthly payments", phase: "collection" },
  { message: "Income: $80000, Monthly debts: $500", phase: "collection" },
  { message: "I earn 80000 annually with 500 in monthly obligations", phase: "collection" },
  
  // Test purchase details
  { message: "The purchase price is $250000 and I have $50000 for down payment", phase: "collection" },
  { message: "Home price is $250,000, down payment $50,000", phase: "collection" },
  { message: "Looking at a $250000 house with $50000 down", phase: "collection" },
  
  // Test contact info
  { message: "My full name is David Thompson. My phone number is 08108616884. My email address is obayomiabraham@gmail.com", phase: "collection" },
  
  // Combined test
  { message: "My income is $80000, debts are $500 monthly, purchase price $250000, down payment $50000", phase: "collection" },
];

console.log('🧪 Testing Data Extraction Logic\n');
console.log('='.repeat(80));

testCases.forEach((test, index) => {
  console.log(`\nTest ${index + 1}:`);
  extractDataFromMessage(test.message, test.phase);
  console.log('\n' + '-'.repeat(80));
});

// Real world examples that might be failing
console.log('\n\n🌍 REAL WORLD EXAMPLES THAT MIGHT BE FAILING:\n');

const realWorldTests = [
  "80000",
  "my income is 80000",
  "I have 500 in debts",
  "monthly debt 500",
  "price 250000",
  "250000 purchase price",
  "50000 down payment"
];

realWorldTests.forEach(message => {
  extractDataFromMessage(message, "collection");
  console.log('\n' + '-'.repeat(40));
});