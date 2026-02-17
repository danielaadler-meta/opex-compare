import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { CreateWorkflowMappingDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BusinessUnit } from '../common/enums';

@Controller('workflows')
@UseGuards(JwtAuthGuard)
export class WorkflowController {
  constructor(private workflowService: WorkflowService) {}

  @Post('mappings')
  async upsertMapping(@Body() dto: CreateWorkflowMappingDto) {
    return this.workflowService.upsertMapping(dto);
  }

  @Get('mappings')
  async getMappings(@Query('businessUnit') bu: BusinessUnit) {
    return this.workflowService.getMappings(bu);
  }

  @Delete('mappings/:id')
  async deleteMapping(@Param('id', ParseUUIDPipe) id: string) {
    await this.workflowService.deleteMapping(id);
    return { deleted: true };
  }
}
