'use client'

import { useState, type FormEvent } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DiditIdentityFlow } from './DiditIdentityFlow'
import { NNYA_RETIRO_DEMO, RETIRO_DEMO, TUTORES_AUTORIZADOS_DEMO } from './demo-data'

export function RetiroDemo() {
  const [nnyaId, setNnyaId] = useState<string>(NNYA_RETIRO_DEMO[0].id)
  const [tutorId, setTutorId] = useState<string>(TUTORES_AUTORIZADOS_DEMO[0].id)
  const [descripcion, setDescripcion] = useState('Salida de ejemplo para una actividad recreativa.')
  const [observaciones, setObservaciones] = useState('')
  const [enEdicion, setEnEdicion] = useState(false)
  const [horaRegreso, setHoraRegreso] = useState('')
  const [observacionesCierre, setObservacionesCierre] = useState<string>(RETIRO_DEMO.observaciones)
  const [estado, setEstado] = useState<string>(RETIRO_DEMO.estado)

  const tutoresDisponibles = TUTORES_AUTORIZADOS_DEMO.filter((tutor) =>
    tutor.nnyaIds.some((id) => id === nnyaId)
  )
  const tutorSeleccionado = tutoresDisponibles.find((tutor) => tutor.id === tutorId)

  const seleccionarNnya = (nuevoNnyaId: string) => {
    setNnyaId(nuevoNnyaId)
    const tutorInicial = TUTORES_AUTORIZADOS_DEMO.find((tutor) =>
      tutor.nnyaIds.some((id) => id === nuevoNnyaId)
    )
    setTutorId(tutorInicial?.id ?? '')
  }

  const cerrarRetiro = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!horaRegreso) return
    setEstado('Realizada')
    setEnEdicion(false)
  }

  return (
    <div className="space-y-6">
      <Card id="registro-retiro-demo">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">Registrar retiro — demostración</CardTitle>
            <Badge variant="info">Datos ficticios; no crea un retiro</Badge>
          </div>
          <p className="text-sm text-on-surface-variant">
            Recorrido visual sin consultas ni persistencia. Las opciones y autorizaciones de este prototipo no
            representan datos ni permisos reales.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <label className="block max-w-xl space-y-1.5">
            <span className="text-sm font-medium text-on-surface">1. Seleccionar NNyA (ficticio)</span>
            <select
              value={nnyaId}
              onChange={(event) => seleccionarNnya(event.target.value)}
              className="h-10 w-full rounded-md border border-outline-variant bg-surface-container-low px-3 text-sm text-on-surface"
            >
              {NNYA_RETIRO_DEMO.map((nnya) => (
                <option key={nnya.id} value={nnya.id}>{nnya.nombre}</option>
              ))}
            </select>
          </label>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-on-surface">
              2. Tutores con autorización vigente — ejemplos ficticios
            </legend>
            {tutoresDisponibles.length === 0 ? (
              <p className="text-sm text-on-surface-variant">
                No hay tutores de ejemplo asociados a esta opción ficticia.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
              {tutoresDisponibles.map((tutor) => (
                <label
                  key={tutor.id}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-outline-variant p-4"
                >
                  <input
                    type="radio"
                    name="tutor-demo"
                    value={tutor.id}
                    checked={tutorId === tutor.id}
                    onChange={() => setTutorId(tutor.id)}
                  />
                  <span className="min-w-0 space-y-2">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-on-surface">{tutor.nombre}</span>
                      <Badge variant="success">{tutor.estadoAutorizacion}</Badge>
                    </span>
                    <span className="block text-sm text-on-surface-variant">{tutor.vinculo}</span>
                    <span className="block text-xs text-on-surface-variant">
                      Vigencia: {tutor.vigencia}
                    </span>
                    <span className="block text-xs text-on-surface-variant">
                      Restricciones: {tutor.restricciones || 'Sin restricción en este ejemplo ficticio.'}
                    </span>
                  </span>
                </label>
              ))}
              </div>
            )}
          </fieldset>

          <section aria-labelledby="identificacion-tutor-demo" className="space-y-3">
            <h3 id="identificacion-tutor-demo" className="text-sm font-medium text-on-surface">
              3. Identificación de la persona presente
            </h3>
            <p className="text-sm text-on-surface-variant">
              Tutor seleccionado: {tutorSeleccionado?.nombre ?? '—'}. El DNI se ingresa dentro de Didit;
              este prototipo no solicita ni guarda un DNI. No se fotografía el documento físico.
            </p>
          </section>

          <div id="verificacion-identidad-demo">
            <DiditIdentityFlow proposito="retiro" />
          </div>

          <section aria-labelledby="detalle-retiro-demo" className="space-y-4 border-t border-outline-variant pt-5">
            <h3 id="detalle-retiro-demo" className="text-sm font-semibold text-on-surface">
              4. Datos del retiro (maqueta)
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-on-surface">Hora de inicio</span>
                <Input type="time" value={RETIRO_DEMO.horaInicio} readOnly />
              </label>
              <div className="space-y-1.5">
                <span className="block text-sm font-medium text-on-surface">Captura de selfie</span>
                <p className="rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface-variant">
                  Se realiza dentro del flujo oficial de Didit cuando se integre; no se usa cámara propia.
                </p>
              </div>
              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-sm font-medium text-on-surface">Descripción</span>
                <Textarea value={descripcion} onChange={(event) => setDescripcion(event.target.value)} rows={2} />
              </label>
              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-sm font-medium text-on-surface">
                  Observaciones <span className="font-normal text-on-surface-variant">(opcional)</span>
                </span>
                <Textarea value={observaciones} onChange={(event) => setObservaciones(event.target.value)} rows={2} />
              </label>
            </div>
            <Button type="button" disabled>
              Registrar retiro
            </Button>
            <p className="text-xs text-on-surface-variant">
              El envío permanece deshabilitado: un resultado mock o pendiente no valida identidad ni habilita
              la creación de un retiro real. La autorización efectiva y el registro requieren el backend de Sofi.
            </p>
          </section>
        </CardContent>
      </Card>

      <Card id="cierre-retiro-demo">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">Cierre del retiro de ejemplo</CardTitle>
            <Badge variant="info">Solo estado local; no persiste</Badge>
          </div>
          <p className="text-sm text-on-surface-variant">
            Demostración del flujo de edición de un retiro en curso. El cambio desaparece al recargar.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-on-surface-variant">NNyA</dt>
              <dd className="mt-1 text-sm font-medium text-on-surface">{RETIRO_DEMO.nnya}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-on-surface-variant">Tutor autorizado</dt>
              <dd className="mt-1 text-sm font-medium text-on-surface">{RETIRO_DEMO.tutor}</dd>
            </div>
            <div className="rounded-lg bg-surface-container-low p-3">
              <dt className="text-xs font-medium text-on-surface-variant">Hora de inicio</dt>
              <dd className="mt-1 text-base font-semibold text-on-surface">{RETIRO_DEMO.horaInicio}</dd>
            </div>
            <div className="rounded-lg bg-surface-container-low p-3">
              <dt className="text-xs font-medium text-on-surface-variant">Hora de regreso</dt>
              <dd className="mt-1 text-base font-semibold text-on-surface">{horaRegreso || 'Pendiente'}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={estado === 'Realizada' ? 'success' : 'warning'}>{estado}</Badge>
            {estado !== 'Realizada' && !enEdicion && (
              <Button type="button" variant="outline" onClick={() => setEnEdicion(true)}>
                Editar
              </Button>
            )}
          </div>
          {enEdicion && (
            <form onSubmit={cerrarRetiro} className="space-y-3 rounded-lg border border-outline-variant p-4">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-on-surface">Hora de regreso</span>
                <Input
                  type="time"
                  value={horaRegreso}
                  onChange={(event) => setHoraRegreso(event.target.value)}
                  required
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-on-surface">Observaciones de cierre</span>
                <Textarea
                  value={observacionesCierre}
                  onChange={(event) => setObservacionesCierre(event.target.value)}
                  rows={2}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={!horaRegreso}>Guardar cierre de ejemplo</Button>
                <Button type="button" variant="ghost" onClick={() => setEnEdicion(false)}>Cancelar</Button>
              </div>
              <p className="text-xs text-on-surface-variant">
                Al guardar esta vista local el estado cambia a «Realizada». No se escribe en Supabase.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
