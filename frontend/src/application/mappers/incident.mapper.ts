import type { CreateIncidentDto } from '@/domain/types'
import type { IncidentFormValues } from '../validation/incident.schema'

export function mapFormValuesToDto(values: IncidentFormValues): CreateIncidentDto {
  return {
    title: values.title,
    description: values.description,
    severity: values.severity,
    status: values.status,
    impactedServices: (values.impactedServicesRaw ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  }
}
