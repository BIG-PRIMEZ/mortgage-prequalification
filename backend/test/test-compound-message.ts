import { DataExtractorService } from '../src/chat/data-extractor.service';

const extractor = new DataExtractorService();

console.log('🧪 Testing Compound Message Extraction\n');
console.log('='.repeat(80));

const testMessage = "My annual income is $78,000. My monthly debt obligations are $450. The current estimated value of my property is $320,000, and I'm looking to refinance with a loan amount of $250,000.";

console.log('Message:', testMessage);
console.log('\n');

const result = extractor.extractData(testMessage, 'collection');

console.log('\nExtracted Data:');
console.log(JSON.stringify(result, null, 2));

console.log('\nChecking for required fields:');
const requiredFields = ['grossAnnualIncome', 'monthlyDebts', 'propertyValue', 'desiredLoanAmount'];
const missingFields = requiredFields.filter(field => !result[field]);

if (missingFields.length > 0) {
  console.log('❌ Missing fields:', missingFields);
} else {
  console.log('✅ All required fields extracted successfully');
}

console.log('\nExtracted values:');
requiredFields.forEach(field => {
  console.log(`${field}: ${result[field] || 'NOT FOUND'}`);
});