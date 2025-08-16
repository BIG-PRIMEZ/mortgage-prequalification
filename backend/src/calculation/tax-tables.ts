export interface TaxBracket {
  grossWeeklyIncome: number;
  aCoef: number;
  bCoef: number;
}

export const STANDARD_TAX_TABLE: TaxBracket[] = [
  { grossWeeklyIncome: 361, aCoef: 0.16, bCoef: 57.8462 },
  { grossWeeklyIncome: 500, aCoef: 0.26, bCoef: 107.8462 },
  { grossWeeklyIncome: 625, aCoef: 0.18, bCoef: 57.8462 },
  { grossWeeklyIncome: 721, aCoef: 0.189, bCoef: 64.3365 },
  { grossWeeklyIncome: 865, aCoef: 0.3227, bCoef: 180.0385 },
  { grossWeeklyIncome: 1282, aCoef: 0.32, bCoef: 176.5769 },
  { grossWeeklyIncome: 2596, aCoef: 0.39, bCoef: 358.3077 },
  { grossWeeklyIncome: 3653, aCoef: 0.47, bCoef: 650.6154 }
];

export const STSL_TAX_TABLE: TaxBracket[] = [
  { grossWeeklyIncome: 361, aCoef: 0.16, bCoef: 57.8462 },
  { grossWeeklyIncome: 500, aCoef: 0.26, bCoef: 107.8462 },
  { grossWeeklyIncome: 625, aCoef: 0.18, bCoef: 57.8462 },
  { grossWeeklyIncome: 721, aCoef: 0.189, bCoef: 64.3365 },
  { grossWeeklyIncome: 865, aCoef: 0.3227, bCoef: 180.0385 },
  { grossWeeklyIncome: 1046, aCoef: 0.3327, bCoef: 180.0385 },
  { grossWeeklyIncome: 1208, aCoef: 0.3427, bCoef: 180.0385 },
  { grossWeeklyIncome: 1281, aCoef: 0.345, bCoef: 176.5769 },
  { grossWeeklyIncome: 1358, aCoef: 0.35, bCoef: 176.5769 },
  { grossWeeklyIncome: 1439, aCoef: 0.355, bCoef: 176.5769 },
  { grossWeeklyIncome: 1525, aCoef: 0.36, bCoef: 176.5769 },
  { grossWeeklyIncome: 1617, aCoef: 0.365, bCoef: 176.5769 },
  { grossWeeklyIncome: 1714, aCoef: 0.37, bCoef: 176.5769 },
  { grossWeeklyIncome: 1817, aCoef: 0.375, bCoef: 176.5769 },
  { grossWeeklyIncome: 1926, aCoef: 0.38, bCoef: 176.5769 },
  { grossWeeklyIncome: 2042, aCoef: 0.385, bCoef: 176.5769 },
  { grossWeeklyIncome: 2164, aCoef: 0.39, bCoef: 176.5769 },
  { grossWeeklyIncome: 2294, aCoef: 0.395, bCoef: 176.5769 },
  { grossWeeklyIncome: 2432, aCoef: 0.4, bCoef: 176.5769 },
  { grossWeeklyIncome: 2578, aCoef: 0.405, bCoef: 176.5769 },
  { grossWeeklyIncome: 2596, aCoef: 0.475, bCoef: 358.3077 },
  { grossWeeklyIncome: 2732, aCoef: 0.48, bCoef: 358.3077 },
  { grossWeeklyIncome: 2896, aCoef: 0.485, bCoef: 358.3077 },
  { grossWeeklyIncome: 3070, aCoef: 0.49, bCoef: 358.3077 },
  { grossWeeklyIncome: 3653, aCoef: 0.57, bCoef: 650.6154 }
];