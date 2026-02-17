import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Tabs } from 'antd';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../api/auth';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const data = await login(values.email, values.password);
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const data = await register(values.email, values.password);
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const loginForm = (
    <Form layout="vertical" onFinish={handleLogin}>
      <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
        <Input placeholder="you@example.com" />
      </Form.Item>
      <Form.Item name="password" label="Password" rules={[{ required: true, min: 8 }]}>
        <Input.Password placeholder="Password" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          Sign In
        </Button>
      </Form.Item>
    </Form>
  );

  const registerForm = (
    <Form layout="vertical" onFinish={handleRegister}>
      <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
        <Input placeholder="you@example.com" />
      </Form.Item>
      <Form.Item name="password" label="Password" rules={[{ required: true, min: 8 }]}>
        <Input.Password placeholder="Min 8 characters" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          Register
        </Button>
      </Form.Item>
    </Form>
  );

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400 }}>
        <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
          OpEx Compare
        </Typography.Title>
        <Tabs
          centered
          items={[
            { key: 'login', label: 'Sign In', children: loginForm },
            { key: 'register', label: 'Register', children: registerForm },
          ]}
        />
      </Card>
    </div>
  );
}
