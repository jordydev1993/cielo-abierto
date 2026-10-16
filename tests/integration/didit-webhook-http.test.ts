import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { startNextServer } from '../support/next-server.ts'

// E-4 (nivel endpoint): contrato HTTP real del webhook de Didit.
// Levanta `next dev` local en 127.0.0.1 y hace POST reales.
// Secreto EXCLUSIVAMENTE ficticio. No se configuran variables de Supabase:
// el webhook debe funcionar sin ellas gracias al bypass de `proxy.ts` (Plan 032).

const SECRET = 'test-secret-not-a-real-credential'
const OTHER_SECRET = 'otro-secreto-ficticio'
const PORT_SIN_SECRETO = 3491
const PORT_CON_SECRETO = 3492
const WEBHOOK_PATH = '/api/didit/webhook'

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value !== null && typeof value === 'object') {
    const sorted: Record<string, unknown> = {}
    const v = value as Record<string, unknown>
    for (const key of Object.keys(v).sort()) {
      sorted[key] = canonicalize(v[key])
    }
    return sorted
  }
  return value
}

function signBody(raw: string, secret: string): string {
  const canonical = JSON.stringify(canonicalize(JSON.parse(raw)))
  return createHmac('sha256', secret).update(canonical).digest('hex')
}

function nowSec(): number {
  return Math.floor(Date.now() / 1000)
}

function validBody(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    event_id: 'evt_test_0001',
    webhook_type: 'status.updated',
    timestamp: 1750000000,
    application_id: 'app_test_sandbox',
    environment: 'sandbox',
    status: 'Approved',
    session_id: 'sess_test_0001',
    ...overrides,
  })
}

function signedHeaders(
  raw: string,
  secret: string,
  timestamp: number = nowSec()
): Record<string, string> {
  return {
    'content-type': 'application/json',
    'x-timestamp': String(timestamp),
    'x-signature-v2': signBody(raw, secret),
  }
}

async function post(
  baseUrl: string,
  body: string,
  headers: Record<string, string>
): Promise<Response> {
  return fetch(`${baseUrl}${WEBHOOK_PATH}`, { method: 'POST', headers, body })
}

test('E4H-1 · sin DIDIT_WEBHOOK_SECRET → 500', { timeout: 180_000 }, async () => {
  const server = await startNextServer({ port: PORT_SIN_SECRETO })
  try {
    const res = await post(server.baseUrl, '{}', { 'content-type': 'application/json' })
    assert.equal(res.status, 500)
    assert.deepEqual(await res.json(), { error: 'Webhook no configurado.' })
  } finally {
    await server.stop()
  }
})

test('E4H-2..9 · contrato HTTP con secreto ficticio', { timeout: 240_000 }, async (t) => {
  const server = await startNextServer({ port: PORT_CON_SECRETO, secret: SECRET })
  try {
    await t.test('E4H-2 · x-signature-v2 ausente → 401', async () => {
      const body = validBody()
      const res = await post(server.baseUrl, body, {
        'content-type': 'application/json',
        'x-timestamp': String(nowSec()),
      })
      assert.equal(res.status, 401)
      assert.deepEqual(await res.json(), { error: 'Firma inválida.' })
    })

    await t.test('E4H-3 · firma inválida (calculada con otro secreto) → 401', async () => {
      const body = validBody()
      const res = await post(server.baseUrl, body, signedHeaders(body, OTHER_SECRET))
      assert.equal(res.status, 401)
      assert.deepEqual(await res.json(), { error: 'Firma inválida.' })
    })

    await t.test('E4H-4 · x-timestamp no numérico → 401', async () => {
      const body = validBody()
      const res = await post(server.baseUrl, body, {
        'content-type': 'application/json',
        'x-timestamp': 'abc',
        'x-signature-v2': signBody(body, SECRET),
      })
      assert.equal(res.status, 401)
    })

    await t.test('E4H-5 · x-timestamp vencido (>300s) → 401', async () => {
      const body = validBody()
      const res = await post(server.baseUrl, body, signedHeaders(body, SECRET, nowSec() - 400))
      assert.equal(res.status, 401)
    })

    // Hallazgo: `route.ts:21-25` (400 "Body inválido") es inalcanzable. La firma se
    // verifica ANTES y `verifyDiditSignature` hace JSON.parse (`verify-signature.ts:38`):
    // si el body no es JSON, la firma da inválida → 401. Se fija el comportamiento ACTUAL.
    await t.test('E4H-6 · body no parseable como JSON → 401 (no 400)', async () => {
      const res = await post(server.baseUrl, 'esto-no-es-json', {
        'content-type': 'application/json',
        'x-timestamp': String(nowSec()),
        'x-signature-v2': 'a'.repeat(64),
      })
      assert.equal(res.status, 401)
      assert.deepEqual(await res.json(), { error: 'Firma inválida.' })
    })

    await t.test('E4H-7 · JSON válido pero fuera de schema → 400', async () => {
      const body = validBody({ environment: 'prod' })
      const res = await post(server.baseUrl, body, signedHeaders(body, SECRET))
      assert.equal(res.status, 400)
      assert.deepEqual(await res.json(), { error: 'Payload inesperado.' })
    })

    await t.test('E4H-8 · webhook_type ≠ status.updated → 200', async () => {
      const body = validBody({ webhook_type: 'session.completed' })
      const res = await post(server.baseUrl, body, signedHeaders(body, SECRET))
      assert.equal(res.status, 200)
      assert.deepEqual(await res.json(), { received: true })
    })

    await t.test('E4H-9 · status.updated válido → 200 + log acotado', async () => {
      const body = validBody()
      const res = await post(server.baseUrl, body, signedHeaders(body, SECRET))
      assert.equal(res.status, 200)
      assert.deepEqual(await res.json(), { received: true })

      await new Promise((resolve) => setTimeout(resolve, 500))
      const out = server.output()
      assert.match(out, /session_id=sess_test_0001/, 'el log debe incluir el session_id')
      assert.match(out, /status=Approved/, 'el log debe incluir el status')
      assert.ok(!out.includes(SECRET), 'el log no debe filtrar el secreto')
      assert.ok(!/decision/i.test(out), 'el log no debe incluir el objeto decision')
      assert.ok(!/selfie/i.test(out), 'el log no debe incluir referencias a selfie')
    })
  } finally {
    await server.stop()
  }
})
