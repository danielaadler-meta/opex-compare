import { Injectable } from '@nestjs/common';
import { BaseRcaStep, RcaStepInput, RcaStepOutput } from './base-rca-step';
import { RcaStep } from '../../common/enums';
import { FedService } from '../../fed/fed.service';

@Injectable()
export class ExchangeRateImpactStep extends BaseRcaStep {
  readonly stepOrder = 7;
  readonly stepName = RcaStep.EXCHANGE_RATE_IMPACT;

  constructor(private fedService: FedService) {
    super();
  }

  async execute(input: RcaStepInput): Promise<RcaStepOutput> {
    const nonUsdRecords = await this.fedService.getNonUsdRecords({
      businessUnit: input.businessUnit,
      year: input.year,
      month: input.month,
    });

    // Aggregate FX impact by currency
    const byCurrency: Record<
      string,
      { totalCost: number; fxImpact: number; recordCount: number }
    > = {};

    let totalFxImpact = 0;

    for (const record of nonUsdRecords) {
      const currency = record.currency || 'UNKNOWN';
      if (!byCurrency[currency]) {
        byCurrency[currency] = { totalCost: 0, fxImpact: 0, recordCount: 0 };
      }

      const cost = Number(record.totalActualCost) || Number(record.totalEstimatedCost) || 0;
      const rate = Number(record.exchangeRateToUsd) || 1;

      // FX impact: difference between cost at recorded rate vs rate = 1
      // This is a simplification; real impact needs BMT's fixed monthly rate
      const impact = cost * (1 - rate);

      byCurrency[currency].totalCost += cost;
      byCurrency[currency].fxImpact += impact;
      byCurrency[currency].recordCount += 1;
      totalFxImpact += impact;
    }

    const amountExplained = Math.abs(totalFxImpact);
    const remainingGap = input.remainingGap - amountExplained;

    return {
      stepOrder: this.stepOrder,
      stepName: this.stepName,
      amountExplained,
      remainingGap,
      percentOfTotalGap: this.calcPercent(amountExplained, input.totalGap),
      breakdown: {
        totalFxImpact,
        nonUsdRecordCount: nonUsdRecords.length,
        byCurrency,
        note: 'FX impact is approximated. For precise calculation, compare FED daily rates against BMT fixed monthly Anaplan rates.',
      },
    };
  }
}
