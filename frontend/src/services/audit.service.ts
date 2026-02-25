import apiClient from '@/lib/axios'
import type { ApiResponse, AuditLog, AuditFilters } from '@/types'

export async function listAuditLogs(
  filters?: AuditFilters
): Promise<ApiResponse<AuditLog[]>> {
  const params = new URLSearchParams()
  if (filters?.entityId) params.set('entityId', filters.entityId)

  const response = await apiClient.get<ApiResponse<AuditLog[]>>(
    `/audit?${params.toString()}`
  )
  return response.data
}
