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
              aria-label={label}
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
