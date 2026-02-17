import React from 'react';
import { Layout as AntLayout, Menu, Button, Typography } from 'antd';
import {
  DashboardOutlined,
  TableOutlined,
  LineChartOutlined,
  BarChartOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

const { Header, Sider, Content } = AntLayout;

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/line-items', icon: <TableOutlined />, label: 'Line Items' },
    { key: '/trends', icon: <LineChartOutlined />, label: 'Trends' },
    { key: '/rca', icon: <BarChartOutlined />, label: 'RCA Waterfall' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="80">
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>
            OpEx Compare
          </Typography.Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <AntLayout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16 }}>
          <Typography.Text>{user.email}</Typography.Text>
          <Button icon={<LogoutOutlined />} onClick={handleLogout} type="text">
            Logout
          </Button>
        </Header>
        <Content style={{ margin: '24px', minHeight: 360 }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
