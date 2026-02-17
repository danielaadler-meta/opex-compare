export class ComparisonWorkflowBreakdownDto {
  workflowName: string;
  fedActualCost: number;
  bmtOpexUsd: number;
  absoluteDelta: number;
  percentageDelta: number;
}

export class ComparisonResultDto {
  snapshotId: string;
  businessUnit: string;
  period: { year: number; month: number };
  fed: {
    totalActualCost: number;
    totalEstimatedCost: number;
  };
  bmt: {
    totalOpexUsd: number;
    totalOpexFinanceAllocated: number;
  };
  delta: {
    absolute: number;
    percentage: number;
    direction: 'BMT_HIGHER' | 'FED_HIGHER' | 'MATCH';
  };
  byWorkflow?: ComparisonWorkflowBreakdownDto[];
}
