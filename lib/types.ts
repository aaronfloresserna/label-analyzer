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
