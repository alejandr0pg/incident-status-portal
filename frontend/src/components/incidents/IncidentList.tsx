'use client'

import { useRouter } from 'next/navigation'
import { SeverityBadge } from './SeverityBadge'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { STATUS_COLOR_MAP } from '@/domain/constants'
import { formatDate } from '@/application/utils/date'
import type { Incident } from '@/domain/types'

interface IncidentListProps {
  incidents?: Incident[]
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  onCreateClick?: () => void
}

export function IncidentList({
  incidents,
  isLoading,
  isError,
  onRetry,
  onCreateClick,
}: IncidentListProps) {
  const router = useRouter()

  if (isLoading) {
    return <Spinner size="lg" className="py-16" />
  }

  if (isError) {
    return <ErrorState message="Failed to load incidents." onRetry={onRetry} />
  }

  if (!incidents || incidents.length === 0) {
    return (
      <EmptyState
        title="No incidents found"
        description="Get started by creating your first incident."
        action={onCreateClick ? { label: 'Create Incident', onClick: onCreateClick } : undefined}
      />
    )
  }

  return (
    <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white overflow-hidden">
      {incidents.map((incident) => (
        <div
          key={incident.id}
          className="flex items-start gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          onClick={() => router.push(`/dashboard/incidents?id=${incident.id}`)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter') router.push(`/dashboard/incidents?id=${incident.id}`)
          }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {incident.title}
              </h3>
              <SeverityBadge severity={incident.severity} size="sm" />
              <Badge color={STATUS_COLOR_MAP[incident.status]} size="sm">
                {incident.status}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{incident.description}</p>
            {incident.impactedServices.length > 0 && (
              <p className="mt-1 text-xs text-gray-400">
                Services: {incident.impactedServices.join(', ')}
              </p>
            )}
          </div>
          <div className="text-xs text-gray-400 whitespace-nowrap shrink-0">
            {formatDate(incident.createdAt)}
          </div>
        </div>
      ))}
    </div>
  )
}
