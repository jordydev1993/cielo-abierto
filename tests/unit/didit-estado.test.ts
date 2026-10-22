// Tests de prompts/047: intentos (D-3, D-12, D-14), sesión abierta (D-27), fallback
// (D-2, D-20, D-26) y códigos de §7.4 con los mensajes de D-33. Correr con: npm run test:unit
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  codigoSesion,
  fallbackHabilitado,
  intentosRestantes,
  intentosUsados,
  sesionAbierta,
  type SesionDiditResumen,
} from '../../lib/didit/estado.ts'
import { MENSAJES_DIDIT } from '../../lib/didit/mensajes.ts'

const AHORA = Date.parse('2026-10-21T12:00:00Z')
let n = 0

function sesion(over: Partial<SesionDiditResumen> = {}): SesionDiditResumen {
  n += 1
  return {
    id: `id-${n}`,
    session_id: `sess-${n}`,
    estado_didit: null,
    estado_rnf12: 'Pendiente',
    error_proveedor: null,
    dni_coincide: null,
    created_at: '2026-10-21T11:30:00Z',
    ...over,
  }
}

const verificada = () => sesion({ estado_didit: 'Approved', dni_coincide: true, estado_rnf12: 'Identidad verificada' })
const rechazada = () => sesion({ estado_didit: 'Declined', estado_rnf12: 'Identidad no verificada' })
const otroDni = () => sesion({ estado_didit: 'Approved', dni_coincide: false, estado_rnf12: 'Identidad no verificada' })
const errorProveedor = () =>
  sesion({ estado_didit: 'Declined', error_proveedor: 'provider_error', estado_rnf12: 'Error del proveedor' })

test('intentos: cuentan las sesiones terminadas, no las pendientes ni los errores del proveedor', () => {
  const sesiones = [rechazada(), otroDni(), errorProveedor(), sesion(), sesion({ estado_didit: 'Expired', estado_rnf12: 'Identidad no verificada' })]
  assert.equal(intentosUsados(sesiones), 3)
  assert.equal(intentosRestantes(sesiones), 0)
  assert.equal(intentosRestantes([rechazada()]), 2)
  assert.equal(intentosRestantes([rechazada(), rechazada(), rechazada(), rechazada()]), 0)
})

test('sesión abierta: la más reciente con session_id, sin resultado y de menos de 1 hora', () => {
  const vieja = sesion({ created_at: '2026-10-21T10:30:00Z' })
  const nueva = sesion({ created_at: '2026-10-21T11:50:00Z', estado_didit: 'In Progress' })
  assert.equal(sesionAbierta([vieja, nueva], AHORA)?.id, nueva.id)
  assert.equal(sesionAbierta([vieja], AHORA), null)
  assert.equal(sesionAbierta([rechazada(), errorProveedor()], AHORA), null)
  assert.equal(sesionAbierta([sesion({ session_id: null, error_proveedor: 'didit_no_disponible' })], AHORA), null)
})

test('fallback: solo Admin y con error del proveedor, 3 fallidos o sin consentimiento', () => {
  assert.equal(fallbackHabilitado({ rol: 'Equipo Tecnico', sesiones: [errorProveedor()] }), false)
  assert.equal(fallbackHabilitado({ rol: 'Admin', sesiones: [errorProveedor()] }), true)
  assert.equal(fallbackHabilitado({ rol: 'Admin', sesiones: [rechazada(), otroDni(), rechazada()] }), true)
  assert.equal(fallbackHabilitado({ rol: 'Admin', sesiones: [rechazada(), rechazada()] }), false)
  assert.equal(fallbackHabilitado({ rol: 'Admin', sesiones: [], consentimiento: 'rechazado' }), true)
  assert.equal(fallbackHabilitado({ rol: 'Admin', sesiones: [errorProveedor(), verificada()] }), false)
})

test('códigos de §7.4 según el estado de la sesión', () => {
  assert.equal(codigoSesion(verificada(), []), 'IDENTITY_VERIFIED_AUTHORIZED')
  assert.equal(codigoSesion(errorProveedor(), []), 'PROVIDER_ERROR')
  const r = rechazada()
  assert.equal(codigoSesion(r, [r]), 'IDENTITY_NOT_VERIFIED')
  const d = otroDni()
  assert.equal(codigoSesion(d, [d]), 'DNI_MISMATCH')
  const tres = [rechazada(), rechazada(), otroDni()]
  assert.equal(codigoSesion(tres[2], tres), 'REQUIRES_REVIEW')
  assert.equal(codigoSesion(r, [r], 'requiere_revision'), 'REQUIRES_REVIEW')
  const p = sesion()
  assert.equal(codigoSesion(p, [p]), 'IDENTITY_PENDING')
})

test('los mensajes A, B y C son los literales de la Práctica 3 §6 (D-33)', () => {
  assert.equal(MENSAJES_DIDIT.IDENTITY_NOT_VERIFIED, 'No fue posible validar la identidad del tutor.')
  assert.equal(
    MENSAJES_DIDIT.IDENTITY_VERIFIED_NOT_AUTHORIZED,
    'La persona identificada no se encuentra autorizada para retirar al NNyA.'
  )
  assert.equal(
    MENSAJES_DIDIT.PROVIDER_ERROR,
    'No fue posible completar la validación de identidad. Intente nuevamente.'
  )
})
