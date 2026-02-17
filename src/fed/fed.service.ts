import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FedOpexRecord } from './entities/fed-opex-record.entity';
import { FedIngestDto, FedQueryDto, FedAggregatedResponseDto } from './dto';
import { BusinessUnit } from '../common/enums';

@Injectable()
export class FedService {
  constructor(
    @InjectRepository(FedOpexRecord)
    private fedRepo: Repository<FedOpexRecord>,
  ) {}

  async ingestRecords(dto: FedIngestDto): Promise<{ inserted: number }> {
    const entities = dto.records.map((r) => {
      const actualTotal = (r.actualCostPerJob || 0) * r.jobCount;
      const estimatedTotal = (r.cappedEstimatedCostPerJob || 0) * r.jobCount;
      return this.fedRepo.create({
        ...r,
        totalActualCost: actualTotal,
        totalEstimatedCost: estimatedTotal,
        sourceSnapshotId: dto.sourceSnapshotId,
      });
    });

    const saved = await this.fedRepo.save(entities, { chunk: 500 });
    return { inserted: saved.length };
  }

  async findRecords(
    query: FedQueryDto,
  ): Promise<{ data: FedOpexRecord[]; total: number }> {
    const qb = this.fedRepo
      .createQueryBuilder('fed')
      .where('fed.primaryBusinessUnit = :bu', { bu: query.businessUnit })
      .andWhere('fed.invoiceYear = :year', { year: query.year })
      .andWhere('fed.invoiceMonth = :month', { month: query.month });

    if (query.opexBucket) {
      qb.andWhere('fed.opexBucket = :bucket', { bucket: query.opexBucket });
    }
    if (query.workflowName) {
      qb.andWhere('fed.workflowName = :wf', { wf: query.workflowName });
    }
    if (query.workCity) {
      qb.andWhere('fed.workCity = :workCity', { workCity: query.workCity });
    }
    if (query.productPillar) {
      qb.andWhere('fed.productPillar = :productPillar', { productPillar: query.productPillar });
    }

    const total = await qb.getCount();
    const data = await qb
      .skip(((query.page || 1) - 1) * (query.limit || 50))
      .take(query.limit || 50)
      .getMany();

    return { data, total };
  }

  async getAggregatedSpend(params: {
    businessUnit: BusinessUnit;
    year: number;
    month: number;
    endYear?: number;
    endMonth?: number;
    groupBy?: 'opexBucket' | 'workflowName';
  }): Promise<FedAggregatedResponseDto> {
    const qb = this.fedRepo
      .createQueryBuilder('fed')
      .where('fed.primaryBusinessUnit = :bu', { bu: params.businessUnit });

    if (params.endYear && params.endMonth) {
      qb.andWhere(
        '(fed.invoiceYear * 100 + fed.invoiceMonth) BETWEEN :start AND :end',
        {
          start: params.year * 100 + params.month,
          end: params.endYear * 100 + params.endMonth,
        },
      );
    } else {
      qb.andWhere('fed.invoiceYear = :year AND fed.invoiceMonth = :month', {
        year: params.year,
        month: params.month,
      });
    }

    const totals = await qb
      .select('SUM(fed.totalActualCost)', 'totalActualCost')
      .addSelect('SUM(fed.totalEstimatedCost)', 'totalEstimatedCost')
      .addSelect('COUNT(*)', 'recordCount')
      .getRawOne();

    const result: FedAggregatedResponseDto = {
      businessUnit: params.businessUnit,
      periodYear: params.year,
      periodMonth: params.month,
      totalActualCost: Number(totals.totalActualCost) || 0,
      totalEstimatedCost: Number(totals.totalEstimatedCost) || 0,
      recordCount: Number(totals.recordCount) || 0,
    };

    if (params.groupBy) {
      const grouped = await this.fedRepo
        .createQueryBuilder('fed')
        .select(`fed.${params.groupBy}`, 'groupKey')
        .addSelect('SUM(fed.totalActualCost)', 'totalActualCost')
        .addSelect('SUM(fed.totalEstimatedCost)', 'totalEstimatedCost')
        .addSelect('SUM(fed.jobCount)', 'jobCount')
        .where('fed.primaryBusinessUnit = :bu', { bu: params.businessUnit })
        .andWhere('fed.invoiceYear = :year AND fed.invoiceMonth = :month', {
          year: params.year,
          month: params.month,
        })
        .groupBy(`fed.${params.groupBy}`)
        .getRawMany();

      result.byOpexBucket = grouped.map((g) => ({
        opexBucket: g.groupKey,
        totalActualCost: Number(g.totalActualCost) || 0,
        totalEstimatedCost: Number(g.totalEstimatedCost) || 0,
        jobCount: Number(g.jobCount) || 0,
      }));
    }

    return result;
  }

  async getEstimatedVsActualSplit(params: {
    businessUnit: BusinessUnit;
    year: number;
    month: number;
  }): Promise<{
    totalActual: number;
    totalEstimated: number;
    jobsWithActuals: number;
    jobsEstimatedOnly: number;
    pctEstimated: number;
  }> {
    const qb = this.fedRepo
      .createQueryBuilder('fed')
      .where('fed.primaryBusinessUnit = :bu', { bu: params.businessUnit })
      .andWhere('fed.invoiceYear = :year', { year: params.year })
      .andWhere('fed.invoiceMonth = :month', { month: params.month });

    const result = await qb
      .select('SUM(fed.totalActualCost)', 'totalActual')
      .addSelect('SUM(fed.totalEstimatedCost)', 'totalEstimated')
      .addSelect(
        'SUM(CASE WHEN fed.actualCostPerJob IS NOT NULL THEN fed.jobCount ELSE 0 END)',
        'jobsWithActuals',
      )
      .addSelect(
        'SUM(CASE WHEN fed.actualCostPerJob IS NULL THEN fed.jobCount ELSE 0 END)',
        'jobsEstimatedOnly',
      )
      .getRawOne();

    const jobsWithActuals = Number(result.jobsWithActuals) || 0;
    const jobsEstimatedOnly = Number(result.jobsEstimatedOnly) || 0;
    const totalJobs = jobsWithActuals + jobsEstimatedOnly;

    return {
      totalActual: Number(result.totalActual) || 0,
      totalEstimated: Number(result.totalEstimated) || 0,
      jobsWithActuals,
      jobsEstimatedOnly,
      pctEstimated: totalJobs > 0 ? (jobsEstimatedOnly / totalJobs) * 100 : 0,
    };
  }

  async getNonUsdRecords(params: {
    businessUnit: BusinessUnit;
    year: number;
    month: number;
  }): Promise<FedOpexRecord[]> {
    return this.fedRepo
      .createQueryBuilder('fed')
      .where('fed.primaryBusinessUnit = :bu', { bu: params.businessUnit })
      .andWhere('fed.invoiceYear = :year', { year: params.year })
      .andWhere('fed.invoiceMonth = :month', { month: params.month })
      .andWhere('fed.currency != :usd', { usd: 'USD' })
      .getMany();
  }
}
