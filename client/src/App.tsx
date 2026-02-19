import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LineItems from './pages/LineItems';
import Trends from './pages/Trends';
import RcaWaterfall from './pages/RcaWaterfall';
import Upload from './pages/Upload';

export default function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/line-items" element={<LineItems />} />
          <Route path="/trends" element={<Trends />} />
          <Route path="/rca" element={<RcaWaterfall />} />
          <Route path="/upload" element={<Upload />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </ConfigProvider>
  );
}
