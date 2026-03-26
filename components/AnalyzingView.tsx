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
