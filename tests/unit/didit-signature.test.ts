// Tests de prompts/029: verificación de la firma X-Signature-V2 del webhook de Didit (K-01a) y ventana anti-replay (K-02).
// Correr con: npm run test:unit
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { verifyDiditSignature } from '../../lib/didit/verify-signature.ts'

/**
 * Tests de función pura: sin fixtures de navegador, sin servidor, sin variables
 * de entorno y sin conexión a Supabase.
 *
 * El secreto de abajo es FICTICIO. No autentica contra Didit ni contra nada,
 * no se lee de `process.env` y no es una credencial.
 */

const TEST_SECRET = 'test-secret-not-a-real-credential'
const OTHER_SECRET = 'test-secret-different-one'

/**
 * Réplica de la canonicalización de `lib/didit/verify-signature.ts` para poder
 * FIRMAR cuerpos válidos. La duplicación es intencional: la alternativa sería
 * exportar las internas de `lib/didit/`, y modificar ese archivo está fuera de
 * alcance. Lo que se prueba acá es `verifyDiditSignature`, no el helper.
 */
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize)
  }
  if (value !== null && typeof value === 'object') {
    const sorted: Record<string, unknown> = {}
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = canonicalize((value as Record<string, unknown>)[key])
    }
    return sorted
  }
  return value
}

function sign(rawBody: string, secret: string): string {
  const canonical = JSON.stringify(canonicalize(JSON.parse(rawBody)))
  return createHmac('sha256', secret).update(canonical).digest('hex')
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000)
}

/**
 * Envelope de Didit con las claves DECLARADAS en desorden alfabético a
 * propósito: si la implementación no canonicalizara antes de firmar, la
 * firma no coincidiría. Usa solo valores válidos según
 * `lib/validations/didit-webhook.schema.ts`.
 */
function buildBody(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    session_id: 'sess_test_0001',
    status: 'Approved',
    application_id: 'app_test_sandbox',
    environment: 'sandbox',
    timestamp: 1750000000,
    webhook_type: 'status.updated',
    event_id: 'evt_test_0001',
    ...overrides,
  })
}

test('K-01a.1: firma válida sobre el mismo secreto → true', () => {
  const body = buildBody()
  const signature = sign(body, TEST_SECRET)
  assert.equal(verifyDiditSignature(body, String(nowSeconds()), signature, TEST_SECRET), true)
})

test('K-01a.2: X-Timestamp ausente → false', () => {
  const body = buildBody()
  const signature = sign(body, TEST_SECRET)
  assert.equal(verifyDiditSignature(body, null, signature, TEST_SECRET), false)
})

test('K-01a.3: X-Signature-V2 ausente → false', () => {
  const body = buildBody()
  assert.equal(verifyDiditSignature(body, String(nowSeconds()), null, TEST_SECRET), false)
})

test('K-01a.4: firma truncada (longitud distinta) → false', () => {
  const body = buildBody()
  const signature = sign(body, TEST_SECRET)
  // 62 caracteres hex = 31 bytes, contra los 32 del HMAC completo. Cubre el
  // pre-check de longitud de verify-signature.ts:49, que evita que
  // timingSafeEqual lance sobre buffers de tamaños distintos.
  const truncated = signature.slice(0, 62)
  assert.equal(truncated.length, 62)
  assert.equal(verifyDiditSignature(body, String(nowSeconds()), truncated, TEST_SECRET), false)
})

test('K-01a.5: 1 carácter alterado de la firma → false', () => {
  const body = buildBody()
  const signature = sign(body, TEST_SECRET)
  // Misma longitud, hex válido, primer carácter distinto: el pre-check de
  // longitud pasa y el fallo real ocurre en timingSafeEqual.
  const altered = (signature[0] === 'a' ? 'b' : 'a') + signature.slice(1)
  assert.equal(altered.length, signature.length)
  assert.notEqual(altered, signature)
  assert.equal(verifyDiditSignature(body, String(nowSeconds()), altered, TEST_SECRET), false)
})

test('K-01a.6: firma calculada con otro secreto → false', () => {
  const body = buildBody()
  const signature = sign(body, OTHER_SECRET)
  assert.equal(verifyDiditSignature(body, String(nowSeconds()), signature, TEST_SECRET), false)
})

test('K-01a.7: body no parseable como JSON → false', () => {
  const rawBody = 'esto-no-es-json'
  // Firmamos el JSON canónico equivalente para aislar la variable: lo que
  // falla es el parseo del body, no la comparación de la firma.
  const signature = sign(JSON.stringify({ raw: 'esto-no-es-json' }), TEST_SECRET)
  assert.equal(verifyDiditSignature(rawBody, String(nowSeconds()), signature, TEST_SECRET), false)
})

test('K-01a.8: claves del body en orden distinto → true (canonicalización)', () => {
  const original = buildBody()
  const signature = sign(original, TEST_SECRET)
  // Mismo contenido, orden de claves invertido y espaciado distinto.
  const reordered = JSON.stringify(
    {
      event_id: 'evt_test_0001',
      webhook_type: 'status.updated',
      timestamp: 1750000000,
      application_id: 'app_test_sandbox',
      environment: 'sandbox',
      status: 'Approved',
      session_id: 'sess_test_0001',
    },
    null,
    2,
  )
  assert.deepEqual(JSON.parse(reordered), JSON.parse(original))
  assert.equal(verifyDiditSignature(reordered, String(nowSeconds()), signature, TEST_SECRET), true)
})

test('K-01a.9: arrays y objetos anidados → true (canonicalización recursiva)', () => {
  const body = buildBody({
    status: 'In Review',
    decision: {
      id_verifications: [
        { node_id: 'node_ocr', result: 'not_found', reasons: ['dni', 'selfie'] },
        { node_id: 'node_extra', result: 'approved' },
      ],
      metadata: { z: 1, a: { b: 2, a: 3 } },
    },
    metadata: { retry: false, attempt: 2 },
  })
  const signature = sign(body, TEST_SECRET)
  assert.equal(verifyDiditSignature(body, String(nowSeconds()), signature, TEST_SECRET), true)
})

test('K-02.1: X-Timestamp de hace 10 minutos → false', () => {
  const body = buildBody()
  const signature = sign(body, TEST_SECRET)
  const timestamp = String(nowSeconds() - 600)
  assert.equal(verifyDiditSignature(body, timestamp, signature, TEST_SECRET), false)
})

test('K-02.2: X-Timestamp de hace 301s → false (fuera de la ventana)', () => {
  const body = buildBody()
  const signature = sign(body, TEST_SECRET)
  // Margen de 1s sobre el límite: la diferencia solo puede crecer con el
  // correr del reloj, así que este caso no es sensible a la carga de la
  // máquina. El reloj corre hacia "más viejo", nunca hacia "más nuevo".
  const timestamp = String(nowSeconds() - 301)
  assert.equal(verifyDiditSignature(body, timestamp, signature, TEST_SECRET), false)
})

test('K-02.3: X-Timestamp de hace 299s → true (dentro de la ventana)', () => {
  const body = buildBody()
  const signature = sign(body, TEST_SECRET)
  // Sensibilidad de ±1s: si el event loop se demora 2s entre calcular el
  // timestamp y que verifyDiditSignature lea Date.now(), la diferencia pasa
  // a 301s y el caso falla. En la práctica el intervalo es de microsegundos.
  // Si alguna vez fallara, el arreglo es subir el número a 290 (sigue
  // dentro de la ventana) y NO tocar la implementación.
  const timestamp = String(nowSeconds() - 299)
  assert.equal(verifyDiditSignature(body, timestamp, signature, TEST_SECRET), true)
})

test('K-02.4: X-Timestamp no numérico ("abc") → false', () => {
  const body = buildBody()
  const signature = sign(body, TEST_SECRET)
  // "abc" es truthy, así que pasa el guard de headers. Number("abc") es NaN
  // → !Number.isFinite(NaN) → frena en verify-signature.ts:31.
  assert.equal(verifyDiditSignature(body, 'abc', signature, TEST_SECRET), false)
})

test('K-02.5: X-Timestamp vacío ("") → false (guard del header, no del reloj)', () => {
  const body = buildBody()
  const signature = sign(body, TEST_SECRET)
  // CORREGIDO 2026-10-05: "" es FALSY, así que verifyDiditSignature corta en
  // el guard `!timestampHeader` de verify-signature.ts:28 —igual que un
  // header ausente (K-01a.2)—. NO llega al chequeo del reloj: `Number("")`
  // nunca se evalúa. Antes se documentaba que "" pasaba la chequeo de
  // finitud y se frenaba por la ventana de 300s, y eso era incorrecto.
  // Se conserva el caso porque fija comportamiento real, pero es una
  // validación del guard de headers, no de la ventana anti-replay.
  assert.equal(verifyDiditSignature(body, '', signature, TEST_SECRET), false)
})