export class RcaStepDetailDto {
  stepOrder: number;
  stepName: string;
  gapInput: number;
  amountExplained: number;
  gapOutput: number;
  percentOfTotalGap: number;
  breakdown: Record<string, any>;
}

export class RcaWaterfallResultDto {
  rcaRunId: string;
  businessUnit: string;
  period: { year: number; month: number };
  totalGap: number;
  totalExplained: number;
  residualUnexplained: number;
  percentExplained: number;
  steps: RcaStepDetailDto[];
}
