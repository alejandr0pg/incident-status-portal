import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IncidentForm } from '@/components/incidents/IncidentForm'
import type { CreateIncidentDto } from '@/types'

describe('IncidentForm', () => {
  const mockOnSubmit = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders all form fields', () => {
    render(
      <IncidentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    )

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/severity/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/impacted services/i)).toBeInTheDocument()
  })

  it('shows validation errors on empty submit', async () => {
    const user = userEvent.setup()

    render(
      <IncidentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    )

    const titleInput = screen.getByLabelText(/title/i)
    await user.clear(titleInput)

    await user.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument()
    })

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with correct data when form is valid', async () => {
    const user = userEvent.setup()
    mockOnSubmit.mockResolvedValueOnce(undefined)

    render(
      <IncidentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    )

    await user.type(screen.getByLabelText(/title/i), 'Test Incident')
    await user.type(screen.getByLabelText(/description/i), 'Test description for the incident')

    await user.selectOptions(screen.getByLabelText(/severity/i), 'HIGH')
    await user.selectOptions(screen.getByLabelText(/status/i), 'OPEN')

    await user.type(
      screen.getByLabelText(/impacted services/i),
      'api, database'
    )

    await user.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining<Partial<CreateIncidentDto>>({
          title: 'Test Incident',
          description: 'Test description for the incident',
          severity: 'HIGH',
          status: 'OPEN',
          impactedServices: ['api', 'database'],
        })
      )
    })
  })

  it('shows severity select with all options', () => {
    render(
      <IncidentForm onSubmit={mockOnSubmit} />
    )

    const severitySelect = screen.getByLabelText(/severity/i)
    expect(severitySelect).toBeInTheDocument()

    const options = Array.from(
      (severitySelect as HTMLSelectElement).options
    ).map((o) => o.value)

    expect(options).toContain('CRITICAL')
    expect(options).toContain('HIGH')
    expect(options).toContain('MEDIUM')
    expect(options).toContain('LOW')
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()

    render(
      <IncidentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    )

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('renders with initial values for editing', () => {
    render(
      <IncidentForm
        onSubmit={mockOnSubmit}
        initialValues={{
          title: 'Existing Incident',
          description: 'Existing description',
          severity: 'CRITICAL',
          status: 'INVESTIGATING',
          impactedServices: ['auth', 'payments'],
        }}
      />
    )

    expect(screen.getByDisplayValue('Existing Incident')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Existing description')).toBeInTheDocument()
    expect(screen.getByDisplayValue('auth, payments')).toBeInTheDocument()
  })
})
