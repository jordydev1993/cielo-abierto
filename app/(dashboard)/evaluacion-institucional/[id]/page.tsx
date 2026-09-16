'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ChevronLeft, Pencil, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useEvaluacionInstitucional } from '@/hooks/evaluacion-institucional/useEvaluacionInstitucional'
import { useUpdateEvaluacionInstitucional } from '@/hooks/evaluacion-institucional/useUpdateEvaluacionInstitucional'
import { useCasosByEvaluacion } from '@/hooks/evaluacion-institucional/useCasosByEvaluacion'
import { useCreateCaso } from '@/hooks/evaluacion-institucional/useCreateCaso'
import { useUpdateCaso } from '@/hooks/evaluacion-institucional/useUpdateCaso'
import { usePropuestasMejora } from '@/hooks/propuestas-mejora/usePropuestasMejora'
import { useCreatePropuestaMejora } from '@/hooks/propuestas-mejora/useCreatePropuestaMejora'
import { EvaluacionInstitucionalForm } from '@/components/entities/evaluacion-institucional/EvaluacionInstitucionalForm'
import { AsistentesList } from '@/components/entities/evaluacion-institucional/AsistentesList'
import { CasoForm } from '@/components/entities/evaluacion-institucional/CasoForm'
import { CasoList } from '@/components/entities/evaluacion-institucional/CasoList'
import { PropuestaMejoraForm } from '@/components/entities/propuestas-mejora/PropuestaMejoraForm'
import { PropuestasKanban } from '@/components/entities/propuestas-mejora/PropuestasKanban'
import { toast } from '@/components/ui/toaster'
import type { EvaluacionInstitucionalCaso } from '@/types/database.types'
import type { EvaluacionInstitucionalFormValues } from '@/lib/validations/evaluacion-institucional.schema'
import type { EvaluacionCasoFormValues } from '@/lib/validations/evaluacion-institucional-caso.schema'
import type { PropuestaMejoraFormValues } from '@/lib/validations/propuesta-mejora.schema'

const ESTADO_VARIANT = { convocada: 'secondary', realizada: 'success', cancelada: 'destructive' } as const

export default function EvaluacionInstitucionalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const { data: evaluacion, isLoading } = useEvaluacionInstitucional(id)
  const { data: casos = [] } = useCasosByEvaluacion(id)
  const { data: propuestasTodas = [] } = usePropuestasMejora()
  const propuestas = propuestasTodas.filter((p) => p.evaluacion_id === id)

  const actualizarEvaluacion = useUpdateEvaluacionInstitucional()
  const crearCaso = useCreateCaso()
  const actualizarCaso = useUpdateCaso()
  const crearPropuesta = useCreatePropuestaMejora()

  const [openEditar, setOpenEditar] = useState(false)
  const [casoEditando, setCasoEditando] = useState<EvaluacionInstitucionalCaso | null>(null)
  const [openCaso, setOpenCaso] = useState(false)
  const [openPropuesta, setOpenPropuesta] = useState(false)

  if (isLoading) return <div className="p-8 text-slate-500">Cargando...</div>
  if (!evaluacion) return <div className="p-8 text-slate-500">Evaluación no encontrada</div>

  const onEditar = async (values: EvaluacionInstitucionalFormValues) => {
    try {
      await actualizarEvaluacion.mutateAsync({ id, values })
      toast({ title: 'Evaluación actualizada', variant: 'success' })
      setOpenEditar(false)
    } catch (e: any) {
      toast({ title: 'Error al guardar', description: e.message, variant: 'destructive' })
    }
  }

  const onCaso = async (values: EvaluacionCasoFormValues) => {
    try {
      if (casoEditando) {
        await actualizarCaso.mutateAsync({ id: casoEditando.id, evaluacionId: id, values })
        toast({ title: 'Caso actualizado', variant: 'success' })
      } else {
        await crearCaso.mutateAsync({ evaluacionId: id, values })
        toast({ title: 'Caso registrado', variant: 'success' })
      }
      setOpenCaso(false)
      setCasoEditando(null)
    } catch (e: any) {
      toast({ title: 'Error al guardar', description: e.message, variant: 'destructive' })
    }
  }

  const onPropuesta = async (values: PropuestaMejoraFormValues) => {
    try {
      await crearPropuesta.mutateAsync(values)
      toast({ title: 'Propuesta creada', variant: 'success' })
      setOpenPropuesta(false)
    } catch (e: any) {
      toast({ title: 'Error al guardar', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <div className="p-6 max-w-3xl space-y-8">
      <div>
        <Button variant="ghost" size="sm" onClick={() => router.push('/evaluacion-institucional')} className="-ml-2 mb-3">
          <ChevronLeft className="h-4 w-4 mr-1" />Volver a evaluaciones
        </Button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-slate-900">
                Evaluación {evaluacion.periodo_mes}/{evaluacion.periodo_anio}
              </h1>
              <Badge variant={ESTADO_VARIANT[evaluacion.estado]}>{evaluacion.estado}</Badge>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Reunión: {format(new Date(evaluacion.fecha_reunion), 'dd/MM/yyyy HH:mm', { locale: es })}
            </p>
            {evaluacion.observaciones && (
              <p className="text-sm text-slate-500 italic mt-1">{evaluacion.observaciones}</p>
            )}
          </div>
          <AccessGuard roles={['Admin']}>
            <Button variant="outline" size="sm" onClick={() => setOpenEditar(true)}>
              <Pencil className="h-4 w-4 mr-1.5" />Editar
            </Button>
          </AccessGuard>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">Asistentes</h2>
        <AsistentesList evaluacionId={id} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h2 className="text-sm font-semibold text-slate-900">Casos tratados</h2>
          <AccessGuard roles={['Admin', 'Equipo Tecnico']}>
            <Button size="sm" variant="outline" onClick={() => { setCasoEditando(null); setOpenCaso(true) }}>
              <Plus className="h-4 w-4 mr-1" />Agregar caso
            </Button>
          </AccessGuard>
        </div>
        <CasoList casos={casos} onEdit={(c) => { setCasoEditando(c); setOpenCaso(true) }} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h2 className="text-sm font-semibold text-slate-900">Propuestas de mejora</h2>
          <AccessGuard roles={['Admin']}>
            <Button size="sm" variant="outline" onClick={() => setOpenPropuesta(true)}>
              <Plus className="h-4 w-4 mr-1" />Nueva propuesta
            </Button>
          </AccessGuard>
        </div>
        <PropuestasKanban propuestas={propuestas} />
      </section>

      <Dialog open={openEditar} onOpenChange={setOpenEditar}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Editar evaluación</DialogTitle></DialogHeader>
          <EvaluacionInstitucionalForm
            initialData={evaluacion}
            onSubmit={onEditar}
            onCancel={() => setOpenEditar(false)}
            loading={actualizarEvaluacion.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={openCaso} onOpenChange={(o) => { setOpenCaso(o); if (!o) setCasoEditando(null) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{casoEditando ? 'Editar caso' : 'Nuevo caso tratado'}</DialogTitle></DialogHeader>
          <CasoForm
            initialData={casoEditando ?? undefined}
            onSubmit={onCaso}
            onCancel={() => { setOpenCaso(false); setCasoEditando(null) }}
            loading={crearCaso.isPending || actualizarCaso.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={openPropuesta} onOpenChange={setOpenPropuesta}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Nueva propuesta de mejora</DialogTitle></DialogHeader>
          <PropuestaMejoraForm
            evaluacionId={id}
            onSubmit={onPropuesta}
            onCancel={() => setOpenPropuesta(false)}
            loading={crearPropuesta.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
