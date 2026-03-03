'use client'

import { useState } from 'react'
import { AuditTable } from '@/components/audit/AuditTable'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuditLogs } from '@/hooks/useAudit'
import type { AuditFilters } from '@/types'

export default function AuditPage() {
  const [entityIdInput, setEntityIdInput] = useState('')
  const [filters, setFilters] = useState<AuditFilters>({})

  const { data, isLoading, isError, refetch } = useAuditLogs(filters)

  function handleApply() {
    const newFilters: AuditFilters = {}
    if (entityIdInput.trim()) {
      newFilters.entityId = entityIdInput.trim()
    }
    setFilters(newFilters)
  }

  function handleClear() {
    setEntityIdInput('')
    setFilters({})
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track all changes and actions in the system
        </p>
      </div>

      <div className="mb-4 flex items-end gap-3 p-4 bg-white border border-gray-200 rounded-lg">
        <div className="flex-1 max-w-sm">
          <Input
            label="Filter by Entity ID"
            value={entityIdInput}
            onChange={(e) => setEntityIdInput(e.target.value)}
            placeholder="Enter entity UUID..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleApply()
            }}
          />
        </div>
        <Button onClick={handleApply}>Apply</Button>
        <Button variant="secondary" onClick={handleClear}>
          Clear
        </Button>
      </div>

      <AuditTable
        logs={data?.data}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
      />
    </div>
  )
}
