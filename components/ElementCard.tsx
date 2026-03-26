'use client'

import type { LabelElement, PrintMaterial } from '@/lib/types'

const PRINT_MATERIALS: { value: PrintMaterial; label: string }[] = [
  { value: 'offset',       label: 'Offset' },
  { value: 'flexografia',  label: 'Flexografía' },
  { value: 'serigrafia',   label: 'Serigrafía' },
  { value: 'digital',      label: 'Digital' },
  { value: 'hot_stamping', label: 'Hot Stamping' },
  { value: 'metalizado',   label: 'Metalizado' },
  { value: 'barniz_uv',    label: 'Barniz UV' },
  { value: 'relieve',      label: 'Relieve / Gofrado' },
  { value: 'troquelado',   label: 'Troquelado' },
  { value: 'sin_impresion', label: 'Sin impresión' },
]

interface Props {
  index: number
  element: LabelElement
  onChange: (index: number, material: PrintMaterial | '') => void
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

      <select
        value={element.printMaterial}
        onChange={(e) => onChange(index, e.target.value as PrintMaterial | '')}
        className={`w-full text-sm border rounded-lg px-3 py-2 bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400 ${
          element.printMaterial
            ? 'border-sky-400 text-slate-800'
            : 'border-slate-200 text-slate-400'
        }`}
      >
        <option value="">Seleccionar material de impresión...</option>
        {PRINT_MATERIALS.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
    </div>
  )
}
