import React, { useEffect, useState } from 'react';
import { Card, Typography, Spin, Alert, Row, Col, DatePicker, Select, Button, Space } from 'antd';
import { DualAxes } from '@ant-design/charts';
import { getComparisonTrend } from '../api/hive';
import { formatCurrency, monthLabel } from '../utils/format';
import type { ComparisonSummary } from '../types';
import dayjs from 'dayjs';

export default function Trends() {
  const [businessUnit, setBusinessUnit] = useState('LEGAL_OPS');
  const [startDate, setStartDate] = useState(dayjs().subtract(5, 'month'));
  const [endDate, setEndDate] = useState(dayjs());
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrend = () => {
    setLoading(true);
    setError(null);
    getComparisonTrend({
      businessUnit,
      startYear: startDate.year(),
      startMonth: startDate.month() + 1,
      endYear: endDate.year(),
      endMonth: endDate.month() + 1,
    })
      .then((results: ComparisonSummary[]) => {
        // Transform results for the chart
        const chartData = results.map((r: any, idx: number) => {
          const year = startDate.year() + Math.floor((startDate.month() + idx) / 12);
          const month = ((startDate.month() + idx) % 12) + 1;
          return {
            period: monthLabel(r.periodYear ?? year, r.periodMonth ?? month),
            fedTotal: r.fed?.totalActualCost ?? 0,
            bmtTotal: r.bmt?.totalOpexUsd ?? 0,
            delta: r.delta?.absolute ?? 0,
          };
        });
        setData(chartData);
      })
      .catch((err) => setError(err.response?.data?.error?.message || 'Failed to load trends'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTrend();
  }, []);

  const lineData = data.flatMap((d) => [
    { period: d.period, value: d.fedTotal, type: 'FED Actual' },
    { period: d.period, value: d.bmtTotal, type: 'BMT OpEx' },
  ]);

  const barData = data.map((d) => ({
    period: d.period,
    value: d.delta,
    type: 'Gap',
  }));

  return (
    <div>
      <Typography.Title level={4}>Trends</Typography.Title>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="bottom">
          <Col>
            <div style={{ marginBottom: 4, fontSize: 12, color: '#888' }}>Business Unit</div>
            <Select
              style={{ width: 200 }}
              value={businessUnit}
              onChange={setBusinessUnit}
              options={[
                { label: 'Legal Ops', value: 'LEGAL_OPS' },
                { label: 'Developer Ops', value: 'DEVELOPER_OPS' },
                { label: 'Compliance Ops', value: 'COMPLIANCE_OPS' },
              ]}
            />
          </Col>
          <Col>
            <div style={{ marginBottom: 4, fontSize: 12, color: '#888' }}>Start Month</div>
            <DatePicker picker="month" value={startDate} onChange={(d) => d && setStartDate(d)} />
          </Col>
          <Col>
            <div style={{ marginBottom: 4, fontSize: 12, color: '#888' }}>End Month</div>
            <DatePicker picker="month" value={endDate} onChange={(d) => d && setEndDate(d)} />
          </Col>
          <Col>
            <Button type="primary" onClick={fetchTrend}>Load</Button>
          </Col>
        </Row>
      </Card>

      {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} closable />}

      <Spin spinning={loading}>
        <Card title="FED vs BMT Over Time">
          {data.length > 0 ? (
            <DualAxes
              data={[lineData, barData]}
              xField="period"
              yField={['value', 'value']}
              geometryOptions={[
                {
                  geometry: 'line',
                  seriesField: 'type',
                  smooth: true,
                  color: ['#1890ff', '#722ed1'],
                },
                {
                  geometry: 'column',
                  seriesField: 'type',
                  color: ['#faad14'],
                },
              ]}
              height={400}
              legend={{ position: 'top' }}
              yAxis={{
                value: {
                  label: { formatter: (v: string) => formatCurrency(Number(v)) },
                },
              }}
            />
          ) : (
            <Typography.Text type="secondary">No trend data available. Click "Load" to fetch.</Typography.Text>
          )}
        </Card>
      </Spin>
    </div>
  );
}
