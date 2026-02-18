import React, { useEffect, useState, useCallback } from 'react';
import { Table, Typography, Tag, Button, Spin, Alert } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import FilterPanel from '../components/FilterPanel';
import { useFilters } from '../hooks/useFilters';
import client from '../api/client';
import { formatCurrency, formatPercent } from '../utils/format';

interface RecordRow {
  key: string;
  source: string;
  businessUnit: string;
  year: number;
  month: number;
  bucket: string;
  role: string;
  fedAmount: number;
  bmtAmount: number;
  delta: number;
  deltaPct: number;
}

export default function LineItems() {
  const { filters, appliedFilters, updateFilter, applyFilters, resetFilters } = useFilters();
  const [data, setData] = useState<RecordRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!appliedFilters.primaryBusinessUnit) {
      setData([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = {
        businessUnit: appliedFilters.primaryBusinessUnit,
        year: appliedFilters.year,
        month: appliedFilters.month,
      };

      const [fedRes, bmtRes] = await Promise.all([
        client.get('/fed/records', { params: { ...params, limit: 500 } }),
        client.get('/bmt/records', { params: { ...params, limit: 500 } }),
      ]);

      const fedRecords = fedRes.data.data?.data ?? [];
      const bmtRecords = bmtRes.data.data?.data ?? [];

      const rows: RecordRow[] = [];

      fedRecords.forEach((r: any, i: number) => {
        rows.push({
          key: `fed-${i}`,
          source: 'FED',
          businessUnit: r.primaryBusinessUnit,
          year: r.invoiceYear,
          month: r.invoiceMonth,
          bucket: r.opexBucket || '-',
          role: r.workflowName || '-',
          fedAmount: Number(r.totalActualCost) || 0,
          bmtAmount: 0,
          delta: -(Number(r.totalActualCost) || 0),
          deltaPct: 0,
        });
      });

      bmtRecords.forEach((r: any, i: number) => {
        rows.push({
          key: `bmt-${i}`,
          source: 'BMT',
          businessUnit: r.primaryBusinessUnit,
          year: r.forecastYear,
          month: r.forecastMonth,
          bucket: r.program || '-',
          role: r.billableRole || '-',
          fedAmount: 0,
          bmtAmount: Number(r.opexUsd) || 0,
          delta: Number(r.opexUsd) || 0,
          deltaPct: 0,
        });
      });

      setData(rows);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load records');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const exportCsv = () => {
    const headers = ['Source', 'Business Unit', 'Year', 'Month', 'Bucket/Program', 'Role/Workflow', 'FED Amount', 'BMT Amount'];
    const rows = data.map((r) => [
      r.source, r.businessUnit, r.year, r.month, r.bucket, r.role, r.fedAmount, r.bmtAmount,
    ]);
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `line-items-${appliedFilters.year}-${appliedFilters.month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    { title: 'Source', dataIndex: 'source', key: 'source', width: 80,
      render: (val: string) => <Tag color={val === 'FED' ? 'blue' : 'purple'}>{val}</Tag>,
    },
    { title: 'BU', dataIndex: 'businessUnit', key: 'bu', width: 130 },
    { title: 'Year', dataIndex: 'year', key: 'year', width: 70 },
    { title: 'Month', dataIndex: 'month', key: 'month', width: 70 },
    { title: 'Bucket / Program', dataIndex: 'bucket', key: 'bucket', width: 180, ellipsis: true },
    { title: 'Role / Workflow', dataIndex: 'role', key: 'role', width: 180, ellipsis: true },
    {
      title: 'FED Amount',
      dataIndex: 'fedAmount',
      key: 'fedAmount',
      width: 130,
      align: 'right' as const,
      render: (val: number) => val > 0 ? formatCurrency(val) : '-',
    },
    {
      title: 'BMT Amount',
      dataIndex: 'bmtAmount',
      key: 'bmtAmount',
      width: 130,
      align: 'right' as const,
      render: (val: number) => val > 0 ? formatCurrency(val) : '-',
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>Line Items</Typography.Title>
        <Button icon={<DownloadOutlined />} onClick={exportCsv} disabled={data.length === 0}>
          Export CSV
        </Button>
      </div>

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

      <Table
        columns={columns}
        dataSource={data}
        rowKey="key"
        loading={loading}
        scroll={{ x: 1000 }}
        pagination={{
          pageSize: 50,
          showSizeChanger: true,
          pageSizeOptions: ['25', '50', '100'],
        }}
      />
    </div>
  );
}
