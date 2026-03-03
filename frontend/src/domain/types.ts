export type Role = 'ADMIN' | 'USER'
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED'

export interface User {
  id: string
  email: string
  role: Role
  createdAt: string
}

export interface Incident {
  id: string
  title: string
  description: string
  severity: Severity
  status: IncidentStatus
  impactedServices: string[]
  createdById: string
  createdAt: string
  updatedAt: string
}

export interface AuditLog {
  id: string
  actorId: string
  action: string
  entityType: string
  entityId: string
  beforeSnapshot?: unknown
  afterSnapshot?: unknown
  timestamp: string
}

export interface ApiResponse<T> {
  data: T
  message: string
  timestamp: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface IncidentFilters {
  status?: IncidentStatus
  severity?: Severity
}

export interface AuditFilters {
  entityId?: string
}

export interface CreateIncidentDto {
  title: string
  description: string
  severity: Severity
  status: IncidentStatus
  impactedServices: string[]
}

export interface UpdateIncidentDto {
  title?: string
  description?: string
  severity?: Severity
  status?: IncidentStatus
  impactedServices?: string[]
}
