import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RcaRun } from './entities/rca-run.entity';
import { RcaStepResult } from './entities/rca-step-result.entity';
import { RcaQueryDto, RcaWaterfallResultDto, RcaStepDetailDto } from './dto';
import { ComparisonService } from '../comparison/comparison.service';
import { BaseRcaStep } from './steps/base-rca-step';
import { NonVendorSpendStep } from './steps/non-vendor-spend.step';
import { FinanceAdjustmentDeltaStep } from './steps/finance-adjustment-delta.step';
import { MiscBillableRoleStep } from './steps/misc-billable-role.step';
import { ResidualGapStep } from './steps/residual-gap.step';
import { FedEstimatedVsActualStep } from './steps/fed-estimated-vs-actual.step';
import { CrossBuAttributionStep } from './steps/cross-bu-attribution.step';
import { ExchangeRateImpactStep } from './steps/exchange-rate-impact.step';

@Injectable()
export class RcaService {
  private readonly logger = new Logger(RcaService.name);
  private readonly steps: BaseRcaStep[];

  constructor(
    @InjectRepository(RcaRun)
    private rcaRunRepo: Repository<RcaRun>,
    @InjectRepository(RcaStepResult)
    private stepResultRepo: Repository<RcaStepResult>,
    private comparisonService: ComparisonService,
    nonVendorStep: NonVendorSpendStep,
    financeAdjStep: FinanceAdjustmentDeltaStep,
    miscBillableStep: MiscBillableRoleStep,
    residualGapStep: ResidualGapStep,
    estimatedVsActualStep: FedEstimatedVsActualStep,
    crossBuStep: CrossBuAttributionStep,
    exchangeRateStep: ExchangeRateImpactStep,
  ) {
    // Steps execute in this order
    this.steps = [
      nonVendorStep,
      financeAdjStep,
      miscBillableStep,
      residualGapStep,
      estimatedVsActualStep,
      crossBuStep,
      exchangeRateStep,
    ];
  }

  async runWaterfall(
    query: RcaQueryDto,
    userId?: string,
  ): Promise<RcaWaterfallResultDto> {
    // 1. Generate comparison to get the total gap
    const comparison = await this.comparisonService.generateComparison({
      businessUnit: query.businessUnit,
      year: query.year,
      month: query.month,
    });

    const totalGap = comparison.delta.absolute;

    // 2. Create RCA run record
    const rcaRun = this.rcaRunRepo.create({
      businessUnit: query.businessUnit,
      periodYear: query.year,
      periodMonth: query.month,
      workflowName: query.workflowName,
      totalGapBeforeRca: totalGap,
      status: 'RUNNING',
      triggeredByUserId: userId,
    });
    await this.rcaRunRepo.save(rcaRun);

    // 3. Execute each step sequentially
    let remainingGap = totalGap;
    const stepResults: RcaStepDetailDto[] = [];

    for (const step of this.steps) {
      try {
        this.logger.log(
          `Executing RCA step ${step.stepOrder}: ${step.stepName}`,
        );

        const output = await step.execute({
          businessUnit: query.businessUnit,
          year: query.year,
          month: query.month,
          workflowName: query.workflowName,
          remainingGap,
          totalGap,
        });

        // Persist step result
        const stepResult = this.stepResultRepo.create({
          rcaRunId: rcaRun.id,
          stepOrder: output.stepOrder,
          stepName: output.stepName,
          gapInputAmount: remainingGap,
          amountExplained: output.amountExplained,
          gapOutputAmount: output.remainingGap,
          percentOfTotalGap: output.percentOfTotalGap,
          breakdown: output.breakdown,
        });
        await this.stepResultRepo.save(stepResult);

        remainingGap = output.remainingGap;

        stepResults.push({
          stepOrder: output.stepOrder,
          stepName: output.stepName,
          gapInput: stepResult.gapInputAmount,
          amountExplained: output.amountExplained,
          gapOutput: output.remainingGap,
          percentOfTotalGap: output.percentOfTotalGap,
          breakdown: output.breakdown,
        });
      } catch (error) {
        this.logger.error(
          `RCA step ${step.stepOrder} failed: ${error.message}`,
        );
        // Continue with remaining steps even if one fails
        stepResults.push({
          stepOrder: step.stepOrder,
          stepName: step.stepName,
          gapInput: remainingGap,
          amountExplained: 0,
          gapOutput: remainingGap,
          percentOfTotalGap: 0,
          breakdown: { error: error.message },
        });
      }
    }

    // 4. Finalize run
    const totalExplained = totalGap - remainingGap;
    rcaRun.totalGapExplained = totalExplained;
    rcaRun.residualUnexplained = remainingGap;
    rcaRun.status = 'COMPLETED';
    await this.rcaRunRepo.save(rcaRun);

    return {
      rcaRunId: rcaRun.id,
      businessUnit: query.businessUnit,
      period: { year: query.year, month: query.month },
      totalGap,
      totalExplained,
      residualUnexplained: remainingGap,
      percentExplained:
        totalGap !== 0 ? (totalExplained / Math.abs(totalGap)) * 100 : 0,
      steps: stepResults,
    };
  }

  async getRcaRunById(id: string): Promise<RcaWaterfallResultDto> {
    const run = await this.rcaRunRepo.findOneOrFail({
      where: { id },
      relations: ['steps'],
    });

    const steps = (run.steps || [])
      .sort((a, b) => a.stepOrder - b.stepOrder)
      .map((s) => ({
        stepOrder: s.stepOrder,
        stepName: s.stepName,
        gapInput: Number(s.gapInputAmount),
        amountExplained: Number(s.amountExplained),
        gapOutput: Number(s.gapOutputAmount),
        percentOfTotalGap: Number(s.percentOfTotalGap),
        breakdown: s.breakdown,
      }));

    return {
      rcaRunId: run.id,
      businessUnit: run.businessUnit,
      period: { year: run.periodYear, month: run.periodMonth },
      totalGap: Number(run.totalGapBeforeRca),
      totalExplained: Number(run.totalGapExplained),
      residualUnexplained: Number(run.residualUnexplained),
      percentExplained:
        Number(run.totalGapBeforeRca) !== 0
          ? (Number(run.totalGapExplained) /
              Math.abs(Number(run.totalGapBeforeRca))) *
            100
          : 0,
      steps,
    };
  }

  async listRcaRuns(params: {
    businessUnit?: string;
    year?: number;
    month?: number;
    page?: number;
    limit?: number;
  }): Promise<{ data: RcaRun[]; total: number }> {
    const qb = this.rcaRunRepo.createQueryBuilder('r');

    if (params.businessUnit) {
      qb.andWhere('r.businessUnit = :bu', { bu: params.businessUnit });
    }
    if (params.year) {
      qb.andWhere('r.periodYear = :year', { year: params.year });
    }
    if (params.month) {
      qb.andWhere('r.periodMonth = :month', { month: params.month });
    }

    qb.orderBy('r.createdAt', 'DESC');

    const total = await qb.getCount();
    const page = params.page || 1;
    const limit = params.limit || 50;
    const data = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { data, total };
  }

  async getStepDetail(
    rcaRunId: string,
    stepOrder: number,
  ): Promise<RcaStepDetailDto> {
    const step = await this.stepResultRepo.findOneOrFail({
      where: { rcaRunId, stepOrder },
    });

    return {
      stepOrder: step.stepOrder,
      stepName: step.stepName,
      gapInput: Number(step.gapInputAmount),
      amountExplained: Number(step.amountExplained),
      gapOutput: Number(step.gapOutputAmount),
      percentOfTotalGap: Number(step.percentOfTotalGap),
      breakdown: step.breakdown,
    };
  }
}
