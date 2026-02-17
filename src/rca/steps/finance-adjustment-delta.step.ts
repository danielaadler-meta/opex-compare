import { Injectable } from '@nestjs/common';
import { BaseRcaStep, RcaStepInput, RcaStepOutput } from './base-rca-step';
import { RcaStep } from '../../common/enums';
import { BmtService } from '../../bmt/bmt.service';

@Injectable()
export class FinanceAdjustmentDeltaStep extends BaseRcaStep {
  readonly stepOrder = 2;
  readonly stepName = RcaStep.FINANCE_ADJUSTMENT_DELTA;

  constructor(private bmtService: BmtService) {
    super();
  }

  async execute(input: RcaStepInput): Promise<RcaStepOutput> {
    const finAdj = await this.bmtService.getFinanceAdjustmentDelta({
      businessUnit: input.businessUnit,
      year: input.year,
      month: input.month,
    });

    // The delta represents how much finance adjustments shift BMT numbers
    // away from system-generated opex. A positive delta means finance
    // allocated more than system generated, inflating the BMT side.
    const amountExplained = finAdj.delta;
    const remainingGap = input.remainingGap - amountExplained;

    return {
      stepOrder: this.stepOrder,
      stepName: this.stepName,
      amountExplained,
      remainingGap,
      percentOfTotalGap: this.calcPercent(amountExplained, input.totalGap),
      breakdown: {
        totalOpexUsd: finAdj.totalOpexUsd,
        totalFinanceAllocated: finAdj.totalFinanceAllocated,
        totalFinanceAdjustment: finAdj.totalFinanceAdjustment,
        delta: finAdj.delta,
      },
    };
  }
}
