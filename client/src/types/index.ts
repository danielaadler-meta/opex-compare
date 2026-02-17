export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export interface ComparisonSummary {
  fed: {
    totalActualCost: number;
    totalEstimatedCost: number;
    recordCount: number;
  };
  bmt: {
    totalOpexUsd: number;
    totalOpexFinanceAllocated: number;
    totalFinanceAdjustment: number;
    recordCount: number;
  };
  delta: {
    absolute: number;
    percentage: number;
    direction: 'BMT_HIGHER' | 'FED_HIGHER' | 'MATCH';
  };
}

export interface LineItem {
  business_unit: string;
  period_year: number;
  period_month: number;
  vendor: string;
  expense_type: string;
  work_city: string;
  product_pillar: string;
  fed_amount: number;
  bmt_amount: number;
  delta: number;
  delta_pct: number;
}

export interface FilterOptions {
  primaryBusinessUnit: string[];
  vendor: string[];
  expenseType: string[];
  workCity: string[];
  productPillar: string[];
}

export interface FilterValues {
  year: number;
  month: number;
  endYear?: number;
  endMonth?: number;
  primaryBusinessUnit?: string;
  vendor?: string;
  expenseType?: string;
  workCity?: string;
  productPillar?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface TrendPoint {
  year: number;
  month: number;
  label: string;
  fedTotal: number;
  bmtTotal: number;
  delta: number;
}

export interface RcaStep {
  stepOrder: number;
  stepName: string;
  amountExplained: number;
  gapInputAmount: number;
  gapOutputAmount: number;
  percentOfTotalGap: number;
  breakdown: any;
}

export interface RcaWaterfallResult {
  totalGap: number;
  totalExplained: number;
  residualUnexplained: number;
  percentExplained: number;
  steps: RcaStep[];
}
