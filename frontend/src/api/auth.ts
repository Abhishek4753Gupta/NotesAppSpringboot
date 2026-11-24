import api from '../lib/axios'
import type { AuthRequest, AuthResponse } from '../types'

export async function login(payload: AuthRequest): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', payload)
  return data
}

export async function register(payload: AuthRequest): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', payload)
  return data
}