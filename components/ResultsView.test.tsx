import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ResultsView from './ResultsView'
import type { LabelElement, TokenUsage } from '@/lib/types'

global.URL.createObjectURL = jest.fn(() => 'blob:mock')
global.URL.revokeObjectURL = jest.fn()

const elements: LabelElement[] = [
  { name: 'Título', type: 'texto', content: 'Agua Pura', position: 'centro', notes: '', materialType: 'texto' },
  { name: 'Logo marca', type: 'logo', content: 'AquaPura', position: 'arriba', notes: 'azul', materialType: 'logo' },
]
const usage: TokenUsage = { input_tokens: 1200, output_tokens: 400 }
const onReset = jest.fn()
const onElementChange = jest.fn()

const props = { imagePreview: 'data:image/jpeg;base64,abc', elements, usage, elapsed: '12.5', onReset, onElementChange }

beforeEach(() => { onReset.mockClear(); onElementChange.mockClear() })

describe('ResultsView', () => {
  it('renders all element cards', () => {
    render(<ResultsView {...props} />)
    expect(screen.getByText('Título')).toBeInTheDocument()
    expect(screen.getByText('Logo marca')).toBeInTheDocument()
  })

  it('shows total tokens', () => {
    render(<ResultsView {...props} />)
    expect(screen.getByText('1600')).toBeInTheDocument()
  })

  it('calls onReset when Nueva imagen clicked', async () => {
    render(<ResultsView {...props} />)
    await userEvent.click(screen.getByRole('button', { name: /nueva imagen/i }))
    expect(onReset).toHaveBeenCalled()
  })

  it('renders Exportar JSON button', () => {
    render(<ResultsView {...props} />)
    expect(screen.getByRole('button', { name: /exportar/i })).toBeInTheDocument()
  })
})
