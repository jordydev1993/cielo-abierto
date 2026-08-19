'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/constants/queryKeys'

interface UploadDocumentoInput {
  legajoId: string
  nnyaId: string
  tipo: string
  file: File
}

export function useUploadDocumento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ legajoId, nnyaId, tipo, file }: UploadDocumentoInput) => {
      // DOC-EX-01: verificar límite de 10 MB
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('El archivo supera el límite de 10 MB. (DOC-EX-01)')
      }

      const supabase = createClient()
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const storagePath = `legajos/${legajoId}/${Date.now()}_${safeName}`

      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(storagePath, file)

      if (uploadError) throw new Error(`Error al subir el archivo: ${uploadError.message}`)

      const { data: urlData } = supabase.storage
        .from('documentos')
        .getPublicUrl(storagePath)

      const { data, error: insertError } = await supabase
        .from('documentos')
        .insert({
          nnya_id: nnyaId,
          legajo_id: legajoId,
          nombre: file.name,
          tipo,
          url: urlData.publicUrl,
          storage_path: storagePath,
          tamaño_bytes: file.size,
          mime_type: file.type || null,
        })
        .select()
        .single()

      if (insertError) {
        await supabase.storage.from('documentos').remove([storagePath])
        throw insertError
      }

      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.documentos.byLegajo(data.legajo_id) })
    },
  })
}
