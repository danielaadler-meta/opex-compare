export class BmtAggregatedResponseDto {
  businessUnit: string;
  periodYear: number;
  periodMonth: number;
  totalOpexUsd: number;
  totalOpexFinanceAllocated: number;
  totalFinanceAdjustment: number;
  recordCount: number;
  breakdown?: Array<{
    groupKey: string;
    opexUsd: number;
    opexFinanceAllocated: number;
    financeAdjustment: number;
  }>;
}
