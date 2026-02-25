'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { SEVERITY_OPTIONS, STATUS_OPTIONS } from '@/domain/constants'
import type { IncidentFilters as IncidentFiltersType, IncidentStatus, Severity } from '@/domain/types'

interface IncidentFiltersProps {
  onApply: (filters: IncidentFiltersType) => void
  initialFilters?: IncidentFiltersType
}

export function IncidentFilters({ onApply, initialFilters = {} }: IncidentFiltersProps) {
  const [status, setStatus] = useState<IncidentStatus | ''>(initialFilters.status ?? '')
  const [severity, setSeverity] = useState<Severity | ''>(initialFilters.severity ?? '')

  function handleApply() {
    const filters: IncidentFiltersType = {}
    if (status) filters.status = status
    if (severity) filters.severity = severity
    onApply(filters)
  }

  function handleClear() {
    setStatus('')
    setSeverity('')
    onApply({})
  }

  return (
    <div className="flex flex-wrap gap-3 items-end p-4 bg-white border border-gray-200 rounded-lg">
      <div className="flex flex-col gap-1 min-w-[150px]">
        <label className="text-sm font-medium text-gray-700">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as IncidentStatus | '')}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1 min-w-[150px]">
        <label className="text-sm font-medium text-gray-700">Severity</label>
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value as Severity | '')}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All severities</option>
          {SEVERITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleApply}>Apply</Button>
        <Button variant="secondary" onClick={handleClear}>Clear</Button>
      </div>
    </div>
  )
}
