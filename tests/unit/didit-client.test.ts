// Tests de prompts/047: cliente HTTP de Didit (RNF-13: timeout, reintento, errores controlados).
// Correr con: npm run test:unit. Sin red: `fetch` se inyecta. La API key es FICTICIA.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { crearSesionDidit, obtenerSesionDidit, DIDIT_API_BASE } from '../../lib/didit/client.ts'

const API_KEY = 'test-api-key-not-a-real-credential'
const PARAMS = {
  apiKey: API_KEY,
  workflowId: '00000000-0000-4000-a000-0000000000aa',
  vendorData: '00000000-0000-4000-a000-0000000000bb',
  dniEsperado: '99000011',
}

type Llamada = { url: string; init: RequestInit }

function fetchFalso(respuestas: Array<() => Response | Promise<Response>>) {
  const llamadas: Llamada[] = []
  const fn = (async (url: string | URL | Request, init?: RequestInit) => {
    llamadas.push({ url: String(url), init: init ?? {} })
    const siguiente = respuestas[llamadas.length - 1] ?? respuestas[respuestas.length - 1]
    return siguiente()
  }) as typeof fetch
  return { fn, llamadas }
}

const creada = () =>
  Response.json(
    { session_id: 'sess-1', session_token: 'tok', url: 'https://verify.didit.me/es/session/abc', status: 'Not Started' },
    { status: 201 }
  )
const error = (status: number) => () => Response.json({ detail: 'x' }, { status })

test('crea la sesión con el DNI esperado, vendor_data y la API key en el header', async () => {
  const { fn, llamadas } = fetchFalso([creada])
  const res = await crearSesionDidit(PARAMS, { fetch: fn })

  assert.deepEqual(res, { ok: true, sessionId: 'sess-1', url: 'https://verify.didit.me/es/session/abc' })
  assert.equal(llamadas.length, 1)
  assert.equal(llamadas[0].url, `${DIDIT_API_BASE}/v3/session/`)
  assert.equal((llamadas[0].init.headers as Record<string, string>)['x-api-key'], API_KEY)
  const body = JSON.parse(String(llamadas[0].init.body))
  assert.equal(body.workflow_id, PARAMS.workflowId)
  assert.equal(body.vendor_data, PARAMS.vendorData)
  assert.equal(body.expected_details.identification_number, '99000011')
  assert.equal(body.language, 'es')
  assert.equal('sandbox_scenario' in body, false)
})

test('manda sandbox_scenario solo cuando se lo pasan', async () => {
  const { fn, llamadas } = fetchFalso([creada])
  await crearSesionDidit({ ...PARAMS, sandboxScenario: 'lookup_no_match' }, { fetch: fn })
  assert.equal(JSON.parse(String(llamadas[0].init.body)).sandbox_scenario, 'lookup_no_match')
})

test('un 5xx se reintenta una vez', async () => {
  const { fn, llamadas } = fetchFalso([error(503), creada])
  const res = await crearSesionDidit(PARAMS, { fetch: fn })
  assert.equal(res.ok, true)
  assert.equal(llamadas.length, 2)
})

test('dos 5xx seguidos terminan en http_5xx', async () => {
  const { fn, llamadas } = fetchFalso([error(500), error(502)])
  const res = await crearSesionDidit(PARAMS, { fetch: fn })
  assert.deepEqual(res, { ok: false, falla: 'http_5xx', status: 502 })
  assert.equal(llamadas.length, 2)
})

test('un 4xx no se reintenta', async () => {
  for (const status of [400, 401, 403, 429]) {
    const { fn, llamadas } = fetchFalso([error(status)])
    const res = await crearSesionDidit(PARAMS, { fetch: fn })
    assert.deepEqual(res, { ok: false, falla: 'http_4xx', status })
    assert.equal(llamadas.length, 1)
  }
})

test('un error de red se reintenta y, si sigue, termina en red', async () => {
  const { fn, llamadas } = fetchFalso([
    () => Promise.reject(new TypeError('fetch failed')),
    () => Promise.reject(new TypeError('fetch failed')),
  ])
  const res = await crearSesionDidit(PARAMS, { fetch: fn })
  assert.deepEqual(res, { ok: false, falla: 'red' })
  assert.equal(llamadas.length, 2)
})

test('un timeout corta la llamada y no se reintenta', async () => {
  const llamadas: number[] = []
  const fn = ((_url: string, init?: RequestInit) => {
    llamadas.push(1)
    return new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(init.signal?.reason))
    })
  }) as unknown as typeof fetch
  const res = await crearSesionDidit(PARAMS, { fetch: fn, timeoutMs: 20 })
  assert.deepEqual(res, { ok: false, falla: 'timeout' })
  assert.equal(llamadas.length, 1)
})

test('una respuesta malformada o sin url es respuesta_invalida', async () => {
  const noJson = fetchFalso([() => new Response('<html>', { status: 201 })])
  assert.equal((await crearSesionDidit(PARAMS, { fetch: noJson.fn })).ok, false)

  const sinUrl = fetchFalso([() => Response.json({ session_id: 'sess-1' }, { status: 201 })])
  assert.deepEqual(await crearSesionDidit(PARAMS, { fetch: sinUrl.fn }), { ok: false, falla: 'respuesta_invalida' })
})

test('obtenerSesionDidit devuelve el estado y la session_url', async () => {
  const { fn, llamadas } = fetchFalso([
    () => Response.json({ status: 'Not Started', session_url: 'https://verify.didit.me/es/session/abc' }),
  ])
  const res = await obtenerSesionDidit({ apiKey: API_KEY, sessionId: 'sess-1' }, { fetch: fn })
  assert.deepEqual(res, { ok: true, status: 'Not Started', url: 'https://verify.didit.me/es/session/abc' })
  assert.equal(llamadas[0].url, `${DIDIT_API_BASE}/v3/session/sess-1/decision/`)
  assert.equal(llamadas[0].init.method, 'GET')
})
