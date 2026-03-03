import apiClient from '@/lib/axios'
import type { ApiResponse, PaginatedResponse, AuditLog, AuditFilters } from '@/types'

export async function listAuditLogs(
  filters?: AuditFilters
): Promise<ApiResponse<PaginatedResponse<AuditLog>>> {
  const params = new URLSearchParams()
  if (filters?.entityId) params.set('entityId', filters.entityId)

  const response = await apiClient.get<ApiResponse<PaginatedResponse<AuditLog>>>(
    `/audit?${params.toString()}`
  )
  return response.data
}
