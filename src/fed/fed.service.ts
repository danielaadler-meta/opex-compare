import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FedOpexRecord } from './entities/fed-opex-record.entity';
import { FedIngestDto, FedQueryDto, FedAggregatedResponseDto } from './dto';
import { BusinessUnit } from '../common/enums';
import { parseCsv, snakeToCamel } from '../common/utils/csv-parser';

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

  async uploadCsv(
    buffer: Buffer,
    sourceSnapshotId: string,
  ): Promise<{ inserted: number; skipped: number; errors: string[] }> {
    const content = buffer.toString('utf-8');
    const rows = parseCsv(content);

    if (rows.length === 0) {
      throw new BadRequestException('CSV file is empty or has no data rows');
    }

    // Map CSV column names (snake_case from Daiquery) to entity fields
    const columnMap: Record<string, string> = {
      primary_business_unit: 'primaryBusinessUnit',
      opex_bucket: 'opexBucket',
      actual_cost_per_job: 'actualCostPerJob',
      capped_estimated_cost_per_job: 'cappedEstimatedCostPerJob',
      estimated_cost_per_job: 'cappedEstimatedCostPerJob',
      job_count: 'jobCount',
      total_actual_cost: 'totalActualCost',
      total_estimated_cost: 'totalEstimatedCost',
      total_opex: 'totalActualCost',
      invoice_year: 'invoiceYear',
      invoice_month: 'invoiceMonth',
      job_id: 'jobId',
      workflow_name: 'workflowName',
      work_city: 'workCity',
      product_pillar: 'productPillar',
      currency: 'currency',
      exchange_rate_to_usd: 'exchangeRateToUsd',
    };

    const entities: Partial<FedOpexRecord>[] = [];
    const errors: string[] = [];
    let skipped = 0;

    for (let i = 0; i < rows.length; i++) {
      const csvRow = rows[i];
      const mapped: Record<string, any> = {};

      // Map each CSV column to entity field
      for (const [csvCol, value] of Object.entries(csvRow)) {
        const normalizedCol = csvCol.toLowerCase().trim();
        const entityField = columnMap[normalizedCol] || snakeToCamel(normalizedCol);
        if (value !== '' && value !== null && value !== undefined) {
          mapped[entityField] = value;
        }
      }

      // Validate required fields
      if (!mapped.primaryBusinessUnit) {
        errors.push(`Row ${i + 2}: missing primary_business_unit`);
        skipped++;
        continue;
      }
      if (!mapped.invoiceYear || !mapped.invoiceMonth) {
        errors.push(`Row ${i + 2}: missing invoice_year or invoice_month`);
        skipped++;
        continue;
      }

      // Parse numeric fields
      const numericFields = [
        'actualCostPerJob', 'cappedEstimatedCostPerJob', 'jobCount',
        'totalActualCost', 'totalEstimatedCost', 'invoiceYear',
        'invoiceMonth', 'exchangeRateToUsd',
      ];
      for (const field of numericFields) {
        if (mapped[field] !== undefined) {
          mapped[field] = Number(mapped[field]) || 0;
        }
      }

      // If totalActualCost wasn't provided, compute it
      if (mapped.totalActualCost === undefined && mapped.actualCostPerJob !== undefined) {
        mapped.totalActualCost = (mapped.actualCostPerJob || 0) * (mapped.jobCount || 1);
      }
      if (mapped.totalEstimatedCost === undefined && mapped.cappedEstimatedCostPerJob !== undefined) {
        mapped.totalEstimatedCost = (mapped.cappedEstimatedCostPerJob || 0) * (mapped.jobCount || 1);
      }

      // Default opexBucket if not present
      if (!mapped.opexBucket) {
        mapped.opexBucket = 'UNKNOWN';
      }
      // Default jobCount if not present
      if (!mapped.jobCount) {
        mapped.jobCount = 1;
      }

      mapped.sourceSnapshotId = sourceSnapshotId;
      entities.push(mapped as Partial<FedOpexRecord>);
    }

    if (entities.length === 0) {
      return { inserted: 0, skipped, errors };
    }

    const saved = await this.fedRepo.save(
      entities.map((e) => this.fedRepo.create(e)),
      { chunk: 500 },
    );

    return { inserted: saved.length, skipped, errors: errors.slice(0, 20) };
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
