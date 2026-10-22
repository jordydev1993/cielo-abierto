'use client'

import { use } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { legajoCierreSchema, type LegajoCierreValues, type LegajoFormValues } from '@/lib/validations/legajos.schema'
import { LegajoForm } from '@/components/entities/legajos/LegajoForm'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { FormField } from '@/components/ui/form'
import { ChevronLeft, Lock, LayoutDashboard, AlertTriangle, CalendarClock, FileText, Activity, Archive, Pencil, Briefcase, Shield } from 'lucide-react'
import { useLegajo } from '@/hooks/legajos/useLegajo'
import { useArchivarLegajo, useCerrarLegajo, useUpdateLegajoDatos } from '@/hooks/legajos/useUpdateLegajo'
import { useIncidentesByLegajo } from '@/hooks/incidentes/useIncidentesByLegajo'
import { useIntervencionesByNnya } from '@/hooks/intervenciones/useIntervencionesByNnya'
import { useAlertasByNnya } from '@/hooks/alertas/useAlertasByNnya'
import { useTurnosByLegajo } from '@/hooks/turnos/useTurnosByLegajo'
import { useInformesByLegajo } from '@/hooks/informes/useInformesByLegajo'
import { useAudienciasByLegajo } from '@/hooks/audiencias/useAudienciasByLegajo'
import { useDiagnosticosByLegajo } from '@/hooks/diagnosticos/useDiagnosticosByLegajo'
import { useMedicamentosByLegajo } from '@/hooks/medicamentos/useMedicamentosByLegajo'
import { ResumenTab } from '@/components/legajos/tabs/ResumenTab'
import { IncidentesTab } from '@/components/legajos/tabs/IncidentesTab'
import { IntervencionesTab } from '@/components/legajos/tabs/IntervencionesTab'
import { AlertasTab } from '@/components/legajos/tabs/AlertasTab'
import { TurnosTab } from '@/components/legajos/tabs/TurnosTab'
import { SaludTab } from '@/components/legajos/tabs/SaludTab'
import { DocumentosTab } from '@/components/legajos/tabs/DocumentosTab'
import { TutelaTab } from '@/components/legajos/tabs/TutelaTab'
import { toast } from '@/components/ui/toaster'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const TABS = ['resumen', 'tutela', 'incidentes', 'intervenciones', 'alertas', 'turnos', 'salud', 'documentos'] as const
type Tab = typeof TABS[number]

function estadoBadge(estado: 'activo' | 'cerrado' | 'archivado') {
  const map = { activo: 'success', cerrado: 'secondary', archivado: 'outline' } as const
  return <Badge variant={map[estado]}>{estado.charAt(0).toUpperCase() + estado.slice(1)}</Badge>
}

function formatFecha(fecha: string | null) {
  if (!fecha) return '—'
  try { return format(new Date(fecha + 'T00:00:00'), 'dd/MM/yyyy', { locale: es }) }
  catch { return fecha }
}

// Un legajo cerrado se puede archivar 12 meses después del cierre (prompts/037).
function fechaArchivable(fechaCierre: string | null): Date | null {
  if (!fechaCierre) return null
  const d = new Date(fechaCierre + 'T00:00:00')
  d.setFullYear(d.getFullYear() + 1)
  return d
}

function TabBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="ml-1.5 bg-surface-container text-on-surface-variant text-caption font-semibold px-1.5 py-0.5 rounded-full leading-none">
      {count}
    </span>
  )
}

export default function LegajoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const rawTab = searchParams.get('tab') as Tab | null
  const activeTab: Tab = TABS.includes(rawTab as Tab) ? (rawTab as Tab) : 'resumen'

  const setTab = (tab: Tab) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const { data: legajo, isLoading } = useLegajo(id)
  const cerrar = useCerrarLegajo()
  const archivar = useArchivarLegajo()
  const actualizarDatos = useUpdateLegajoDatos()
  const [openCierre, setOpenCierre] = useState(false)
  const [openEditar, setOpenEditar] = useState(false)

  const nnyaId = (legajo?.nnya as any)?.id ?? legajo?.nnya_id ?? ''

  // Cargar datos de todas las secciones (cacheados por React Query)
  const { data: incidentes = [] } = useIncidentesByLegajo(id)
  const { data: intervenciones = [] } = useIntervencionesByNnya(nnyaId)
  const { data: alertas = [] } = useAlertasByNnya(nnyaId)
  const { data: turnos = [] } = useTurnosByLegajo(id)
  const { data: informes = [] } = useInformesByLegajo(id)
  const { data: audiencias = [] } = useAudienciasByLegajo(id)
  const { data: diagnosticos = [] } = useDiagnosticosByLegajo(id)
  const { data: medicamentos = [] } = useMedicamentosByLegajo(id)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LegajoCierreValues>({
    resolver: zodResolver(legajoCierreSchema),
    defaultValues: { estado: 'cerrado', motivo_cierre: '' },
  })

  const onEditar = async (values: LegajoFormValues) => {
    try {
      await actualizarDatos.mutateAsync({ id, values })
      toast({ title: 'Legajo actualizado', variant: 'success' })
      setOpenEditar(false)
    } catch (e: any) {
      toast({ title: 'Error al guardar', description: e.message, variant: 'destructive' })
    }
  }

  const onCerrar = async (values: LegajoCierreValues) => {
    if (!legajo) return
    try {
      await cerrar.mutateAsync({ id, nnyaId: legajo.nnya_id, values })
      toast({ title: 'Legajo cerrado', variant: 'success' })
      setOpenCierre(false)
      reset()
    } catch (e: any) {
      toast({ title: 'No se puede cerrar el legajo', description: e.message, variant: 'destructive' })
    }
  }

  const onArchivar = async () => {
    if (!legajo) return
    try {
      await archivar.mutateAsync({ id, nnyaId: legajo.nnya_id })
      toast({ title: 'Legajo archivado', variant: 'success' })
    } catch (e) {
      toast({ title: 'No se puede archivar el legajo', description: (e as Error).message, variant: 'destructive' })
    }
  }

  if (isLoading) return <div className="p-8 text-on-surface-variant">Cargando...</div>
  if (!legajo) return <div className="p-8 text-on-surface-variant">Legajo no encontrado</div>

  const nnya = legajo.nnya as any
  const legajoActivo = legajo.estado === 'activo'
  const alertasPendientes = alertas.filter((a) => a.estado === 'pendiente' || a.estado === 'en_proceso').length
  // Indicador "Incidente pendiente": alerta de incidente grave sin resolver (prompts/037)
  const incidentePendiente = alertas.some(
    (a) => a.tipo === 'incidente' && (a.estado === 'pendiente' || a.estado === 'en_proceso'),
  )
  const archivableDesde = fechaArchivable(legajo.fecha_cierre)
  const puedeArchivar = legajo.estado === 'cerrado' && !!archivableDesde && archivableDesde <= new Date()

  return (
    <div className="flex flex-col h-full">
      {/* Header fijo */}
      <div className="bg-surface-container-lowest px-8 pb-4 pt-6">
        <Button variant="ghost" size="sm" onClick={() => router.push('/legajos')} className="-ml-2 mb-3">
          <ChevronLeft className="h-4 w-4 mr-1" />Volver a legajos
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-title font-semibold text-on-surface">Legajo {legajo.numero_legajo}</h1>
              {estadoBadge(legajo.estado)}
              {incidentePendiente && (
                <Badge className="bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary/30">Incidente pendiente</Badge>
              )}
            </div>
            {nnya && (
              <p className="text-sm text-on-surface-variant mt-0.5">
                {nnya.apellido}, {nnya.nombre} — DNI {nnya.dni}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-outline">
              <span>Apertura: <span className="text-on-surface-variant">{formatFecha(legajo.fecha_apertura)}</span></span>
              {legajo.fecha_cierre && <span>Cierre: <span className="text-on-surface-variant">{formatFecha(legajo.fecha_cierre)}</span></span>}
              {legajo.motivo_cierre && <span className="text-on-surface-variant italic truncate max-w-xs">"{legajo.motivo_cierre}"</span>}
            </div>
          </div>

          {legajoActivo && (
            <AccessGuard roles={['Admin', 'Equipo Tecnico']}>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => setOpenEditar(true)}>
                  <Pencil className="h-4 w-4 mr-1.5" />Editar
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setOpenCierre(true)}>
                  <Lock className="h-4 w-4 mr-1.5" />Cerrar legajo
                </Button>
              </div>
            </AccessGuard>
          )}

          {legajo.estado === 'cerrado' && (
            <AccessGuard roles={['Admin', 'Equipo Tecnico']}>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <Button variant="outline" size="sm" onClick={onArchivar} disabled={!puedeArchivar || archivar.isPending}>
                  <Archive className="h-4 w-4 mr-1.5" />{archivar.isPending ? 'Archivando...' : 'Archivar'}
                </Button>
                {!puedeArchivar && archivableDesde && (
                  <span className="text-xs text-outline">
                    Se puede archivar desde el {format(archivableDesde, 'dd/MM/yyyy', { locale: es })}
                  </span>
                )}
              </div>
            </AccessGuard>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={(v) => setTab(v as Tab)}>
          <div className="sticky top-0 z-10 border-b border-filete bg-surface-container-lowest px-8 pt-2">
            <TabsList className="h-auto flex-wrap gap-x-5 gap-y-1 border-b-0">
              <TabsTrigger value="resumen" className="gap-1.5">
                <LayoutDashboard className="h-3.5 w-3.5" />Resumen
              </TabsTrigger>
              <TabsTrigger value="tutela" className="gap-1.5">
                <Shield className="h-3.5 w-3.5" />Tutela
              </TabsTrigger>
              <TabsTrigger value="incidentes" className="gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />Incidentes<TabBadge count={incidentes.length} />
              </TabsTrigger>
              <TabsTrigger value="intervenciones" className="gap-1.5">
                <Briefcase className="h-3.5 w-3.5" />Intervenciones<TabBadge count={intervenciones.length} />
              </TabsTrigger>
              <TabsTrigger value="alertas" className="gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />Alertas
                {alertasPendientes > 0 && (
                  <span className="ml-1 bg-error text-white text-caption font-bold px-1.5 py-0.5 rounded-full leading-none">{alertasPendientes}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="turnos" className="gap-1.5">
                <CalendarClock className="h-3.5 w-3.5" />Turnos<TabBadge count={turnos.length} />
              </TabsTrigger>
              <TabsTrigger value="salud" className="gap-1.5">
                <Activity className="h-3.5 w-3.5" />Salud<TabBadge count={diagnosticos.length + medicamentos.length} />
              </TabsTrigger>
              <TabsTrigger value="documentos" className="gap-1.5">
                <FileText className="h-3.5 w-3.5" />Documentos<TabBadge count={informes.length + audiencias.length} />
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="max-w-4xl px-8 py-6">
            {!legajoActivo && (
              <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
                <Archive className="h-4 w-4 mt-0.5 shrink-0 text-outline" />
                <span>
                  Este legajo se encuentra <strong>{legajo.estado}</strong>.
                  {legajo.estado === 'archivado'
                    ? ' Se encuentra en el archivo histórico — no se permiten modificaciones.'
                    : ' No admite modificaciones ni nuevos registros; se puede archivar 12 meses después del cierre.'}
                </span>
              </div>
            )}
            <TabsContent value="resumen">
              <ResumenTab
                incidentes={incidentes}
                alertas={alertas}
                turnos={turnos}
                informes={informes}
                diagnosticos={diagnosticos}
                medicamentos={medicamentos}
                audiencias={audiencias}
                onChangeTab={(tab) => setTab(tab as Tab)}
              />
            </TabsContent>

            <TabsContent value="tutela">
              <TutelaTab nnyaId={nnyaId} legajoActivo={legajoActivo} />
            </TabsContent>

            <TabsContent value="incidentes">
              <IncidentesTab legajoId={id} nnyaId={nnyaId} legajoActivo={legajoActivo} />
            </TabsContent>

            <TabsContent value="intervenciones">
              <IntervencionesTab nnyaId={nnyaId} legajoActivo={legajoActivo} />
            </TabsContent>

            <TabsContent value="alertas">
              <AlertasTab nnyaId={nnyaId} />
            </TabsContent>

            <TabsContent value="turnos">
              <TurnosTab legajoId={id} nnyaId={nnyaId} legajoActivo={legajoActivo} />
            </TabsContent>

            <TabsContent value="salud">
              <SaludTab legajoId={id} nnyaId={nnyaId} legajoActivo={legajoActivo} />
            </TabsContent>

            <TabsContent value="documentos">
              <DocumentosTab legajoId={id} nnyaId={nnyaId} legajoActivo={legajoActivo} />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Dialog: editar legajo */}
      <Dialog open={openEditar} onOpenChange={setOpenEditar}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Editar legajo {legajo.numero_legajo}</DialogTitle></DialogHeader>
          <LegajoForm
            initialData={legajo}
            onSubmit={onEditar}
            onCancel={() => setOpenEditar(false)}
            loading={actualizarDatos.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog: cerrar legajo */}
      <Dialog open={openCierre} onOpenChange={setOpenCierre}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Cerrar legajo {legajo.numero_legajo}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onCerrar)} className="space-y-4 pt-2">
            <p className="text-sm text-on-surface-variant">
              El legajo pasa a <strong>cerrado</strong> y queda de solo lectura. Se puede archivar 12 meses después del cierre.
            </p>
            <FormField label="Motivo de cierre" error={errors.motivo_cierre?.message} required>
              <Textarea {...register('motivo_cierre')} rows={4} placeholder="Describí el motivo del cierre..." />
            </FormField>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setOpenCierre(false)}>Cancelar</Button>
              <Button type="submit" variant="destructive" disabled={cerrar.isPending}>
                {cerrar.isPending ? 'Cerrando...' : 'Confirmar cierre'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
