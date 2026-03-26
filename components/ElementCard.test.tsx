import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ElementCard from './ElementCard'
import type { LabelElement } from '@/lib/types'

const element: LabelElement = {
  name: 'Nombre de marca',
  type: 'logo',
  content: 'AquaPura',
  position: 'arriba centro',
  notes: 'Color azul, tamaño grande',
  materialType: 'logo',
}

const mockOnChange = jest.fn()
beforeEach(() => mockOnChange.mockClear())

describe('ElementCard', () => {
  it('renders element name and content', () => {
    render(<ElementCard index={0} element={element} onChange={mockOnChange} />)
    expect(screen.getByText('Nombre de marca')).toBeInTheDocument()
    expect(screen.getByText('AquaPura')).toBeInTheDocument()
  })

  it('renders position badge', () => {
    render(<ElementCard index={0} element={element} onChange={mockOnChange} />)
    expect(screen.getByText(/arriba centro/)).toBeInTheDocument()
  })

  it('pre-selects materialType as active button', () => {
    render(<ElementCard index={0} element={element} onChange={mockOnChange} />)
    expect(screen.getByRole('button', { name: /logo/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls onChange when different type selected', async () => {
    render(<ElementCard index={0} element={element} onChange={mockOnChange} />)
    await userEvent.click(screen.getByRole('button', { name: /^texto/i }))
    expect(mockOnChange).toHaveBeenCalledWith(0, 'texto')
  })
})
