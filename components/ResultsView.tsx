'use client'

import type { LabelElement, PrintMaterial } from '@/lib/types'
import ElementCard from './ElementCard'

interface Props {
  imagePreview: string
  elements: LabelElement[]
  onReset: () => void
  onElementChange: (index: number, material: PrintMaterial | '') => void
}

export default function ResultsView({ imagePreview, elements, onReset, onElementChange }: Props) {
  const allFilled = elements.length > 0 && elements.every((el) => el.printMaterial !== '')

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Elementos detectados</h1>
          <div className="flex gap-3">
            {!allFilled && (
              <>
                <button
                  onClick={onReset}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Nueva imagen
                </button>
                <button
                  disabled
                  className="px-4 py-2 text-sm font-medium text-slate-400 bg-slate-100 border border-slate-200 rounded-lg cursor-not-allowed"
                >
                  Enviar
                </button>
              </>
            )}
            {allFilled && (
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 rounded-lg transition-colors"
              >
                Enviar
              </button>
            )}
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
