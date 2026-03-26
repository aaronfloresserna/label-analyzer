import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UploadZone from './UploadZone'

jest.mock('@/lib/imageUtils', () => ({
  compressImage: jest.fn().mockResolvedValue({ base64: 'mock-base64', mediaType: 'image/jpeg' }),
}))

global.URL.createObjectURL = jest.fn(() => 'blob:mock')
global.URL.revokeObjectURL = jest.fn()

const mockOnAnalyze = jest.fn()
beforeEach(() => mockOnAnalyze.mockClear())

describe('UploadZone', () => {
  it('renders upload instructions', () => {
    render(<UploadZone onAnalyze={mockOnAnalyze} />)
    expect(screen.getByText(/arrastra/i)).toBeInTheDocument()
  })

  it('shows Analizar button disabled when no image', () => {
    render(<UploadZone onAnalyze={mockOnAnalyze} />)
    expect(screen.getByRole('button', { name: /analizar/i })).toBeDisabled()
  })

  it('enables Analizar button after file selected', async () => {
    render(<UploadZone onAnalyze={mockOnAnalyze} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['img'], 'label.jpg', { type: 'image/jpeg' })
    await userEvent.upload(input, file)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /analizar/i })).not.toBeDisabled()
    })
  })

  it('calls onAnalyze with base64 and mediaType when Analizar clicked', async () => {
    render(<UploadZone onAnalyze={mockOnAnalyze} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['img'], 'label.jpg', { type: 'image/jpeg' })
    await userEvent.upload(input, file)
    await waitFor(() => expect(screen.getByRole('button', { name: /analizar/i })).not.toBeDisabled())
    await userEvent.click(screen.getByRole('button', { name: /analizar/i }))
    expect(mockOnAnalyze).toHaveBeenCalledWith('mock-base64', 'image/jpeg')
  })
})
