import { Injectable } from '@nestjs/common';
import { BaseRcaStep, RcaStepInput, RcaStepOutput } from './base-rca-step';
import { RcaStep } from '../../common/enums';
import { BmtService } from '../../bmt/bmt.service';

@Injectable()
export class MiscBillableRoleStep extends BaseRcaStep {
  readonly stepOrder = 3;
  readonly stepName = RcaStep.MISC_BILLABLE_ROLE;

  constructor(private bmtService: BmtService) {
    super();
  }

  async execute(input: RcaStepInput): Promise<RcaStepOutput> {
    const miscData = await this.bmtService.getMiscBillableRoleSpend({
      businessUnit: input.businessUnit,
      year: input.year,
      month: input.month,
    });

    const amountExplained = miscData.totalMiscSpend;
    const remainingGap = input.remainingGap - amountExplained;

    return {
      stepOrder: this.stepOrder,
      stepName: this.stepName,
      amountExplained,
      remainingGap,
      percentOfTotalGap: this.calcPercent(amountExplained, input.totalGap),
      breakdown: {
        totalMiscSpend: miscData.totalMiscSpend,
        byBillableRole: miscData.byBillableRole,
      },
    };
  }
}
