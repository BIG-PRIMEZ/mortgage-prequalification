import { DataExtractorService } from '../src/chat/data-extractor.service';

const extractor = new DataExtractorService();

const testCases = [
  // Basic income tests
  { 
    message: "My annual income is $80000", 
    phase: "collection",
    expected: { grossAnnualIncome: 80000 }
  },
  { 
    message: "I make 80k per year", 
    phase: "collection",
    expected: { grossAnnualIncome: 80000 }
  },
  { 
    message: "earn $85,000 annually", 
    phase: "collection",
    expected: { grossAnnualIncome: 85000 }
  },
  { 
    message: "My salary is 90000", 
    phase: "collection",
    expected: { grossAnnualIncome: 90000 }
  },
  
  // Monthly debt tests
  { 
    message: "I have $500 in monthly debts", 
    phase: "collection",
    expected: { monthlyDebts: 500 }
  },
  { 
    message: "monthly payments are $1,200", 
    phase: "collection",
    expected: { monthlyDebts: 1200 }
  },
  { 
    message: "debts: $800/month", 
    phase: "collection",
    expected: { monthlyDebts: 800 }
  },
  { 
    message: "pay 600 monthly", 
    phase: "collection",
    expected: { monthlyDebts: 600 }
  },
  
  // Purchase price tests
  { 
    message: "The purchase price is $250000", 
    phase: "collection",
    expected: { purchasePrice: 250000 }
  },
  { 
    message: "looking at a 300k home", 
    phase: "collection",
    expected: { purchasePrice: 300000 }
  },
  { 
    message: "house costs $275,000", 
    phase: "collection",
    expected: { purchasePrice: 275000 }
  },
  
  // Down payment tests
  { 
    message: "I have $50000 for down payment", 
    phase: "collection",
    expected: { downPayment: 50000 }
  },
  { 
    message: "saved 60k for down", 
    phase: "collection",
    expected: { downPayment: 60000 }
  },
  { 
    message: "down payment is $45,000", 
    phase: "collection",
    expected: { downPayment: 45000 }
  },
  
  // Combined tests
  { 
    message: "My income is $80000, debts are $500 monthly", 
    phase: "collection",
    expected: { grossAnnualIncome: 80000, monthlyDebts: 500 }
  },
  { 
    message: "purchase price $250k, down payment $50k", 
    phase: "collection",
    expected: { purchasePrice: 250000, downPayment: 50000 }
  },
  { 
    message: "I make 85k annually, have 600 in monthly debts, looking at a 280k home with 56k down", 
    phase: "collection",
    expected: { 
      grossAnnualIncome: 85000, 
      monthlyDebts: 600, 
      purchasePrice: 280000, 
      downPayment: 56000 
    }
  },
  
  // Contact info tests
  { 
    message: "My name is John Smith, email john@example.com, phone 08108616884", 
    phase: "collection",
    expected: { 
      fullName: "John Smith", 
      email: "john@example.com", 
      phone: "08108616884" 
    }
  },
  
  // Real world examples
  { 
    message: "80000", 
    phase: "collection",
    expected: {} // Should extract in context-based fallback
  },
  { 
    message: "income 80000", 
    phase: "collection",
    expected: { grossAnnualIncome: 80000 }
  },
  { 
    message: "monthly 500", 
    phase: "collection",
    expected: { monthlyDebts: 500 }
  },
  { 
    message: "price 250000", 
    phase: "collection",
    expected: { purchasePrice: 250000 }
  },
  
  // Intent tests
  { 
    message: "I want to purchase a home", 
    phase: "intent",
    expected: { intent: "purchase" }
  },
  { 
    message: "looking to refinance", 
    phase: "intent",
    expected: { intent: "refinance" }
  },
];

// Run tests
console.log('🧪 Testing Improved Data Extraction\n');
console.log('='.repeat(80));

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  console.log(`\nTest ${index + 1}: "${test.message}"`);
  const result = extractor.extractData(test.message, test.phase);
  
  // Check if all expected fields match
  let testPassed = true;
  for (const key in test.expected) {
    if (result[key] !== test.expected[key]) {
      testPassed = false;
      console.log(`❌ FAIL: Expected ${key}=${test.expected[key]}, got ${key}=${result[key]}`);
    }
  }
  
  if (testPassed && Object.keys(test.expected).length > 0) {
    console.log('✅ PASS');
    passed++;
  } else if (Object.keys(test.expected).length === 0 && Object.keys(result).length === 0) {
    console.log('✅ PASS (no extraction expected)');
    passed++;
  } else {
    failed++;
  }
  
  console.log('Result:', result);
  console.log('-'.repeat(60));
});

console.log(`\n📊 Summary: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);

// Test fallback extraction
console.log('\n\n🔄 Testing Fallback Extraction\n');
const fallbackTests = [
  { message: "income 80000, debts 500", phase: "collection" },
  { message: "80000 income, 500 debts monthly", phase: "collection" },
  { message: "earn 80000. pay 500 monthly", phase: "collection" },
  { message: "price is 250000. down is 50000", phase: "collection" },
];

fallbackTests.forEach(test => {
  console.log(`Test: "${test.message}"`);
  const result = extractor.extractData(test.message, test.phase);
  console.log('Result:', result);
  console.log('-'.repeat(40));
});