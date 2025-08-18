import { DataExtractorService } from './data-extractor.service';

// Test the improved data extractor with natural sentences
const extractor = new DataExtractorService();

const testCases = [
  // Income tests
  {
    message: "I make about 92k a year working as a software engineer",
    phase: 'collection',
    expected: { grossAnnualIncome: 92000 }
  },
  {
    message: "My salary is 78,000 dollars per year",
    phase: 'collection',
    expected: { grossAnnualIncome: 78000 }
  },
  {
    message: "I work as a teacher and earn 65000 annually",
    phase: 'collection',
    expected: { grossAnnualIncome: 65000 }
  },
  
  // Monthly debt tests
  {
    message: "I pay about $600 a month for all my debts",
    phase: 'collection',
    expected: { monthlyDebts: 600 }
  },
  {
    message: "My total monthly payments come to $450",
    phase: 'collection',
    expected: { monthlyDebts: 450 }
  },
  {
    message: "My monthly debt payments total $600",
    phase: 'collection',
    expected: { monthlyDebts: 600 }
  },
  
  // Purchase price tests
  {
    message: "I'm looking at a house that costs around $320,000",
    phase: 'collection',
    expected: { purchasePrice: 320000 }
  },
  {
    message: "The home I want to buy is listed at $350,000",
    phase: 'collection',
    expected: { purchasePrice: 350000 }
  },
  
  // Down payment tests
  {
    message: "I have saved about $25,000 for the down payment",
    phase: 'collection',
    expected: { downPayment: 25000 }
  },
  {
    message: "I can put down $30,000",
    phase: 'collection',
    expected: { downPayment: 30000 }
  },
  {
    message: "My down payment will be $20,000",
    phase: 'collection',
    expected: { downPayment: 20000 }
  },
  
  // Name tests
  {
    message: "You can call me John Doe",
    phase: 'collection',
    expected: { fullName: "John Doe" }
  },
  {
    message: "I go by Sarah Johnson",
    phase: 'collection',
    expected: { fullName: "Sarah Johnson" }
  },
  
  // Complex sentence with multiple data points
  {
    message: "I make about 92k a year and have $600 in monthly debt payments. The house I'm looking at costs $320,000 and I can put down $25,000",
    phase: 'collection',
    expected: { 
      grossAnnualIncome: 92000,
      monthlyDebts: 600,
      purchasePrice: 320000,
      downPayment: 25000
    }
  }
];

// Run tests
console.log('🧪 Testing Natural Language Data Extraction\n');
testCases.forEach((test, index) => {
  console.log(`Test ${index + 1}: "${test.message}"`);
  const result = extractor.extractData(test.message, test.phase);
  
  const passed = Object.keys(test.expected).every(key => 
    result[key] === test.expected[key]
  );
  
  if (passed) {
    console.log('✅ PASSED\n');
  } else {
    console.log('❌ FAILED');
    console.log('Expected:', test.expected);
    console.log('Got:', result);
    console.log('\n');
  }
});