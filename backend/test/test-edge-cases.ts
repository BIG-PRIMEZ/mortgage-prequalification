import { DataExtractorService } from '../src/chat/data-extractor.service';

const extractor = new DataExtractorService();

console.log('🧪 Testing Edge Cases for Data Extraction\n');
console.log('='.repeat(80));

const edgeCases = [
  {
    message: "The purchase price of the property I'm interested in is $420,000,.",
    phase: "collection",
    expected: { purchasePrice: 420000 },
    description: "Trailing comma after number"
  },
  {
    message: "My income is $80,000, and I have $500 in monthly debts.",
    phase: "collection",
    expected: { grossAnnualIncome: 80000, monthlyDebts: 500 },
    description: "Comma after first number"
  },
  {
    message: "I make $95,000,.",
    phase: "collection",
    expected: { grossAnnualIncome: 95000 },
    description: "Trailing comma and period"
  },
  {
    message: "Purchase price: $350,000, down payment: $70,000,",
    phase: "collection",
    expected: { purchasePrice: 350000, downPayment: 70000 },
    description: "Multiple trailing commas"
  },
  {
    message: "My email is john@example.com, phone is 08108616884",
    phase: "collection",
    expected: { email: "john@example.com", phone: "08108616884" },
    description: "Email and phone extraction"
  }
];

edgeCases.forEach((test, index) => {
  console.log(`\n${index + 1}. ${test.description}`);
  console.log(`   Input: "${test.message}"`);
  
  const result = extractor.extractData(test.message, test.phase);
  
  let passed = true;
  const failures: string[] = [];
  
  for (const key in test.expected) {
    if (result[key] !== test.expected[key]) {
      passed = false;
      failures.push(`Expected ${key}=${test.expected[key]}, got ${key}=${result[key]}`);
    }
  }
  
  if (passed) {
    console.log('   ✅ PASS');
  } else {
    console.log('   ❌ FAIL');
    failures.forEach(f => console.log(`      ${f}`));
  }
  
  console.log('   Result:', result);
  console.log('-'.repeat(60));
});