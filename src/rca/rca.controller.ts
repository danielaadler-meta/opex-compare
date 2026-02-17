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
  ParseIntPipe,
} from '@nestjs/common';
import { RcaService } from './rca.service';
import { RcaQueryDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BusinessUnit } from '../common/enums';

@Controller('rca')
@UseGuards(JwtAuthGuard)
export class RcaController {
  constructor(private rcaService: RcaService) {}

  @Post('run')
  async runWaterfall(@Body() query: RcaQueryDto, @Request() req) {
    return this.rcaService.runWaterfall(query, req.user?.id);
  }

  @Get('runs')
  async listRuns(
    @Query('businessUnit') businessUnit?: BusinessUnit,
    @Query('year') year?: number,
    @Query('month') month?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.rcaService.listRcaRuns({
      businessUnit,
      year,
      month,
      page,
      limit,
    });
  }

  @Get('runs/:id')
  async getRun(@Param('id', ParseUUIDPipe) id: string) {
    return this.rcaService.getRcaRunById(id);
  }

  @Get('runs/:id/steps/:stepOrder')
  async getStepDetail(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('stepOrder', ParseIntPipe) stepOrder: number,
  ) {
    return this.rcaService.getStepDetail(id, stepOrder);
  }
}
