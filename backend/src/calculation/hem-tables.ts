export interface HEMBracket {
  minIncome: number;
  maxIncome: number;
  amount: number;
}

export interface HEMCategory {
  [incomeRange: string]: number;
}

export interface HEMTable {
  [householdType: string]: HEMCategory;
}

// HEM Table 24Q3 from UBank Excel
export const HEM_TABLE: HEMTable = {
  // Couple with 0 children
  "C0": {
    "0-26000": 2569,
    "26000-39000": 2569,
    "39000-52000": 2632,
    "52000+": 2754
  },
  // Couple with 1 child
  "C1": {
    "0-26000": 2983,
    "26000-39000": 2983,
    "39000-52000": 2983,
    "52000+": 3105
  },
  // Couple with 2 children
  "C2": {
    "0-26000": 3397,
    "26000-39000": 3397,
    "39000-52000": 3397,
    "52000+": 3519
  },
  // Couple with 3 children
  "C3": {
    "0-26000": 3811,
    "26000-39000": 3811,
    "39000-52000": 3811,
    "52000+": 3933
  },
  // Couple with 4+ children
  "C4": {
    "0-26000": 4225,
    "26000-39000": 4225,
    "39000-52000": 4225,
    "52000+": 4347
  },
  // Single with 0 children
  "S0": {
    "0-26000": 1574,
    "26000-39000": 1574,
    "39000-52000": 1637,
    "52000+": 1759
  },
  // Single with 1 child
  "S1": {
    "0-26000": 1988,
    "26000-39000": 1988,
    "39000-52000": 2051,
    "52000+": 2173
  },
  // Single with 2 children
  "S2": {
    "0-26000": 2402,
    "26000-39000": 2402,
    "39000-52000": 2465,
    "52000+": 2587
  },
  // Single with 3 children
  "S3": {
    "0-26000": 2816,
    "26000-39000": 2816,
    "39000-52000": 2879,
    "52000+": 3001
  },
  // Single with 4+ children
  "S4": {
    "0-26000": 3230,
    "26000-39000": 3230,
    "39000-52000": 3293,
    "52000+": 3415
  }
};

export function getHEMKey(householdType: 'Couple' | 'Single', numberOfChildren: number): string {
  const typeKey = householdType === 'Couple' ? 'C' : 'S';
  const childrenKey = Math.min(numberOfChildren, 4); // Cap at 4+
  return `${typeKey}${childrenKey}`;
}

export function getIncomeBracket(annualIncome: number): string {
  if (annualIncome < 26000) return "0-26000";
  if (annualIncome < 39000) return "26000-39000";
  if (annualIncome < 52000) return "39000-52000";
  return "52000+";
}