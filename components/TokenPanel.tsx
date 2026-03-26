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
