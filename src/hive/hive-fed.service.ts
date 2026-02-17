import { Injectable, Logger } from '@nestjs/common';
import { HiveService } from './hive.service';
import { HiveQueryDto } from './dto/hive-query.dto';

@Injectable()
export class HiveFedService {
  private readonly logger = new Logger(HiveFedService.name);
  private readonly TABLE = 'dim_opex_reporting_buckets_daily';

  constructor(private hiveService: HiveService) {}

  private buildWhereClause(query: HiveQueryDto): string {
    const conditions: string[] = [];

    if (query.endYear && query.endMonth) {
      conditions.push(
        `(invoice_year * 100 + invoice_month) BETWEEN ${query.year * 100 + query.month} AND ${query.endYear * 100 + query.endMonth}`,
      );
    } else {
      conditions.push(`invoice_year = ${query.year}`);
      conditions.push(`invoice_month = ${query.month}`);
    }

    if (query.primaryBusinessUnit) {
      conditions.push(`primary_business_unit = '${query.primaryBusinessUnit.replace(/'/g, "''")}'`);
    }
    if (query.vendor) {
      conditions.push(`vendor = '${query.vendor.replace(/'/g, "''")}'`);
    }
    if (query.expenseType) {
      conditions.push(`expense_type = '${query.expenseType.replace(/'/g, "''")}'`);
    }
    if (query.workCity) {
      conditions.push(`work_city = '${query.workCity.replace(/'/g, "''")}'`);
    }
    if (query.productPillar) {
      conditions.push(`product_pillar = '${query.productPillar.replace(/'/g, "''")}'`);
    }

    return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  }

  async getRecords(query: HiveQueryDto): Promise<{ data: any[]; total: number }> {
    const where = this.buildWhereClause(query);
    const offset = ((query.page || 1) - 1) * (query.limit || 50);
    const limit = query.limit || 50;

    const countSql = `SELECT COUNT(*) as cnt FROM ${this.TABLE} ${where}`;
    const dataSql = `SELECT * FROM ${this.TABLE} ${where} LIMIT ${limit} OFFSET ${offset}`;

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
        SUM(total_actual_cost) as total_actual_cost,
        SUM(total_estimated_cost) as total_estimated_cost,
        COUNT(*) as record_count
      FROM ${this.TABLE}
      ${where}
    `;

    const result = await this.hiveService.executeQuery(sql);
    const row = result[0] || {};

    return {
      totalActualCost: Number(row.total_actual_cost) || 0,
      totalEstimatedCost: Number(row.total_estimated_cost) || 0,
      recordCount: Number(row.record_count) || 0,
    };
  }
}
