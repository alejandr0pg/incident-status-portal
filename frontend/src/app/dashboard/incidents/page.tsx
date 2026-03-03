'use client'

import { useState } from 'react'
import { IncidentFilters } from '@/components/incidents/IncidentFilters'
import { IncidentList } from '@/components/incidents/IncidentList'
import { IncidentForm } from '@/components/incidents/IncidentForm'
import { Button } from '@/components/ui/Button'
import { useIncidents, useCreateIncident } from '@/hooks/useIncidents'
import type { IncidentFilters as IncidentFiltersType, CreateIncidentDto } from '@/types'

export default function IncidentsPage() {
  const [filters, setFilters] = useState<IncidentFiltersType>({})
  const [showCreateForm, setShowCreateForm] = useState(false)

  const { data, isLoading, isError, refetch } = useIncidents(filters)
  const createMutation = useCreateIncident()

  async function handleCreate(formData: CreateIncidentDto) {
    await createMutation.mutateAsync(formData)
    setShowCreateForm(false)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incidents</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and track all incidents
          </p>
        </div>
        <Button onClick={() => setShowCreateForm((v) => !v)}>
          {showCreateForm ? 'Cancel' : 'Create Incident'}
        </Button>
      </div>

      {showCreateForm && (
        <div className="mb-6 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            New Incident
          </h2>
          <IncidentForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateForm(false)}
            isLoading={createMutation.isPending}
            submitLabel="Create Incident"
          />
          {createMutation.isError && (
            <p className="mt-3 text-sm text-red-600">
              Failed to create incident. Please try again.
            </p>
          )}
        </div>
      )}

      <div className="mb-4">
        <IncidentFilters onApply={setFilters} initialFilters={filters} />
      </div>

      <IncidentList
        incidents={data?.data.data}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        onCreateClick={() => setShowCreateForm(true)}
      />
    </div>
  )
}
