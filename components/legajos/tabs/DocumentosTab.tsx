'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { InformeList } from '@/components/entities/informes/InformeList'
import { InformeForm } from '@/components/entities/informes/InformeForm'
import { AudienciaList } from '@/components/entities/audiencias/AudienciaList'
import { AudienciaForm } from '@/components/entities/audiencias/AudienciaForm'
import { DocumentoList } from '@/components/entities/documentos/DocumentoList'
import { DocumentoUpload } from '@/components/entities/documentos/DocumentoUpload'
import { useInformesByLegajo } from '@/hooks/informes/useInformesByLegajo'
import { useCreateInforme } from '@/hooks/informes/useCreateInforme'
import { useAudienciasByLegajo } from '@/hooks/audiencias/useAudienciasByLegajo'
import { useCreateAudiencia } from '@/hooks/audiencias/useCreateAudiencia'
import { useDocumentosByLegajo } from '@/hooks/documentos/useDocumentosByLegajo'
import { toast } from '@/components/ui/toaster'
import type { InformeFormValues } from '@/lib/validations/informes.schema'
import type { AudienciaFormValues } from '@/lib/validations/audiencias.schema'

interface DocumentosTabProps { legajoId: string; nnyaId: string; legajoActivo: boolean }

export function DocumentosTab({ legajoId, nnyaId, legajoActivo }: DocumentosTabProps) {
  const [openInf, setOpenInf] = useState(false)
  const [openAud, setOpenAud] = useState(false)
  const { data: informes = [], isLoading: loadingInf } = useInformesByLegajo(legajoId)
  const { data: audiencias = [], isLoading: loadingAud } = useAudienciasByLegajo(legajoId)
  const { data: documentos = [], isLoading: loadingDocs } = useDocumentosByLegajo(legajoId)
  const createInf = useCreateInforme()
  const createAud = useCreateAudiencia()

  const onSubmitInf = async (values: InformeFormValues) => {
    try {
      await createInf.mutateAsync(values)
      toast({ title: 'Informe guardado como borrador', variant: 'success' })
      setOpenInf(false)
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  const onSubmitAud = async (values: AudienciaFormValues) => {
    try {
      await createAud.mutateAsync(values)
      toast({ title: 'Audiencia registrada', variant: 'success' })
      setOpenAud(false)
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-8">
      {/* Informes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Informes
            {informes.length > 0 && <span className="ml-2 text-xs font-normal text-slate-400">({informes.length})</span>}
          </h3>
          {legajoActivo && (
            <AccessGuard roles={['Admin', 'Equipo Tecnico']}>
              <Button size="sm" variant="outline" onClick={() => setOpenInf(true)}>
                <Plus className="h-4 w-4 mr-1" />Nuevo informe
              </Button>
            </AccessGuard>
          )}
        </div>
        {loadingInf ? <p className="text-sm text-slate-400">Cargando...</p> : <InformeList informes={informes} legajoId={legajoId} legajoActivo={legajoActivo} />}
      </div>

      <hr className="border-slate-100" />

      {/* Audiencias judiciales */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Audiencias judiciales
            {audiencias.length > 0 && <span className="ml-2 text-xs font-normal text-slate-400">({audiencias.length})</span>}
          </h3>
          {legajoActivo && (
            <AccessGuard roles={['Admin', 'Equipo Tecnico']}>
              <Button size="sm" variant="outline" onClick={() => setOpenAud(true)}>
                <Plus className="h-4 w-4 mr-1" />Nueva audiencia
              </Button>
            </AccessGuard>
          )}
        </div>
        {loadingAud ? <p className="text-sm text-slate-400">Cargando...</p> : <AudienciaList audiencias={audiencias} legajoId={legajoId} legajoActivo={legajoActivo} />}
      </div>

      <hr className="border-slate-100" />

      {/* Archivos adjuntos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Archivos adjuntos
            {documentos.length > 0 && <span className="ml-2 text-xs font-normal text-slate-400">({documentos.length})</span>}
          </h3>
        </div>
        {legajoActivo && (
          <AccessGuard roles={['Admin', 'Equipo Tecnico']}>
            <div className="mb-4">
              <DocumentoUpload legajoId={legajoId} nnyaId={nnyaId} />
            </div>
          </AccessGuard>
        )}
        {loadingDocs ? (
          <p className="text-sm text-slate-400">Cargando...</p>
        ) : (
          <DocumentoList documentos={documentos} legajoId={legajoId} legajoActivo={legajoActivo} />
        )}
      </div>

      <Dialog open={openInf} onOpenChange={setOpenInf}>
        <DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>Nuevo informe</DialogTitle></DialogHeader>
          <InformeForm legajoId={legajoId} nnyaId={nnyaId} onSubmit={onSubmitInf} onCancel={() => setOpenInf(false)} loading={createInf.isPending} />
        </DialogContent>
      </Dialog>
      <Dialog open={openAud} onOpenChange={setOpenAud}>
        <DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Registrar audiencia judicial</DialogTitle></DialogHeader>
          <AudienciaForm legajoId={legajoId} nnyaId={nnyaId} onSubmit={onSubmitAud} onCancel={() => setOpenAud(false)} loading={createAud.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
