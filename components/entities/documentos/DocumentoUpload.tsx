'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, X } from 'lucide-react'
import { useUploadDocumento } from '@/hooks/documentos/useUploadDocumento'
import { toast } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'

const TIPOS_DOCUMENTO = [
  'Identificación',
  'Médico',
  'Judicial',
  'Educativo',
  'Fotografía',
  'Consentimiento',
  'Otro',
]

interface DocumentoUploadProps {
  legajoId: string
  nnyaId: string
}

export function DocumentoUpload({ legajoId, nnyaId }: DocumentoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [tipo, setTipo] = useState('')
  const [dragging, setDragging] = useState(false)
  const upload = useUploadDocumento()

  const handleFile = (f: File) => {
    if (f.size > 10 * 1024 * 1024) {
      toast({ title: 'Archivo demasiado grande', description: 'El límite es 10 MB (DOC-EX-01)', variant: 'destructive' })
      return
    }
    setFile(f)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const onSubmit = async () => {
    if (!file || !tipo) return
    try {
      await upload.mutateAsync({ legajoId, nnyaId, tipo, file })
      toast({ title: 'Archivo subido correctamente', variant: 'success' })
      setFile(null)
      setTipo('')
    } catch (e: any) {
      toast({ title: 'Error al subir archivo', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors',
          dragging ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300',
          file ? 'border-primary/50 bg-primary/5' : ''
        )}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !file && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
        {file ? (
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-slate-700 font-medium truncate max-w-[200px]">{file.name}</span>
            <button
              type="button"
              className="text-slate-400 hover:text-red-500 transition-colors"
              onClick={(e) => { e.stopPropagation(); setFile(null); if (inputRef.current) inputRef.current.value = '' }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <Upload className="h-6 w-6 text-slate-300" />
            <p className="text-sm text-slate-500">Arrastrá un archivo o hacé click para seleccionar</p>
            <p className="text-xs text-slate-400">Máximo 10 MB</p>
          </div>
        )}
      </div>

      {/* Tipo + botón subir */}
      {file && (
        <div className="flex gap-2">
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Tipo de documento" />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_DOCUMENTO.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={onSubmit}
            disabled={!tipo || upload.isPending}
            size="sm"
            className="shrink-0"
          >
            {upload.isPending ? 'Subiendo...' : 'Subir'}
          </Button>
        </div>
      )}
    </div>
  )
}
