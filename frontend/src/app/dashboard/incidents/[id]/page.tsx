'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { IncidentForm } from '@/components/incidents/IncidentForm'
import { SeverityBadge } from '@/components/incidents/SeverityBadge'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorState } from '@/components/ui/ErrorState'
import { useIncident, useUpdateIncident, useDeleteIncident } from '@/hooks/useIncidents'
import { useAuth } from '@/hooks/useAuth'
import { canDeleteIncident } from '@/application/authorization'
import { formatDate } from '@/application/utils/date'
import { STATUS_COLOR_MAP } from '@/domain/constants'
import type { CreateIncidentDto } from '@/domain/types'

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { data, isLoading, isError, refetch } = useIncident(id)
  const updateMutation = useUpdateIncident()
  const deleteMutation = useDeleteIncident()
  const { user } = useAuth()

  const incident = data?.data

  async function handleUpdate(formData: CreateIncidentDto) {
    await updateMutation.mutateAsync({ id, data: formData })
    setIsEditing(false)
  }

  async function handleDelete() {
    await deleteMutation.mutateAsync(id)
    router.push('/dashboard/incidents')
  }

  if (isLoading) return <Spinner size="lg" className="py-24" />
  if (isError || !incident) {
    return <ErrorState message="Failed to load incident." onRetry={() => refetch()} />
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          Back
        </Button>
        <div className="flex-1" />
        <Button variant="secondary" size="sm" onClick={() => setIsEditing((v) => !v)}>
          {isEditing ? 'Cancel Edit' : 'Edit'}
        </Button>
        {canDeleteIncident(user) && (
          <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>
            Delete
          </Button>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 font-medium mb-3">
            Are you sure you want to delete this incident? This action cannot be undone.
          </p>
          <div className="flex gap-2">
            <Button variant="danger" size="sm" isLoading={deleteMutation.isPending} onClick={handleDelete}>
              Delete
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        {isEditing ? (
          <>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Incident</h2>
            <IncidentForm
              initialValues={incident}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
              isLoading={updateMutation.isPending}
              submitLabel="Save Changes"
            />
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900 flex-1">{incident.title}</h1>
              <SeverityBadge severity={incident.severity} />
              <Badge color={STATUS_COLOR_MAP[incident.status]}>{incident.status}</Badge>
            </div>
            <p className="text-gray-600 whitespace-pre-wrap">{incident.description}</p>
            {incident.impactedServices.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Impacted Services</p>
                <div className="flex flex-wrap gap-2">
                  {incident.impactedServices.map((svc) => (
                    <Badge key={svc} color="gray" size="sm">{svc}</Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="pt-4 border-t border-gray-100 text-xs text-gray-400 space-y-1">
              <p>Created: {formatDate(incident.createdAt)}</p>
              <p>Updated: {formatDate(incident.updatedAt)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
