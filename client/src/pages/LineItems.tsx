import React, { useEffect, useState, useCallback } from 'react';
import { Table, Typography, Tag, Button, Spin, Alert } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import FilterPanel from '../components/FilterPanel';
import { useFilters } from '../hooks/useFilters';
import { getComparisonLineItems } from '../api/hive';
import { formatCurrency, formatPercent } from '../utils/format';
import type { LineItem } from '../types';

export default function LineItems() {
  const { filters, appliedFilters, updateFilter, applyFilters, resetFilters } = useFilters();
  const [data, setData] = useState<LineItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    getComparisonLineItems(appliedFilters, page, pageSize)
      .then((res) => {
        setData(res.data);
        setTotal(res.total);
      })
      .catch((err) => setError(err.response?.data?.error?.message || 'Failed to load line items'))
      .finally(() => setLoading(false));
  }, [appliedFilters, page, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isMaterialGap = (record: LineItem) =>
    Math.abs(record.delta_pct) > 10 || Math.abs(record.delta) > 10000;

  const exportCsv = () => {
    const headers = ['Business Unit', 'Year', 'Month', 'Vendor', 'Expense Type', 'Work City', 'Product Pillar', 'FED Amount', 'BMT Amount', 'Delta', 'Delta %'];
    const rows = data.map((r) => [
      r.business_unit, r.period_year, r.period_month, r.vendor, r.expense_type,
      r.work_city, r.product_pillar, r.fed_amount, r.bmt_amount, r.delta, r.delta_pct,
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
    { title: 'BU', dataIndex: 'business_unit', key: 'bu', width: 120 },
    { title: 'Year', dataIndex: 'period_year', key: 'year', width: 70 },
    { title: 'Month', dataIndex: 'period_month', key: 'month', width: 70 },
    { title: 'Vendor', dataIndex: 'vendor', key: 'vendor', width: 150, ellipsis: true },
    { title: 'Expense Type', dataIndex: 'expense_type', key: 'expense_type', width: 130, ellipsis: true },
    { title: 'Work City', dataIndex: 'work_city', key: 'work_city', width: 120, ellipsis: true },
    { title: 'Product Pillar', dataIndex: 'product_pillar', key: 'product_pillar', width: 130, ellipsis: true },
    {
      title: 'FED Amount',
      dataIndex: 'fed_amount',
      key: 'fed_amount',
      width: 130,
      align: 'right' as const,
      render: (val: number) => formatCurrency(val),
    },
    {
      title: 'BMT Amount',
      dataIndex: 'bmt_amount',
      key: 'bmt_amount',
      width: 130,
      align: 'right' as const,
      render: (val: number) => formatCurrency(val),
    },
    {
      title: 'Delta',
      dataIndex: 'delta',
      key: 'delta',
      width: 120,
      align: 'right' as const,
      render: (val: number) => (
        <span style={{ color: val > 0 ? '#ff4d4f' : val < 0 ? '#52c41a' : undefined }}>
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      title: 'Delta %',
      dataIndex: 'delta_pct',
      key: 'delta_pct',
      width: 100,
      align: 'right' as const,
      render: (val: number) => {
        const abs = Math.abs(val);
        let color = 'green';
        if (abs >= 15) color = 'red';
        else if (abs >= 5) color = 'orange';
        return <Tag color={color}>{formatPercent(val)}</Tag>;
      },
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

      {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} closable />}

      <Table
        columns={columns}
        dataSource={data}
        rowKey={(_, index) => String(index)}
        loading={loading}
        scroll={{ x: 1300 }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          pageSizeOptions: ['25', '50', '100'],
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
        rowClassName={(record) => (isMaterialGap(record) ? 'row-material-gap' : '')}
      />

      <style>{`
        .row-material-gap {
          background-color: #fff2f0 !important;
        }
        .row-material-gap:hover > td {
          background-color: #ffccc7 !important;
        }
      `}</style>
    </div>
  );
}
