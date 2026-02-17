import { Injectable, Logger } from '@nestjs/common';
import { HiveService } from './hive.service';
import { HiveFedService } from './hive-fed.service';
import { HiveBmtService } from './hive-bmt.service';
import { HiveQueryDto } from './dto/hive-query.dto';

@Injectable()
export class HiveComparisonService {
  private readonly logger = new Logger(HiveComparisonService.name);
  private readonly FED_TABLE = 'dim_opex_reporting_buckets_daily';
  private readonly BMT_TABLE = 'fct_ap_ce_billing_forecast_live';

  constructor(
    private hiveService: HiveService,
    private hiveFedService: HiveFedService,
    private hiveBmtService: HiveBmtService,
  ) {}

  async getSummary(query: HiveQueryDto): Promise<any> {
    const [fedAgg, bmtAgg] = await Promise.all([
      this.hiveFedService.getAggregated(query),
      this.hiveBmtService.getAggregated(query),
    ]);

    const fedTotal = fedAgg.totalActualCost;
    const bmtTotal = bmtAgg.totalOpexUsd;
    const absoluteDelta = bmtTotal - fedTotal;
    const percentageDelta = fedTotal !== 0 ? (absoluteDelta / fedTotal) * 100 : 0;

    let direction: string;
    if (Math.abs(percentageDelta) < 0.01) {
      direction = 'MATCH';
    } else if (absoluteDelta > 0) {
      direction = 'BMT_HIGHER';
    } else {
      direction = 'FED_HIGHER';
    }

    return {
      fed: {
        totalActualCost: fedTotal,
        totalEstimatedCost: fedAgg.totalEstimatedCost,
        recordCount: fedAgg.recordCount,
      },
      bmt: {
        totalOpexUsd: bmtTotal,
        totalOpexFinanceAllocated: bmtAgg.totalOpexFinanceAllocated,
        totalFinanceAdjustment: bmtAgg.totalFinanceAdjustment,
        recordCount: bmtAgg.recordCount,
      },
      delta: {
        absolute: absoluteDelta,
        percentage: percentageDelta,
        direction,
      },
    };
  }

  async getLineItems(query: HiveQueryDto): Promise<{ data: any[]; total: number }> {
    const buildDateCondition = (alias: string, yearCol: string, monthCol: string) => {
      if (query.endYear && query.endMonth) {
        return `(${alias}.${yearCol} * 100 + ${alias}.${monthCol}) BETWEEN ${query.year * 100 + query.month} AND ${query.endYear * 100 + query.endMonth}`;
      }
      return `${alias}.${yearCol} = ${query.year} AND ${alias}.${monthCol} = ${query.month}`;
    };

    const buildFilterConditions = (alias: string) => {
      const conds: string[] = [];
      if (query.primaryBusinessUnit) {
        conds.push(`${alias}.primary_business_unit = '${query.primaryBusinessUnit.replace(/'/g, "''")}'`);
      }
      if (query.vendor) conds.push(`${alias}.vendor = '${query.vendor.replace(/'/g, "''")}'`);
      if (query.expenseType) conds.push(`${alias}.expense_type = '${query.expenseType.replace(/'/g, "''")}'`);
      if (query.workCity) conds.push(`${alias}.work_city = '${query.workCity.replace(/'/g, "''")}'`);
      if (query.productPillar) conds.push(`${alias}.product_pillar = '${query.productPillar.replace(/'/g, "''")}'`);
      return conds;
    };

    const fedDateCond = buildDateCondition('fed', 'invoice_year', 'invoice_month');
    const bmtDateCond = buildDateCondition('bmt', 'forecast_year', 'forecast_month');
    const fedFilters = buildFilterConditions('fed');
    const bmtFilters = buildFilterConditions('bmt');

    const fedWhere = [fedDateCond, ...fedFilters].join(' AND ');
    const bmtWhere = [bmtDateCond, ...bmtFilters].join(' AND ');

    const offset = ((query.page || 1) - 1) * (query.limit || 50);
    const limit = query.limit || 50;

    const sql = `
      SELECT
        COALESCE(f.primary_business_unit, b.primary_business_unit) as business_unit,
        COALESCE(f.period_year, b.period_year) as period_year,
        COALESCE(f.period_month, b.period_month) as period_month,
        COALESCE(f.vendor, b.vendor) as vendor,
        COALESCE(f.expense_type, b.expense_type) as expense_type,
        COALESCE(f.work_city, b.work_city) as work_city,
        COALESCE(f.product_pillar, b.product_pillar) as product_pillar,
        COALESCE(f.fed_amount, 0) as fed_amount,
        COALESCE(b.bmt_amount, 0) as bmt_amount,
        COALESCE(b.bmt_amount, 0) - COALESCE(f.fed_amount, 0) as delta,
        CASE WHEN COALESCE(f.fed_amount, 0) != 0
          THEN ((COALESCE(b.bmt_amount, 0) - COALESCE(f.fed_amount, 0)) / f.fed_amount) * 100
          ELSE 0
        END as delta_pct
      FROM (
        SELECT primary_business_unit, invoice_year as period_year, invoice_month as period_month,
               vendor, expense_type, work_city, product_pillar,
               SUM(total_actual_cost) as fed_amount
        FROM ${this.FED_TABLE} fed
        WHERE ${fedWhere}
        GROUP BY primary_business_unit, invoice_year, invoice_month, vendor, expense_type, work_city, product_pillar
      ) f
      FULL OUTER JOIN (
        SELECT primary_business_unit, forecast_year as period_year, forecast_month as period_month,
               vendor, expense_type, work_city, product_pillar,
               SUM(opex_usd) as bmt_amount
        FROM ${this.BMT_TABLE} bmt
        WHERE ${bmtWhere}
        GROUP BY primary_business_unit, forecast_year, forecast_month, vendor, expense_type, work_city, product_pillar
      ) b ON f.primary_business_unit = b.primary_business_unit
        AND f.period_year = b.period_year
        AND f.period_month = b.period_month
        AND f.vendor = b.vendor
        AND f.expense_type = b.expense_type
        AND f.work_city = b.work_city
        AND f.product_pillar = b.product_pillar
      ORDER BY ABS(COALESCE(b.bmt_amount, 0) - COALESCE(f.fed_amount, 0)) DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const data = await this.hiveService.executeQuery(sql);

    return {
      data,
      total: data.length < limit ? offset + data.length : offset + limit + 1,
    };
  }

  async getFilterOptions(): Promise<Record<string, string[]>> {
    const dimensions = [
      { name: 'primaryBusinessUnit', table: this.FED_TABLE, column: 'primary_business_unit' },
      { name: 'vendor', table: this.FED_TABLE, column: 'vendor' },
      { name: 'expenseType', table: this.FED_TABLE, column: 'expense_type' },
      { name: 'workCity', table: this.FED_TABLE, column: 'work_city' },
      { name: 'productPillar', table: this.FED_TABLE, column: 'product_pillar' },
    ];

    const results: Record<string, string[]> = {};

    for (const dim of dimensions) {
      try {
        const sql = `SELECT DISTINCT ${dim.column} FROM ${dim.table} WHERE ${dim.column} IS NOT NULL ORDER BY ${dim.column} LIMIT 500`;
        const rows = await this.hiveService.executeQuery(sql);
        results[dim.name] = rows.map((r: any) => r[dim.column]).filter(Boolean);
      } catch {
        results[dim.name] = [];
      }
    }

    return results;
  }
}
