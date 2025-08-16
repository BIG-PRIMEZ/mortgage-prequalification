import { Test, TestingModule } from '@nestjs/testing';
import { CalculationService } from './calculation.service';
import { BorrowingCapacityRequest } from './interfaces/ubank-calculation.interface';

describe('CalculationService - UBank Excel Formula Tests', () => {
  let service: CalculationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CalculationService],
    }).compile();

    service = module.get<CalculationService>(CalculationService);
  });

  describe('Tax Calculations', () => {
    it('should calculate correct net income for standard tax (no HECS)', () => {
      const request: BorrowingCapacityRequest = {
        applicant1: {
          salary: 80000,
          overtime: 5000,
          bonus: 10000,
          nonTaxableIncome: 0,
          rentalIncome: 0,
          governmentPayments: 0,
          investmentIncome: 0,
          hasHECS: false
        },
        loan: {
          purpose: 'Purchase',
          loanAmount: 500000,
          interestRate: 0.045,
          loanTerm: 30
        },
        household: {
          type: 'Single',
          numberOfChildren: 0
        },
        expenses: {
          generalLivingExpenses: 2000
        }
      };

      const result = service.calculateUBankBorrowingCapacity(request);
      
      // Gross annual: 95,000
      // Weekly: 1,826.92
      // Tax bracket: 2596 weekly (0.39 aCoef, 358.3077 bCoef)
      // Weekly tax: 0.39 * 1826.92 - 358.3077 = 354.1911
      // Net weekly: 1826.92 - 354.1911 = 1472.73
      // Net monthly: 1472.73 * 52 / 12 = 6381.83
      
      expect(result.applicant1NetMonthly).toBeCloseTo(6382, 0);
    });

    it('should calculate correct net income with HECS', () => {
      const request: BorrowingCapacityRequest = {
        applicant1: {
          salary: 80000,
          overtime: 5000,
          bonus: 10000,
          nonTaxableIncome: 0,
          rentalIncome: 0,
          governmentPayments: 0,
          investmentIncome: 0,
          hasHECS: true
        },
        loan: {
          purpose: 'Purchase',
          loanAmount: 500000,
          interestRate: 0.045,
          loanTerm: 30
        },
        household: {
          type: 'Single',
          numberOfChildren: 0
        },
        expenses: {
          generalLivingExpenses: 2000
        }
      };

      const result = service.calculateUBankBorrowingCapacity(request);
      
      // With HECS, tax should be higher
      expect(result.applicant1NetMonthly).toBeLessThan(6382);
    });
  });

  describe('HEM Calculations', () => {
    it('should use correct HEM for single with 0 children', () => {
      const request: BorrowingCapacityRequest = {
        applicant1: {
          salary: 60000,
          overtime: 0,
          bonus: 0,
          nonTaxableIncome: 0,
          rentalIncome: 0,
          governmentPayments: 0,
          investmentIncome: 0,
          hasHECS: false
        },
        loan: {
          purpose: 'Purchase',
          loanAmount: 400000,
          interestRate: 0.045,
          loanTerm: 30
        },
        household: {
          type: 'Single',
          numberOfChildren: 0
        },
        expenses: {
          generalLivingExpenses: 0 // Force HEM usage
        }
      };

      const result = service.calculateUBankBorrowingCapacity(request);
      
      // Income bracket: 52000+ 
      // HEM for S0 in 52000+ bracket: 1759
      expect(result.monthlyExpenses).toBe(1759);
    });

    it('should use correct HEM for couple with 2 children', () => {
      const request: BorrowingCapacityRequest = {
        applicant1: {
          salary: 100000,
          overtime: 0,
          bonus: 0,
          nonTaxableIncome: 0,
          rentalIncome: 0,
          governmentPayments: 0,
          investmentIncome: 0,
          hasHECS: false
        },
        loan: {
          purpose: 'Purchase',
          loanAmount: 600000,
          interestRate: 0.045,
          loanTerm: 30
        },
        household: {
          type: 'Couple',
          numberOfChildren: 2
        },
        expenses: {
          generalLivingExpenses: 0 // Force HEM usage
        }
      };

      const result = service.calculateUBankBorrowingCapacity(request);
      
      // Income bracket: 52000+ 
      // HEM for C2 in 52000+ bracket: 3519
      expect(result.monthlyExpenses).toBe(3519);
    });
  });

  describe('Borrowing Capacity Calculation', () => {
    it('should calculate correct borrowing capacity with assessment rate', () => {
      const request: BorrowingCapacityRequest = {
        applicant1: {
          salary: 120000,
          overtime: 0,
          bonus: 0,
          nonTaxableIncome: 0,
          rentalIncome: 0,
          governmentPayments: 0,
          investmentIncome: 0,
          hasHECS: false
        },
        loan: {
          purpose: 'Purchase',
          loanAmount: 800000,
          interestRate: 0.045, // 4.5%
          loanTerm: 30
        },
        household: {
          type: 'Single',
          numberOfChildren: 0
        },
        expenses: {
          generalLivingExpenses: 2000
        }
      };

      const result = service.calculateUBankBorrowingCapacity(request);
      
      // Assessment rate should be max(5.75%, 4.5% + 3%) = 7.5%
      expect(result.assessmentRate).toBe(0.075);
      
      // Verify the calculation produces reasonable results
      expect(result.maxBorrowingCapacity).toBeGreaterThan(0);
      expect(result.maxBorrowingCapacity).toBeLessThan(2000000); // Sanity check
    });
  });

  describe('Credit Card and Loan Servicing', () => {
    it('should calculate credit card servicing at 3.8% of limit', () => {
      const request: BorrowingCapacityRequest = {
        applicant1: {
          salary: 80000,
          overtime: 0,
          bonus: 0,
          nonTaxableIncome: 0,
          rentalIncome: 0,
          governmentPayments: 0,
          investmentIncome: 0,
          hasHECS: false
        },
        loan: {
          purpose: 'Purchase',
          loanAmount: 500000,
          interestRate: 0.045,
          loanTerm: 30
        },
        household: {
          type: 'Single',
          numberOfChildren: 0
        },
        expenses: {
          generalLivingExpenses: 2000,
          creditCardLimits: 10000 // $10k credit card limit
        }
      };

      const result = service.calculateUBankBorrowingCapacity(request);
      
      // Credit card servicing: 10000 * 0.038 = 380
      // Total expenses should include base expenses + 380
      expect(result.monthlyExpenses).toBeGreaterThanOrEqual(2380);
    });
  });
});

describe('CalculationService - Backward Compatibility', () => {
  let service: CalculationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CalculationService],
    }).compile();

    service = module.get<CalculationService>(CalculationService);
  });

  it('should maintain backward compatibility with original method', () => {
    const userData = {
      grossAnnualIncome: 80000,
      monthlyDebts: 500,
      purchasePrice: 600000,
      downPayment: 120000
    };

    const result = service.calculateBorrowingCapacity(userData, 'purchase');
    
    expect(result).toHaveProperty('minAmount');
    expect(result).toHaveProperty('maxAmount');
    expect(result.minAmount).toBeLessThanOrEqual(result.maxAmount);
  });
});