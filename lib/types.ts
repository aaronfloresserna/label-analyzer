export type MaterialType = 'texto' | 'imagen' | 'logo' | 'icono' | 'codigo_barras'

export type PrintMaterial =
  | 'offset'
  | 'flexografia'
  | 'serigrafia'
  | 'digital'
  | 'hot_stamping'
  | 'metalizado'
  | 'barniz_uv'
  | 'relieve'
  | 'troquelado'
  | 'sin_impresion'

export interface LabelElement {
  name: string
  type: MaterialType
  content: string
  position: string
  notes: string
  printMaterial: PrintMaterial | ''
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
