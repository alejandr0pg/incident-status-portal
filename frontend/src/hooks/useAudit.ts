'use client'

import { useQuery } from '@tanstack/react-query'
import { listAuditLogs } from '@/services/audit.service'
import type { AuditFilters } from '@/types'

const AUDIT_KEY = ['audit']

export function useAuditLogs(filters?: AuditFilters) {
  return useQuery({
    queryKey: [...AUDIT_KEY, filters],
    queryFn: () => listAuditLogs(filters),
  })
}
