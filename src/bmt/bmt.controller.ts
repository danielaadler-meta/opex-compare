import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { BmtService } from './bmt.service';
import { BmtIngestDto, BmtQueryDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('bmt')
@UseGuards(JwtAuthGuard)
export class BmtController {
  constructor(private bmtService: BmtService) {}

  @Post('ingest')
  async ingest(@Body() dto: BmtIngestDto) {
    return this.bmtService.ingestRecords(dto);
  }

  @Get('records')
  async getRecords(@Query() query: BmtQueryDto) {
    return this.bmtService.findRecords(query);
  }

  @Get('aggregated')
  async getAggregated(@Query() query: BmtQueryDto) {
    return this.bmtService.getAggregatedSpend({
      businessUnit: query.businessUnit,
      year: query.year,
      month: query.month,
      endYear: query.endYear,
      endMonth: query.endMonth,
    });
  }

  @Get('aggregated/by-role')
  async getAggregatedByRole(@Query() query: BmtQueryDto) {
    return this.bmtService.getAggregatedSpend({
      businessUnit: query.businessUnit,
      year: query.year,
      month: query.month,
      groupBy: 'billableRole',
    });
  }

  @Get('aggregated/by-source')
  async getAggregatedBySource(@Query() query: BmtQueryDto) {
    return this.bmtService.getAggregatedSpend({
      businessUnit: query.businessUnit,
      year: query.year,
      month: query.month,
      groupBy: 'source',
    });
  }

  @Get('non-vendor-spend')
  async getNonVendorSpend(@Query() query: BmtQueryDto) {
    return this.bmtService.getNonVendorSpend({
      businessUnit: query.businessUnit,
      year: query.year,
      month: query.month,
    });
  }

  @Get('finance-adjustment-delta')
  async getFinanceAdjustmentDelta(@Query() query: BmtQueryDto) {
    return this.bmtService.getFinanceAdjustmentDelta({
      businessUnit: query.businessUnit,
      year: query.year,
      month: query.month,
    });
  }

  @Get('misc-billable-role')
  async getMiscBillableRole(@Query() query: BmtQueryDto) {
    return this.bmtService.getMiscBillableRoleSpend({
      businessUnit: query.businessUnit,
      year: query.year,
      month: query.month,
    });
  }

  @Post('misc-master')
  async upsertMiscMaster(@Body() dto: any) {
    return this.bmtService.upsertMiscMaster(dto);
  }

  @Get('misc-master')
  async listMiscMaster() {
    return this.bmtService.listMiscMaster();
  }
}
