# Label Analyzer — Design Spec
Date: 2026-03-26

## Overview

A web app where users upload product label images, Claude Vision identifies every visual element, and results are shown in an editable form where users assign a material type to each element. Deployed to Vercel.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS, light mode
- **AI**: Anthropic Claude API with vision (`claude-sonnet-4-20250514`)
- **Deployment**: Vercel
- **Language**: Spanish UI

## Architecture

```
Browser (Next.js)  →  app/api/analyze/route.ts  →  Anthropic API
```

Single Next.js project. The API Route Handler acts as a secure proxy — holds the API key server-side, never exposes it to the frontend. No separate Express server needed.

## File Structure

```
label-analyzer/
├── .env.local                        # ANTHROPIC_API_KEY (gitignored)
├── app/
│   ├── layout.tsx                    # Root layout, light theme, DM Sans font
│   ├── page.tsx                      # Main page (orchestrates all state)
│   └── api/
│       └── analyze/
│           └── route.ts              # POST handler → Anthropic API proxy
├── components/
│   ├── UploadZone.tsx                # Drag & drop, preview, compress trigger
│   ├── AnalyzingView.tsx             # Spinner + live elapsed timer
│   ├── ResultsView.tsx               # Two-column results layout
│   ├── ElementCard.tsx               # Element card + material type selector
│   └── TokenPanel.tsx                # Token usage display
├── lib/
│   └── imageUtils.ts                 # Resize to 800px, convert to JPEG base64
└── tailwind.config.ts
```

## Data Flow & State

`page.tsx` manages a `view` state with three values:

### `upload`
- Shows `UploadZone`
- User picks PNG/JPG/WEBP → `compressImage()` resizes to max 800px longest side, compresses to JPEG 0.7, returns `{ base64, mediaType }`
- User clicks "Analizar" → transitions to `analyzing`

### `analyzing`
- Shows `AnalyzingView` with spinner and live elapsed timer
- Calls `POST /api/analyze` with `{ image: base64, mediaType }`
- On success → stores `elements[]` + `{ usage, elapsed }`, transitions to `results`
- On error → shows Spanish error message, returns to `upload`

### `results`
- Shows `ResultsView` (two columns)
- User can toggle material types on each card
- "Nueva imagen" resets to `upload`
- "Exportar JSON" downloads element list as `.json` file

## API Route: POST /api/analyze

**Input:** `{ image: string (base64), mediaType: "image/jpeg" }`

**Process:**
1. Record start time
2. POST to `https://api.anthropic.com/v1/messages` with image + prompt
3. Parse response JSON array from Claude's text output
4. Return result

**Output:** `{ elements: Element[], usage: { input_tokens, output_tokens }, elapsed: string }`

**Error handling:** Returns `{ error: string }` with HTTP 500 if Anthropic call fails or JSON parsing fails.

**Prompt sent to Claude:**
```
Analiza esta imagen de etiqueta de producto. Identifica TODOS los elementos visuales individuales.

Para cada elemento devuelve:
- name: nombre descriptivo del elemento
- type: uno exactamente de: "texto", "imagen", "logo", "icono", "codigo_barras"
- content: el contenido (texto literal si es texto, descripción si es imagen/logo/ícono)
- position: ubicación en la etiqueta (e.g., "arriba izquierda", "centro", "abajo derecha")
- notes: observaciones relevantes (color, tamaño relativo, estilo tipográfico, etc.)

Responde SOLO con un array JSON, sin markdown, sin backticks:
[{"name":"...","type":"...","content":"...","position":"...","notes":"..."}]
```

## Components

### `UploadZone`
- Drag & drop area with dashed border
- Accepts PNG, JPG, WEBP
- Shows image preview once selected + file size
- "Analizar" button enabled only when image is loaded

### `AnalyzingView`
- Full-screen centered spinner
- Message: "Analizando etiqueta..."
- Live elapsed timer in seconds (e.g., "12.3s")

### `ResultsView`
- Two-column layout
- Left (sticky): image preview + `TokenPanel` + "Exportar JSON" button
- Right (scrollable): list of `ElementCard` components
- "Nueva imagen" button to reset

### `ElementCard`
- Badge: `#1`, `#2`, etc.
- Name + position badge (📍)
- Content text
- Notes in italic
- 5 toggle buttons (AI pre-selects, user can override):
  - **Texto** (T) — azul
  - **Imagen** (🖼) — verde
  - **Logo** (◆) — morado
  - **Ícono** (●) — ámbar
  - **Código de barras** (║) — rojo

### `TokenPanel`
- Tokens de entrada / Tokens de salida / Total / Tiempo de respuesta
- Values rendered in JetBrains Mono font

### `imageUtils.ts`
- Single export: `compressImage(file: File): Promise<{ base64: string, mediaType: string }>`
- Uses `<canvas>` to resize longest side to max 800px, then encodes as JPEG quality 0.7

## UI Design

- **Background**: `#F8FAFC`
- **Cards**: `#FFFFFF`
- **Borders**: `#E2E8F0`
- **Accent**: sky blue `#0EA5E9`
- **UI font**: DM Sans
- **Data/mono font**: JetBrains Mono
- **Animations**: fade-in on results, spinner during analysis

## Element Data Shape

```typescript
interface Element {
  name: string;
  type: "texto" | "imagen" | "logo" | "icono" | "codigo_barras";
  content: string;
  position: string;
  notes: string;
  materialType: "texto" | "imagen" | "logo" | "icono" | "codigo_barras"; // user-editable
}
```

## Environment Variables

| Variable | Where |
|---|---|
| `ANTHROPIC_API_KEY` | `.env.local` (dev), Vercel Environment Variables (prod) |

Never exposed to the frontend.

## Success Criteria

1. User can upload an image and see a preview
2. Clicking "Analizar" sends the image to the API route, which calls Claude
3. Results appear as editable cards within 15–30 seconds
4. Each card shows AI-detected info + a material type selector
5. Token usage and response time are displayed
6. User can export results as JSON
7. Clean, light-mode Spanish UI with smooth transitions
