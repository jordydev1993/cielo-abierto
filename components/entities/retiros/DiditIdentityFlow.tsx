'use client'

import { useState } from 'react'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { QrCode } from 'lucide-react'
import {
  ESTADOS_VERIFICACION_DEMO,
  ESTADO_VERIFICACION_PRESENTACION,
  type EstadoVerificacionDemo,
} from './demo-data'
import { EstadoVerificacionBadge } from './EstadoVerificacionBadge'
import { ConsentimientoTexto } from './ConsentimientoTexto'

type PropositoVerificacion = 'retiro' | 'referente'
type DispositivoVerificacion = 'celular' | 'tablet'

interface DiditIdentityFlowProps {
  proposito: PropositoVerificacion
}

export function DiditIdentityFlow({ proposito }: DiditIdentityFlowProps) {
  const [consentimiento, setConsentimiento] = useState<'aceptado' | 'rechazado' | null>(null)
  const [dispositivo, setDispositivo] = useState<DispositivoVerificacion>('celular')
  const [motivo, setMotivo] = useState('')
  const [esperaExtendida, setEsperaExtendida] = useState(false)
  const [resultadoDemo, setResultadoDemo] = useState<EstadoVerificacionDemo | null>(null)
  const [fallbackDemoRegistrado, setFallbackDemoRegistrado] = useState(false)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">Verificación de identidad</CardTitle>
            <Badge variant="info">Interfaz; integración Didit pendiente</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ConsentimientoTexto proposito={proposito} />

          {consentimiento === null ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => setConsentimiento('aceptado')}>Acepto</Button>
              <Button type="button" variant="outline" onClick={() => setConsentimiento('rechazado')}>
                No acepto
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Badge variant={consentimiento === 'aceptado' ? 'success' : 'secondary'}>
                {consentimiento === 'aceptado' ? 'Consentimiento aceptado en esta vista' : 'Consentimiento no aceptado'}
              </Badge>
              <Button type="button" variant="ghost" onClick={() => setConsentimiento(null)}>
                Cambiar respuesta
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {consentimiento === 'aceptado' && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-base">Elegí el dispositivo</CardTitle>
              <Badge variant="warning">No se crea una sesión real</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <fieldset className="grid gap-3 sm:grid-cols-2">
              <legend className="mb-2 text-sm font-medium text-on-surface">Método de verificación</legend>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-outline-variant p-3">
                <input
                  type="radio"
                  name={`dispositivo-${proposito}`}
                  value="celular"
                  checked={dispositivo === 'celular'}
                  onChange={() => setDispositivo('celular')}
                />
                <span className="space-y-1">
                  <span className="block text-sm font-medium text-on-surface">Celular del adulto (QR)</span>
                  <span className="block text-xs text-on-surface-variant">
                    El QR se mostrará cuando esté disponible el endpoint de creación de sesión.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-outline-variant p-3">
                <input
                  type="radio"
                  name={`dispositivo-${proposito}`}
                  value="tablet"
                  checked={dispositivo === 'tablet'}
                  onChange={() => setDispositivo('tablet')}
                />
                <span className="space-y-1">
                  <span className="block text-sm font-medium text-on-surface">Tablet de la residencia</span>
                  <span className="block text-xs text-on-surface-variant">
                    Mismo flujo de Didit en una pestaña de la tablet; requiere el mismo endpoint.
                  </span>
                </span>
              </label>
            </fieldset>

            <div className="rounded-lg bg-surface-container-low p-4" aria-live="polite">
              <div className="flex flex-wrap items-center gap-2">
                <EstadoVerificacionBadge estado="Pendiente de verificación" />
                <span className="text-xs text-on-surface-variant">Estado visual; no proviene de Didit.</span>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-on-surface">DNI y selfie dentro de Didit</p>
                  <p className="text-sm text-on-surface-variant">
                    El DNI y sexo se ingresan en el flujo del proveedor. La selfie y la prueba de vida pasiva
                    también se realizan allí; esta app no abre la cámara ni almacena la imagen.
                  </p>
                </div>
                {dispositivo === 'celular' && (
                  <div className="flex items-center gap-2 rounded-md border border-dashed border-outline-variant bg-surface-container-lowest p-3 text-xs text-on-surface-variant">
                    <QrCode className="h-8 w-8 shrink-0" aria-hidden="true" />
                    QR real pendiente de sesión
                  </div>
                )}
              </div>
              <p className="mt-3 text-sm text-on-surface">
                Esperando resultado.{' '}
                {dispositivo === 'celular'
                  ? 'El QR aparecerá aquí al integrar el endpoint; no se genera un código ficticio.'
                  : 'La sesión se abrirá en esta pestaña de la tablet cuando exista la integración.'}
              </p>
              <p className="mt-2 text-sm text-on-surface-variant">
                Los intentos restantes se mostrarán cuando los entregue el contrato del backend (máximo definido: 3).
              </p>
              {!esperaExtendida ? (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3"
                  onClick={() => setEsperaExtendida(true)}
                >
                  Ver estado después de 90 segundos (vista demo)
                </Button>
              ) : (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-on-surface" role="status">
                    Seguimos esperando
                  </p>
                  <p className="text-sm text-on-surface-variant">
                    Vista de ejemplo posterior a 90 segundos. El polling real será cada 3–5 segundos; un resultado
                    confirmado por webhook tendrá prioridad.
                  </p>
                  <Button type="button" variant="outline" disabled>
                    Actualizar — endpoint pendiente
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-lg border border-outline-variant p-4">
              <div>
                <p className="text-sm font-semibold text-on-surface">Estados posibles — ejemplos visuales</p>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Seleccioná un estado para inspeccionar su presentación. No representa una respuesta de Didit
                  ni habilita el retiro o el cambio del vínculo.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {ESTADOS_VERIFICACION_DEMO.map((estado) => (
                  <Button
                    key={estado}
                    type="button"
                    variant={resultadoDemo === estado ? 'secondary' : 'outline'}
                    onClick={() => {
                      setResultadoDemo(estado)
                      setFallbackDemoRegistrado(false)
                    }}
                  >
                    {estado}
                  </Button>
                ))}
              </div>
              {resultadoDemo && (
                <div className="space-y-2 rounded-md bg-surface-container-low p-3" aria-live="polite">
                  <div className="flex flex-wrap items-center gap-2">
                    <EstadoVerificacionBadge estado={resultadoDemo} />
                    <Badge variant="info">Resultado ficticio de demostración</Badge>
                  </div>
                  <p className="text-sm text-on-surface-variant">
                    {ESTADO_VERIFICACION_PRESENTACION[resultadoDemo].descripcion}
                  </p>
                  {resultadoDemo === 'Requiere revisión' && (
                    <p className="text-sm text-on-surface-variant">
                      Ejemplo de intentos: 3 usados y 0 restantes (dato ficticio). Esta vista no realiza el conteo.
                    </p>
                  )}
                  {resultadoDemo === 'Error del proveedor' && (
                    <p className="text-sm text-on-surface-variant">
                      No consume intentos; no equivale a una identidad rechazada.
                    </p>
                  )}
                  {(resultadoDemo === 'Requiere revisión' || resultadoDemo === 'Error del proveedor') && (
                    <AccessGuard
                      roles={['Admin']}
                      fallback={
                        <p className="text-sm text-on-surface-variant">
                          El fallback manual de este estado está disponible exclusivamente para Admin.
                        </p>
                      }
                    >
                      <label className="block space-y-1.5">
                        <span className="text-sm font-medium text-on-surface">
                          Motivo obligatorio para el fallback manual
                        </span>
                        <Textarea
                          value={motivo}
                          onChange={(event) => setMotivo(event.target.value)}
                          placeholder="Motivo de ejemplo"
                          required
                          rows={2}
                        />
                      </label>
                      <Button
                        type="button"
                        className="mt-2"
                        disabled={!motivo.trim()}
                        onClick={() => setFallbackDemoRegistrado(true)}
                      >
                        Aplicar fallback manual — ejemplo
                      </Button>
                    </AccessGuard>
                  )}
                </div>
              )}
              {fallbackDemoRegistrado && (
                <p className="rounded-md bg-surface-container-low p-3 text-sm text-on-surface-variant" role="status">
                  Fallback de ejemplo registrado solo en esta vista. No se verificó identidad ni se escribió
                  en el sistema.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {consentimiento === 'rechazado' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Verificación manual alternativa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-on-surface-variant">
              No aceptar no impide el proceso. Según D-26, solo un Admin puede comparar el DNI físico con
              el registrado y dejar la verificación manual auditada; no consume un intento Didit.
            </p>
            <AccessGuard
              roles={['Admin']}
              fallback={<p className="text-sm text-on-surface-variant">La autorización de verificación manual es exclusiva de Admin.</p>}
            >
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-on-surface">Motivo obligatorio</span>
                <Textarea
                  value={motivo}
                  onChange={(event) => setMotivo(event.target.value)}
                  placeholder="Ej.: no aceptó el consentimiento"
                  required
                  rows={3}
                />
              </label>
              <Button
                type="button"
                className="mt-3"
                disabled={!motivo.trim()}
                onClick={() => setFallbackDemoRegistrado(true)}
              >
                Registrar verificación manual — ejemplo
              </Button>
              {fallbackDemoRegistrado && (
                <p className="mt-2 text-sm text-on-surface-variant" role="status">
                  Fallback de ejemplo registrado solo en esta vista. No se verificó identidad ni se escribió
                  en el sistema.
                </p>
              )}
              <p className="mt-2 text-xs text-on-surface-variant">
                No se registra ni audita nada desde esta vista mientras no exista el endpoint aprobado.
              </p>
            </AccessGuard>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
