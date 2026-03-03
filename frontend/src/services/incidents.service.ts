import apiClient from '@/lib/axios'
import type {
  ApiResponse,
  PaginatedResponse,
  Incident,
  IncidentFilters,
  CreateIncidentDto,
  UpdateIncidentDto,
} from '@/types'

export async function listIncidents(
  filters?: IncidentFilters
): Promise<PaginatedResponse<Incident>> {
  const params = new URLSearchParams()
  if (filters?.status) params.set('status', filters.status)
  if (filters?.severity) params.set('severity', filters.severity)

  const response = await apiClient.get<ApiResponse<PaginatedResponse<Incident>>>(
    `/incidents?${params.toString()}`
  )
  return response.data.data
}

export async function getIncident(id: string): Promise<ApiResponse<Incident>> {
  const response = await apiClient.get<ApiResponse<Incident>>(
    `/incidents/${id}`
  )
  return response.data
}

export async function createIncident(
  data: CreateIncidentDto
): Promise<ApiResponse<Incident>> {
  const response = await apiClient.post<ApiResponse<Incident>>(
    '/incidents',
    data
  )
  return response.data
}

export async function updateIncident(
  id: string,
  data: UpdateIncidentDto
): Promise<ApiResponse<Incident>> {
  const response = await apiClient.put<ApiResponse<Incident>>(
    `/incidents/${id}`,
    data
  )
  return response.data
}

export async function deleteIncident(id: string): Promise<void> {
  await apiClient.delete(`/incidents/${id}`)
}
