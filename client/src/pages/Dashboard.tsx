import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Spin, Alert, Typography } from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { Column } from '@ant-design/charts';
import FilterPanel from '../components/FilterPanel';
import { useFilters } from '../hooks/useFilters';
import { generateComparison } from '../api/hive';
import { formatCurrency, getGapColor } from '../utils/format';
import type { ComparisonSummary } from '../types';

export default function Dashboard() {
  const { filters, appliedFilters, updateFilter, applyFilters, resetFilters } = useFilters();
  const [summary, setSummary] = useState<ComparisonSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!appliedFilters.primaryBusinessUnit) {
      setSummary(null);
      return;
    }
    setLoading(true);
    setError(null);
    generateComparison({
      businessUnit: appliedFilters.primaryBusinessUnit,
      year: appliedFilters.year,
      month: appliedFilters.month,
    })
      .then(setSummary)
      .catch((err) => setError(err.response?.data?.error?.message || 'Failed to load summary'))
      .finally(() => setLoading(false));
  }, [appliedFilters]);

  const gapPct = summary?.delta.percentage ?? 0;
  const gapColor = getGapColor(gapPct);

  const directionIcon =
    summary?.delta.direction === 'BMT_HIGHER' ? <ArrowUpOutlined /> :
    summary?.delta.direction === 'FED_HIGHER' ? <ArrowDownOutlined /> :
    <CheckCircleOutlined />;

  const chartData = summary
    ? [
        { source: 'FED Actual', amount: summary.fed.totalActualCost },
        { source: 'BMT OpEx', amount: summary.bmt.totalOpexUsd },
      ]
    : [];

  return (
    <div>
      <Typography.Title level={4}>Dashboard</Typography.Title>
      <FilterPanel
        filters={filters}
        onFilterChange={updateFilter}
        onApply={applyFilters}
        onReset={resetFilters}
      />

      {!appliedFilters.primaryBusinessUnit && (
        <Alert type="info" message="Select a Business Unit and click Apply to load data." style={{ marginBottom: 16 }} />
      )}

      {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} closable />}

      <Spin spinning={loading}>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="FED Total (Actual)"
                value={summary?.fed.totalActualCost ?? 0}
                formatter={(val) => formatCurrency(Number(val))}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="BMT Total (OpEx USD)"
                value={summary?.bmt.totalOpexUsd ?? 0}
                formatter={(val) => formatCurrency(Number(val))}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Absolute Gap"
                value={summary?.delta.absolute ?? 0}
                formatter={(val) => formatCurrency(Number(val))}
                valueStyle={{ color: gapColor }}
                prefix={directionIcon}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Gap %"
                value={gapPct}
                precision={1}
                suffix="%"
                valueStyle={{ color: gapColor }}
                prefix={directionIcon}
              />
            </Card>
          </Col>
        </Row>

        <Card title="FED vs BMT Comparison">
          {chartData.length > 0 && (
            <Column
              data={chartData}
              xField="source"
              yField="amount"
              color={({ source }: { source: string }) =>
                source === 'FED Actual' ? '#1890ff' : '#722ed1'
              }
              label={{
                text: (d: any) => formatCurrency(d.amount),
                position: 'outside',
              }}
              height={300}
            />
          )}
        </Card>
      </Spin>
    </div>
  );
}
