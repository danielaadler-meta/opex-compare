import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowMapping } from './entities/workflow-mapping.entity';
import { CreateWorkflowMappingDto } from './dto';
import { BusinessUnit } from '../common/enums';

@Injectable()
export class WorkflowService {
  constructor(
    @InjectRepository(WorkflowMapping)
    private mappingRepo: Repository<WorkflowMapping>,
  ) {}

  async upsertMapping(dto: CreateWorkflowMappingDto): Promise<WorkflowMapping> {
    const existing = await this.mappingRepo.findOne({
      where: {
        businessUnit: dto.businessUnit,
        fedOpexBucket: dto.fedOpexBucket,
      },
    });

    if (existing) {
      Object.assign(existing, dto);
      return this.mappingRepo.save(existing);
    }

    return this.mappingRepo.save(this.mappingRepo.create(dto));
  }

  async getMappings(businessUnit: BusinessUnit): Promise<WorkflowMapping[]> {
    return this.mappingRepo.find({
      where: { businessUnit, isActive: true },
    });
  }

  async resolveWorkflowFromFed(
    opexBucket: string,
    businessUnit: BusinessUnit,
  ): Promise<string | null> {
    const mapping = await this.mappingRepo.findOne({
      where: { fedOpexBucket: opexBucket, businessUnit, isActive: true },
    });
    return mapping?.workflowName ?? null;
  }

  async resolveWorkflowFromBmt(
    program: string,
    project: string,
    businessUnit: BusinessUnit,
  ): Promise<string | null> {
    const mapping = await this.mappingRepo.findOne({
      where: { bmtProgram: program, bmtProject: project, businessUnit, isActive: true },
    });
    return mapping?.workflowName ?? null;
  }

  async deleteMapping(id: string): Promise<void> {
    await this.mappingRepo.delete(id);
  }
}
