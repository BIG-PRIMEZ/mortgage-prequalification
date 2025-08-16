export interface ApplicantData {
  salary: number;
  overtime: number;
  bonus: number;
  nonTaxableIncome: number;
  rentalIncome: number;
  governmentPayments: number;
  investmentIncome: number;
  hasHECS: boolean;
}

export interface LoanData {
  purpose: 'Purchase' | 'Refinance';
  loanAmount: number;
  interestRate: number; // Annual rate as decimal (e.g., 0.045 for 4.5%)
  loanTerm: number; // In years
  interestOnlyTerm?: number; // In years
}

export interface HouseholdData {
  type: 'Couple' | 'Single';
  numberOfChildren: number;
}

export interface ExpenseData {
  generalLivingExpenses: number; // Monthly amount
  creditCardLimits?: number;
  personalLoans?: number;
  otherLoans?: number;
}

export interface BorrowingCapacityRequest {
  applicant1: ApplicantData;
  applicant2?: ApplicantData;
  loan: LoanData;
  household: HouseholdData;
  expenses: ExpenseData;
}

export interface BorrowingCapacityResult {
  maxBorrowingCapacity: number;
  minBorrowingCapacity: number;
  netMonthlyIncome: number;
  monthlyExpenses: number;
  monthlySurplus: number;
  assessmentRate: number;
  applicant1NetMonthly?: number;
  applicant2NetMonthly?: number;
}

export const AFFORDABILITY_PARAMS = {
  affordabilityFloor: 0.0575,    // 5.75% minimum assessment rate
  affordabilityBuffer: 0.03,     // 3% buffer above current rate
  creditCardRate: 0.038,         // 3.8% for credit card repayments
  personalLoanFloor: 0.1,        // 10% for personal loans
  personalLoanTerm: 36,          // 36 months term
  rentalFloor: 650,              // Minimum rental expense
  investmentFloor: 0.1           // 10% investment property expenses
};