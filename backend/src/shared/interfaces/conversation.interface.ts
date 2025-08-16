export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

export type ConversationPhase = 'intent' | 'collection' | 'verification' | 'results';
export type Intent = 'purchase' | 'refinance' | null;

export interface ConversationState {
  phase: ConversationPhase;
  intent: Intent;
  collectedData: UserData;
  verificationStatus: {
    sms: boolean;
    email: boolean;
  };
  messages: Message[];
}

export interface UserData {
  fullName?: string;
  email?: string;
  phone?: string;
  grossAnnualIncome?: number;
  employmentDetails?: string;
  monthlyDebts?: number;
  propertyValue?: number;
  purchasePrice?: number;
  downPayment?: number;
  desiredLoanAmount?: number;
  // Additional UBank fields
  overtime?: number;
  bonus?: number;
  hasHECS?: boolean;
  householdType?: 'Single' | 'Couple';
  numberOfChildren?: number;
  creditCardLimits?: number;
  personalLoans?: number;
  otherLoans?: number;
  loanTerm?: number; // in years
  interestRate?: number; // as decimal
}

export interface BorrowingCapacityResult {
  minAmount: number;
  maxAmount: number;
}