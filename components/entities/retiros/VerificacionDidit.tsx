'use client'

import { useEffect, useState } from 'react'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toaster'
import { useCrearSesionDidit, type CrearSesionInput } from '@/hooks/didit/useCrearSesionDidit'
import { useSesionDidit } from '@/hooks/didit/useSesionDidit'
import { useFallbackDidit } from '@/hooks/didit/useFallbackDidit'
import { SANDBOX_SCENARIOS, type SandboxScenario } from '@/lib/didit/client'
import { MENSAJES_DIDIT, type CodigoDidit } from '@/lib/didit/mensajes'
import { POLLING_TOPE_MS } from '@/lib/didit/polling'
import { EstadoRnf12Badge } from './EstadoRnf12Badge'
import { QrSesionDidit } from './QrSesionDidit'

type Objetivo = { proposito: 'retiro'; retiroId: string } | { proposito: 'validacion_referente'; referenteId: string }

interface VerificacionDiditProps {
  objetivo: Objetivo
  /** Lo decide el servidor (DIDIT_SANDBOX_SCENARIOS): muestra el selector de escenario. */
  sandbox: boolean
  /** Se llama cuando la verificación llega a un resultado, para refrescar la pantalla. */
  onResultado?: (code: CodigoDidit) => void
  /**
   * Última sesión del retiro o del referente: al montar se consulta su estado para
   * mostrar el resultado sin crear otra sesión (prompts/050).
   */
  sesionInicialId?: string
}

const REINTENTABLES: CodigoDidit[] = ['IDENTITY_NOT_VERIFIED', 'DNI_MISMATCH', 'PROVIDER_ERROR']

// Verificación de identidad con Didit (Plan 035 §8, prompts/049): crea la sesión, muestra
// el QR o el botón para la tablet (D-24), consulta el estado (N-6) y muestra el mensaje
// de D-33 que devuelve la API. El resultado lo guarda el webhook; acá solo se consulta.
export function VerificacionDidit({ objetivo, sandbox, onResultado, sesionInicialId }: VerificacionDiditProps) {
  const [dispositivo, setDispositivo] = useState<'celular' | 'tablet'>('celular')
  const [escenario, setEscenario] = useState<SandboxScenario | ''>('')
  // La URL de Didit solo se conoce al crear o retomar la sesión: la sesión inicial
  // empieza sin URL y se retoma con "Continuar verificación".
  const [sesion, setSesion] = useState<{ id: string; url: string | null } | null>(
    sesionInicialId ? { id: sesionInicialId, url: null } : null
  )
  const [aviso, setAviso] = useState<string | null>(null)
  const [inicioEspera, setInicioEspera] = useState(0)
  const [extendida, setExtendida] = useState(false)
  const [motivo, setMotivo] = useState('')

  const crear = useCrearSesionDidit()
  const fallback = useFallbackDidit()
  const estado = useSesionDidit(sesion?.id ?? null, inicioEspera)

  const respuesta = estado.data
  const code = respuesta?.code
  const pendiente = !!sesion && (!code || code === 'IDENTITY_PENDING')
  const esperando = pendiente && !!sesion?.url

  // "Seguimos esperando" a los 90 s sin resultado (N-6).
  useEffect(() => {
    if (!esperando) return
    const timer = setTimeout(() => setExtendida(true), Math.max(0, inicioEspera + POLLING_TOPE_MS - Date.now()))
    return () => clearTimeout(timer)
  }, [esperando, inicioEspera])

  useEffect(() => {
    if (code && code !== 'IDENTITY_PENDING') onResultado?.(code)
  }, [code, onResultado])

  const iniciar = async () => {
    setAviso(null)
    const base = escenario ? { sandbox_scenario: escenario } : {}
    const input: CrearSesionInput =
      objetivo.proposito === 'retiro'
        ? { proposito: 'retiro', retiro_id: objetivo.retiroId, ...base }
        : { proposito: 'validacion_referente', referente_id: objetivo.referenteId, consentimiento: true, ...base }
    try {
      const res = await crear.mutateAsync(input)
      if (res.ok && res.data?.sesion_id && res.data.url_didit) {
        setSesion({ id: res.data.sesion_id, url: res.data.url_didit })
        setInicioEspera(Date.now())
        setExtendida(false)
      } else {
        setSesion(null)
        setAviso(res.message ?? 'No se pudo iniciar la verificación.')
        if (res.code === 'REQUIRES_REVIEW' || res.code === 'MAX_ATTEMPTS_REACHED') onResultado?.(res.code)
      }
    } catch {
      setAviso('No se pudo conectar con el servidor. Intente nuevamente.')
    }
  }

  const actualizar = () => {
    setInicioEspera(Date.now())
    setExtendida(false)
    void estado.refetch()
  }

  const aplicarFallback = async () => {
    if (!sesion) return
    const res = await fallback.mutateAsync({ sesionId: sesion.id, motivo: motivo.trim() })
    if (res.ok) {
      toast({ title: 'Verificación manual registrada', variant: 'success' })
      onResultado?.('FALLBACK_APPLIED')
    } else {
      toast({ title: 'No se pudo aplicar la verificación manual', description: res.message ?? undefined, variant: 'destructive' })
    }
  }

  const datos = respuesta?.data
  const final = !!code && code !== 'IDENTITY_PENDING'
  const puedeReintentar = final && REINTENTABLES.includes(code) && (datos?.intentos_restantes ?? 0) > 0
  const mostrarInicio = !sesion || puedeReintentar

  return (
    <div className="space-y-4">
      {mostrarInicio && (
        <div className="space-y-4 rounded-lg border border-outline-variant p-4">
          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="mb-2 text-sm font-medium text-on-surface">Dispositivo para la verificación</legend>
            {(['celular', 'tablet'] as const).map((opcion) => (
              <label key={opcion} className="flex cursor-pointer items-start gap-3 rounded-lg border border-outline-variant p-3">
                <input
                  type="radio"
                  name={`dispositivo-${objetivo.proposito}`}
                  value={opcion}
                  checked={dispositivo === opcion}
                  onChange={() => setDispositivo(opcion)}
                />
                <span className="space-y-1">
                  <span className="block text-sm font-medium text-on-surface">
                    {opcion === 'celular' ? 'Celular del adulto (QR)' : 'Tablet de la residencia'}
                  </span>
                  <span className="block text-xs text-on-surface-variant">
                    {opcion === 'celular'
                      ? 'El adulto escanea el código con su celular.'
                      : 'El flujo de Didit se abre en esta tablet.'}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>

          {sandbox && (
            <label className="block max-w-sm space-y-1.5">
              <span className="text-sm font-medium text-on-surface">Escenario de prueba (sandbox)</span>
              <select
                value={escenario}
                onChange={(e) => setEscenario(e.target.value as SandboxScenario | '')}
                className="h-10 w-full rounded-md border border-outline-variant bg-surface-container-low px-3 text-sm text-on-surface"
              >
                <option value="">Sin escenario (por defecto)</option>
                {SANDBOX_SCENARIOS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <span className="block text-xs text-on-surface-variant">
                Solo en el entorno de prueba: elige qué responde Didit (prompts/045).
              </span>
            </label>
          )}

          <Button type="button" onClick={iniciar} disabled={crear.isPending}>
            {crear.isPending ? 'Iniciando…' : sesion ? 'Reintentar verificación' : 'Iniciar verificación'}
          </Button>
        </div>
      )}

      {aviso && (
        <p className="rounded-md bg-surface-container-low p-3 text-sm text-on-surface" role="alert">
          {aviso}
        </p>
      )}

      {sesion && (
        <div className="space-y-3 rounded-lg bg-surface-container-low p-4" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2">
            <EstadoRnf12Badge estado={datos?.estado_rnf12 ?? 'Pendiente'} />
            {datos && (
              <span className="text-xs text-on-surface-variant">
                Intentos usados: {datos.intentos_usados} · restantes: {datos.intentos_restantes}
              </span>
            )}
          </div>

          {pendiente && !sesion.url && (
            <div className="space-y-2">
              <p className="text-sm text-on-surface">Hay una verificación en curso.</p>
              <Button type="button" onClick={iniciar} disabled={crear.isPending}>
                {crear.isPending ? 'Retomando…' : 'Continuar verificación'}
              </Button>
            </div>
          )}

          {esperando && sesion.url && (
            <>
              {dispositivo === 'celular' ? (
                <QrSesionDidit url={sesion.url} />
              ) : (
                <Button asChild>
                  <a href={sesion.url} target="_blank" rel="noopener noreferrer">
                    Abrir la verificación en esta tablet
                  </a>
                </Button>
              )}
              <p className="text-sm text-on-surface">
                Esperando resultado. El DNI, el sexo y la selfie se ingresan dentro de Didit; esta aplicación
                no abre la cámara ni guarda la imagen.
              </p>
              {extendida && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-on-surface" role="status">Seguimos esperando</p>
                  <Button type="button" variant="outline" onClick={actualizar}>
                    Actualizar
                  </Button>
                </div>
              )}
            </>
          )}

          {final && respuesta?.message && <p className="text-sm text-on-surface">{respuesta.message}</p>}

          {final && objetivo.proposito === 'retiro' && datos?.fallback_habilitado && (
            <AccessGuard roles={['Admin']}>
              <div className="space-y-2 border-t border-outline-variant pt-3">
                <p className="text-sm text-on-surface">{MENSAJES_DIDIT.FALLBACK_AVAILABLE}</p>
                <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} required />
                <Button
                  type="button"
                  onClick={aplicarFallback}
                  disabled={!motivo.trim() || fallback.isPending}
                >
                  Registrar verificación manual
                </Button>
              </div>
            </AccessGuard>
          )}
        </div>
      )}
    </div>
  )
}
