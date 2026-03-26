/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'

const mockElements = [
  { name: 'Título', type: 'texto', content: 'Agua Pura', position: 'centro', notes: 'negrita' }
]

beforeEach(() => {
  process.env.ANTHROPIC_API_KEY = 'test-key'
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify(mockElements) }],
      usage: { input_tokens: 120, output_tokens: 80 },
    }),
  } as any)
})

afterEach(() => jest.resetAllMocks())

describe('POST /api/analyze', () => {
  it('returns elements with materialType and usage on success', async () => {
    const { POST } = await import('./route')
    const req = new NextRequest('http://localhost/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ image: 'base64data', mediaType: 'image/jpeg' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.elements).toHaveLength(1)
    expect(data.elements[0].materialType).toBe('texto')
    expect(data.usage.input_tokens).toBe(120)
    expect(typeof data.elapsed).toBe('string')
  })

  it('returns 500 when Anthropic returns an error', async () => {
    const { POST } = await import('./route')
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue({ error: { message: 'invalid key' } }),
    })

    const req = new NextRequest('http://localhost/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ image: 'bad', mediaType: 'image/jpeg' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
