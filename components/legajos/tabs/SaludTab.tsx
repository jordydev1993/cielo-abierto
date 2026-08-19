'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { DiagnosticoList } from '@/components/entities/diagnosticos/DiagnosticoList'
import { DiagnosticoForm } from '@/components/entities/diagnosticos/DiagnosticoForm'
import { MedicamentoList } from '@/components/entities/medicamentos/MedicamentoList'
import { MedicamentoForm } from '@/components/entities/medicamentos/MedicamentoForm'
import { useDiagnosticosByLegajo } from '@/hooks/diagnosticos/useDiagnosticosByLegajo'
import { useCreateDiagnostico } from '@/hooks/diagnosticos/useCreateDiagnostico'
import { useMedicamentosByLegajo } from '@/hooks/medicamentos/useMedicamentosByLegajo'
import { useCreateMedicamento } from '@/hooks/medicamentos/useCreateMedicamento'
import { toast } from '@/components/ui/toaster'
import type { DiagnosticoFormValues } from '@/lib/validations/diagnosticos.schema'
import type { MedicamentoFormValues } from '@/lib/validations/medicamentos.schema'

interface SaludTabProps { legajoId: string; nnyaId: string; legajoActivo: boolean }

export function SaludTab({ legajoId, nnyaId, legajoActivo }: SaludTabProps) {
  const [openDiag, setOpenDiag] = useState(false)
  const [openMed, setOpenMed] = useState(false)
  const { data: diagnosticos = [], isLoading: loadingDiag } = useDiagnosticosByLegajo(legajoId)
  const { data: medicamentos = [], isLoading: loadingMed } = useMedicamentosByLegajo(legajoId)
  const createDiag = useCreateDiagnostico()
  const createMed = useCreateMedicamento()

  const onSubmitDiag = async (values: DiagnosticoFormValues) => {
    try {
      await createDiag.mutateAsync(values)
      toast({ title: 'Diagnóstico registrado', variant: 'success' })
      setOpenDiag(false)
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  const onSubmitMed = async (values: MedicamentoFormValues) => {
    try {
      await createMed.mutateAsync(values)
      toast({ title: 'Tratamiento registrado', variant: 'success' })
      setOpenMed(false)
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-8">
      {/* Diagnósticos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Diagnósticos
            {diagnosticos.length > 0 && <span className="ml-2 text-xs font-normal text-slate-400">({diagnosticos.length})</span>}
          </h3>
          {legajoActivo && (
            <AccessGuard roles={['Admin', 'Equipo Tecnico']}>
              <Button size="sm" variant="outline" onClick={() => setOpenDiag(true)}>
                <Plus className="h-4 w-4 mr-1" />Nuevo diagnóstico
              </Button>
            </AccessGuard>
          )}
        </div>
        {loadingDiag ? <p className="text-sm text-slate-400">Cargando...</p> : <DiagnosticoList diagnosticos={diagnosticos} legajoId={legajoId} legajoActivo={legajoActivo} />}
      </div>

      <hr className="border-slate-100" />

      {/* Medicación */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Medicación
            {medicamentos.length > 0 && <span className="ml-2 text-xs font-normal text-slate-400">({medicamentos.length})</span>}
          </h3>
          {legajoActivo && (
            <AccessGuard roles={['Admin', 'Equipo Tecnico']}>
              <Button size="sm" variant="outline" onClick={() => setOpenMed(true)}>
                <Plus className="h-4 w-4 mr-1" />Nuevo tratamiento
              </Button>
            </AccessGuard>
          )}
        </div>
        {loadingMed ? <p className="text-sm text-slate-400">Cargando...</p> : <MedicamentoList medicamentos={medicamentos} legajoId={legajoId} legajoActivo={legajoActivo} />}
      </div>

      <Dialog open={openDiag} onOpenChange={setOpenDiag}>
        <DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Registrar diagnóstico</DialogTitle></DialogHeader>
          <DiagnosticoForm legajoId={legajoId} nnyaId={nnyaId} onSubmit={onSubmitDiag} onCancel={() => setOpenDiag(false)} loading={createDiag.isPending} />
        </DialogContent>
      </Dialog>
      <Dialog open={openMed} onOpenChange={setOpenMed}>
        <DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Registrar tratamiento farmacológico</DialogTitle></DialogHeader>
          <MedicamentoForm legajoId={legajoId} nnyaId={nnyaId} diagnosticos={diagnosticos} onSubmit={onSubmitMed} onCancel={() => setOpenMed(false)} loading={createMed.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
