import React, { useEffect, useState } from 'react';
import { Row, Col, Select, DatePicker, Button, Space } from 'antd';
import { SearchOutlined, UndoOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { FilterValues } from '../types';
import client from '../api/client';

interface Props {
  filters: FilterValues;
  onFilterChange: <K extends keyof FilterValues>(key: K, value: FilterValues[K]) => void;
  onApply: () => void;
  onReset: () => void;
}

export default function FilterPanel({ filters, onFilterChange, onApply, onReset }: Props) {
  const [businessUnits, setBusinessUnits] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      client.get('/fed/business-units').catch(() => ({ data: { data: [] } })),
      client.get('/bmt/business-units').catch(() => ({ data: { data: [] } })),
    ]).then(([fedRes, bmtRes]) => {
      const fedBus = fedRes.data.data ?? fedRes.data ?? [];
      const bmtBus = bmtRes.data.data ?? bmtRes.data ?? [];
      const merged = Array.from(new Set([...fedBus, ...bmtBus])).sort();
      setBusinessUnits(merged);
    });
  }, []);

  const handleMonthChange = (_: any, dateString: string | string[]) => {
    const str = Array.isArray(dateString) ? dateString[0] : dateString;
    if (str) {
      const [y, m] = str.split('-').map(Number);
      onFilterChange('year', y);
      onFilterChange('month', m);
    }
  };

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
        <Col xs={24} sm={12} md={8} lg={6}>
          <div style={{ marginBottom: 4, fontSize: 12, color: '#888' }}>Business Unit</div>
          <Select
            style={{ width: '100%' }}
            placeholder="Select Business Unit"
            allowClear
            showSearch
            value={filters.primaryBusinessUnit}
            onChange={(val) => onFilterChange('primaryBusinessUnit', val)}
            options={businessUnits.map((v) => ({ label: v.replace(/_/g, ' '), value: v }))}
          />
        </Col>
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
