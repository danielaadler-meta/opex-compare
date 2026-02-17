import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { HiveFedService } from './hive-fed.service';
import { HiveBmtService } from './hive-bmt.service';
import { HiveComparisonService } from './hive-comparison.service';
import { HiveService } from './hive.service';
import { HiveQueryDto } from './dto/hive-query.dto';

@Controller('hive')
@UseGuards(JwtAuthGuard)
export class HiveController {
  constructor(
    private hiveService: HiveService,
    private hiveFedService: HiveFedService,
    private hiveBmtService: HiveBmtService,
    private hiveComparisonService: HiveComparisonService,
  ) {}

  @Get('fed/records')
  async getFedRecords(@Query() query: HiveQueryDto) {
    if (!this.hiveService.isConfigured()) {
      return { data: [], total: 0, message: 'Hive is not configured' };
    }
    return this.hiveFedService.getRecords(query);
  }

  @Get('fed/aggregated')
  async getFedAggregated(@Query() query: HiveQueryDto) {
    if (!this.hiveService.isConfigured()) {
      return { totalActualCost: 0, totalEstimatedCost: 0, recordCount: 0, message: 'Hive is not configured' };
    }
    return this.hiveFedService.getAggregated(query);
  }

  @Get('bmt/records')
  async getBmtRecords(@Query() query: HiveQueryDto) {
    if (!this.hiveService.isConfigured()) {
      return { data: [], total: 0, message: 'Hive is not configured' };
    }
    return this.hiveBmtService.getRecords(query);
  }

  @Get('bmt/aggregated')
  async getBmtAggregated(@Query() query: HiveQueryDto) {
    if (!this.hiveService.isConfigured()) {
      return { totalOpexUsd: 0, totalOpexFinanceAllocated: 0, totalFinanceAdjustment: 0, recordCount: 0, message: 'Hive is not configured' };
    }
    return this.hiveBmtService.getAggregated(query);
  }

  @Get('comparison/summary')
  async getComparisonSummary(@Query() query: HiveQueryDto) {
    if (!this.hiveService.isConfigured()) {
      return {
        fed: { totalActualCost: 0, totalEstimatedCost: 0, recordCount: 0 },
        bmt: { totalOpexUsd: 0, totalOpexFinanceAllocated: 0, totalFinanceAdjustment: 0, recordCount: 0 },
        delta: { absolute: 0, percentage: 0, direction: 'MATCH' },
        message: 'Hive is not configured',
      };
    }
    return this.hiveComparisonService.getSummary(query);
  }

  @Get('comparison/line-items')
  async getComparisonLineItems(@Query() query: HiveQueryDto) {
    if (!this.hiveService.isConfigured()) {
      return { data: [], total: 0, message: 'Hive is not configured' };
    }
    return this.hiveComparisonService.getLineItems(query);
  }

  @Get('filters/options')
  async getFilterOptions() {
    if (!this.hiveService.isConfigured()) {
      return {
        primaryBusinessUnit: [],
        vendor: [],
        expenseType: [],
        workCity: [],
        productPillar: [],
        message: 'Hive is not configured',
      };
    }
    return this.hiveComparisonService.getFilterOptions();
  }
}
