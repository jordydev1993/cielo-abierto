'use client'

import { use } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { legajoCierreSchema, type LegajoCierreValues } from '@/lib/validations/legajos.schema'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { FormField } from '@/components/ui/form'
import { ChevronLeft, Lock, LayoutDashboard, AlertTriangle, CalendarClock, FileText, Activity, Archive, Pencil, Briefcase } from 'lucide-react'
import { useLegajo } from '@/hooks/legajos/useLegajo'
import { useCerrarLegajo } from '@/hooks/legajos/useUpdateLegajo'
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
import { toast } from '@/components/ui/toaster'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const TABS = ['resumen', 'incidentes', 'intervenciones', 'alertas', 'turnos', 'salud', 'documentos'] as const
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

function TabBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="ml-1.5 bg-slate-200 text-slate-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none">
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
  const [openCierre, setOpenCierre] = useState(false)

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

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<LegajoCierreValues>({
    resolver: zodResolver(legajoCierreSchema),
    defaultValues: { estado: 'cerrado', motivo_cierre: '' },
  })

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

  if (isLoading) return <div className="p-8 text-slate-500">Cargando...</div>
  if (!legajo) return <div className="p-8 text-slate-500">Legajo no encontrado</div>

  const nnya = legajo.nnya as any
  const legajoActivo = legajo.estado === 'activo'
  const alertasPendientes = alertas.filter((a) => a.estado === 'pendiente' || a.estado === 'en_proceso').length

  return (
    <div className="flex flex-col h-full">
      {/* Header fijo */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100 bg-white">
        <Button variant="ghost" size="sm" onClick={() => router.push('/legajos')} className="-ml-2 mb-3">
          <ChevronLeft className="h-4 w-4 mr-1" />Volver a legajos
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-semibold text-slate-900">Legajo {legajo.numero_legajo}</h1>
              {estadoBadge(legajo.estado)}
            </div>
            {nnya && (
              <p className="text-sm text-slate-500 mt-0.5">
                {nnya.apellido}, {nnya.nombre} — DNI {nnya.dni}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
              <span>Apertura: <span className="text-slate-600">{formatFecha(legajo.fecha_apertura)}</span></span>
              {legajo.fecha_cierre && <span>Cierre: <span className="text-slate-600">{formatFecha(legajo.fecha_cierre)}</span></span>}
              {legajo.motivo_cierre && <span className="text-slate-500 italic truncate max-w-xs">"{legajo.motivo_cierre}"</span>}
            </div>
          </div>

          {legajoActivo && (
            <AccessGuard roles={['Admin', 'Equipo Tecnico']}>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => router.push(`/legajos/${id}/editar`)}>
                  <Pencil className="h-4 w-4 mr-1.5" />Editar
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setOpenCierre(true)}>
                  <Lock className="h-4 w-4 mr-1.5" />Cerrar legajo
                </Button>
              </div>
            </AccessGuard>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={(v) => setTab(v as Tab)}>
          <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6">
            <TabsList className="h-auto py-2 bg-transparent gap-1 flex-wrap">
              <TabsTrigger value="resumen" className="gap-1.5 text-xs data-[state=active]:bg-slate-100">
                <LayoutDashboard className="h-3.5 w-3.5" />Resumen
              </TabsTrigger>
              <TabsTrigger value="incidentes" className="gap-1.5 text-xs data-[state=active]:bg-slate-100">
                <AlertTriangle className="h-3.5 w-3.5" />Incidentes<TabBadge count={incidentes.length} />
              </TabsTrigger>
              <TabsTrigger value="intervenciones" className="gap-1.5 text-xs data-[state=active]:bg-slate-100">
                <Briefcase className="h-3.5 w-3.5" />Intervenciones<TabBadge count={intervenciones.length} />
              </TabsTrigger>
              <TabsTrigger value="alertas" className="gap-1.5 text-xs data-[state=active]:bg-slate-100">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />Alertas
                {alertasPendientes > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{alertasPendientes}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="turnos" className="gap-1.5 text-xs data-[state=active]:bg-slate-100">
                <CalendarClock className="h-3.5 w-3.5" />Turnos<TabBadge count={turnos.length} />
              </TabsTrigger>
              <TabsTrigger value="salud" className="gap-1.5 text-xs data-[state=active]:bg-slate-100">
                <Activity className="h-3.5 w-3.5" />Salud<TabBadge count={diagnosticos.length + medicamentos.length} />
              </TabsTrigger>
              <TabsTrigger value="documentos" className="gap-1.5 text-xs data-[state=active]:bg-slate-100">
                <FileText className="h-3.5 w-3.5" />Documentos<TabBadge count={informes.length + audiencias.length} />
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="px-6 py-6 max-w-3xl">
            {!legajoActivo && (
              <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <Archive className="h-4 w-4 mt-0.5 shrink-0 text-slate-400" />
                <span>
                  Este legajo se encuentra <strong>{legajo.estado}</strong>.
                  {legajo.estado === 'archivado'
                    ? ' Se encuentra en el archivo histórico — no se permiten modificaciones.'
                    : ' No se pueden registrar nuevas actividades.'}
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

      {/* Dialog: cerrar legajo */}
      <Dialog open={openCierre} onOpenChange={setOpenCierre}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Cerrar legajo {legajo.numero_legajo}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onCerrar)} className="space-y-4 pt-2">
            <FormField label="Estado final" error={errors.estado?.message} required>
              <Controller name="estado" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cerrado">Cerrado — el NNyA puede reingresar</SelectItem>
                    <SelectItem value="archivado">Archivado — pasa al archivo histórico</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </FormField>
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
