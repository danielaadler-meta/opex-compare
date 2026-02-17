import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ComparisonService } from './comparison.service';
import { ComparisonQueryDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BusinessUnit } from '../common/enums';

@Controller('comparison')
@UseGuards(JwtAuthGuard)
export class ComparisonController {
  constructor(private comparisonService: ComparisonService) {}

  @Post('generate')
  async generate(@Body() query: ComparisonQueryDto, @Request() req) {
    return this.comparisonService.generateComparison(query, req.user?.id);
  }

  @Get('snapshots')
  async listSnapshots(
    @Query('businessUnit') businessUnit?: BusinessUnit,
    @Query('year') year?: number,
    @Query('month') month?: number,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.comparisonService.listSnapshots({
      businessUnit,
      year,
      month,
      status,
      page,
      limit,
    });
  }

  @Get('snapshots/:id')
  async getSnapshot(@Param('id', ParseUUIDPipe) id: string) {
    return this.comparisonService.getSnapshotById(id);
  }

  @Get('trend')
  async getTrend(
    @Query('businessUnit') businessUnit: BusinessUnit,
    @Query('startYear') startYear: number,
    @Query('startMonth') startMonth: number,
    @Query('endYear') endYear: number,
    @Query('endMonth') endMonth: number,
  ) {
    return this.comparisonService.getTrend({
      businessUnit,
      startYear,
      startMonth,
      endYear,
      endMonth,
    });
  }
}
