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
}

export interface BorrowingCapacityResult {
  minAmount: number;
  maxAmount: number;
}