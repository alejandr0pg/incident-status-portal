import apiClient from '@/lib/axios'
import type { ApiResponse, User } from '@/types'

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  user: User
}

export async function login(
  email: string,
  password: string
): Promise<ApiResponse<LoginResponse>> {
  const response = await apiClient.post<ApiResponse<LoginResponse>>(
    '/auth/login',
    { email, password }
  )
  return response.data
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout')
}

export async function getMe(): Promise<ApiResponse<User>> {
  const response = await apiClient.get<ApiResponse<User>>('/auth/me')
  return response.data
}
