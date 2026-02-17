import client from './client';
import type {
  ComparisonSummary,
  FilterOptions,
  FilterValues,
  LineItem,
  PaginatedResponse,
  RcaWaterfallResult,
} from '../types';

function toParams(filters: FilterValues, extra?: Record<string, any>) {
  const params: Record<string, any> = { ...filters, ...extra };
  // Remove undefined values
  Object.keys(params).forEach((key) => {
    if (params[key] === undefined || params[key] === '') {
      delete params[key];
    }
  });
  return params;
}

export async function getFilterOptions(): Promise<FilterOptions> {
  const res = await client.get('/hive/filters/options');
  return res.data.data ?? res.data;
}

export async function getComparisonSummary(filters: FilterValues): Promise<ComparisonSummary> {
  const res = await client.get('/hive/comparison/summary', { params: toParams(filters) });
  return res.data.data ?? res.data;
}

export async function getComparisonLineItems(
  filters: FilterValues,
  page = 1,
  limit = 50,
): Promise<PaginatedResponse<LineItem>> {
  const res = await client.get('/hive/comparison/line-items', {
    params: toParams(filters, { page, limit }),
  });
  return res.data.data ?? res.data;
}

export async function getFedAggregated(filters: FilterValues): Promise<any> {
  const res = await client.get('/hive/fed/aggregated', { params: toParams(filters) });
  return res.data.data ?? res.data;
}

export async function getBmtAggregated(filters: FilterValues): Promise<any> {
  const res = await client.get('/hive/bmt/aggregated', { params: toParams(filters) });
  return res.data.data ?? res.data;
}

// Comparison via existing PostgreSQL endpoints
export async function generateComparison(params: {
  businessUnit: string;
  year: number;
  month: number;
}): Promise<ComparisonSummary> {
  const res = await client.post('/comparison/generate', params);
  return res.data.data;
}

export async function getComparisonTrend(params: {
  businessUnit: string;
  startYear: number;
  startMonth: number;
  endYear: number;
  endMonth: number;
}): Promise<ComparisonSummary[]> {
  const res = await client.get('/comparison/trend', { params });
  return res.data.data;
}

// RCA endpoints
export async function runRca(params: {
  businessUnit: string;
  year: number;
  month: number;
  workflowName?: string;
}): Promise<RcaWaterfallResult> {
  const res = await client.post('/rca/run', params);
  return res.data.data;
}

export async function getRcaRun(id: string): Promise<RcaWaterfallResult> {
  const res = await client.get(`/rca/runs/${id}`);
  return res.data.data;
}

export async function listRcaRuns(params?: {
  businessUnit?: string;
  year?: number;
  month?: number;
  page?: number;
  limit?: number;
}): Promise<any> {
  const res = await client.get('/rca/runs', { params });
  return res.data.data;
}
