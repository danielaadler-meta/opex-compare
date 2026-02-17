import { Injectable, Logger } from '@nestjs/common';
import { HiveService } from './hive.service';
import { HiveQueryDto } from './dto/hive-query.dto';

@Injectable()
export class HiveBmtService {
  private readonly logger = new Logger(HiveBmtService.name);
  private readonly FORECAST_TABLE = 'fct_ap_ce_billing_forecast_live';
  private readonly MASTER_TABLE = 'dim_ap_ce_billing_forecast_misc_master';

  constructor(private hiveService: HiveService) {}

  private buildWhereClause(query: HiveQueryDto, alias = 'f'): string {
    const conditions: string[] = [];

    if (query.endYear && query.endMonth) {
      conditions.push(
        `(${alias}.forecast_year * 100 + ${alias}.forecast_month) BETWEEN ${query.year * 100 + query.month} AND ${query.endYear * 100 + query.endMonth}`,
      );
    } else {
      conditions.push(`${alias}.forecast_year = ${query.year}`);
      conditions.push(`${alias}.forecast_month = ${query.month}`);
    }

    if (query.primaryBusinessUnit) {
      conditions.push(`${alias}.primary_business_unit = '${query.primaryBusinessUnit.replace(/'/g, "''")}'`);
    }
    if (query.vendor) {
      conditions.push(`${alias}.vendor = '${query.vendor.replace(/'/g, "''")}'`);
    }
    if (query.expenseType) {
      conditions.push(`${alias}.expense_type = '${query.expenseType.replace(/'/g, "''")}'`);
    }
    if (query.workCity) {
      conditions.push(`${alias}.work_city = '${query.workCity.replace(/'/g, "''")}'`);
    }
    if (query.productPillar) {
      conditions.push(`${alias}.product_pillar = '${query.productPillar.replace(/'/g, "''")}'`);
    }

    return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  }

  async getRecords(query: HiveQueryDto): Promise<{ data: any[]; total: number }> {
    const where = this.buildWhereClause(query);
    const offset = ((query.page || 1) - 1) * (query.limit || 50);
    const limit = query.limit || 50;

    const countSql = `SELECT COUNT(*) as cnt FROM ${this.FORECAST_TABLE} f ${where}`;
    const dataSql = `
      SELECT f.*, m.mapped_opex_bucket, m.has_fed_counterpart
      FROM ${this.FORECAST_TABLE} f
      LEFT JOIN ${this.MASTER_TABLE} m ON f.forecast_unique_id = m.forecast_unique_id
      ${where}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [countResult, data] = await Promise.all([
      this.hiveService.executeQuery(countSql),
      this.hiveService.executeQuery(dataSql),
    ]);

    return {
      data,
      total: Number(countResult[0]?.cnt) || 0,
    };
  }

  async getAggregated(query: HiveQueryDto): Promise<any> {
    const where = this.buildWhereClause(query);

    const sql = `
      SELECT
        SUM(f.opex_usd) as total_opex_usd,
        SUM(f.opex_usd_finance_actuals_allocated) as total_opex_finance_allocated,
        SUM(f.finance_adjustment) as total_finance_adjustment,
        COUNT(*) as record_count
      FROM ${this.FORECAST_TABLE} f
      ${where}
    `;

    const result = await this.hiveService.executeQuery(sql);
    const row = result[0] || {};

    return {
      totalOpexUsd: Number(row.total_opex_usd) || 0,
      totalOpexFinanceAllocated: Number(row.total_opex_finance_allocated) || 0,
      totalFinanceAdjustment: Number(row.total_finance_adjustment) || 0,
      recordCount: Number(row.record_count) || 0,
    };
  }
}
