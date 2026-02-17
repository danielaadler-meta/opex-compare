import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComparisonSnapshot } from './entities/comparison-snapshot.entity';
import { ComparisonQueryDto, ComparisonResultDto } from './dto';
import { FedService } from '../fed/fed.service';
import { BmtService } from '../bmt/bmt.service';
import { BusinessUnit } from '../common/enums';

@Injectable()
export class ComparisonService {
  constructor(
    private fedService: FedService,
    private bmtService: BmtService,
    @InjectRepository(ComparisonSnapshot)
    private snapshotRepo: Repository<ComparisonSnapshot>,
  ) {}

  async generateComparison(
    query: ComparisonQueryDto,
    userId?: string,
  ): Promise<ComparisonResultDto> {
    const [fedData, bmtData] = await Promise.all([
      this.fedService.getAggregatedSpend({
        businessUnit: query.businessUnit,
        year: query.year,
        month: query.month,
      }),
      this.bmtService.getAggregatedSpend({
        businessUnit: query.businessUnit,
        year: query.year,
        month: query.month,
      }),
    ]);

    const absoluteDelta = bmtData.totalOpexUsd - fedData.totalActualCost;
    const percentageDelta =
      fedData.totalActualCost !== 0
        ? (absoluteDelta / fedData.totalActualCost) * 100
        : 0;

    // Supersede previous snapshots for same BU + period
    await this.snapshotRepo.update(
      {
        businessUnit: query.businessUnit,
        periodYear: query.year,
        periodMonth: query.month,
        status: 'CURRENT',
      },
      { status: 'SUPERSEDED' },
    );

    const snapshot = this.snapshotRepo.create({
      businessUnit: query.businessUnit,
      periodYear: query.year,
      periodMonth: query.month,
      fedTotalActualCost: fedData.totalActualCost,
      fedTotalEstimatedCost: fedData.totalEstimatedCost,
      bmtTotalOpexUsd: bmtData.totalOpexUsd,
      bmtTotalOpexFinanceAllocated: bmtData.totalOpexFinanceAllocated,
      absoluteDelta,
      percentageDelta,
      status: 'CURRENT',
      createdByUserId: userId,
    });

    const saved = await this.snapshotRepo.save(snapshot);

    return {
      snapshotId: saved.id,
      businessUnit: query.businessUnit,
      period: { year: query.year, month: query.month },
      fed: {
        totalActualCost: fedData.totalActualCost,
        totalEstimatedCost: fedData.totalEstimatedCost,
      },
      bmt: {
        totalOpexUsd: bmtData.totalOpexUsd,
        totalOpexFinanceAllocated: bmtData.totalOpexFinanceAllocated,
      },
      delta: {
        absolute: absoluteDelta,
        percentage: percentageDelta,
        direction:
          absoluteDelta > 0
            ? 'BMT_HIGHER'
            : absoluteDelta < 0
              ? 'FED_HIGHER'
              : 'MATCH',
      },
    };
  }

  async getSnapshotById(id: string): Promise<ComparisonSnapshot> {
    return this.snapshotRepo.findOneOrFail({ where: { id } });
  }

  async listSnapshots(params: {
    businessUnit?: BusinessUnit;
    year?: number;
    month?: number;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: ComparisonSnapshot[]; total: number }> {
    const qb = this.snapshotRepo.createQueryBuilder('s');

    if (params.businessUnit) {
      qb.andWhere('s.businessUnit = :bu', { bu: params.businessUnit });
    }
    if (params.year) {
      qb.andWhere('s.periodYear = :year', { year: params.year });
    }
    if (params.month) {
      qb.andWhere('s.periodMonth = :month', { month: params.month });
    }
    if (params.status) {
      qb.andWhere('s.status = :status', { status: params.status });
    }

    qb.orderBy('s.createdAt', 'DESC');

    const total = await qb.getCount();
    const page = params.page || 1;
    const limit = params.limit || 50;
    const data = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { data, total };
  }

  async getTrend(params: {
    businessUnit: BusinessUnit;
    startYear: number;
    startMonth: number;
    endYear: number;
    endMonth: number;
  }): Promise<ComparisonResultDto[]> {
    const results: ComparisonResultDto[] = [];
    let year = params.startYear;
    let month = params.startMonth;

    while (
      year < params.endYear ||
      (year === params.endYear && month <= params.endMonth)
    ) {
      const comparison = await this.generateComparison({
        businessUnit: params.businessUnit,
        year,
        month,
      });
      results.push(comparison);

      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
    }

    return results;
  }
}
