import { BusinessUnit, RcaStep } from '../../common/enums';

export interface RcaStepInput {
  businessUnit: BusinessUnit;
  year: number;
  month: number;
  workflowName?: string;
  remainingGap: number;
  totalGap: number;
}

export interface RcaStepOutput {
  stepOrder: number;
  stepName: RcaStep;
  amountExplained: number;
  remainingGap: number;
  percentOfTotalGap: number;
  breakdown: Record<string, any>;
}

export abstract class BaseRcaStep {
  abstract readonly stepOrder: number;
  abstract readonly stepName: RcaStep;
  abstract execute(input: RcaStepInput): Promise<RcaStepOutput>;

  protected calcPercent(amount: number, totalGap: number): number {
    if (totalGap === 0) return 0;
    return (amount / Math.abs(totalGap)) * 100;
  }
}
