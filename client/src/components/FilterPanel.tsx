import React, { useEffect, useState } from 'react';
import { Row, Col, Select, DatePicker, Button, Space } from 'antd';
import { SearchOutlined, UndoOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { FilterValues, FilterOptions } from '../types';
import { getFilterOptions } from '../api/hive';

interface Props {
  filters: FilterValues;
  onFilterChange: <K extends keyof FilterValues>(key: K, value: FilterValues[K]) => void;
  onApply: () => void;
  onReset: () => void;
}

export default function FilterPanel({ filters, onFilterChange, onApply, onReset }: Props) {
  const [options, setOptions] = useState<FilterOptions>({
    primaryBusinessUnit: [],
    vendor: [],
    expenseType: [],
    workCity: [],
    productPillar: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getFilterOptions()
      .then(setOptions)
      .catch(() => {
        // Use fallback hardcoded options if Hive is not configured
        setOptions({
          primaryBusinessUnit: ['LEGAL_OPS', 'DEVELOPER_OPS', 'COMPLIANCE_OPS'],
          vendor: [],
          expenseType: [],
          workCity: [],
          productPillar: [],
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleMonthChange = (_: any, dateString: string | string[]) => {
    const str = Array.isArray(dateString) ? dateString[0] : dateString;
    if (str) {
      const [y, m] = str.split('-').map(Number);
      onFilterChange('year', y);
      onFilterChange('month', m);
    }
  };

  const renderSelect = (
    label: string,
    field: keyof FilterValues,
    items: string[],
  ) => (
    <Col xs={24} sm={12} md={8} lg={4}>
      <div style={{ marginBottom: 4, fontSize: 12, color: '#888' }}>{label}</div>
      <Select
        style={{ width: '100%' }}
        placeholder={`Select ${label}`}
        allowClear
        showSearch
        loading={loading}
        value={filters[field] as string | undefined}
        onChange={(val) => onFilterChange(field, val)}
        options={items.map((v) => ({ label: v, value: v }))}
      />
    </Col>
  );

  return (
    <div style={{ background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16 }}>
      <Row gutter={[12, 12]} align="bottom">
        <Col xs={24} sm={12} md={8} lg={4}>
          <div style={{ marginBottom: 4, fontSize: 12, color: '#888' }}>Period</div>
          <DatePicker
            picker="month"
            style={{ width: '100%' }}
            value={dayjs(`${filters.year}-${String(filters.month).padStart(2, '0')}`)}
            onChange={handleMonthChange}
          />
        </Col>
        {renderSelect('Business Unit', 'primaryBusinessUnit', options.primaryBusinessUnit)}
        {renderSelect('Vendor', 'vendor', options.vendor)}
        {renderSelect('Expense Type', 'expenseType', options.expenseType)}
        {renderSelect('Work City', 'workCity', options.workCity)}
        {renderSelect('Product Pillar', 'productPillar', options.productPillar)}
        <Col xs={24} sm={12} md={8} lg={4}>
          <Space>
            <Button type="primary" icon={<SearchOutlined />} onClick={onApply}>
              Apply
            </Button>
            <Button icon={<UndoOutlined />} onClick={onReset}>
              Reset
            </Button>
          </Space>
        </Col>
      </Row>
    </div>
  );
}
