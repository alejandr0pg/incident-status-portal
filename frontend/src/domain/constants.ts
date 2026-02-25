import type { Severity, IncidentStatus } from './types'

export const SEVERITY_OPTIONS: { label: string; value: Severity }[] = [
  { label: 'Critical', value: 'CRITICAL' },
  { label: 'High', value: 'HIGH' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'Low', value: 'LOW' },
]

export const STATUS_OPTIONS: { label: string; value: IncidentStatus }[] = [
  { label: 'Open', value: 'OPEN' },
  { label: 'Investigating', value: 'INVESTIGATING' },
  { label: 'Resolved', value: 'RESOLVED' },
  { label: 'Closed', value: 'CLOSED' },
]

export const SEVERITY_COLOR_MAP: Record<Severity, 'red' | 'orange' | 'yellow' | 'green'> = {
  CRITICAL: 'red',
  HIGH: 'orange',
  MEDIUM: 'yellow',
  LOW: 'green',
}

export const SEVERITY_LABEL_MAP: Record<Severity, string> = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
}

export const STATUS_COLOR_MAP: Record<IncidentStatus, 'blue' | 'purple' | 'green' | 'gray'> = {
  OPEN: 'blue',
  INVESTIGATING: 'purple',
  RESOLVED: 'green',
  CLOSED: 'gray',
}
