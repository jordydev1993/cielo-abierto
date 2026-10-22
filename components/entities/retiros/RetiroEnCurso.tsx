'use client'

import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toaster'
import { queryKeys } from '@/lib/constants/queryKeys'
import { tieneIdentidadVerificada } from '@/lib/didit/estado'
import { MENSAJES_DIDIT } from '@/lib/didit/mensajes'
import {
  cerrarRetiroSchema,
  registrarRetiroSchema,
  type CerrarRetiroValues,
  type RegistrarRetiroValues,
} from '@/lib/validations/retiros.schema'
import { useUpdateRetiroConsentimiento } from '@/hooks/retiros/useUpdateRetiroConsentimiento'
import { useRegistrarRetiro } from '@/hooks/retiros/useRegistrarRetiro'
import { useCerrarRetiro } from '@/hooks/retiros/useCerrarRetiro'
import type { Retiro } from '@/types/database.types'
import { ConsentimientoTexto } from './ConsentimientoTexto'
import { VerificacionDidit } from './VerificacionDidit'
import { mensajeError } from './mensajeError'

const ETIQUETA_ESTADO: Record<Retiro['estado'], { texto: string; variant: 'warning' | 'success' | 'destructive' | 'outline' }> = {
  en_curso: { texto: 'En curso', variant: 'outline' },
  requiere_revision: { texto: 'Requiere revisión', variant: 'warning' },
  realizada: { texto: 'Realizada', variant: 'success' },
  rechazada: { texto: 'Rechazada', variant: 'destructive' },
}

const ahoraLocal = () => format(new Date(), "yyyy-MM-dd'T'HH:mm")
const fechaHora = (iso: string | null) => (iso ? format(new Date(iso), "dd/MM/yyyy HH:mm", { locale: es }) : '—')

export function EstadoRetiroBadge({ estado }: { estado: Retiro['estado'] }) {
  const { texto, variant } = ETIQUETA_ESTADO[estado]
  return <Badge variant={variant}>{texto}</Badge>
}

// Un retiro de punta a punta (Plan 035 §8.1, prompts/049): consentimiento (D-26),
// verificación con Didit, registro (RF20/21) y cierre (RF22).
export function RetiroEnCurso({ retiro, sandbox }: { retiro: Retiro; sandbox: boolean }) {
  const qc = useQueryClient()
  const consentimiento = useUpdateRetiroConsentimiento()
  const sesiones = retiro.sesiones_didit ?? []
  const verificada = tieneIdentidadVerificada(sesiones) || retiro.metodo_verificacion === 'manual'
  // prompts/050: al abrir el retiro se muestra el resultado de su última sesión.
  const ultimaSesionId = [...sesiones].sort((a, b) => b.created_at.localeCompare(a.created_at))[0]?.id

  const refrescar = useCallback(() => {
    void qc.invalidateQueries({ queryKey: queryKeys.retiros.all })
  }, [qc])

  const responder = async (valor: 'aceptado' | 'rechazado') => {
    try {
      await consentimiento.mutateAsync({ id: retiro.id, consentimiento: valor })
    } catch (e) {
      toast({ title: 'No se pudo guardar el consentimiento', description: mensajeError(e), variant: 'destructive' })
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">
            Retiro de {retiro.nnya ? `${retiro.nnya.apellido}, ${retiro.nnya.nombre}` : 'NNyA'}
          </CardTitle>
          <EstadoRetiroBadge estado={retiro.estado} />
        </div>
        {retiro.tutores && (
          <p className="text-sm text-on-surface-variant">
            Tutor: {retiro.tutores.apellido}, {retiro.tutores.nombre} · DNI {retiro.tutores.dni} ·{' '}
            {retiro.tutores.parentesco}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {retiro.estado === 'rechazada' && (
          <p className="text-sm text-on-surface">Retiro rechazado. Motivo: {retiro.motivo_rechazo ?? '—'}</p>
        )}

        {retiro.estado === 'realizada' && (
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-on-surface-variant">Inicio</dt><dd>{fechaHora(retiro.fecha_inicio)}</dd></div>
            <div><dt className="text-on-surface-variant">Finalización</dt><dd>{fechaHora(retiro.fecha_fin)}</dd></div>
            <div className="sm:col-span-2"><dt className="text-on-surface-variant">Descripción</dt><dd>{retiro.descripcion ?? '—'}</dd></div>
          </dl>
        )}

        {retiro.estado === 'requiere_revision' && (
          <p className="text-sm text-on-surface" role="status">{MENSAJES_DIDIT.REQUIRES_REVIEW}</p>
        )}

        {retiro.estado === 'en_curso' && retiro.resultado_autorizacion === 'autorizada' && (
          <CerrarRetiroForm retiro={retiro} />
        )}

        {retiro.estado === 'en_curso' && retiro.resultado_autorizacion === 'pendiente' && (
          <>
            {retiro.consentimiento_didit === null && (
              <div className="space-y-4">
                <ConsentimientoTexto proposito="retiro" />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={() => responder('aceptado')} disabled={consentimiento.isPending}>
                    Acepto
                  </Button>
                  <Button type="button" variant="outline" onClick={() => responder('rechazado')} disabled={consentimiento.isPending}>
                    No acepto
                  </Button>
                </div>
              </div>
            )}

            {retiro.consentimiento_didit === 'rechazado' && (
              <p className="text-sm text-on-surface" role="status">{MENSAJES_DIDIT.CONSENT_REJECTED}</p>
            )}

            {retiro.consentimiento_didit === 'aceptado' &&
              (verificada ? (
                <>
                  <p className="text-sm text-on-surface" role="status">{MENSAJES_DIDIT.IDENTITY_VERIFIED_AUTHORIZED}</p>
                  <RegistrarRetiroForm retiro={retiro} />
                </>
              ) : (
                <VerificacionDidit
                  objetivo={{ proposito: 'retiro', retiroId: retiro.id }}
                  sandbox={sandbox}
                  onResultado={refrescar}
                  sesionInicialId={ultimaSesionId}
                />
              ))}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function RegistrarRetiroForm({ retiro }: { retiro: Retiro }) {
  const registrar = useRegistrarRetiro()
  const { register, handleSubmit, formState: { errors } } = useForm<RegistrarRetiroValues>({
    resolver: zodResolver(registrarRetiroSchema),
    defaultValues: { fecha_inicio: ahoraLocal(), descripcion: '', observaciones: '' },
  })

  const onSubmit = async (values: RegistrarRetiroValues) => {
    try {
      await registrar.mutateAsync({ id: retiro.id, values })
      toast({ title: 'Retiro registrado', variant: 'success' })
    } catch (e) {
      toast({ title: 'No se pudo registrar el retiro', description: mensajeError(e), variant: 'destructive' })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 border-t border-outline-variant pt-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Hora de inicio" error={errors.fecha_inicio?.message} required>
          <Input type="datetime-local" {...register('fecha_inicio')} />
        </FormField>
        <FormField label="Descripción" error={errors.descripcion?.message} required className="sm:col-span-2">
          <Textarea rows={2} {...register('descripcion')} />
        </FormField>
        <FormField label="Observaciones" className="sm:col-span-2">
          <Textarea rows={2} {...register('observaciones')} />
        </FormField>
      </div>
      <Button type="submit" disabled={registrar.isPending}>Registrar retiro</Button>
    </form>
  )
}

function CerrarRetiroForm({ retiro }: { retiro: Retiro }) {
  const cerrar = useCerrarRetiro()
  const { register, handleSubmit, formState: { errors } } = useForm<CerrarRetiroValues>({
    resolver: zodResolver(cerrarRetiroSchema),
    defaultValues: { fecha_fin: '', observaciones: '' },
  })

  const onSubmit = async (values: CerrarRetiroValues) => {
    try {
      await cerrar.mutateAsync({ id: retiro.id, values, observacionesPrevias: retiro.observaciones })
      toast({ title: 'Retiro cerrado', variant: 'success' })
    } catch (e) {
      toast({ title: 'No se pudo cerrar el retiro', description: mensajeError(e), variant: 'destructive' })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div><dt className="text-on-surface-variant">Inicio</dt><dd>{fechaHora(retiro.fecha_inicio)}</dd></div>
        <div><dt className="text-on-surface-variant">Descripción</dt><dd>{retiro.descripcion ?? '—'}</dd></div>
      </dl>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Hora de finalización" error={errors.fecha_fin?.message} required>
          <Input type="datetime-local" {...register('fecha_fin')} />
        </FormField>
        <FormField label="Observaciones de cierre" className="sm:col-span-2">
          <Textarea rows={2} {...register('observaciones')} />
        </FormField>
      </div>
      <Button type="submit" disabled={cerrar.isPending}>Cerrar retiro</Button>
    </form>
  )
}
