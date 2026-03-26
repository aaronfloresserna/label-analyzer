'use client'

import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { compressImage } from '@/lib/imageUtils'

interface Props {
  onAnalyze: (base64: string, mediaType: string) => void
}

export default function UploadZone({ onAnalyze }: Props) {
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileSize, setFileSize] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [compressed, setCompressed] = useState<{ base64: string; mediaType: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return
    setFileName(file.name)
    setFileSize((file.size / 1024).toFixed(0) + ' KB')
    // Revoke the previous object URL to prevent memory leaks
    if (preview) URL.revokeObjectURL(preview)
    setPreview(URL.createObjectURL(file))
    try {
      const result = await compressImage(file)
      setCompressed(result)
    } catch {
      // compressImage failed - show preview but keep button disabled
      // (user will see the image but Analizar stays disabled)
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0])
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0])
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Analizador de Etiquetas</h1>
      <p className="text-slate-500 mb-8">Sube una imagen de etiqueta para identificar sus elementos visuales</p>

      <div
        className={`w-full max-w-lg border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          dragging ? 'border-sky-400 bg-sky-50' : 'border-slate-300 bg-white hover:border-sky-300'
        }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click() } }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleChange}
        />
        {preview ? (
          <div className="space-y-3">
            <img src={preview} alt="preview" className="max-h-48 mx-auto rounded-lg object-contain" />
            <p className="text-sm text-slate-500">{fileName} · {fileSize}</p>
            <p className="text-xs text-slate-400">Haz clic para cambiar la imagen</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-4xl">🖼️</div>
            <p className="text-slate-600 font-medium">Arrastra una imagen aquí</p>
            <p className="text-slate-400 text-sm">o haz clic para seleccionar</p>
            <p className="text-slate-400 text-xs">PNG, JPG, WEBP</p>
          </div>
        )}
      </div>

      <button
        onClick={() => compressed && onAnalyze(compressed.base64, compressed.mediaType)}
        disabled={!compressed}
        className="mt-6 px-8 py-3 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold rounded-xl transition-colors"
      >
        Analizar
      </button>
    </div>
  )
}
