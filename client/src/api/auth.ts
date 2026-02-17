import client from './client';
import type { AuthResponse } from '../types';

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await client.post('/auth/login', { email, password });
  return res.data.data;
}

export async function register(email: string, password: string, role?: string): Promise<AuthResponse> {
  const res = await client.post('/auth/register', { email, password, role });
  return res.data.data;
}

export async function getProfile(): Promise<{ id: string; email: string; role: string }> {
  const res = await client.get('/auth/profile');
  return res.data.data;
}
