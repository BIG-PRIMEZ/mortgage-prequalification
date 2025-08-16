import { Injectable } from '@nestjs/common';
import { UserData, BorrowingCapacityResult, Intent } from '../shared/interfaces/conversation.interface';
import { 
  ApplicantData, 
  BorrowingCapacityRequest, 
  BorrowingCapacityResult as UBankResult,
  AFFORDABILITY_PARAMS,
  HouseholdData,
  ExpenseData
} from './interfaces/ubank-calculation.interface';
import { STANDARD_TAX_TABLE, STSL_TAX_TABLE, TaxBracket } from './tax-tables';
import { HEM_TABLE, getHEMKey, getIncomeBracket } from './hem-tables';

@Injectable()
export class CalculationService {
  // Original simplified method - kept for backward compatibility
  calculateBorrowingCapacity(userData: UserData, intent?: Intent): BorrowingCapacityResult {
    // Convert to UBank format
    const ubankRequest = this.convertToUBankFormat(userData, intent);
    const ubankResult = this.calculateUBankBorrowingCapacity(ubankRequest);
    
    // Return in original format
    return {
      minAmount: ubankResult.minBorrowingCapacity,
      maxAmount: ubankResult.maxBorrowingCapacity
    };
  }

  // New UBank exact calculation method
  calculateUBankBorrowingCapacity(data: BorrowingCapacityRequest): UBankResult {
    // 1. Calculate net monthly income for both applicants
    const app1NetMonthly = this.calculateNetMonthlyIncome(data.applicant1);
    const app2NetMonthly = data.applicant2 ? this.calculateNetMonthlyIncome(data.applicant2) : 0;
    const totalNetIncome = app1NetMonthly + app2NetMonthly;
    
    // 2. Calculate monthly expenses using HEM
    const monthlyExpenses = this.calculateMonthlyExpenses(
      data.household,
      totalNetIncome * 12, // Annual income for HEM bracket
      data.expenses
    );
    
    // 3. Calculate available surplus
    const monthlySurplus = totalNetIncome - monthlyExpenses;
    
    // 4. Determine assessment rate
    const assessmentRate = Math.max(
      AFFORDABILITY_PARAMS.affordabilityFloor,
      data.loan.interestRate + AFFORDABILITY_PARAMS.affordabilityBuffer
    );
    
    // 5. Calculate maximum borrowing capacity
    const maxLoanAmount = this.calculateMaxLoan(
      monthlySurplus,
      assessmentRate,
      data.loan.loanTerm
    );
    
    // 6. Calculate minimum (90% of max as per original logic)
    const minLoanAmount = maxLoanAmount * 0.9;
    
    return {
      maxBorrowingCapacity: Math.round(maxLoanAmount / 1000) * 1000, // Round to nearest thousand
      minBorrowingCapacity: Math.round(minLoanAmount / 1000) * 1000,
      netMonthlyIncome: Math.round(totalNetIncome),
      monthlyExpenses: Math.round(monthlyExpenses),
      monthlySurplus: Math.round(monthlySurplus),
      assessmentRate: assessmentRate,
      applicant1NetMonthly: Math.round(app1NetMonthly),
      applicant2NetMonthly: app2NetMonthly ? Math.round(app2NetMonthly) : undefined
    };
  }

  private calculateNetMonthlyIncome(applicant: ApplicantData): number {
    // Calculate total gross annual income (employment income)
    const grossAnnualEmployment = applicant.salary + applicant.overtime + applicant.bonus;
    
    // Convert to weekly for tax calculation
    const grossWeekly = grossAnnualEmployment / 52;
    
    // Find appropriate tax bracket
    const taxTable = applicant.hasHECS ? STSL_TAX_TABLE : STANDARD_TAX_TABLE;
    const bracket = this.findTaxBracket(grossWeekly, taxTable);
    
    // Calculate net weekly income using UBank formula
    // Net = Gross - (aCoef * Gross - bCoef)
    const weeklyTax = bracket.aCoef * grossWeekly - bracket.bCoef;
    const netWeekly = grossWeekly - weeklyTax;
    
    // Convert to monthly
    const netMonthlyEmployment = netWeekly * 52 / 12;
    
    // Add other income sources (these are typically not taxed in the same way)
    const otherMonthlyIncome = (
      applicant.nonTaxableIncome + 
      applicant.rentalIncome * 0.75 + // Rental income often calculated at 75%
      applicant.governmentPayments + 
      applicant.investmentIncome
    ) / 12;
    
    return netMonthlyEmployment + otherMonthlyIncome;
  }

  private findTaxBracket(weeklyIncome: number, taxTable: TaxBracket[]): TaxBracket {
    // Find the highest bracket where weeklyIncome >= grossWeeklyIncome
    for (let i = taxTable.length - 1; i >= 0; i--) {
      if (weeklyIncome >= taxTable[i].grossWeeklyIncome) {
        return taxTable[i];
      }
    }
    return taxTable[0]; // Default to lowest bracket
  }

  private calculateMonthlyExpenses(
    household: HouseholdData, 
    annualIncome: number,
    expenses: ExpenseData
  ): number {
    // Get HEM baseline expenses
    const hemKey = getHEMKey(household.type, household.numberOfChildren);
    const incomeBracket = getIncomeBracket(annualIncome);
    const hemMonthly = HEM_TABLE[hemKey][incomeBracket] || 0;
    
    // Use the greater of HEM or declared living expenses
    const livingExpenses = Math.max(hemMonthly, expenses.generalLivingExpenses || 0);
    
    // Add other debt servicing
    let otherDebtServicing = 0;
    
    // Credit card servicing (3.8% of limit)
    if (expenses.creditCardLimits) {
      otherDebtServicing += expenses.creditCardLimits * AFFORDABILITY_PARAMS.creditCardRate;
    }
    
    // Personal loans (using floor rate)
    if (expenses.personalLoans) {
      const monthlyRate = AFFORDABILITY_PARAMS.personalLoanFloor / 12;
      const payments = AFFORDABILITY_PARAMS.personalLoanTerm;
      otherDebtServicing += this.calculateMonthlyPayment(
        expenses.personalLoans,
        monthlyRate,
        payments
      );
    }
    
    // Other loans
    if (expenses.otherLoans) {
      otherDebtServicing += expenses.otherLoans;
    }
    
    return livingExpenses + otherDebtServicing;
  }

  private calculateMaxLoan(
    monthlySurplus: number, 
    annualRate: number, 
    termYears: number
  ): number {
    if (monthlySurplus <= 0) return 0;
    
    const monthlyRate = annualRate / 12;
    const totalPayments = termYears * 12;
    
    // PMT formula rearranged to find Principal
    // P = PMT / [(r * (1+r)^n) / ((1+r)^n - 1)]
    const factor = (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                   (Math.pow(1 + monthlyRate, totalPayments) - 1);
    
    return monthlySurplus / factor;
  }

  private calculateMonthlyPayment(
    principal: number,
    monthlyRate: number,
    numberOfPayments: number
  ): number {
    if (monthlyRate === 0) {
      return principal / numberOfPayments;
    }
    
    // Standard PMT formula
    const payment = principal * 
      (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    
    return payment;
  }

  // Helper method to convert from original format to UBank format
  private convertToUBankFormat(userData: UserData, intent?: Intent): BorrowingCapacityRequest {
    const applicant1: ApplicantData = {
      salary: userData.grossAnnualIncome || 0,
      overtime: userData.overtime || 0,
      bonus: userData.bonus || 0,
      nonTaxableIncome: 0,
      rentalIncome: 0,
      governmentPayments: 0,
      investmentIncome: 0,
      hasHECS: userData.hasHECS || false
    };

    return {
      applicant1,
      loan: {
        purpose: intent === 'refinance' ? 'Refinance' : 'Purchase',
        loanAmount: userData.desiredLoanAmount || userData.purchasePrice || 0,
        interestRate: userData.interestRate || 0.045, // Default 4.5%
        loanTerm: userData.loanTerm || 30 // Default 30 years
      },
      household: {
        type: userData.householdType || 'Single',
        numberOfChildren: userData.numberOfChildren || 0
      },
      expenses: {
        generalLivingExpenses: userData.monthlyDebts || 0,
        creditCardLimits: userData.creditCardLimits || 0,
        personalLoans: userData.personalLoans || 0,
        otherLoans: userData.otherLoans || 0
      }
    };
  }
}