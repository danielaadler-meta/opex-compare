import { Injectable } from '@nestjs/common';
import { BaseRcaStep, RcaStepInput, RcaStepOutput } from './base-rca-step';
import { RcaStep, BusinessUnit } from '../../common/enums';
import { BmtService } from '../../bmt/bmt.service';
import { FedService } from '../../fed/fed.service';

@Injectable()
export class CrossBuAttributionStep extends BaseRcaStep {
  readonly stepOrder = 6;
  readonly stepName = RcaStep.CROSS_BU_ATTRIBUTION;

  constructor(
    private bmtService: BmtService,
    private fedService: FedService,
  ) {
    super();
  }

  async execute(input: RcaStepInput): Promise<RcaStepOutput> {
    const allBus = Object.values(BusinessUnit);

    // Get spend by BU from both sources
    const bmtByBu = await this.bmtService.getSpendByBusinessUnit({
      year: input.year,
      month: input.month,
    });

    const fedByBu = await Promise.all(
      allBus.map(async (bu) => {
        const agg = await this.fedService.getAggregatedSpend({
          businessUnit: bu,
          year: input.year,
          month: input.month,
        });
        return { businessUnit: bu, totalActualCost: agg.totalActualCost };
      }),
    );

    // Calculate leakage: difference in BU attribution between sources
    const leakage: Array<{
      businessUnit: string;
      bmtSpend: number;
      fedSpend: number;
      difference: number;
    }> = [];

    for (const bu of allBus) {
      const bmtRecord = bmtByBu.find((r) => r.businessUnit === bu);
      const fedRecord = fedByBu.find((r) => r.businessUnit === bu);
      const bmtSpend = bmtRecord?.totalOpexUsd || 0;
      const fedSpend = fedRecord?.totalActualCost || 0;
      leakage.push({
        businessUnit: bu,
        bmtSpend,
        fedSpend,
        difference: bmtSpend - fedSpend,
      });
    }

    // The leakage for the target BU
    const targetLeakage = leakage.find(
      (l) => l.businessUnit === input.businessUnit,
    );
    const amountExplained = targetLeakage
      ? targetLeakage.difference -
        (input.totalGap - input.remainingGap + input.remainingGap)
      : 0;

    // Simplified: attribute cross-BU leakage as 0 if we can't isolate it
    // from the already-explained gap
    const effectiveExplained = 0; // placeholder — requires deeper join logic
    const remainingGap = input.remainingGap - effectiveExplained;

    return {
      stepOrder: this.stepOrder,
      stepName: this.stepName,
      amountExplained: effectiveExplained,
      remainingGap,
      percentOfTotalGap: this.calcPercent(effectiveExplained, input.totalGap),
      breakdown: {
        note: 'Cross-BU attribution requires job-level demand-vs-supply matching. Populate with actual WFU data for precise leakage calculation.',
        allBuComparison: leakage,
      },
    };
  }
}
