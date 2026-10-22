'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toaster'
import { useRetiros } from '@/hooks/retiros/useRetiros'
import { useRechazarRetiro } from '@/hooks/retiros/useRechazarRetiro'
import { useVerificacionManualRetiro } from '@/hooks/retiros/useVerificacionManualRetiro'
import { intentosFallidos, tieneIdentidadVerificada } from '@/lib/didit/estado'
import { MENSAJES_DIDIT } from '@/lib/didit/mensajes'
import { motivoAdminSchema } from '@/lib/validations/retiros.schema'
import type { Retiro } from '@/types/database.types'
import { EstadoRetiroBadge } from './RetiroEnCurso'
import { mensajeError } from './mensajeError'

// Por qué el retiro espera a Dirección (D-19, D-20, D-26).
function causa(r: Retiro): string | null {
  const sesiones = r.sesiones_didit ?? []
  if (r.estado === 'requiere_revision') return `Requiere revisión: ${intentosFallidos(sesiones)} intentos fallidos.`
  if (r.estado !== 'en_curso' || r.resultado_autorizacion !== 'pendiente') return null
  // Si un reintento ya verificó la identidad, el retiro sigue su curso y no espera a Dirección.
  if (tieneIdentidadVerificada(sesiones)) return null
  if (r.consentimiento_didit === 'rechazado') return MENSAJES_DIDIT.CONSENT_REJECTED
  if (sesiones.some((s) => s.error_proveedor !== null)) return 'Error del proveedor: Didit o RENAPER no respondieron.'
  return null
}

// "Casos en revisión", solo Admin (prompts/049): verificación manual o rechazo, con motivo.
// La base es la garantía: fn_validar_fallback_retiro exige Admin y una causa habilitante.
export function CasosRevisionList() {
  const { data: retiros, isLoading } = useRetiros()
  const casos = (retiros ?? []).filter((r) => causa(r) !== null)

  if (isLoading) return <p className="text-sm text-on-surface-variant">Cargando casos…</p>
  if (casos.length === 0) return <p className="text-sm text-on-surface-variant">No hay casos en revisión.</p>

  return (
    <ul className="space-y-4">
      {casos.map((r) => (
        <li key={r.id}>
          <CasoRevision retiro={r} motivoCaso={causa(r) ?? ''} />
        </li>
      ))}
    </ul>
  )
}

function CasoRevision({ retiro, motivoCaso }: { retiro: Retiro; motivoCaso: string }) {
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const manual = useVerificacionManualRetiro()
  const rechazar = useRechazarRetiro()

  const ejecutar = async (accion: 'manual' | 'rechazar') => {
    setError(null)
    const parsed = motivoAdminSchema.safeParse({ motivo })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? null)
      return
    }
    try {
      if (accion === 'manual') await manual.mutateAsync({ id: retiro.id, motivo: parsed.data.motivo })
      else await rechazar.mutateAsync({ id: retiro.id, motivo: parsed.data.motivo })
      toast({ title: accion === 'manual' ? 'Verificación manual registrada' : 'Retiro rechazado', variant: 'success' })
    } catch (e) {
      setError(mensajeError(e))
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-medium text-on-surface">
            {retiro.nnya ? `${retiro.nnya.apellido}, ${retiro.nnya.nombre}` : 'NNyA'} —{' '}
            {retiro.tutores ? `${retiro.tutores.apellido}, ${retiro.tutores.nombre} (DNI ${retiro.tutores.dni})` : 'Tutor'}
          </p>
          <EstadoRetiroBadge estado={retiro.estado} />
        </div>
        <p className="text-sm text-on-surface-variant">
          {format(new Date(retiro.created_at), 'dd/MM/yyyy HH:mm')} · {motivoCaso}
        </p>
        <p className="text-sm text-on-surface">{MENSAJES_DIDIT.FALLBACK_AVAILABLE}</p>
        <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} aria-label="Motivo" />
        {error && <p className="text-sm text-error" role="alert">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => ejecutar('manual')} disabled={manual.isPending || rechazar.isPending}>
            Verificación manual
          </Button>
          <Button type="button" variant="outline" onClick={() => ejecutar('rechazar')} disabled={manual.isPending || rechazar.isPending}>
            Rechazar retiro
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
