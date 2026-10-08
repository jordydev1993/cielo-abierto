import assert from 'node:assert/strict'
import test from 'node:test'
import { EVENTOS_TIMELINE_DEMO } from '../../components/entities/nnya/timeline-demo-data.ts'
import { ALERTAS_EDUCATIVAS_DEMO } from '../../components/entities/alertas/alertas-educativas-demo-data.ts'
import {
  ESTADOS_VERIFICACION_DEMO,
  ESTADO_VERIFICACION_PRESENTACION,
  RETIRO_DEMO,
  TUTORES_AUTORIZADOS_DEMO,
} from '../../components/entities/retiros/demo-data.ts'

test('la timeline de demostración incluye entre tres y cinco eventos en orden cronológico', () => {
  assert.ok(EVENTOS_TIMELINE_DEMO.length >= 3 && EVENTOS_TIMELINE_DEMO.length <= 5)

  const fechas = EVENTOS_TIMELINE_DEMO.map((evento) => evento.fecha)
  assert.deepEqual(fechas, [...fechas].sort())
  assert.ok(EVENTOS_TIMELINE_DEMO.every((evento) => evento.descripcion.includes('Ejemplo ficticio')))
})

test('los cinco estados RNF-12 tienen etiquetas y presentaciones diferenciadas', () => {
  assert.deepEqual(ESTADOS_VERIFICACION_DEMO, [
    'Pendiente de verificación',
    'Identidad verificada',
    'Identidad no verificada',
    'Requiere revisión',
    'Error del proveedor',
  ])

  const variantes = ESTADOS_VERIFICACION_DEMO.map(
    (estado) => ESTADO_VERIFICACION_PRESENTACION[estado].variant
  )
  assert.equal(new Set(variantes).size, ESTADOS_VERIFICACION_DEMO.length)
  assert.match(
    ESTADO_VERIFICACION_PRESENTACION['Error del proveedor'].descripcion,
    /no consume un intento/i
  )
  assert.notEqual(
    ESTADO_VERIFICACION_PRESENTACION['Error del proveedor'].variant,
    ESTADO_VERIFICACION_PRESENTACION['Identidad no verificada'].variant
  )
})

test('los datos demo de tutores y retiro están claramente marcados y contienen los campos pedidos', () => {
  assert.ok(TUTORES_AUTORIZADOS_DEMO.length > 0)
  assert.ok(TUTORES_AUTORIZADOS_DEMO.every((tutor) =>
    tutor.nombre.includes('ficticio') &&
    tutor.vinculo.length > 0 &&
    tutor.estadoAutorizacion.includes('ficticio') &&
    tutor.vigencia.includes('ejemplo') &&
    typeof tutor.restricciones === 'string'
  ))
  assert.equal(RETIRO_DEMO.estado, 'Realizada')
  assert.ok(RETIRO_DEMO.horaInicio)
  assert.ok(RETIRO_DEMO.horaFinalizacion)
})

test('los ejemplos de alertas educativas son ficticios y tienen fecha, estado y descripción', () => {
  assert.ok(ALERTAS_EDUCATIVAS_DEMO.length > 0)
  assert.ok(ALERTAS_EDUCATIVAS_DEMO.every((alerta) =>
    alerta.tipo.startsWith('Ejemplo') &&
    alerta.fecha.length > 0 &&
    alerta.estado.startsWith('Estado de demostración:') &&
    alerta.descripcion.length > 0
  ))
})
