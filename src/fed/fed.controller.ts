import { Controller, Get, Post, Body, Query, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FedService } from './fed.service';
import { FedIngestDto, FedQueryDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('fed')
@UseGuards(JwtAuthGuard)
export class FedController {
  constructor(private fedService: FedService) {}

  @Post('ingest')
  async ingest(@Body() dto: FedIngestDto) {
    return this.fedService.ingestRecords(dto);
  }

  @Post('upload-csv')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCsv(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (!file.originalname.endsWith('.csv')) {
      throw new BadRequestException('File must be a CSV');
    }
    const snapshotId = `csv-upload-${Date.now()}`;
    return this.fedService.uploadCsv(file.buffer, snapshotId);
  }

  @Get('records')
  async getRecords(@Query() query: FedQueryDto) {
    return this.fedService.findRecords(query);
  }

  @Get('aggregated')
  async getAggregated(@Query() query: FedQueryDto) {
    return this.fedService.getAggregatedSpend({
      businessUnit: query.businessUnit,
      year: query.year,
      month: query.month,
      endYear: query.endYear,
      endMonth: query.endMonth,
    });
  }

  @Get('aggregated/by-bucket')
  async getAggregatedByBucket(@Query() query: FedQueryDto) {
    return this.fedService.getAggregatedSpend({
      businessUnit: query.businessUnit,
      year: query.year,
      month: query.month,
      groupBy: 'opexBucket',
    });
  }

  @Get('aggregated/by-workflow')
  async getAggregatedByWorkflow(@Query() query: FedQueryDto) {
    return this.fedService.getAggregatedSpend({
      businessUnit: query.businessUnit,
      year: query.year,
      month: query.month,
      groupBy: 'workflowName',
    });
  }

  @Get('estimated-vs-actual')
  async getEstimatedVsActual(@Query() query: FedQueryDto) {
    return this.fedService.getEstimatedVsActualSplit({
      businessUnit: query.businessUnit,
      year: query.year,
      month: query.month,
    });
  }
}
