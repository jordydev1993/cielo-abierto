// Tests de prompts/048: lógica del webhook de Didit. Qué se lee del payload (D-28),
// cómo se actualiza la sesión (D-1, D-12, D-14, idempotencia) y la validación
// RENAPER (D-11). Correr con: npm run test:unit. Datos ficticios.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  extraerResultadoDidit,
  mapearValidacionRenaper,
  resolverActualizacion,
  type ResultadoWebhookDidit,
} from '../../lib/didit/webhook.ts'

const AHORA = new Date('2026-10-21T12:00:00Z')

// Payload como el que manda Didit con los datos de la verificación sin restringir (D-28).
function payloadCompleto(status: string, verificacion: Record<string, unknown>) {
  return {
    status,
    decision: {
      session_id: 'sess-1',
      id_verifications: [
        {
          node_id: 'feature_id_lookup',
          status,
          verification_method: 'id_lookup',
          first_name: 'MARÍA',
          last_name: 'PRUEBA SECRETA',
          date_of_birth: '1990-01-01',
          portrait_image: 'https://renaper.example/foto-secreta.jpg',
          id_lookup: { selfie_url: 'https://selfie.example/secreta.jpg', outcome: 'match' },
          ...verificacion,
        },
      ],
      liveness_checks: [{ reference_image: 'https://selfie.example/otra.jpg' }],
    },
  }
}

const r = (over: Partial<ResultadoWebhookDidit>): ResultadoWebhookDidit => ({
  status: 'Approved',
  motivo: null,
  personalNumber: null,
  ...over,
})

test('D-28: del payload solo salen status, motivo y personal_number', () => {
  const res = extraerResultadoDidit(payloadCompleto('Approved', { personal_number: '99.000.011' }))
  assert.deepEqual(res, { status: 'Approved', motivo: null, personalNumber: '99.000.011' })
  assert.deepEqual(Object.keys(res ?? {}).sort(), ['motivo', 'personalNumber', 'status'])
  const texto = JSON.stringify(res)
  for (const dato of ['MARÍA', 'PRUEBA SECRETA', '1990-01-01', 'selfie', 'foto-secreta']) {
    assert.ok(!texto.includes(dato), `no debe salir ${dato}`)
  }
})

test('lee fallback_from.reason en los rechazos y personal_number dentro de id_lookup', () => {
  assert.equal(
    extraerResultadoDidit(payloadCompleto('Declined', { fallback_from: { reason: 'no_match', method: 'id_lookup' } }))?.motivo,
    'no_match'
  )
  assert.equal(
    extraerResultadoDidit(payloadCompleto('Approved', { id_lookup: { personal_number: 99000011 } }))?.personalNumber,
    '99000011'
  )
  assert.deepEqual(extraerResultadoDidit({ status: 'Expired' }), { status: 'Expired', motivo: null, personalNumber: null })
  assert.equal(extraerResultadoDidit({ status: 'approved' }), null, 'los estados son case-sensitive')
})

test('Approved compara el DNI solo por dígitos (D-14)', () => {
  const ok = resolverActualizacion({ estado_didit: null }, r({ personalNumber: '99.000.011' }), '99000011', AHORA)
  assert.deepEqual(ok, {
    tipo: 'actualizar',
    terminada: true,
    cambios: { estado_didit: 'Approved', dni_coincide: true, finalizada_at: AHORA.toISOString() },
  })
  const otro = resolverActualizacion({ estado_didit: 'In Progress' }, r({ personalNumber: '30111222' }), '99000011', AHORA)
  assert.equal(otro.tipo === 'actualizar' && otro.cambios.dni_coincide, false)
  const sin = resolverActualizacion({ estado_didit: null }, r({}), '99000011', AHORA)
  assert.equal(sin.tipo === 'actualizar' && sin.cambios.dni_coincide, false)
})

test('Declined por provider_error marca el error del proveedor (D-12); otros motivos no', () => {
  const pe = resolverActualizacion({ estado_didit: null }, r({ status: 'Declined', motivo: 'provider_error' }), '1', AHORA)
  assert.equal(pe.tipo === 'actualizar' && pe.cambios.error_proveedor, 'provider_error')
  const nm = resolverActualizacion({ estado_didit: null }, r({ status: 'Declined', motivo: 'no_match' }), '1', AHORA)
  assert.equal(nm.tipo === 'actualizar' && 'error_proveedor' in nm.cambios, false)
})

test('estados no terminados solo cambian estado_didit', () => {
  const ip = resolverActualizacion({ estado_didit: 'Not Started' }, r({ status: 'In Progress' }), '1', AHORA)
  assert.deepEqual(ip, { tipo: 'actualizar', terminada: false, cambios: { estado_didit: 'In Progress' } })
})

test('idempotencia: una sesión terminada no cambia y un estado repetido es no-op', () => {
  assert.deepEqual(
    resolverActualizacion({ estado_didit: 'Approved' }, r({ status: 'In Progress' }), '1', AHORA),
    { tipo: 'ignorar', motivo: 'terminada' }
  )
  assert.deepEqual(
    resolverActualizacion({ estado_didit: 'Declined' }, r({ status: 'Declined', motivo: 'no_match' }), '1', AHORA),
    { tipo: 'ignorar', motivo: 'terminada' }
  )
  assert.deepEqual(
    resolverActualizacion({ estado_didit: 'In Progress' }, r({ status: 'In Progress' }), '1', AHORA),
    { tipo: 'ignorar', motivo: 'sin_cambios' }
  )
})

test('validación RENAPER según D-11, y sin validación en los casos de las decisiones 2 y 3', () => {
  assert.deepEqual(mapearValidacionRenaper(r({}), true), { resultado: 'aprobado', estado_dni: 'vigente' })
  assert.equal(mapearValidacionRenaper(r({}), false), null, 'DNI distinto: no se crea')
  assert.deepEqual(mapearValidacionRenaper(r({ status: 'Declined', motivo: 'no_match' }), undefined), {
    resultado: 'rechazado',
    estado_dni: 'inexistente',
  })
  assert.deepEqual(mapearValidacionRenaper(r({ status: 'Declined', motivo: 'partial_match' }), undefined), {
    resultado: 'rechazado',
    estado_dni: 'vigente',
  })
  assert.deepEqual(mapearValidacionRenaper(r({ status: 'Declined', motivo: 'provider_error' }), undefined), {
    resultado: 'no_concluyente',
    estado_dni: 'error_servicio',
  })
  assert.equal(mapearValidacionRenaper(r({ status: 'Declined' }), undefined), null, 'Declined sin motivo')
  assert.equal(mapearValidacionRenaper(r({ status: 'Expired' }), undefined), null)
  assert.equal(mapearValidacionRenaper(r({ status: 'Abandoned' }), undefined), null)
})
