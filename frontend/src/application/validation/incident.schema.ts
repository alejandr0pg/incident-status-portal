import { z } from 'zod'

export const incidentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required'),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], {
    required_error: 'Severity is required',
  }),
  status: z.enum(['OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'], {
    required_error: 'Status is required',
  }),
  impactedServicesRaw: z.string().optional(),
})

export type IncidentFormValues = z.infer<typeof incidentSchema>
