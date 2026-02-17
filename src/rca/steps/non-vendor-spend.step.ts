import { Injectable } from '@nestjs/common';
import { BaseRcaStep, RcaStepInput, RcaStepOutput } from './base-rca-step';
import { RcaStep } from '../../common/enums';
import { BmtService } from '../../bmt/bmt.service';

@Injectable()
export class NonVendorSpendStep extends BaseRcaStep {
  readonly stepOrder = 1;
  readonly stepName = RcaStep.NON_VENDOR_SPEND;

  constructor(private bmtService: BmtService) {
    super();
  }

  async execute(input: RcaStepInput): Promise<RcaStepOutput> {
    const nonVendor = await this.bmtService.getNonVendorSpend({
      businessUnit: input.businessUnit,
      year: input.year,
      month: input.month,
    });

    const amountExplained = nonVendor.totalNonVendorOpex;
    const remainingGap = input.remainingGap - amountExplained;

    return {
      stepOrder: this.stepOrder,
      stepName: this.stepName,
      amountExplained,
      remainingGap,
      percentOfTotalGap: this.calcPercent(amountExplained, input.totalGap),
      breakdown: {
        totalNonVendorOpex: nonVendor.totalNonVendorOpex,
        bySource: nonVendor.bySource,
        byEmployeeType: nonVendor.byEmployeeType,
        byForecastUniqueIdGroup: nonVendor.byForecastUniqueIdGroup,
      },
    };
  }
}
