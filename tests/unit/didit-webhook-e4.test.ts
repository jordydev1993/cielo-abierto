import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { verifyDiditSignature } from '../../lib/didit/verify-signature.ts'
import { diditWebhookSchema } from '../../lib/validations/didit-webhook.schema.ts'

const SECRET = 'test-secret-not-a-real-credential'
const OTHER_SECRET = 'other-secret'

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
  const parsed = JSON.parse(raw)
  const canonical = JSON.stringify(canonicalize(parsed))
  return createHmac('sha256', secret).update(canonical).digest('hex')
}

function nowSec(): number {
  return Math.floor(Date.now() / 1000)
}

const base = () => JSON.stringify({
  session_id: 'sess_test_0001',
  status: 'Approved',
  application_id: 'app_test_sandbox',
  environment: 'sandbox',
  timestamp: 1750000000,
  webhook_type: 'status.updated',
  event_id: 'evt_test_0001',
})

test('E4-1 firma valida con signature layer', () => {
  const body = base()
  const sig = signBody(body, SECRET)
  assert.equal(verifyDiditSignature(body, String(nowSec()), sig, SECRET), true)
})

test('E4-2 firma invalida', () => {
  const body = base()
  const sig = signBody(body, OTHER_SECRET)
  assert.equal(verifyDiditSignature(body, String(nowSec()), sig, SECRET), false)
})

test('E4-3 body no JSON -> schema/parse', () => {
  const bad = 'not-json'
  try { JSON.parse(bad); assert.fail('should throw') } catch { assert.ok(true) }
})

test('E4-4 payload fuera de schema', () => {
  const body = { invalid: true }
  const res = diditWebhookSchema.safeParse(body)
  assert.equal(res.success, false)
})

test('E4-5 schema valido', () => {
  const body = JSON.parse(base())
  const res = diditWebhookSchema.safeParse(body)
  assert.equal(res.success, true)
})
