import React, { useEffect, useState } from 'react';
import { Card, Typography, Table, Spin, Alert, Row, Col, Select, DatePicker, Button, Space } from 'antd';
import { Waterfall } from '@ant-design/charts';
import { runRca, listRcaRuns, getRcaRun } from '../api/hive';
import { formatCurrency, formatPercent } from '../utils/format';
import type { RcaWaterfallResult, RcaStep } from '../types';
import dayjs from 'dayjs';

export default function RcaWaterfallPage() {
  const [businessUnit, setBusinessUnit] = useState('LEGAL_OPS');
  const [date, setDate] = useState(dayjs());
  const [result, setResult] = useState<RcaWaterfallResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRun = () => {
    setLoading(true);
    setError(null);
    runRca({
      businessUnit,
      year: date.year(),
      month: date.month() + 1,
    })
      .then(setResult)
      .catch((err) => setError(err.response?.data?.error?.message || 'Failed to run RCA'))
      .finally(() => setLoading(false));
  };

  const chartData = result
    ? [
        { step: 'Total Gap', value: result.totalGap },
        ...result.steps.map((s) => ({
          step: s.stepName.replace(/_/g, ' '),
          value: -s.amountExplained,
        })),
        { step: 'Residual', value: result.residualUnexplained },
      ]
    : [];

  const stepColumns = [
    { title: '#', dataIndex: 'stepOrder', key: 'order', width: 50 },
    {
      title: 'Step',
      dataIndex: 'stepName',
      key: 'name',
      render: (val: string) => val.replace(/_/g, ' '),
    },
    {
      title: 'Gap In',
      dataIndex: 'gapInputAmount',
      key: 'gapIn',
      align: 'right' as const,
      render: (val: number) => formatCurrency(val),
    },
    {
      title: 'Explained',
      dataIndex: 'amountExplained',
      key: 'explained',
      align: 'right' as const,
      render: (val: number) => formatCurrency(val),
    },
    {
      title: 'Gap Out',
      dataIndex: 'gapOutputAmount',
      key: 'gapOut',
      align: 'right' as const,
      render: (val: number) => formatCurrency(val),
    },
    {
      title: '% of Total',
      dataIndex: 'percentOfTotalGap',
      key: 'pct',
      align: 'right' as const,
      render: (val: number) => `${val.toFixed(1)}%`,
    },
  ];

  return (
    <div>
      <Typography.Title level={4}>RCA Waterfall</Typography.Title>

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
            <div style={{ marginBottom: 4, fontSize: 12, color: '#888' }}>Period</div>
            <DatePicker picker="month" value={date} onChange={(d) => d && setDate(d)} />
          </Col>
          <Col>
            <Button type="primary" onClick={handleRun} loading={loading}>
              Run RCA
            </Button>
          </Col>
        </Row>
      </Card>

      {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} closable />}

      <Spin spinning={loading}>
        {result && (
          <>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Card size="small">
                  <Typography.Text type="secondary">Total Gap</Typography.Text>
                  <div style={{ fontSize: 20, fontWeight: 600 }}>{formatCurrency(result.totalGap)}</div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Typography.Text type="secondary">Explained</Typography.Text>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#52c41a' }}>{formatCurrency(result.totalExplained)}</div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Typography.Text type="secondary">Residual</Typography.Text>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#ff4d4f' }}>{formatCurrency(result.residualUnexplained)}</div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Typography.Text type="secondary">% Explained</Typography.Text>
                  <div style={{ fontSize: 20, fontWeight: 600 }}>{result.percentExplained.toFixed(1)}%</div>
                </Card>
              </Col>
            </Row>

            <Card title="Waterfall Chart" style={{ marginBottom: 16 }}>
              <Waterfall
                data={chartData}
                xField="step"
                yField="value"
                total={{
                  label: 'Residual',
                  style: { fill: '#ff4d4f' },
                }}
                color={({ step }: { step: string }) => {
                  if (step === 'Total Gap') return '#1890ff';
                  if (step === 'Residual') return '#ff4d4f';
                  return '#52c41a';
                }}
                label={{
                  text: (d: any) => formatCurrency(Math.abs(d.value)),
                  position: 'outside',
                }}
                height={350}
              />
            </Card>

            <Card title="Step Details">
              <Table
                columns={stepColumns}
                dataSource={result.steps}
                rowKey="stepOrder"
                pagination={false}
                size="small"
              />
            </Card>
          </>
        )}

        {!result && !loading && (
          <Card>
            <Typography.Text type="secondary">
              Select a business unit and period, then click "Run RCA" to generate the waterfall analysis.
            </Typography.Text>
          </Card>
        )}
      </Spin>
    </div>
  );
}
