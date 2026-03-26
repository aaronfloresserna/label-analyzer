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
    setError(null)
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
          onReset={handleReset}
          onElementChange={handleElementChange}
        />
      )}
    </>
  )
}
