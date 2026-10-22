// Tests de prompts/049: cuándo la pantalla consulta el estado de la sesión (N-6).
// Correr con: npm run test:unit
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { esperaExtendida, POLLING_INTERVALO_MS, POLLING_TOPE_MS, proximaConsulta } from '../../lib/didit/polling.ts'

test('mientras está pendiente consulta cada 4 s, hasta los 90 s', () => {
  assert.equal(proximaConsulta(undefined, 0), POLLING_INTERVALO_MS)
  assert.equal(proximaConsulta('IDENTITY_PENDING', 30_000), POLLING_INTERVALO_MS)
  assert.equal(proximaConsulta('IDENTITY_PENDING', POLLING_TOPE_MS), false)
})

test('con un resultado deja de consultar', () => {
  for (const code of ['IDENTITY_VERIFIED_AUTHORIZED', 'IDENTITY_NOT_VERIFIED', 'DNI_MISMATCH', 'PROVIDER_ERROR', 'REQUIRES_REVIEW']) {
    assert.equal(proximaConsulta(code, 1_000), false, code)
  }
})

test('"Seguimos esperando" solo a los 90 s y sin resultado', () => {
  assert.equal(esperaExtendida('IDENTITY_PENDING', POLLING_TOPE_MS - 1), false)
  assert.equal(esperaExtendida('IDENTITY_PENDING', POLLING_TOPE_MS), true)
  assert.equal(esperaExtendida('IDENTITY_NOT_VERIFIED', POLLING_TOPE_MS), false)
})
