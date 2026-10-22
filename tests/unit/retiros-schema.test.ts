// Tests de prompts/049: campos obligatorios del retiro con los mensajes D y E de la
// Práctica 3 §6 (D-33), y la autorización de retiro. Correr con: npm run test:unit
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  cerrarRetiroSchema,
  iniciarRetiroSchema,
  MENSAJE_CAMPOS_OBLIGATORIOS,
  MENSAJE_HORA_FIN,
  motivoAdminSchema,
  registrarRetiroSchema,
} from '../../lib/validations/retiros.schema.ts'
import { autorizacionRetiroSchema } from '../../lib/validations/autorizaciones-retiro.schema.ts'

const primerMensaje = (r: { success: boolean; error?: { issues: { message: string }[] } }) =>
  r.success ? null : r.error?.issues[0]?.message

test('los mensajes D y E son los literales de D-33', () => {
  assert.equal(MENSAJE_CAMPOS_OBLIGATORIOS, 'Complete los campos obligatorios para registrar el retiro.')
  assert.equal(MENSAJE_HORA_FIN, 'Debe ingresar la hora de finalización para completar el retiro.')
})

test('iniciar sin NNyA o sin tutor autorizado → mensaje D', () => {
  assert.equal(primerMensaje(iniciarRetiroSchema.safeParse({ nnya_id: '', autorizacion_retiro_id: 'a' })), MENSAJE_CAMPOS_OBLIGATORIOS)
  assert.equal(primerMensaje(iniciarRetiroSchema.safeParse({ nnya_id: 'n', autorizacion_retiro_id: '' })), MENSAJE_CAMPOS_OBLIGATORIOS)
  assert.equal(iniciarRetiroSchema.safeParse({ nnya_id: 'n', autorizacion_retiro_id: 'a' }).success, true)
})

test('registrar exige hora de inicio y descripción → mensaje D; observaciones opcionales', () => {
  assert.equal(primerMensaje(registrarRetiroSchema.safeParse({ fecha_inicio: '', descripcion: 'x' })), MENSAJE_CAMPOS_OBLIGATORIOS)
  assert.equal(primerMensaje(registrarRetiroSchema.safeParse({ fecha_inicio: '2026-10-21T10:00', descripcion: '   ' })), MENSAJE_CAMPOS_OBLIGATORIOS)
  assert.equal(registrarRetiroSchema.safeParse({ fecha_inicio: '2026-10-21T10:00', descripcion: 'Salida al médico' }).success, true)
})

test('cerrar sin hora de finalización → mensaje E', () => {
  assert.equal(primerMensaje(cerrarRetiroSchema.safeParse({ fecha_fin: '' })), MENSAJE_HORA_FIN)
  assert.equal(cerrarRetiroSchema.safeParse({ fecha_fin: '2026-10-21T18:00' }).success, true)
})

test('el motivo del Admin es obligatorio', () => {
  assert.equal(motivoAdminSchema.safeParse({ motivo: '  ' }).success, false)
  assert.equal(motivoAdminSchema.safeParse({ motivo: 'Comparé el DNI físico' }).success, true)
})

test('autorización: tutor y desde obligatorios; hasta no anterior a desde', () => {
  assert.equal(autorizacionRetiroSchema.safeParse({ nnya_tutor_id: '', vigente_desde: '2026-10-21' }).success, false)
  assert.equal(
    primerMensaje(autorizacionRetiroSchema.safeParse({ nnya_tutor_id: 'v', vigente_desde: '2026-10-21', vigente_hasta: '2026-10-20' })),
    'La fecha de fin no puede ser anterior a la de inicio.'
  )
  assert.equal(autorizacionRetiroSchema.safeParse({ nnya_tutor_id: 'v', vigente_desde: '2026-10-21', vigente_hasta: '' }).success, true)
})
