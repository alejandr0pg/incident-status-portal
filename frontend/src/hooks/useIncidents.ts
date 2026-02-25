'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listIncidents,
  getIncident,
  createIncident,
  updateIncident,
  deleteIncident,
} from '@/services/incidents.service'
import type { IncidentFilters, CreateIncidentDto, UpdateIncidentDto } from '@/types'

const INCIDENTS_KEY = ['incidents']
const incidentKey = (id: string) => ['incident', id]

export function useIncidents(filters?: IncidentFilters) {
  return useQuery({
    queryKey: [...INCIDENTS_KEY, filters],
    queryFn: () => listIncidents(filters),
  })
}

export function useIncident(id: string) {
  return useQuery({
    queryKey: incidentKey(id),
    queryFn: () => getIncident(id),
    enabled: Boolean(id),
  })
}

export function useCreateIncident() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateIncidentDto) => createIncident(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INCIDENTS_KEY })
    },
  })
}

export function useUpdateIncident() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIncidentDto }) =>
      updateIncident(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: INCIDENTS_KEY })
      queryClient.invalidateQueries({ queryKey: incidentKey(id) })
    },
  })
}

export function useDeleteIncident() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteIncident(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INCIDENTS_KEY })
    },
  })
}
