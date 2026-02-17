import { Injectable } from '@nestjs/common';
import { BaseRcaStep, RcaStepInput, RcaStepOutput } from './base-rca-step';
import { RcaStep } from '../../common/enums';

@Injectable()
export class ResidualGapStep extends BaseRcaStep {
  readonly stepOrder = 4;
  readonly stepName = RcaStep.RESIDUAL_GAP;

  async execute(input: RcaStepInput): Promise<RcaStepOutput> {
    // Checkpoint step: records remaining gap after structural causes (1-3)
    return {
      stepOrder: this.stepOrder,
      stepName: this.stepName,
      amountExplained: 0,
      remainingGap: input.remainingGap,
      percentOfTotalGap: 0,
      breakdown: {
        residualAfterStructuralCauses: input.remainingGap,
        percentOfOriginalGap: this.calcPercent(
          input.remainingGap,
          input.totalGap,
        ),
      },
    };
  }
}
