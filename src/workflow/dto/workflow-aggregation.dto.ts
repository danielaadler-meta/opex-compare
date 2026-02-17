export class WorkflowAggregationResultDto {
  workflowName: string;
  businessUnit: string;
  period: { year: number; month: number };
  fedSpend: { actual: number; estimated: number; jobCount: number };
  bmtSpend: { opexUsd: number; financeAllocated: number };
  delta: { absolute: number; percentage: number };
}
