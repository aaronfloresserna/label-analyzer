import { render, screen } from '@testing-library/react'
import AnalyzingView from './AnalyzingView'

describe('AnalyzingView', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  it('renders analyzing message', () => {
    render(<AnalyzingView />)
    expect(screen.getByText(/analizando etiqueta/i)).toBeInTheDocument()
  })

  it('shows elapsed time starting at 0.0s', () => {
    render(<AnalyzingView />)
    expect(screen.getByText('0.0s')).toBeInTheDocument()
  })
})
