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
        // Handle "k" notation first (e.g., "80k", "$80k")
        /(?:income|salary|earn|make)\s*(?:is|of)?\s*\$?(\d+k)/i,
        /\$?(\d+k)\s*(?:per year|annually|annual|yearly)/i,
        /make\s+\$?(\d+k)\s*(?:annually|per year|a year)?/i,
        /earn\s+\$?(\d+k)\s*(?:annually|per year|a year)?/i,
        // Standard patterns with full number capture
        /(?:annual income|yearly income|income|salary|earn|make)\s*(?:is|of|about|around)?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        /\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:per year|annually|annual|yearly|\/year|\/yr)/i,
        /earn\s+\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:a year|per year)?/i,
        /make\s+\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:a year|per year)?/i,
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
        // Standard patterns
        /(?:monthly\s*debt\s*obligations?)\s*(?:are|is)?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        /\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:in\s*)?(?:monthly|per month|\/month|\/mo)\s*(?:debts?|payments?|obligations?|expenses?)/i,
        /(?:monthly|per month)\s*(?:debts?|payments?|obligations?|expenses?)\s*(?:are|is|of|about|total)?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        /(?:debts?|payments?|obligations?)\s*(?:are|is)?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:monthly|per month|a month|\/month)/i,
        /pay\s+\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:monthly|per month|a month)/i,
        /\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:in\s*)?monthly\s*(?:debt|payment)/i,
        // Simple patterns for common phrases
        /monthly:?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        /debts?:?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:monthly|\/mo)?/i,
      ],
      postprocessor: (value: string) => parseInt(value.replace(/[$,]/g, ''))
    },
    
    // Purchase price extraction rules
    {
      field: 'purchasePrice',
      patterns: [
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
        // Pattern for "The purchase price of the property I'm interested..."
        /purchase\s*price\s*of\s*the\s*property\s*I'?m?\s*interested.*?(?:is|in)?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
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
        /\b([a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,})\b/,
      ],
      postprocessor: (value: string) => value.toLowerCase().trim()
    },
    
    // Phone extraction
    {
      field: 'phone',
      patterns: [
        // Match word boundaries for phone numbers
        /\b(\d{11})\b/,  // 11 consecutive digits
        /\b(\d{10})\b/,  // 10 consecutive digits
        // International format with country code
        /\b((?:\+?\d{1,3}[-.\s]?)?\(?\d{3,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,6})\b/,
        // US format variations
        /\b(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})\b/,
        // With extensions
        /\b(\d{3}[-.\s]?\d{3}[-.\s]?\d{4}(?:\s*(?:ext|x|extension)\.?\s*\d{1,5})?)/i,
      ],
      postprocessor: (value: string) => value.replace(/[-.\s()]/g, '').replace(/^1/, '')
    },
    
    // Name extraction
    {
      field: 'fullName',
      patterns: [
        /(?:my\s*(?:full\s*)?name\s*is|i\s*am|i'm)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/,
        /(?:name|called)\s*:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/,
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
    
    // Extract intent if in intent phase
    if (phase === 'intent') {
      const lowerMessage = cleanedMessage.toLowerCase();
      if (lowerMessage.includes('purchase') || lowerMessage.includes('buy') || lowerMessage.includes('buying')) {
        extracted.intent = 'purchase';
        console.log(`  ✅ Intent: purchase`);
      } else if (lowerMessage.includes('refinance') || lowerMessage.includes('refinancing')) {
        extracted.intent = 'refinance';
        console.log(`  ✅ Intent: refinance`);
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
    
    console.log(`📊 Total extracted: ${Object.keys(extracted).length} fields`);
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