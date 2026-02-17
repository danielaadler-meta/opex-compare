import { Injectable } from '@nestjs/common';
import { BaseRcaStep, RcaStepInput, RcaStepOutput } from './base-rca-step';
import { RcaStep } from '../../common/enums';
import { FedService } from '../../fed/fed.service';

@Injectable()
export class FedEstimatedVsActualStep extends BaseRcaStep {
  readonly stepOrder = 5;
  readonly stepName = RcaStep.FED_ESTIMATED_VS_ACTUAL;

  constructor(private fedService: FedService) {
    super();
  }

  async execute(input: RcaStepInput): Promise<RcaStepOutput> {
    const split = await this.fedService.getEstimatedVsActualSplit({
      businessUnit: input.businessUnit,
      year: input.year,
      month: input.month,
    });

    // If FED estimated > FED actual, it means some FED costs are provisional
    // and may be higher than true actuals, reducing the perceived gap.
    // Conversely, if estimated < actual, FED underestimates, widening the gap.
    const estimationDelta = split.totalEstimated - split.totalActual;
    const amountExplained = estimationDelta;
    const remainingGap = input.remainingGap - amountExplained;

    return {
      stepOrder: this.stepOrder,
      stepName: this.stepName,
      amountExplained,
      remainingGap,
      percentOfTotalGap: this.calcPercent(amountExplained, input.totalGap),
      breakdown: {
        totalActual: split.totalActual,
        totalEstimated: split.totalEstimated,
        estimationDelta,
        jobsWithActuals: split.jobsWithActuals,
        jobsEstimatedOnly: split.jobsEstimatedOnly,
        pctEstimated: split.pctEstimated,
      },
    };
  }
}
