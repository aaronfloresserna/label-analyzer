import { render, screen } from '@testing-library/react'
import TokenPanel from './TokenPanel'

const props = { inputTokens: 1200, outputTokens: 450, elapsed: '14.3' }

describe('TokenPanel', () => {
  it('shows input tokens', () => {
    render(<TokenPanel {...props} />)
    expect(screen.getByText('1200')).toBeInTheDocument()
  })

  it('shows output tokens', () => {
    render(<TokenPanel {...props} />)
    expect(screen.getByText('450')).toBeInTheDocument()
  })

  it('shows total tokens', () => {
    render(<TokenPanel {...props} />)
    expect(screen.getByText('1650')).toBeInTheDocument()
  })

  it('shows elapsed with s suffix', () => {
    render(<TokenPanel {...props} />)
    expect(screen.getByText('14.3s')).toBeInTheDocument()
  })
})
