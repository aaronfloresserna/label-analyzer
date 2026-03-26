import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Page from './page'

jest.mock('@/components/UploadZone', () => ({
  __esModule: true,
  default: ({ onAnalyze }: { onAnalyze: (b: string, m: string) => void }) => (
    <button onClick={() => onAnalyze('base64', 'image/jpeg')}>mock-upload</button>
  ),
}))

jest.mock('@/components/AnalyzingView', () => ({
  __esModule: true,
  default: () => <div>mock-analyzing</div>,
}))

jest.mock('@/components/ResultsView', () => ({
  __esModule: true,
  default: ({ onReset }: { onReset: () => void }) => (
    <button onClick={onReset}>mock-reset</button>
  ),
}))

// Controllable deferred promise helper
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(r => { resolve = r })
  return { promise, resolve }
}

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue({
      elements: [{ name: 'T', type: 'texto', content: 'x', position: 'c', notes: '', materialType: 'texto' }],
      usage: { input_tokens: 100, output_tokens: 50 },
      elapsed: '5.0',
    }),
  } as any)
})

afterEach(() => jest.resetAllMocks())

describe('Page', () => {
  it('starts in upload view', () => {
    render(<Page />)
    expect(screen.getByText('mock-upload')).toBeInTheDocument()
  })

  it('transitions to analyzing then results', async () => {
    const { promise, resolve } = deferred<{
      ok: boolean
      json: () => Promise<unknown>
    }>()
    global.fetch = jest.fn().mockReturnValue(promise)

    render(<Page />)
    await userEvent.click(screen.getByText('mock-upload'))

    // analyzing state is visible while fetch is pending
    expect(screen.getByText('mock-analyzing')).toBeInTheDocument()

    // now resolve the fetch
    resolve({
      ok: true,
      json: () => Promise.resolve({
        elements: [{ name: 'T', type: 'texto', content: 'x', position: 'c', notes: '', materialType: 'texto' }],
        usage: { input_tokens: 100, output_tokens: 50 },
        elapsed: '5.0',
      }),
    })

    await waitFor(() => expect(screen.getByText('mock-reset')).toBeInTheDocument())
  })

  it('resets to upload when onReset called', async () => {
    render(<Page />)
    await userEvent.click(screen.getByText('mock-upload'))
    await waitFor(() => screen.getByText('mock-reset'))
    await userEvent.click(screen.getByText('mock-reset'))
    expect(screen.getByText('mock-upload')).toBeInTheDocument()
  })

  it('shows error and returns to upload when fetch fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ error: 'API key inválida' }),
    } as any)
    render(<Page />)
    await userEvent.click(screen.getByText('mock-upload'))
    await waitFor(() => expect(screen.getByText('API key inválida')).toBeInTheDocument())
    expect(screen.getByText('mock-upload')).toBeInTheDocument()
  })
})
