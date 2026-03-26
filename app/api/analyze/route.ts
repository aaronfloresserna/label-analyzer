import { NextRequest, NextResponse } from 'next/server'
import type { LabelElement, MaterialType } from '@/lib/types'

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY environment variable is not set')
}

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

    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'Campo "image" requerido.' }, { status: 400 })
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!mediaType || !allowedTypes.includes(mediaType)) {
      return NextResponse.json({ error: 'Tipo de imagen no soportado.' }, { status: 400 })
    }

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

    if (!response.ok && !data.error) {
      return NextResponse.json(
        { error: `Error del servidor de IA (${response.status}).` },
        { status: 500 }
      )
    }

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

    let rawElements: unknown[]
    try {
      rawElements = JSON.parse(text.replace(/```json|```/g, '').trim())
    } catch {
      return NextResponse.json(
        { error: 'La IA devolvió una respuesta inesperada. Intenta de nuevo.' },
        { status: 500 }
      )
    }
    const elements: LabelElement[] = (rawElements as Omit<LabelElement, 'materialType'>[]).map(
      (el) => ({ ...el, materialType: el.type as MaterialType })
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
