# CLAUDE.md — Label Analyzer Web App

## Goal

Build a web app where users upload product label images, an AI (Claude Vision API) identifies every visual element on the label, and the results are shown in an editable form where users assign a material type to each element.

## Problem

Clients need to analyze product labels (water bottles, food packaging, cosmetics, etc.) and catalog every visual element — texts, images, logos, icons, barcodes — along with what type of material/print process each element requires.

## Tech Stack

- **Frontend**: React + Vite (or Next.js, your choice)
- **Backend**: Node.js / Express API route (to handle the Claude API call server-side and avoid CORS)
- **AI**: Anthropic Claude API with vision (claude-sonnet-4-20250514)
- **Styling**: Tailwind CSS, light mode

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Browser    │────▶│  Backend API  │────▶│  Anthropic API   │
│  (React UI)  │◀────│  /api/analyze │◀────│  claude-sonnet   │
└─────────────┘     └──────────────┘     └─────────────────┘
```

**Why a backend?** The Claude API cannot be called directly from a browser (CORS). The backend acts as a proxy, holds the API key securely, and forwards the image + prompt to Claude.

## API Key

The Anthropic API key should be read from the environment variable:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Use `dotenv` or pass it via environment. **Never expose it to the frontend.**

## Core Features

### 1. Image Upload
- Drag & drop or click to upload
- Accept: PNG, JPG, WEBP
- Preview the image before analyzing
- Resize to max 800px on the longest side (client-side, before sending)
- Convert to JPEG quality 0.7 to reduce payload

### 2. AI Analysis (Backend Route: POST /api/analyze)
- Receives the image as base64 from the frontend
- Sends it to Claude API with this prompt:

```
Analyze this product label image. Identify ALL individual visual elements.

For each element return:
- name: descriptive name of the element
- type: one of exactly: "texto", "imagen", "logo", "icono", "codigo_barras"
- content: the content (literal text if text, description if image/logo/icon)
- position: location on the label (e.g., "top left", "center", "bottom right")  
- notes: relevant observations (color, relative size, typographic style, etc.)

Reply ONLY with a JSON array, no markdown, no backticks:
[{"name":"...","type":"...","content":"...","position":"...","notes":"..."}]
```

- Parse the response as JSON
- Return to the frontend: `{ elements: [...], usage: { input_tokens, output_tokens } }`

### 3. Results Form
For each detected element, display a card with:
- **Element number** (badge)
- **Name** (from AI)
- **Position** (badge, e.g., "📍 top left")
- **Content** (the actual text or description)
- **Notes** (italic, from AI)
- **Material type selector** — 5 buttons the user can toggle:
  - Texto (T) — blue
  - Imagen (🖼) — green  
  - Logo (◆) — purple
  - Ícono (●) — amber
  - Código de barras (║) — red
- The AI pre-selects the type, but the user can change it

### 4. Token Display Panel
Show a small panel next to the image preview with:
- Input tokens (from API response `usage.input_tokens`)
- Output tokens (from API response `usage.output_tokens`)
- Total tokens
- Response time in seconds

### 5. Export
- Button to export the element list as JSON file
- Each element includes: name, type, content, position, notes, materialType

## UI Design

- **Light mode**: background #F8FAFC, cards #FFFFFF, borders #E2E8F0
- **Accent color**: sky blue #0EA5E9
- **Font**: DM Sans for UI, JetBrains Mono for data/tokens
- **Layout**: Two-column on results (left: image preview + token info, right: element cards)
- **Animations**: Fade-in on results, spinner while analyzing, progress bar

## File Structure (suggested)

```
label-analyzer/
├── .env                    # ANTHROPIC_API_KEY=sk-ant-...
├── package.json
├── server.js               # Express backend
│   └── POST /api/analyze   # Proxy to Claude API
├── src/
│   ├── App.jsx             # Main app component
│   ├── components/
│   │   ├── UploadZone.jsx  # Drag & drop upload
│   │   ├── AnalyzingView.jsx # Loading state with timer
│   │   ├── ResultsView.jsx # Two-column results layout
│   │   ├── ElementCard.jsx # Single element card with material selector
│   │   └── TokenPanel.jsx  # Token usage display
│   └── utils/
│       └── imageUtils.js   # Resize & compress image to base64
└── README.md
```

## Backend Route Detail

```javascript
// POST /api/analyze
// Body: { image: "base64string", mediaType: "image/jpeg" }
// Response: { elements: [...], usage: { input_tokens, output_tokens }, elapsed: "12.3" }

app.post('/api/analyze', async (req, res) => {
  const { image, mediaType } = req.body;
  const start = Date.now();
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
          { type: 'text', text: PROMPT }
        ]
      }]
    })
  });

  const data = await response.json();
  const text = data.content?.filter(b => b.type === 'text').map(b => b.text).join('');
  const elements = JSON.parse(text.replace(/```json|```/g, '').trim());
  
  res.json({
    elements,
    usage: data.usage,
    elapsed: ((Date.now() - start) / 1000).toFixed(1)
  });
});
```

## Token Cost Estimate

Per label analysis with an 800x534 JPEG image:
- Image tokens: ~1,200
- Prompt tokens: ~150  
- Response tokens: ~500-1,500
- **Total: ~2,000-3,000 tokens per label**
- **Cost: ~$0.01-0.02 USD per label** (Sonnet pricing)

## Success Criteria

1. User can upload an image and see a preview
2. Clicking "Analizar" sends the image to the backend, which calls Claude
3. Results appear as editable cards within 15-30 seconds
4. Each card shows the AI-detected info + a material type selector
5. Token usage is displayed
6. User can export results as JSON
7. Clean, light-mode UI with smooth transitions
