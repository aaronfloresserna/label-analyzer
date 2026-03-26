'use client'

import type { LabelElement, MaterialType } from '@/lib/types'
import ElementCard from './ElementCard'

interface Props {
  imagePreview: string
  elements: LabelElement[]
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

export default function ResultsView({ imagePreview, elements, onReset, onElementChange }: Props) {
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
