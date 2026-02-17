import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BmtForecastRecord } from './entities/bmt-forecast-record.entity';
import { BmtMiscMaster } from './entities/bmt-misc-master.entity';
import { BmtIngestDto, BmtQueryDto, BmtAggregatedResponseDto } from './dto';
import { BusinessUnit } from '../common/enums';

@Injectable()
export class BmtService {
  constructor(
    @InjectRepository(BmtForecastRecord)
    private bmtRepo: Repository<BmtForecastRecord>,
    @InjectRepository(BmtMiscMaster)
    private miscMasterRepo: Repository<BmtMiscMaster>,
  ) {}

  async ingestRecords(dto: BmtIngestDto): Promise<{ inserted: number }> {
    const entities = dto.records.map((r) =>
      this.bmtRepo.create({
        ...r,
        sourceSnapshotId: dto.sourceSnapshotId,
      }),
    );
    const saved = await this.bmtRepo.save(entities, { chunk: 500 });
    return { inserted: saved.length };
  }

  async findRecords(
    query: BmtQueryDto,
  ): Promise<{ data: BmtForecastRecord[]; total: number }> {
    const qb = this.bmtRepo
      .createQueryBuilder('bmt')
      .where('bmt.primaryBusinessUnit = :bu', { bu: query.businessUnit })
      .andWhere('bmt.forecastYear = :year', { year: query.year })
      .andWhere('bmt.forecastMonth = :month', { month: query.month });

    if (query.billableRole) {
      qb.andWhere('bmt.billableRole = :role', { role: query.billableRole });
    }
    if (query.source) {
      qb.andWhere('bmt.source = :source', { source: query.source });
    }
    if (query.program) {
      qb.andWhere('bmt.program = :program', { program: query.program });
    }
    if (query.employeeType) {
      qb.andWhere('bmt.employeeType = :et', { et: query.employeeType });
    }
    if (query.vendor) {
      qb.andWhere('bmt.vendor = :vendor', { vendor: query.vendor });
    }
    if (query.expenseType) {
      qb.andWhere('bmt.expenseType = :expenseType', { expenseType: query.expenseType });
    }
    if (query.workCity) {
      qb.andWhere('bmt.workCity = :workCity', { workCity: query.workCity });
    }
    if (query.productPillar) {
      qb.andWhere('bmt.productPillar = :productPillar', { productPillar: query.productPillar });
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
    groupBy?: 'billableRole' | 'program' | 'source';
  }): Promise<BmtAggregatedResponseDto> {
    const qb = this.bmtRepo
      .createQueryBuilder('bmt')
      .where('bmt.primaryBusinessUnit = :bu', { bu: params.businessUnit });

    if (params.endYear && params.endMonth) {
      qb.andWhere(
        '(bmt.forecastYear * 100 + bmt.forecastMonth) BETWEEN :start AND :end',
        {
          start: params.year * 100 + params.month,
          end: params.endYear * 100 + params.endMonth,
        },
      );
    } else {
      qb.andWhere('bmt.forecastYear = :year AND bmt.forecastMonth = :month', {
        year: params.year,
        month: params.month,
      });
    }

    const totals = await qb
      .select('SUM(bmt.opexUsd)', 'totalOpexUsd')
      .addSelect(
        'SUM(bmt.opexUsdFinanceActualsAllocated)',
        'totalOpexFinanceAllocated',
      )
      .addSelect('SUM(bmt.financeAdjustment)', 'totalFinanceAdjustment')
      .addSelect('COUNT(*)', 'recordCount')
      .getRawOne();

    const result: BmtAggregatedResponseDto = {
      businessUnit: params.businessUnit,
      periodYear: params.year,
      periodMonth: params.month,
      totalOpexUsd: Number(totals.totalOpexUsd) || 0,
      totalOpexFinanceAllocated:
        Number(totals.totalOpexFinanceAllocated) || 0,
      totalFinanceAdjustment: Number(totals.totalFinanceAdjustment) || 0,
      recordCount: Number(totals.recordCount) || 0,
    };

    if (params.groupBy) {
      const grouped = await this.bmtRepo
        .createQueryBuilder('bmt')
        .select(`bmt.${params.groupBy}`, 'groupKey')
        .addSelect('SUM(bmt.opexUsd)', 'opexUsd')
        .addSelect(
          'SUM(bmt.opexUsdFinanceActualsAllocated)',
          'opexFinanceAllocated',
        )
        .addSelect('SUM(bmt.financeAdjustment)', 'financeAdjustment')
        .where('bmt.primaryBusinessUnit = :bu', { bu: params.businessUnit })
        .andWhere('bmt.forecastYear = :year AND bmt.forecastMonth = :month', {
          year: params.year,
          month: params.month,
        })
        .groupBy(`bmt.${params.groupBy}`)
        .getRawMany();

      result.breakdown = grouped.map((g) => ({
        groupKey: g.groupKey,
        opexUsd: Number(g.opexUsd) || 0,
        opexFinanceAllocated: Number(g.opexFinanceAllocated) || 0,
        financeAdjustment: Number(g.financeAdjustment) || 0,
      }));
    }

    return result;
  }

  async getNonVendorSpend(params: {
    businessUnit: BusinessUnit;
    year: number;
    month: number;
  }): Promise<{
    totalNonVendorOpex: number;
    bySource: Record<string, number>;
    byEmployeeType: Record<string, number>;
    byForecastUniqueIdGroup: Record<string, number>;
  }> {
    const baseWhere = {
      bu: params.businessUnit,
      year: params.year,
      month: params.month,
    };

    const nonVendorCondition = `
      bmt.primaryBusinessUnit = :bu
      AND bmt.forecastYear = :year
      AND bmt.forecastMonth = :month
      AND (bmt.forecastUniqueIdGroup = 'MISC' OR bmt.employeeType NOT IN ('Vendor Onsite', 'Vendor Offsite', 'Vendor WFH'))
    `;

    const total = await this.bmtRepo
      .createQueryBuilder('bmt')
      .select('SUM(bmt.opexUsd)', 'total')
      .where(nonVendorCondition, baseWhere)
      .getRawOne();

    const bySource = await this.bmtRepo
      .createQueryBuilder('bmt')
      .select('bmt.source', 'key')
      .addSelect('SUM(bmt.opexUsd)', 'value')
      .where(nonVendorCondition, baseWhere)
      .groupBy('bmt.source')
      .getRawMany();

    const byEmployeeType = await this.bmtRepo
      .createQueryBuilder('bmt')
      .select('bmt.employeeType', 'key')
      .addSelect('SUM(bmt.opexUsd)', 'value')
      .where(nonVendorCondition, baseWhere)
      .groupBy('bmt.employeeType')
      .getRawMany();

    const byGroup = await this.bmtRepo
      .createQueryBuilder('bmt')
      .select('bmt.forecastUniqueIdGroup', 'key')
      .addSelect('SUM(bmt.opexUsd)', 'value')
      .where(nonVendorCondition, baseWhere)
      .groupBy('bmt.forecastUniqueIdGroup')
      .getRawMany();

    const toRecord = (rows: any[]) =>
      rows.reduce(
        (acc, r) => ({ ...acc, [r.key || 'NULL']: Number(r.value) || 0 }),
        {} as Record<string, number>,
      );

    return {
      totalNonVendorOpex: Number(total.total) || 0,
      bySource: toRecord(bySource),
      byEmployeeType: toRecord(byEmployeeType),
      byForecastUniqueIdGroup: toRecord(byGroup),
    };
  }

  async getFinanceAdjustmentDelta(params: {
    businessUnit: BusinessUnit;
    year: number;
    month: number;
  }): Promise<{
    totalOpexUsd: number;
    totalFinanceAllocated: number;
    totalFinanceAdjustment: number;
    delta: number;
  }> {
    const result = await this.bmtRepo
      .createQueryBuilder('bmt')
      .select('SUM(bmt.opexUsd)', 'totalOpexUsd')
      .addSelect(
        'SUM(bmt.opexUsdFinanceActualsAllocated)',
        'totalFinanceAllocated',
      )
      .addSelect('SUM(bmt.financeAdjustment)', 'totalFinanceAdjustment')
      .where('bmt.primaryBusinessUnit = :bu', { bu: params.businessUnit })
      .andWhere('bmt.forecastYear = :year', { year: params.year })
      .andWhere('bmt.forecastMonth = :month', { month: params.month })
      .getRawOne();

    const totalOpexUsd = Number(result.totalOpexUsd) || 0;
    const totalFinanceAllocated = Number(result.totalFinanceAllocated) || 0;
    const totalFinanceAdjustment = Number(result.totalFinanceAdjustment) || 0;

    return {
      totalOpexUsd,
      totalFinanceAllocated,
      totalFinanceAdjustment,
      delta: totalFinanceAllocated - totalOpexUsd,
    };
  }

  async getMiscBillableRoleSpend(params: {
    businessUnit: BusinessUnit;
    year: number;
    month: number;
  }): Promise<{
    totalMiscSpend: number;
    byBillableRole: Array<{
      billableRole: string;
      opexUsd: number;
      hasFedCounterpart: boolean;
    }>;
  }> {
    // Get all MISC-category billable roles
    const miscRecords = await this.bmtRepo
      .createQueryBuilder('bmt')
      .select('bmt.billableRole', 'billableRole')
      .addSelect('SUM(bmt.opexUsd)', 'opexUsd')
      .where('bmt.primaryBusinessUnit = :bu', { bu: params.businessUnit })
      .andWhere('bmt.forecastYear = :year', { year: params.year })
      .andWhere('bmt.forecastMonth = :month', { month: params.month })
      .andWhere(
        "bmt.billableRole NOT IN ('Agent', 'Operational SME', 'Quality & Policy Expert')",
      )
      .groupBy('bmt.billableRole')
      .getRawMany();

    // Check which have FED counterparts via misc master
    const result = await Promise.all(
      miscRecords.map(async (r) => {
        const master = await this.miscMasterRepo.findOne({
          where: { billableRole: r.billableRole },
        });
        return {
          billableRole: r.billableRole,
          opexUsd: Number(r.opexUsd) || 0,
          hasFedCounterpart: master?.hasFedCounterpart ?? false,
        };
      }),
    );

    const totalMiscSpend = result
      .filter((r) => !r.hasFedCounterpart)
      .reduce((sum, r) => sum + r.opexUsd, 0);

    return { totalMiscSpend, byBillableRole: result };
  }

  async getSpendByBusinessUnit(params: {
    year: number;
    month: number;
  }): Promise<Array<{ businessUnit: string; totalOpexUsd: number }>> {
    const rows = await this.bmtRepo
      .createQueryBuilder('bmt')
      .select('bmt.primaryBusinessUnit', 'businessUnit')
      .addSelect('SUM(bmt.opexUsd)', 'totalOpexUsd')
      .where('bmt.forecastYear = :year', { year: params.year })
      .andWhere('bmt.forecastMonth = :month', { month: params.month })
      .groupBy('bmt.primaryBusinessUnit')
      .getRawMany();

    return rows.map((r) => ({
      businessUnit: r.businessUnit,
      totalOpexUsd: Number(r.totalOpexUsd) || 0,
    }));
  }

  // MISC Master CRUD
  async upsertMiscMaster(
    data: Partial<BmtMiscMaster> & { forecastUniqueId: string },
  ): Promise<BmtMiscMaster> {
    const existing = await this.miscMasterRepo.findOne({
      where: { forecastUniqueId: data.forecastUniqueId },
    });
    if (existing) {
      Object.assign(existing, data);
      return this.miscMasterRepo.save(existing);
    }
    return this.miscMasterRepo.save(this.miscMasterRepo.create(data));
  }

  async listMiscMaster(): Promise<BmtMiscMaster[]> {
    return this.miscMasterRepo.find();
  }
}
