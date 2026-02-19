import React, { useState } from 'react';
import { Typography, Upload, Button, Card, Row, Col, Alert, Table, Space, message } from 'antd';
import { UploadOutlined, InboxOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import client from '../api/client';

const { Dragger } = Upload;

interface UploadResult {
  inserted: number;
  skipped: number;
  errors: string[];
}

export default function UploadPage() {
  const [fedResult, setFedResult] = useState<UploadResult | null>(null);
  const [bmtResult, setBmtResult] = useState<UploadResult | null>(null);
  const [fedLoading, setFedLoading] = useState(false);
  const [bmtLoading, setBmtLoading] = useState(false);

  const handleUpload = async (file: File, type: 'fed' | 'bmt') => {
    const formData = new FormData();
    formData.append('file', file);

    const setLoading = type === 'fed' ? setFedLoading : setBmtLoading;
    const setResult = type === 'fed' ? setFedResult : setBmtResult;

    setLoading(true);
    try {
      const res = await client.post(`/${type}/upload-csv`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      message.success(`${type.toUpperCase()} CSV uploaded: ${res.data.inserted} records inserted`);
    } catch (err: any) {
      message.error(err.response?.data?.message || `Failed to upload ${type.toUpperCase()} CSV`);
    } finally {
      setLoading(false);
    }
  };

  const renderResult = (result: UploadResult | null, label: string) => {
    if (!result) return null;
    return (
      <div style={{ marginTop: 16 }}>
        <Alert
          type={result.errors.length > 0 ? 'warning' : 'success'}
          message={`${label} Upload Complete`}
          description={
            <div>
              <div><CheckCircleOutlined style={{ color: '#52c41a' }} /> Inserted: <strong>{result.inserted}</strong> records</div>
              {result.skipped > 0 && (
                <div style={{ color: '#faad14' }}>Skipped: <strong>{result.skipped}</strong> rows</div>
              )}
            </div>
          }
        />
        {result.errors.length > 0 && (
          <div style={{ marginTop: 8, maxHeight: 150, overflow: 'auto', fontSize: 12, color: '#ff4d4f' }}>
            {result.errors.map((e, i) => (
              <div key={i}>{e}</div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <Typography.Title level={4}>Upload Data</Typography.Title>
      <Alert
        type="info"
        style={{ marginBottom: 24 }}
        message="How to upload data"
        description={
          <div>
            <p>1. Run your query in Daiquery against the iData Hive tables</p>
            <p>2. Export the results as CSV</p>
            <p>3. Upload the FED CSV (from <code>dim_opex_measurement_buckets_reporting_daily</code>) and/or BMT CSV (from <code>fct_ap_ce_billing_forecast_live</code> joined with <code>dim_ap_ce_billing_forecast_misc_master</code>)</p>
            <p style={{ margin: 0 }}>The CSV columns will be automatically mapped to the app's data model (snake_case column names are expected).</p>
          </div>
        }
      />

      <Row gutter={24}>
        <Col xs={24} lg={12}>
          <Card title="FED Data (Actuals)" style={{ marginBottom: 24 }}>
            <Dragger
              name="file"
              accept=".csv"
              maxCount={1}
              beforeUpload={(file) => {
                handleUpload(file, 'fed');
                return false;
              }}
              showUploadList={false}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Click or drag FED CSV file here</p>
              <p className="ant-upload-hint">
                From <code>dim_opex_measurement_buckets_reporting_daily</code>
              </p>
            </Dragger>
            {fedLoading && <Alert type="info" message="Uploading..." style={{ marginTop: 16 }} />}
            {renderResult(fedResult, 'FED')}

            <div style={{ marginTop: 16, fontSize: 12, color: '#888' }}>
              <strong>Expected columns:</strong> primary_business_unit, opex_bucket,
              actual_cost_per_job, estimated_cost_per_job, job_count, total_opex,
              invoice_year, invoice_month, job_id, workflow_name, work_city, product_pillar
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="BMT Data (Forecast)" style={{ marginBottom: 24 }}>
            <Dragger
              name="file"
              accept=".csv"
              maxCount={1}
              beforeUpload={(file) => {
                handleUpload(file, 'bmt');
                return false;
              }}
              showUploadList={false}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Click or drag BMT CSV file here</p>
              <p className="ant-upload-hint">
                From <code>fct_ap_ce_billing_forecast_live</code> + <code>dim_ap_ce_billing_forecast_misc_master</code>
              </p>
            </Dragger>
            {bmtLoading && <Alert type="info" message="Uploading..." style={{ marginTop: 16 }} />}
            {renderResult(bmtResult, 'BMT')}

            <div style={{ marginTop: 16, fontSize: 12, color: '#888' }}>
              <strong>Expected columns:</strong> primary_business_unit, billable_role,
              opex_usd (or bmt_running_forecast), forecast_year, forecast_month,
              program, project, vendor, expense_type, work_city, product_pillar,
              employee_type, forecast_unique_id
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
