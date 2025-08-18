import { Injectable } from '@nestjs/common';

interface ExtractedData {
  [key: string]: any;
}

interface ExtractionRule {
  field: string;
  patterns: RegExp[];
  preprocessor?: (text: string) => string;
  postprocessor?: (value: string, context?: any) => any;
}

@Injectable()
export class DataExtractorService {
  private extractionRules: ExtractionRule[] = [
    // Income extraction rules
    {
      field: 'grossAnnualIncome',
      patterns: [
        // Natural sentence patterns
        // "I make about 80k a year working as a software engineer"
        /\b(?:I|i)\s+(?:make|earn|get|receive)\s+(?:about|around|approximately|roughly)?\s*\$?(\d+k)\s*(?:a\s+year|annually|per\s+year)?/i,
        // "My salary is 80,000 dollars per year"
        /\b(?:my|My)\s+(?:salary|income|pay)\s+(?:is|equals|totals)\s+(?:about|around|approximately)?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:dollars?)?\s*(?:per\s+year|annually|a\s+year)?/i,
        
        // Handle "k" notation first (e.g., "80k", "$80k")
        // Matches: "income is 80k", "salary of $80k", "I earn 80k", "I make $80k"
        /(?:income|salary|earn|make)\s*(?:is|of)?\s*\$?(\d+k)/i,
        // Matches: "$80k per year", "80k annually", "$80k annual", "80k yearly"
        /\$?(\d+k)\s*(?:per year|annually|annual|yearly)/i,
        // Matches: "make $80k annually", "make 80k per year", "make 80k a year"
        /make\s+\$?(\d+k)\s*(?:annually|per year|a year)?/i,
        // Matches: "earn $80k annually", "earn 80k per year", "earn 80k a year"
        /earn\s+\$?(\d+k)\s*(?:annually|per year|a year)?/i,
        
        // Standard patterns with full number capture (e.g., "80,000" or "80000.00")
        // Matches: "annual income is $80,000", "income of 80000", "salary around $80,000.00"
        /(?:annual income|yearly income|income|salary|earn|make)\s*(?:is|of|about|around)?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        // Matches: "$80,000 per year", "80000 annually", "$80,000.00 yearly"
        /\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:per year|annually|annual|yearly|\/year|\/yr)/i,
        // Matches: "earn $80,000 a year", "earn 80000 per year"
        /earn\s+\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:a year|per year)?/i,
        // Matches: "make $80,000 a year", "make 80000 per year"
        /make\s+\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:a year|per year)?/i,
        
        // More flexible patterns for sentences
        // "I work as a teacher and earn 65000 annually"
        /\b(?:and|,)?\s*(?:I|i)?\s*(?:earn|make|get|receive)\s+\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:annually|yearly|per\s+year|a\s+year)?/i,
        // "My annual gross income is approximately $92,000"
        /annual\s+gross\s+income\s+is\s+(?:approximately|about|around)?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
      ],
      postprocessor: (value: string) => {
        // Handle "k" notation
        if (value.toLowerCase().endsWith('k')) {
          return parseInt(value.slice(0, -1)) * 1000;
        }
        return parseInt(value.replace(/[$,]/g, ''));
      }
    },
    
    // Monthly debts extraction rules
    {
      field: 'monthlyDebts',
      patterns: [
        // Natural sentence patterns for debts
        // "I pay about $600 a month for all my debts"
        /\b(?:I|i)\s+(?:pay|owe|have)\s+(?:about|around|approximately)?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:a\s+month|monthly|per\s+month)\s+(?:for|in)?\s*(?:all\s+)?(?:my\s+)?(?:debts?|loans?|obligations?)/i,
        // "My total monthly payments come to $600"
        /\b(?:my|My)\s+(?:total\s+)?monthly\s+(?:debt\s+)?(?:payments?|obligations?)\s+(?:come\s+to|are|total|equal)\s+(?:about|around|approximately)?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        
        // NEW: Matches "My monthly debt payments total $600"
        /monthly\s+debt\s+payments?\s+total\s+\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        
        // Standard patterns
        // Matches: "monthly debt obligations are $450", "monthly debt obligations is $450"
        /(?:monthly\s*debt\s*obligations?)\s*(?:are|is)?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        // Matches: "$450 in monthly debts", "450 per month expenses", "$450/month payments"
        /\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:in\s*)?(?:monthly|per month|\/month|\/mo)\s*(?:debts?|payments?|obligations?|expenses?)/i,
        // Matches: "monthly debts are $450", "per month payments total 450"
        /(?:monthly|per month)\s*(?:debts?|payments?|obligations?|expenses?)\s*(?:are|is|of|about|total)?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        // Matches: "debts are $450 monthly", "payments is 450 per month"
        /(?:debts?|payments?|obligations?)\s*(?:are|is)?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:monthly|per month|a month|\/month)/i,
        // Matches: "pay $450 monthly", "pay 450 per month", "pay $450 a month"
        /pay\s+\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:monthly|per month|a month)/i,
        // Matches: "$450 in monthly debt", "450 monthly payment"
        /\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:in\s*)?monthly\s*(?:debt|payment)/i,
        
        // Simple patterns for common phrases
        // Matches: "monthly: $450", "monthly:450"
        /monthly:?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        // Matches: "debt: $450", "debts: 450 monthly"
        /debts?:?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:monthly|\/mo)?/i,
      ],
      postprocessor: (value: string) => parseInt(value.replace(/[$,]/g, ''))
    },
    
    // Purchase price extraction rules
    {
      field: 'purchasePrice',
      patterns: [
        // Natural sentence patterns for purchase price
        // "I'm looking at a house that costs around $320,000"
        /\b(?:I'm|i'm|I\s+am)\s+(?:looking\s+at|considering|interested\s+in)\s+(?:a|an)\s+(?:house|home|property|condo|apartment)\s+(?:that\s+)?(?:costs?|priced\s+at)\s+(?:about|around|approximately)?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        // "The home I want to buy is listed at $320,000"
        /(?:home|house|property|place)\s+(?:I|i)\s+(?:want\s+to\s+)?(?:buy|purchase)\s+(?:is\s+)?(?:listed\s+at|priced\s+at|costs?)\s+(?:about|around)?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        
        // Handle "k" notation first
        /purchase\s*price\s*(?:is|of)?\s*\$?(\d+k)/i,
        /(?:home|house|property)\s*(?:costs?|price)\s*\$?(\d+k)/i,
        /looking\s*at\s*(?:a\s*)?\$?(\d+k)\s*(?:home|house|property)/i,
        /(\d+k)\s*(?:home|house|property)/i,
        // Standard patterns with full number capture
        /purchase\s*price\s*(?:of\s*the\s*property\s*)?(?:I'm\s*interested\s*in\s*)?(?:is|of|about|around)?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        /(?:home|house|property|place)\s*(?:costs?|price|is priced at|is listed at)\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        /(?:looking at|considering|interested in|want to buy)\s*(?:a\s*)?\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:home|house|property)/i,
        /(?:buying|purchasing)\s*(?:a|the)?\s*(?:home|house|property)\s*(?:for|at)\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        /\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:home|house|property|place)/i,
        // Patterns for "The purchase price of the property I'm interested/looking at..."
        /purchase\s*price\s*of\s*the\s*property\s*I'?m?\s*interested.*?(?:is|in)?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        /purchase\s*price\s*of\s*the\s*property\s*(?:you\s*are|you're)\s*interested\s*in\s*is\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        /purchase\s*price\s*of\s*the\s*property\s*I'?m?\s*looking\s*at\s*is\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        // Simple patterns
        /price:?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        /cost:?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
      ],
      postprocessor: (value: string) => {
        if (value.toLowerCase().endsWith('k')) {
          return parseInt(value.slice(0, -1)) * 1000;
        }
        return parseInt(value.replace(/[$,]/g, ''));
      }
    },
    
    // Down payment extraction rules
    {
      field: 'downPayment',
      patterns: [
        // Natural sentence patterns for down payment
        // "I have saved about $25,000 for the down payment"
        /\b(?:I|i)\s+(?:have|'ve|has)\s+(?:saved|got|accumulated)\s+(?:about|around|approximately)?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s+(?:for\s+)?(?:the\s+)?down\s*payment/i,
        // "I can put down $25,000"
        /\b(?:I|i)\s+(?:can|could|will)\s+(?:put\s+)?down\s+(?:about|around|approximately)?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        // "My down payment will be $25,000"
        /\b(?:my|My)\s+down\s*payment\s+(?:will\s+be|is|equals)\s+(?:about|around|approximately)?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        
        // Handle "k" notation first
        /(?:have|saved)\s*\$?(\d+k)\s*(?:for\s*)?down/i,
        /down\s*payment\s*\$?(\d+k)/i,
        /down\s*payment\s*amount\s*\$?(\d+k)/i,
        /(\d+k)\s*down/i,
        /(\d+k)\s*(?:for\s*)?down\s*payment/i,
        // Standard patterns with full number capture
        /(?:have|saved|putting down|can put down | down payment amount)\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:for\s*)?(?:down payment|down|deposit)/i,
        /down\s*payment\s*(?:is|of|about)?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        /\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:for\s*)?down\s*(?:payment)?/i,
        /(?:deposit|down)\s*(?:is|of)?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        // Percentage patterns (convert to amount if we have purchase price)
        /(\d+)%\s*down/i,
        /down\s*payment\s*(?:is|of)?\s*(\d+)%/i,
      ],
      postprocessor: (value: string, context?: any) => {
        if (value.endsWith('%') && context?.purchasePrice) {
          const percentage = parseInt(value.slice(0, -1));
          return Math.round((percentage / 100) * context.purchasePrice);
        }
        if (value.toLowerCase().endsWith('k')) {
          return parseInt(value.slice(0, -1)) * 1000;
        }
        return parseInt(value.replace(/[$,]/g, ''));
      }
    },
    
    // Property value (for refinance)
    {
      field: 'propertyValue',
      patterns: [
        /(?:current\s*estimated\s*value|estimated\s*value)\s*(?:of\s*(?:my|the)\s*property\s*)?(?:is\s*)?\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        /property\s*(?:is\s*)?(?:valued?|worth|appraised)\s*(?:at\s*)?\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        /(?:home|house)\s*(?:is\s*)?worth\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        /(?:current|market)\s*value\s*(?:is|of)?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        /value\s*of\s*(?:my|the)\s*property\s*(?:is\s*)?\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        /valued?\s*at\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        // Handle "k" notation
        /property\s*(?:value|worth)\s*\$?(\d+)k/i,
      ],
      postprocessor: (value: string) => {
        if (value.toLowerCase().endsWith('k')) {
          return parseInt(value.slice(0, -1)) * 1000;
        }
        return parseInt(value.replace(/[$,]/g, ''));
      }
    },
    
    // Desired loan amount (for refinance)
    {
      field: 'desiredLoanAmount',
      patterns: [
        /(?:want to|would like to|need to|looking to)\s*(?:borrow|refinance for|get|take out)\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        /(?:loan amount|refinance amount)\s*(?:is|of|would be)?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        /(?:borrow|need|want)\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:from|for|in)\s*(?:the\s*)?(?:refinance|loan)/i,
        // Handle "k" notation
        /(?:borrow|refinance)\s*\$?(\d+)k/i,
      ],
      postprocessor: (value: string) => {
        if (value.toLowerCase().endsWith('k')) {
          return parseInt(value.slice(0, -1)) * 1000;
        }
        return parseInt(value.replace(/[$,]/g, ''));
      }
    },
    
    // Email extraction
    {
      field: 'email',
      patterns: [
        // Email pattern breakdown:
        // \b = word boundary
        // [a-zA-Z0-9][a-zA-Z0-9._%+-]* = username part (letters, numbers, dots, underscores, etc.)
        // @ = literal @ symbol
        // [a-zA-Z0-9][a-zA-Z0-9.-]* = domain name part
        // \.[a-zA-Z]{2,} = dot followed by at least 2 letters for TLD (.com, .org, etc.)
        // Matches: "john.doe@example.com", "jane_smith123@company.co.uk"
        /\b([a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,})\b/,
      ],
      postprocessor: (value: string) => value.toLowerCase().trim()
    },
    
    // Phone extraction
    {
      field: 'phone',
      patterns: [
        // Match word boundaries for phone numbers
        /\b(\d{11})\b/,  // 11 consecutive digits (e.g., "14155551234")
        /\b(\d{10})\b/,  // 10 consecutive digits (e.g., "4155551234")
        
        // International format with country code
        // Matches: "+1-415-555-1234", "+44 20 7123 4567", "1 (415) 555-1234"
        /\b((?:\+?\d{1,3}[-.\s]?)?\(?\d{3,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,6})\b/,
        
        // US format variations
        // Matches: "(415) 555-1234", "415-555-1234", "415.555.1234", "415 555 1234"
        /\b(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})\b/,
        
        // With extensions
        // Matches: "415-555-1234 ext 123", "415.555.1234 x123", "415 555 1234 extension 12345"
        /\b(\d{3}[-.\s]?\d{3}[-.\s]?\d{4}(?:\s*(?:ext|x|extension)\.?\s*\d{1,5})?)/i,
      ],
      // Remove formatting characters and leading 1 (US country code)
      postprocessor: (value: string) => value.replace(/[-.\s()]/g, '').replace(/^1/, '')
    },
    
    // Name extraction
    {
      field: 'fullName',
      patterns: [
        // Natural sentence patterns for names
        // "You can call me John Doe"
        /\b(?:you\s+can\s+)?call\s+me\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
        // "I go by John Doe"
        /\b(?:I|i)\s+go\s+by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
        
        // Pattern explanation: (?:...) is a non-capturing group, \s* matches any whitespace
        // [A-Z][a-z]+ matches a capitalized word, (?:\s+[A-Z][a-z]+)+ matches additional capitalized words
        // Matches: "my name is John Doe", "my full name is Jane Marie Smith", "I am Bob Johnson", "I'm Sarah Lee"
        /(?:my\s*(?:full\s*)?name\s*is|i\s*am|i'm)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
        // Matches: "My full name is David Thompson"
        /my\s+full\s+name\s+is\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
        // Matches: "name: John Doe", "called: Jane Smith"
        /(?:name|called)\s*:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
        // Handle names with punctuation: "It's John Doe"
        /\b(?:It's|it's|Its|its)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
        // Simple pattern for "Name Surname" - but only at start of sentence or after punctuation
        /(?:^|[.!?]\s*)([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s*[,.]|$)/,
      ],
      postprocessor: (value: string) => value.trim()
    }
  ];

  extractData(message: string, phase: string, existingData?: any): ExtractedData {
    const extracted: ExtractedData = {};
    
    // Clean the message by removing trailing punctuation after numbers
    const cleanedMessage = message.replace(/(\d+(?:,\d{3})*(?:\.\d{2})?),(?=\s|$)/g, '$1');
    
    console.log(`\n🔍 DataExtractor: Processing message in phase '${phase}'`);
    console.log(`📝 Original: "${message}"`);
    console.log(`📝 Cleaned: "${cleanedMessage}"`);
    
    // Count and display existing fields
    const existingFieldCount = existingData ? Object.keys(existingData).filter(key => existingData[key] !== undefined).length : 0;
    if (existingFieldCount > 0) {
      console.log(`📋 Previously collected: ${existingFieldCount} fields (${Object.keys(existingData || {}).filter(key => existingData[key]).join(', ')})`);
    }
    
    // Extract intent if in intent phase - only from user messages, not questions
    if (phase === 'intent') {
      const lowerMessage = cleanedMessage.toLowerCase();
      // Avoid extracting from questions by checking for question marks
      const isQuestion = cleanedMessage.includes('?') || lowerMessage.includes('are you looking');
      
      if (!isQuestion) {
        // Look for definitive statements
        if ((lowerMessage.includes('i want to purchase') || 
             lowerMessage.includes('i am looking to buy') || 
             lowerMessage.includes('i want to buy') ||
             lowerMessage.includes('looking to purchase') ||
             (lowerMessage.includes('purchase') && !lowerMessage.includes('or refinance')))) {
          extracted.intent = 'purchase';
          console.log(`  ✅ Intent: purchase`);
        } else if ((lowerMessage.includes('i want to refinance') || 
                    lowerMessage.includes('i am refinancing') || 
                    lowerMessage.includes('looking to refinance') ||
                    (lowerMessage.includes('refinance') && !lowerMessage.includes('purchase or')))) {
          extracted.intent = 'refinance';
          console.log(`  ✅ Intent: refinance`);
        }
      }
    }
    
    // Apply extraction rules
    for (const rule of this.extractionRules) {
      for (const pattern of rule.patterns) {
        const match = cleanedMessage.match(pattern);
        if (match && match[1]) {
          let value = match[1];
          
          // Apply postprocessor if available
          if (rule.postprocessor) {
            value = rule.postprocessor(value, existingData);
          }
          
          extracted[rule.field] = value;
          console.log(`  ✅ ${rule.field}: ${value} (pattern: ${pattern.source.substring(0, 50)}...)`);
          break; // Stop after first match for this field
        }
      }
    }
    
    // Fallback extraction for numbers if we're in collection phase and found nothing
    if (phase === 'collection' && Object.keys(extracted).length === 0) {
      console.log('  🔄 Trying context-based fallback extraction...');
      this.contextBasedExtraction(cleanedMessage, extracted, existingData);
    }
    
    // Calculate total fields (existing + newly extracted)
    const newFieldCount = Object.keys(extracted).length;
    const totalFieldCount = existingFieldCount + newFieldCount;
    
    console.log(`📊 Extracted in this message: ${newFieldCount} fields`);
    console.log(`📊 Total collected so far: ${totalFieldCount} fields`);
    
    // Show all collected fields for clarity
    const allFields = { ...existingData, ...extracted };
    const collectedFields = Object.keys(allFields).filter(key => allFields[key] !== undefined);
    if (collectedFields.length > 0) {
      console.log(`📋 All collected fields: ${collectedFields.join(', ')}`);
    }
    
    return extracted;
  }

  private contextBasedExtraction(message: string, extracted: ExtractedData, existingData?: any): void {
    // Don't split by comma if it's part of a number
    // First, temporarily replace number commas with a placeholder
    const tempMessage = message.replace(/(\d),(\d{3})/g, '$1NUMCOMMA$2');
    
    // Now split by punctuation
    const parts = tempMessage.split(/[,;.]/).map(s => s.trim()).filter(s => s);
    
    for (let part of parts) {
      // Restore the number commas
      part = part.replace(/NUMCOMMA/g, ',');
      
      const numberMatch = part.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?|\d+k)/i);
      if (numberMatch) {
        const rawValue = numberMatch[1];
        let value: number;
        
        if (rawValue.toLowerCase().endsWith('k')) {
          value = parseInt(rawValue.slice(0, -1)) * 1000;
        } else {
          value = parseInt(rawValue.replace(/[$,]/g, ''));
        }
        
        const lowerPart = part.toLowerCase();
        
        // Try to determine what this number represents
        if ((lowerPart.includes('income') || lowerPart.includes('earn') || lowerPart.includes('make') || lowerPart.includes('salary')) && !extracted.grossAnnualIncome) {
          extracted.grossAnnualIncome = value;
          console.log(`  ✅ grossAnnualIncome: ${value} (context-based)`);
        } else if ((lowerPart.includes('debt') || lowerPart.includes('monthly') || lowerPart.includes('payment')) && !extracted.monthlyDebts) {
          extracted.monthlyDebts = value;
          console.log(`  ✅ monthlyDebts: ${value} (context-based)`);
        } else if ((lowerPart.includes('price') || lowerPart.includes('cost') || lowerPart.includes('purchase') || lowerPart.includes('home')) && !extracted.purchasePrice) {
          extracted.purchasePrice = value;
          console.log(`  ✅ purchasePrice: ${value} (context-based)`);
        } else if ((lowerPart.includes('down') || lowerPart.includes('deposit')) && !extracted.downPayment) {
          extracted.downPayment = value;
          console.log(`  ✅ downPayment: ${value} (context-based)`);
        } else if ((lowerPart.includes('value') || lowerPart.includes('worth')) && !extracted.propertyValue) {
          extracted.propertyValue = value;
          console.log(`  ✅ propertyValue: ${value} (context-based)`);
        } else if ((lowerPart.includes('borrow') || lowerPart.includes('loan')) && !extracted.desiredLoanAmount) {
          extracted.desiredLoanAmount = value;
          console.log(`  ✅ desiredLoanAmount: ${value} (context-based)`);
        }
      }
    }
  }

  // Test the extractor with various inputs
  testExtraction(testCases: { message: string; phase: string; expected?: any }[]): void {
    console.log('\n🧪 Testing Data Extraction\n' + '='.repeat(60));
    
    for (const test of testCases) {
      console.log(`\nTest: "${test.message}"`);
      const result = this.extractData(test.message, test.phase);
      
      if (test.expected) {
        const passed = Object.keys(test.expected).every(key => result[key] === test.expected[key]);
        console.log(`Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
        if (!passed) {
          console.log('Expected:', test.expected);
          console.log('Got:', result);
        }
      }
      console.log('-'.repeat(60));
    }
  }
}