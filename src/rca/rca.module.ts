import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RcaRun } from './entities/rca-run.entity';
import { RcaStepResult } from './entities/rca-step-result.entity';
import { RcaService } from './rca.service';
import { RcaController } from './rca.controller';
import { ComparisonModule } from '../comparison/comparison.module';
import { FedModule } from '../fed/fed.module';
import { BmtModule } from '../bmt/bmt.module';
import { NonVendorSpendStep } from './steps/non-vendor-spend.step';
import { FinanceAdjustmentDeltaStep } from './steps/finance-adjustment-delta.step';
import { MiscBillableRoleStep } from './steps/misc-billable-role.step';
import { ResidualGapStep } from './steps/residual-gap.step';
import { FedEstimatedVsActualStep } from './steps/fed-estimated-vs-actual.step';
import { CrossBuAttributionStep } from './steps/cross-bu-attribution.step';
import { ExchangeRateImpactStep } from './steps/exchange-rate-impact.step';

@Module({
  imports: [
    TypeOrmModule.forFeature([RcaRun, RcaStepResult]),
    ComparisonModule,
    FedModule,
    BmtModule,
  ],
  controllers: [RcaController],
  providers: [
    RcaService,
    NonVendorSpendStep,
    FinanceAdjustmentDeltaStep,
    MiscBillableRoleStep,
    ResidualGapStep,
    FedEstimatedVsActualStep,
    CrossBuAttributionStep,
    ExchangeRateImpactStep,
  ],
  exports: [RcaService],
})
export class RcaModule {}
