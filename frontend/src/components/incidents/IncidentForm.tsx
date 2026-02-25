'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { incidentSchema, type IncidentFormValues } from '@/application/validation/incident.schema'
import { mapFormValuesToDto } from '@/application/mappers/incident.mapper'
import { SEVERITY_OPTIONS, STATUS_OPTIONS } from '@/domain/constants'
import type { Incident, CreateIncidentDto } from '@/domain/types'

interface IncidentFormProps {
  initialValues?: Partial<Incident>
  onSubmit: (data: CreateIncidentDto) => void | Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  submitLabel?: string
}

export function IncidentForm({
  initialValues,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Submit',
}: IncidentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      title: initialValues?.title ?? '',
      description: initialValues?.description ?? '',
      severity: initialValues?.severity ?? 'MEDIUM',
      status: initialValues?.status ?? 'OPEN',
      impactedServicesRaw: initialValues?.impactedServices?.join(', ') ?? '',
    },
  })

  async function handleFormSubmit(values: IncidentFormValues) {
    await onSubmit(mapFormValuesToDto(values))
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <Input
        label="Title"
        {...register('title')}
        error={errors.title?.message}
        placeholder="Brief incident title"
      />

      <div className="w-full">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          {...register('description')}
          rows={4}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Detailed description of the incident"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="w-full">
          <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-1">
            Severity
          </label>
          <select
            id="severity"
            {...register('severity')}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SEVERITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {errors.severity && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {errors.severity.message}
            </p>
          )}
        </div>

        <div className="w-full">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            {...register('status')}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {errors.status && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {errors.status.message}
            </p>
          )}
        </div>
      </div>

      <Input
        label="Impacted Services"
        {...register('impactedServicesRaw')}
        error={errors.impactedServicesRaw?.message}
        placeholder="api, database, auth (comma-separated)"
        helperText="Enter service names separated by commas"
      />

      <div className="flex gap-3 justify-end pt-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isLoading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
