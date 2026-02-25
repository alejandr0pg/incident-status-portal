import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IncidentList } from '@/components/incidents/IncidentList'
import type { Incident } from '@/types'

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  refresh: jest.fn(),
  forward: jest.fn(),
}

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/dashboard/incidents',
}))

const sampleIncidents: Incident[] = [
  {
    id: 'inc-001',
    title: 'Database connection failure',
    description: 'Primary database is unreachable from all services.',
    severity: 'CRITICAL',
    status: 'OPEN',
    impactedServices: ['api', 'database'],
    createdById: 'user-1',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'inc-002',
    title: 'Slow API response times',
    description: 'API latency is above threshold.',
    severity: 'HIGH',
    status: 'INVESTIGATING',
    impactedServices: ['api'],
    createdById: 'user-2',
    createdAt: '2024-01-16T08:00:00Z',
    updatedAt: '2024-01-16T09:30:00Z',
  },
]

describe('IncidentList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders a list of incidents', () => {
    render(<IncidentList incidents={sampleIncidents} />)

    expect(screen.getByText('Database connection failure')).toBeInTheDocument()
    expect(screen.getByText('Slow API response times')).toBeInTheDocument()
  })

  it('renders severity badges for each incident', () => {
    render(<IncidentList incidents={sampleIncidents} />)

    expect(screen.getByText('Critical')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
  })

  it('renders status badges for each incident', () => {
    render(<IncidentList incidents={sampleIncidents} />)

    expect(screen.getByText('OPEN')).toBeInTheDocument()
    expect(screen.getByText('INVESTIGATING')).toBeInTheDocument()
  })

  it('shows EmptyState when no incidents are provided', () => {
    render(<IncidentList incidents={[]} />)

    expect(screen.getByText('No incidents found')).toBeInTheDocument()
  })

  it('shows EmptyState when incidents is undefined', () => {
    render(<IncidentList incidents={undefined} />)

    expect(screen.getByText('No incidents found')).toBeInTheDocument()
  })

  it('shows Spinner when isLoading is true', () => {
    render(<IncidentList isLoading />)

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows ErrorState on error', () => {
    const mockRetry = jest.fn()
    render(<IncidentList isError onRetry={mockRetry} />)

    expect(screen.getByText('Failed to load incidents.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('calls onRetry when retry button is clicked', async () => {
    const user = userEvent.setup()
    const mockRetry = jest.fn()
    render(<IncidentList isError onRetry={mockRetry} />)

    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(mockRetry).toHaveBeenCalledTimes(1)
  })

  it('navigates to detail page on incident click', async () => {
    const user = userEvent.setup()
    render(<IncidentList incidents={sampleIncidents} />)

    await user.click(screen.getByText('Database connection failure'))
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/incidents/inc-001')
  })

  it('shows impacted services when present', () => {
    render(<IncidentList incidents={sampleIncidents} />)

    expect(screen.getByText(/api, database/)).toBeInTheDocument()
  })
})
