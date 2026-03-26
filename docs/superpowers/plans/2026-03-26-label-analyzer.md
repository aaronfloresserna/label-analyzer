# Label Analyzer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js (App Router) web app where users upload product label images, Claude Vision identifies every visual element, and results appear as editable cards with material type selectors.

**Architecture:** Single Next.js project. `app/api/analyze/route.ts` proxies requests to Anthropic API server-side (API key never exposed to browser). `app/page.tsx` manages three views: upload → analyzing → results. All components are typed with shared interfaces from `lib/types.ts`.

**Tech Stack:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, Google Fonts (DM Sans + JetBrains Mono), Jest + React Testing Library, Anthropic API (via fetch).

---

### Task 1: Project Scaffold + Jest Setup

**Files:**
- Create: project root via `create-next-app`
- Create: `jest.config.ts`
- Create: `jest.setup.ts`
- Create: `.env.local`

- [ ] **Step 1: Scaffold Next.js project**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --yes
```

Expected: Project files created including `app/`, `tailwind.config.ts`, `tsconfig.json`, `next.config.ts`.

- [ ] **Step 2: Install Jest + React Testing Library**

```bash
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-canvas-mock
```

- [ ] **Step 3: Create jest.config.ts**

```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
}

export default createJestConfig(config)
```

- [ ] **Step 4: Create jest.setup.ts**

```typescript
import '@testing-library/jest-dom'
import 'jest-canvas-mock'
```

- [ ] **Step 5: Add test script to package.json**

In `package.json` scripts section, add:
```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 6: Create .env.local**

```
ANTHROPIC_API_KEY=your-key-here
```

- [ ] **Step 7: Verify Jest setup**

```bash
npm test -- --passWithNoTests
```

Expected: "Test Suites: 0 passed, 0 total"

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js project with Jest + RTL"
```

---

### Task 2: Types and Image Utilities

**Files:**
- Create: `lib/types.ts`
- Create: `lib/imageUtils.ts`
- Create: `lib/imageUtils.test.ts`

- [ ] **Step 1: Write failing tests**

Create `lib/imageUtils.test.ts`:

```typescript
import { calculateDimensions } from './imageUtils'

describe('calculateDimensions', () => {
  it('returns original dimensions when both sides are under max', () => {
    expect(calculateDimensions(400, 300, 800)).toEqual({ width: 400, height: 300 })
  })

  it('scales down wide image keeping aspect ratio', () => {
    expect(calculateDimensions(1600, 900, 800)).toEqual({ width: 800, height: 450 })
  })

  it('scales down tall image keeping aspect ratio', () => {
    expect(calculateDimensions(600, 1200, 800)).toEqual({ width: 400, height: 800 })
  })

  it('scales down square image', () => {
    expect(calculateDimensions(1000, 1000, 800)).toEqual({ width: 800, height: 800 })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test lib/imageUtils.test.ts
```

Expected: FAIL — "Cannot find module './imageUtils'"

- [ ] **Step 3: Create lib/types.ts**

```typescript
export type MaterialType = 'texto' | 'imagen' | 'logo' | 'icono' | 'codigo_barras'

export interface LabelElement {
  name: string
  type: MaterialType
  content: string
  position: string
  notes: string
  materialType: MaterialType
}

export interface TokenUsage {
  input_tokens: number
  output_tokens: number
}

export interface AnalyzeResponse {
  elements: LabelElement[]
  usage: TokenUsage
  elapsed: string
}
```

- [ ] **Step 4: Create lib/imageUtils.ts**

```typescript
export function calculateDimensions(
  width: number,
  height: number,
  max: number
): { width: number; height: number } {
  if (width <= max && height <= max) return { width, height }
  if (width >= height) {
    return { width: max, height: Math.round((height * max) / width) }
  }
  return { width: Math.round((width * max) / height), height: max }
}

export async function compressImage(
  file: File
): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const { width, height } = calculateDimensions(img.width, img.height, 800)
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
      const base64 = dataUrl.split(',')[1]
      URL.revokeObjectURL(url)
      resolve({ base64, mediaType: 'image/jpeg' })
    }
    img.onerror = reject
    img.src = url
  })
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test lib/imageUtils.test.ts
```

Expected: PASS — 4 tests pass.

- [ ] **Step 6: Commit**

```bash
git add lib/
git commit -m "feat: add shared types and image compression utility"
```

---

### Task 3: API Route

**Files:**
- Create: `app/api/analyze/route.ts`
- Create: `app/api/analyze/route.test.ts`

- [ ] **Step 1: Write failing tests**

Create `app/api/analyze/route.test.ts`:

```typescript
import { NextRequest } from 'next/server'

const mockElements = [
  { name: 'Título', type: 'texto', content: 'Agua Pura', position: 'centro', notes: 'negrita' }
]

beforeEach(() => {
  process.env.ANTHROPIC_API_KEY = 'test-key'
  global.fetch = jest.fn().mockResolvedValue({
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test app/api/analyze/route.test.ts
```

Expected: FAIL — "Cannot find module './route'"

- [ ] **Step 3: Create app/api/analyze/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import type { LabelElement, MaterialType } from '@/lib/types'

const PROMPT = `Analiza esta imagen de etiqueta de producto. Identifica TODOS los elementos visuales individuales.

Para cada elemento devuelve:
- name: nombre descriptivo del elemento
- type: uno exactamente de: "texto", "imagen", "logo", "icono", "codigo_barras"
- content: el contenido (texto literal si es texto, descripción si es imagen/logo/ícono)
- position: ubicación en la etiqueta (e.g., "arriba izquierda", "centro", "abajo derecha")
- notes: observaciones relevantes (color, tamaño relativo, estilo tipográfico, etc.)

Responde SOLO con un array JSON, sin markdown, sin backticks:
[{"name":"...","type":"...","content":"...","position":"...","notes":"..."}]`

export async function POST(req: NextRequest) {
  try {
    const { image, mediaType } = await req.json()
    const start = Date.now()

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
            { type: 'text', text: PROMPT },
          ],
        }],
      }),
    })

    const data = await response.json()

    if (data.error) {
      return NextResponse.json(
        { error: 'Error al conectar con la IA: ' + data.error.message },
        { status: 500 }
      )
    }

    const text: string = data.content
      ?.filter((b: { type: string }) => b.type === 'text')
      .map((b: { text: string }) => b.text)
      .join('') ?? ''

    const rawElements = JSON.parse(text.replace(/```json|```/g, '').trim())
    const elements: LabelElement[] = rawElements.map(
      (el: Omit<LabelElement, 'materialType'>) => ({ ...el, materialType: el.type as MaterialType })
    )

    return NextResponse.json({
      elements,
      usage: data.usage,
      elapsed: ((Date.now() - start) / 1000).toFixed(1),
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: 'Error al procesar la imagen. Intenta de nuevo.' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 4: Run tests**

```bash
npm test app/api/analyze/route.test.ts
```

Expected: PASS — 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/api/
git commit -m "feat: add /api/analyze route handler proxying Anthropic API"
```

---

### Task 4: UploadZone Component

**Files:**
- Create: `components/UploadZone.tsx`
- Create: `components/UploadZone.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `components/UploadZone.test.tsx`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test components/UploadZone.test.tsx
```

Expected: FAIL — "Cannot find module './UploadZone'"

- [ ] **Step 3: Create components/UploadZone.tsx**

```tsx
'use client'

import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { compressImage } from '@/lib/imageUtils'

interface Props {
  onAnalyze: (base64: string, mediaType: string) => void
}

export default function UploadZone({ onAnalyze }: Props) {
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileSize, setFileSize] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [compressed, setCompressed] = useState<{ base64: string; mediaType: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return
    setFileName(file.name)
    setFileSize((file.size / 1024).toFixed(0) + ' KB')
    setPreview(URL.createObjectURL(file))
    const result = await compressImage(file)
    setCompressed(result)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0])
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0])
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Analizador de Etiquetas</h1>
      <p className="text-slate-500 mb-8">Sube una imagen de etiqueta para identificar sus elementos visuales</p>

      <div
        className={`w-full max-w-lg border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          dragging ? 'border-sky-400 bg-sky-50' : 'border-slate-300 bg-white hover:border-sky-300'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleChange}
        />
        {preview ? (
          <div className="space-y-3">
            <img src={preview} alt="preview" className="max-h-48 mx-auto rounded-lg object-contain" />
            <p className="text-sm text-slate-500">{fileName} · {fileSize}</p>
            <p className="text-xs text-slate-400">Haz clic para cambiar la imagen</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-4xl">🖼️</div>
            <p className="text-slate-600 font-medium">Arrastra una imagen aquí</p>
            <p className="text-slate-400 text-sm">o haz clic para seleccionar</p>
            <p className="text-slate-400 text-xs">PNG, JPG, WEBP</p>
          </div>
        )}
      </div>

      <button
        onClick={() => compressed && onAnalyze(compressed.base64, compressed.mediaType)}
        disabled={!compressed}
        className="mt-6 px-8 py-3 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold rounded-xl transition-colors"
      >
        Analizar
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
npm test components/UploadZone.test.tsx
```

Expected: PASS — 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/UploadZone.tsx components/UploadZone.test.tsx
git commit -m "feat: add UploadZone component"
```

---

### Task 5: AnalyzingView + TokenPanel Components

**Files:**
- Create: `components/AnalyzingView.tsx`
- Create: `components/AnalyzingView.test.tsx`
- Create: `components/TokenPanel.tsx`
- Create: `components/TokenPanel.test.tsx`

- [ ] **Step 1: Write failing tests for AnalyzingView**

Create `components/AnalyzingView.test.tsx`:

```typescript
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
```

- [ ] **Step 2: Write failing tests for TokenPanel**

Create `components/TokenPanel.test.tsx`:

```typescript
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
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npm test components/AnalyzingView.test.tsx components/TokenPanel.test.tsx
```

Expected: FAIL — modules not found.

- [ ] **Step 4: Create components/AnalyzingView.tsx**

```tsx
'use client'

import { useState, useEffect } from 'react'

export default function AnalyzingView() {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const interval = setInterval(
      () => setElapsed(e => parseFloat((e + 0.1).toFixed(1))),
      100
    )
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-6">
      <div className="w-14 h-14 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
      <p className="text-xl font-semibold text-slate-700">Analizando etiqueta...</p>
      <p className="font-mono text-slate-400 text-sm">{elapsed.toFixed(1)}s</p>
    </div>
  )
}
```

- [ ] **Step 5: Create components/TokenPanel.tsx**

```tsx
interface Props {
  inputTokens: number
  outputTokens: number
  elapsed: string
}

export default function TokenPanel({ inputTokens, outputTokens, elapsed }: Props) {
  const rows = [
    { label: 'Tokens de entrada', value: String(inputTokens) },
    { label: 'Tokens de salida', value: String(outputTokens) },
    { label: 'Total', value: String(inputTokens + outputTokens) },
    { label: 'Tiempo de respuesta', value: `${elapsed}s` },
  ]

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Uso de tokens</h3>
      {rows.map(({ label, value }) => (
        <div key={label} className="flex justify-between items-center">
          <span className="text-sm text-slate-600">{label}</span>
          <span className="font-mono text-sm text-slate-800">{value}</span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 6: Run tests**

```bash
npm test components/AnalyzingView.test.tsx components/TokenPanel.test.tsx
```

Expected: PASS — 6 tests pass total.

- [ ] **Step 7: Commit**

```bash
git add components/AnalyzingView.tsx components/AnalyzingView.test.tsx components/TokenPanel.tsx components/TokenPanel.test.tsx
git commit -m "feat: add AnalyzingView and TokenPanel components"
```

---

### Task 6: ElementCard Component

**Files:**
- Create: `components/ElementCard.tsx`
- Create: `components/ElementCard.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `components/ElementCard.test.tsx`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test components/ElementCard.test.tsx
```

Expected: FAIL — "Cannot find module './ElementCard'"

- [ ] **Step 3: Create components/ElementCard.tsx**

```tsx
'use client'

import type { LabelElement, MaterialType } from '@/lib/types'

const TYPE_CONFIG: Record<MaterialType, { label: string; icon: string; active: string; inactive: string }> = {
  texto:         { label: 'Texto',       icon: 'T',  active: 'bg-blue-500 text-white border-blue-500',     inactive: 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50' },
  imagen:        { label: 'Imagen',      icon: '🖼', active: 'bg-green-500 text-white border-green-500',   inactive: 'bg-white text-green-600 border-green-200 hover:bg-green-50' },
  logo:          { label: 'Logo',        icon: '◆',  active: 'bg-purple-500 text-white border-purple-500', inactive: 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50' },
  icono:         { label: 'Ícono',       icon: '●',  active: 'bg-amber-500 text-white border-amber-500',   inactive: 'bg-white text-amber-600 border-amber-200 hover:bg-amber-50' },
  codigo_barras: { label: 'Cód. Barras', icon: '║',  active: 'bg-red-500 text-white border-red-500',       inactive: 'bg-white text-red-600 border-red-200 hover:bg-red-50' },
}

interface Props {
  index: number
  element: LabelElement
  onChange: (index: number, type: MaterialType) => void
}

export default function ElementCard({ index, element, onChange }: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 animate-fade-in">
      <div className="flex items-start gap-3">
        <span className="shrink-0 w-7 h-7 rounded-full bg-sky-100 text-sky-600 text-xs font-bold flex items-center justify-center">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-slate-800 text-sm">{element.name}</h3>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              📍 {element.position}
            </span>
          </div>
          <p className="text-slate-700 text-sm mt-1">{element.content}</p>
          {element.notes && (
            <p className="text-slate-400 text-xs italic mt-1">{element.notes}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(TYPE_CONFIG) as MaterialType[]).map((type) => {
          const { label, icon, active, inactive } = TYPE_CONFIG[type]
          const isActive = element.materialType === type
          return (
            <button
              key={type}
              aria-pressed={isActive}
              onClick={() => onChange(index, type)}
              className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${isActive ? active : inactive}`}
            >
              {icon} {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
npm test components/ElementCard.test.tsx
```

Expected: PASS — 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/ElementCard.tsx components/ElementCard.test.tsx
git commit -m "feat: add ElementCard with material type toggle"
```

---

### Task 7: ResultsView Component

**Files:**
- Create: `components/ResultsView.tsx`
- Create: `components/ResultsView.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `components/ResultsView.test.tsx`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test components/ResultsView.test.tsx
```

Expected: FAIL — "Cannot find module './ResultsView'"

- [ ] **Step 3: Create components/ResultsView.tsx**

```tsx
'use client'

import type { LabelElement, MaterialType, TokenUsage } from '@/lib/types'
import ElementCard from './ElementCard'
import TokenPanel from './TokenPanel'

interface Props {
  imagePreview: string
  elements: LabelElement[]
  usage: TokenUsage
  elapsed: string
  onReset: () => void
  onElementChange: (index: number, type: MaterialType) => void
}

function exportJSON(elements: LabelElement[]) {
  const blob = new Blob([JSON.stringify(elements, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'elementos-etiqueta.json'
  a.click()
  URL.revokeObjectURL(url)
}

export default function ResultsView({ imagePreview, elements, usage, elapsed, onReset, onElementChange }: Props) {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Elementos detectados</h1>
          <div className="flex gap-3">
            <button
              onClick={onReset}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Nueva imagen
            </button>
            <button
              onClick={() => exportJSON(elements)}
              className="px-4 py-2 text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 rounded-lg transition-colors"
            >
              Exportar JSON
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
          <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <img src={imagePreview} alt="Etiqueta analizada" className="w-full rounded-lg object-contain max-h-72" />
            </div>
            <TokenPanel inputTokens={usage.input_tokens} outputTokens={usage.output_tokens} elapsed={elapsed} />
            <p className="text-xs text-slate-400 text-center">{elements.length} elementos detectados</p>
          </div>

          <div className="space-y-3">
            {elements.map((el, i) => (
              <ElementCard key={i} index={i} element={el} onChange={onElementChange} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
npm test components/ResultsView.test.tsx
```

Expected: PASS — 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/ResultsView.tsx components/ResultsView.test.tsx
git commit -m "feat: add ResultsView two-column layout"
```

---

### Task 8: Layout and Main Page

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Modify: `tailwind.config.ts`
- Modify: `app/page.tsx`
- Create: `app/page.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `app/page.test.tsx`:

```typescript
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
    render(<Page />)
    await userEvent.click(screen.getByText('mock-upload'))
    expect(screen.getByText('mock-analyzing')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('mock-reset')).toBeInTheDocument())
  })

  it('resets to upload when onReset called', async () => {
    render(<Page />)
    await userEvent.click(screen.getByText('mock-upload'))
    await waitFor(() => screen.getByText('mock-reset'))
    await userEvent.click(screen.getByText('mock-reset'))
    expect(screen.getByText('mock-upload')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test app/page.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Update app/globals.css**

**Note:** This project uses Tailwind CSS v4. There is no `tailwind.config.ts` — all theme customization goes in `globals.css` via `@theme inline` blocks.

Replace full contents of `app/globals.css`:

```css
@import "tailwindcss";

@theme inline {
  --font-sans: var(--font-dm-sans), sans-serif;
  --font-mono: var(--font-jetbrains-mono), monospace;
  --animate-fade-in: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  0% { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
}
```

- [ ] **Step 5: Update app/layout.tsx**

Replace full contents:

```tsx
import type { Metadata } from 'next'
import { DM_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' })

export const metadata: Metadata = {
  title: 'Analizador de Etiquetas',
  description: 'Identifica elementos visuales en etiquetas de producto',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${dmSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 6: Write app/page.tsx**

Replace full contents:

```tsx
'use client'

import { useState } from 'react'
import UploadZone from '@/components/UploadZone'
import AnalyzingView from '@/components/AnalyzingView'
import ResultsView from '@/components/ResultsView'
import type { LabelElement, MaterialType, TokenUsage } from '@/lib/types'

type View = 'upload' | 'analyzing' | 'results'

export default function Page() {
  const [view, setView] = useState<View>('upload')
  const [imagePreview, setImagePreview] = useState('')
  const [elements, setElements] = useState<LabelElement[]>([])
  const [usage, setUsage] = useState<TokenUsage>({ input_tokens: 0, output_tokens: 0 })
  const [elapsed, setElapsed] = useState('0')
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async (base64: string, mediaType: string) => {
    setImagePreview(`data:${mediaType};base64,${base64}`)
    setView('analyzing')
    setError(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mediaType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error desconocido')
      setElements(data.elements)
      setUsage(data.usage)
      setElapsed(data.elapsed)
      setView('results')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al analizar la imagen')
      setView('upload')
    }
  }

  const handleElementChange = (index: number, type: MaterialType) => {
    setElements(prev => prev.map((el, i) => i === index ? { ...el, materialType: type } : el))
  }

  const handleReset = () => {
    setView('upload')
    setElements([])
    setImagePreview('')
  }

  return (
    <>
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm shadow">
          {error}
        </div>
      )}
      {view === 'upload' && <UploadZone onAnalyze={handleAnalyze} />}
      {view === 'analyzing' && <AnalyzingView />}
      {view === 'results' && (
        <ResultsView
          imagePreview={imagePreview}
          elements={elements}
          usage={usage}
          elapsed={elapsed}
          onReset={handleReset}
          onElementChange={handleElementChange}
        />
      )}
    </>
  )
}
```

- [ ] **Step 7: Run all tests**

```bash
npm test
```

Expected: All test suites pass.

- [ ] **Step 8: Verify dev server**

```bash
npm run dev
```

Open http://localhost:3000. Verify the full flow: upload → analyzing spinner → results cards.

- [ ] **Step 9: Commit**

```bash
git add app/
git commit -m "feat: wire layout, fonts, and main page state machine"
```

---

### Task 9: Deploy to Vercel

- [ ] **Step 1: Push to GitHub**

Create a repo on github.com, then:

```bash
git remote add origin https://github.com/<your-username>/label-analyzer.git
git branch -M main
git push -u origin main
```

- [ ] **Step 2: Import in Vercel**

1. vercel.com → New Project → Import the GitHub repo
2. Framework: Next.js (auto-detected)
3. Click Deploy

- [ ] **Step 3: Add environment variable**

Vercel project → Settings → Environment Variables:
- Name: `ANTHROPIC_API_KEY`
- Value: your key from `.env.local`
- Environments: Production + Preview

- [ ] **Step 4: Redeploy**

Vercel dashboard → Deployments → Redeploy (or push an empty commit: `git commit --allow-empty -m "chore: trigger deploy"`).

- [ ] **Step 5: Verify production**

Open the Vercel URL. Upload a label image and confirm end-to-end flow works.
