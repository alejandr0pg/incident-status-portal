'use client'

import { useState } from 'react'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import type { AuditLog } from '@/types'

interface AuditTableProps {
  logs?: AuditLog[]
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
}

function SnapshotRow({ label, data }: { label: string; data: unknown }) {
  if (!data) return null
  return (
    <div className="mt-2">
      <p className="text-xs font-semibold text-gray-500 mb-1">{label}:</p>
      <pre className="text-xs bg-gray-100 rounded p-2 overflow-auto max-h-32 text-gray-700">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}

function AuditRow({ log }: { log: AuditLog }) {
  const [expanded, setExpanded] = useState(false)
  const hasSnapshot = log.beforeSnapshot != null || log.afterSnapshot != null

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-4 py-3 text-sm text-gray-600 font-mono truncate max-w-[120px]">
          {log.actorId}
        </td>
        <td className="px-4 py-3 text-sm font-medium text-gray-900">{log.action}</td>
        <td className="px-4 py-3 text-sm text-gray-600">{log.entityType}</td>
        <td className="px-4 py-3 text-sm text-gray-600 font-mono truncate max-w-[120px]">
          {log.entityId}
        </td>
        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
          {new Date(log.timestamp).toLocaleString()}
        </td>
        <td className="px-4 py-3 text-sm">
          {hasSnapshot && (
            <button
              onClick={() => setExpanded((prev) => !prev)}
              className="text-blue-600 hover:text-blue-800 text-xs font-medium"
            >
              {expanded ? 'Hide' : 'Show'} diff
            </button>
          )}
        </td>
      </tr>
      {expanded && hasSnapshot && (
        <tr>
          <td colSpan={6} className="px-4 pb-4 bg-gray-50">
            <SnapshotRow label="Before" data={log.beforeSnapshot} />
            <SnapshotRow label="After" data={log.afterSnapshot} />
          </td>
        </tr>
      )}
    </>
  )
}

export function AuditTable({ logs, isLoading, isError, onRetry }: AuditTableProps) {
  if (isLoading) return <Spinner size="lg" className="py-16" />
  if (isError) return <ErrorState message="Failed to load audit logs." onRetry={onRetry} />
  if (!logs || logs.length === 0) {
    return <EmptyState title="No audit logs found" description="No activity has been recorded yet." />
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {['Actor', 'Action', 'Entity Type', 'Entity ID', 'Timestamp', ''].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {logs.map((log) => (
            <AuditRow key={log.id} log={log} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
