'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Paperclip, Download, Trash2, FileText, FileImage, File, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useDeleteDocumento } from '@/hooks/documentos/useDeleteDocumento'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'
import type { Documento } from '@/types/database.types'

function formatBytes(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileIcon({ mime }: { mime: string | null }) {
  if (mime?.startsWith('image/')) return <FileImage className="h-4 w-4 text-blue-400 shrink-0" />
  if (mime === 'application/pdf') return <FileText className="h-4 w-4 text-red-400 shrink-0" />
  return <File className="h-4 w-4 text-slate-400 shrink-0" />
}

interface DocumentoListProps {
  documentos: Documento[]
  legajoId: string
  legajoActivo: boolean
}

export function DocumentoList({ documentos, legajoId, legajoActivo }: DocumentoListProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const deleteMutation = useDeleteDocumento(legajoId)

  const onDelete = async (doc: Documento) => {
    try {
      await deleteMutation.mutateAsync({ id: doc.id, storagePath: doc.storage_path })
      toast({ title: 'Archivo eliminado', variant: 'success' })
      setConfirmId(null)
    } catch (e: any) {
      toast({ title: 'Error al eliminar', description: e.message, variant: 'destructive' })
    }
  }

  const onDownload = async (doc: Documento) => {
    setDownloadingId(doc.id)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.storage
        .from('documentos')
        .createSignedUrl(doc.storage_path, 60)
      if (error || !data) throw new Error('No se pudo generar el enlace de descarga')
      const a = document.createElement('a')
      a.href = data.signedUrl
      a.download = doc.nombre
      a.target = '_blank'
      a.click()
    } catch (e: any) {
      toast({ title: 'Error al descargar', description: e.message, variant: 'destructive' })
    } finally {
      setDownloadingId(null)
    }
  }

  if (documentos.length === 0) {
    return (
      <div className="py-6 text-center">
        <Paperclip className="h-7 w-7 text-slate-200 mx-auto mb-1.5" />
        <p className="text-xs text-slate-400">Sin archivos adjuntos</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-slate-50">
      {documentos.map((doc) => (
        <div key={doc.id} className="flex items-center gap-3 py-2.5 px-1 group">
          <FileIcon mime={doc.mime_type} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-800 truncate font-medium">{doc.nombre}</p>
            <p className="text-xs text-slate-400">
              {doc.tipo}
              {doc.tamaño_bytes ? ` · ${formatBytes(doc.tamaño_bytes)}` : ''}
              {' · '}
              {format(new Date(doc.created_at), 'dd MMM yyyy', { locale: es })}
            </p>
          </div>
          <div className={cn('flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity')}>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              title="Descargar"
              disabled={downloadingId === doc.id}
              onClick={() => onDownload(doc)}
            >
              {downloadingId === doc.id
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Download className="h-3.5 w-3.5" />}
            </Button>
            {legajoActivo && confirmId !== doc.id && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-slate-400 hover:text-red-500"
                title="Eliminar"
                onClick={() => setConfirmId(doc.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
            {confirmId === doc.id && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-red-600">¿Eliminar?</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-red-600 hover:bg-red-50 px-2"
                  disabled={deleteMutation.isPending}
                  onClick={() => onDelete(doc)}
                >
                  Sí
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={() => setConfirmId(null)}
                >
                  No
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
