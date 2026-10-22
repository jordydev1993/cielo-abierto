import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac, randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { startNextServer } from '../support/next-server.ts'

// prompts/048: lógica del webhook de Didit contra Supabase LOCAL (npx supabase start).
// Si Supabase local no está levantado, el test se salta. Nunca usa .env.local.
// Datos ficticios (DNI 99…, nombres "Prueba"). El secreto es ficticio.

const SECRET = 'test-secret-not-a-real-credential'
const PORT = 3493

function supabaseLocal(): { url: string; anonKey: string; serviceRoleKey: string } | null {
  try {
    const out = execFileSync('npx', ['--yes', 'supabase@2.121.0', 'status', '-o', 'env'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      shell: process.platform === 'win32',
      timeout: 60_000,
    })
    const env = Object.fromEntries(
      out.split(/\r?\n/).flatMap((l) => {
        const m = l.match(/^([A-Z_]+)="?(.*?)"?$/)
        return m ? [[m[1], m[2]]] : []
      })
    )
    if (!env.API_URL || !env.SERVICE_ROLE_KEY || !env.ANON_KEY) return null
    // Solo una base local: nunca un proyecto remoto.
    if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(env.API_URL)) return null
    return { url: env.API_URL, anonKey: env.ANON_KEY, serviceRoleKey: env.SERVICE_ROLE_KEY }
  } catch {
    return null
  }
}

const local = supabaseLocal()

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value !== null && typeof value === 'object') {
    const sorted: Record<string, unknown> = {}
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = canonicalize((value as Record<string, unknown>)[key])
    }
    return sorted
  }
  return value
}

const NOMBRE_SECRETO = 'PRUEBA SECRETA'
const SELFIE_SECRETA = 'https://selfie.example/secreta.jpg'

test('webhook de Didit contra Supabase local', { skip: local ? false : 'Supabase local no está levantado', timeout: 300_000 }, async (t) => {
  const db = local!
  const headers = { apikey: db.serviceRoleKey, authorization: `Bearer ${db.serviceRoleKey}`, 'content-type': 'application/json' }

  async function rest<T = Record<string, unknown>[]>(path: string, body?: unknown, method = body ? 'POST' : 'GET'): Promise<T> {
    const res = await fetch(`${db.url}/rest/v1/${path}`, {
      method,
      headers: { ...headers, prefer: 'return=representation' },
      body: body ? JSON.stringify(body) : undefined,
    })
    const json = await res.json()
    if (!res.ok) throw new Error(`${path}: ${res.status} ${JSON.stringify(json)}`)
    return json as T
  }
  const uno = async (path: string, body?: unknown) => (await rest(path, body))[0] as Record<string, string>

  // Datos de prueba
  const sufijo = randomUUID().replace(/\D/g, '').slice(0, 6).padEnd(6, '0')
  const dni = (p: string) => `9${p}${sufijo}`.slice(0, 9)
  const [rolEt] = await rest(`roles?nombre=eq.${encodeURIComponent('Equipo Tecnico')}&select=id`)
  const usuario = await uno('usuarios', { nombre: 'Educador', apellido: 'QA', email: `qa.webhook.${sufijo}@arguelloinfancias.test`, rol_id: rolEt.id })
  const nnya = await uno('nnya', { nombre: 'Lucía', apellido: 'Prueba', dni: dni('10'), fecha_nacimiento: '2015-03-10' })
  const tutor = await uno('tutores', { nombre: 'Ana', apellido: 'Prueba', dni: dni('11'), parentesco: 'Madre' })
  const nt = await uno('nnya_tutores', { nnya_id: nnya.id, tutor_id: tutor.id })
  const aut = await uno('autorizaciones_retiro', { nnya_tutor_id: nt.id, created_by: usuario.id })
  const nuevoRetiro = () => uno('retiros', { nnya_id: nnya.id, tutor_id: tutor.id, created_by: usuario.id, autorizacion_retiro_id: aut.id, consentimiento_didit: 'aceptado' })
  const nuevaSesion = (vinculo: Record<string, string>, proposito = 'retiro') =>
    uno('sesiones_didit', { id: randomUUID(), session_id: `qa-wh-${randomUUID()}`, proposito, creada_por: usuario.id, ...vinculo })
  const leerSesion = async (id: string) => (await rest(`sesiones_didit?id=eq.${id}&select=*`))[0] as Record<string, unknown>

  const server = await startNextServer({ port: PORT, secret: SECRET, supabase: db })

  async function webhook(sesion: Record<string, string> | null, status: string, verificacion: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) {
    const body = JSON.stringify({
      event_id: randomUUID(),
      webhook_type: 'status.updated',
      timestamp: Math.floor(Date.now() / 1000),
      application_id: 'app_test_sandbox',
      environment: 'sandbox',
      status,
      session_id: sesion?.session_id ?? `qa-desconocida-${randomUUID()}`,
      vendor_data: sesion?.id ?? null,
      decision: {
        id_verifications: [
          {
            status,
            verification_method: 'id_lookup',
            first_name: 'MARÍA',
            last_name: NOMBRE_SECRETO,
            id_lookup: { selfie_url: SELFIE_SECRETA },
            ...verificacion,
          },
        ],
      },
      ...extra,
    })
    const ts = String(Math.floor(Date.now() / 1000))
    const sig = createHmac('sha256', SECRET).update(JSON.stringify(canonicalize(JSON.parse(body)))).digest('hex')
    const res = await fetch(`${server.baseUrl}/api/didit/webhook`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-timestamp': ts, 'x-signature-v2': sig },
      body,
    })
    return res.status
  }

  const sesionesUsadas: string[] = []

  try {
    await t.test('sesión desconocida → 200 sin escribir (D-4)', async () => {
      assert.equal(await webhook(null, 'Approved'), 200)
    })

    await t.test('vendor_data distinto → 200 sin escribir', async () => {
      const r = await nuevoRetiro()
      const s = await nuevaSesion({ retiro_id: r.id })
      assert.equal(await webhook({ id: randomUUID(), session_id: s.session_id }, 'Approved', { personal_number: tutor.dni }), 200)
      assert.equal((await leerSesion(s.id)).estado_didit, null)
    })

    await t.test('Approved con el DNI del tutor → Identidad verificada (D-14)', async () => {
      const r = await nuevoRetiro()
      const s = await nuevaSesion({ retiro_id: r.id })
      sesionesUsadas.push(s.id)
      assert.equal(await webhook(s, 'Approved', { personal_number: tutor.dni }), 200)
      const fila = await leerSesion(s.id)
      assert.equal(fila.estado_rnf12, 'Identidad verificada')
      assert.equal(fila.dni_coincide, true)
      assert.ok(fila.finalizada_at)

      // Idempotencia: el mismo evento y uno atrasado no cambian nada.
      assert.equal(await webhook(s, 'Approved', { personal_number: '1' }), 200)
      assert.equal(await webhook(s, 'In Progress'), 200)
      const otraVez = await leerSesion(s.id)
      assert.equal(otraVez.estado_didit, 'Approved')
      assert.equal(otraVez.dni_coincide, true)
      assert.equal(otraVez.finalizada_at, fila.finalizada_at)
    })

    await t.test('Approved con otro DNI → Identidad no verificada', async () => {
      const r = await nuevoRetiro()
      const s = await nuevaSesion({ retiro_id: r.id })
      sesionesUsadas.push(s.id)
      assert.equal(await webhook(s, 'Approved', { personal_number: '30111222' }), 200)
      const fila = await leerSesion(s.id)
      assert.equal(fila.estado_rnf12, 'Identidad no verificada')
      assert.equal(fila.dni_coincide, false)
    })

    await t.test('Declined por provider_error → Error del proveedor (D-12)', async () => {
      const r = await nuevoRetiro()
      const s = await nuevaSesion({ retiro_id: r.id })
      sesionesUsadas.push(s.id)
      assert.equal(await webhook(s, 'Declined', { fallback_from: { reason: 'provider_error' } }), 200)
      const fila = await leerSesion(s.id)
      assert.equal(fila.estado_rnf12, 'Error del proveedor')
      assert.equal(fila.error_proveedor, 'provider_error')
    })

    await t.test('3 no_match → retiro en requiere_revision (D-19)', async () => {
      const r = await nuevoRetiro()
      for (let i = 0; i < 3; i++) {
        const s = await nuevaSesion({ retiro_id: r.id })
        sesionesUsadas.push(s.id)
        assert.equal(await webhook(s, 'Declined', { fallback_from: { reason: 'no_match' } }), 200)
      }
      const [retiro] = await rest(`retiros?id=eq.${r.id}&select=estado`)
      assert.equal(retiro.estado, 'requiere_revision')
    })

    await t.test('referente aprobado → validación RENAPER y el vínculo puede pasar a vigente (D-11, D-16)', async () => {
      const ref = await uno('referentes', { nombre: 'Gabriela', apellido: 'Prueba', dni: dni('21'), tipo: 'familiar', created_by: usuario.id })
      const vinculo = await uno('vinculos_tutela', { nnya_id: nnya.id, tipo: 'revinculacion_familiar', referente_id: ref.id, vigente_desde: '2026-10-21', estado: 'propuesto', created_by: usuario.id })
      const s = await nuevaSesion({ referente_id: ref.id }, 'validacion_referente')
      sesionesUsadas.push(s.id)
      assert.equal(await webhook(s, 'Approved', { personal_number: ref.dni }), 200)

      const [v] = await rest(`validaciones_renaper?sesion_didit_id=eq.${s.id}&select=*`)
      assert.equal(v.resultado, 'aprobado')
      assert.equal(v.estado_dni, 'vigente')
      assert.equal(v.momento, 'alta_referente')
      assert.equal(v.consultado_por, usuario.id)
      assert.equal(v.respuesta_cruda, null)
      assert.equal(v.tiene_antecedentes, null)

      await rest(`vinculos_tutela?id=eq.${vinculo.id}`, { estado: 'vigente' }, 'PATCH')
      const [act] = await rest(`vinculos_tutela?id=eq.${vinculo.id}&select=estado`)
      assert.equal(act.estado, 'vigente')

      // Reentrega: no duplica la validación.
      assert.equal(await webhook(s, 'Approved', { personal_number: ref.dni }), 200)
      assert.equal((await rest(`validaciones_renaper?sesion_didit_id=eq.${s.id}&select=id`)).length, 1)
    })

    await t.test('referente con otro DNI → sin validación RENAPER (decisión 2)', async () => {
      const ref = await uno('referentes', { nombre: 'Hernán', apellido: 'Prueba', dni: dni('22'), tipo: 'otro', created_by: usuario.id })
      const s = await nuevaSesion({ referente_id: ref.id }, 'validacion_referente')
      sesionesUsadas.push(s.id)
      assert.equal(await webhook(s, 'Approved', { personal_number: '30111222' }), 200)
      assert.equal((await rest(`validaciones_renaper?sesion_didit_id=eq.${s.id}&select=id`)).length, 0)
      assert.equal((await leerSesion(s.id)).estado_rnf12, 'Identidad no verificada')
    })

    await t.test('minimización (D-28): ni el nombre ni la selfie llegan a la base ni al log', async () => {
      const ids = sesionesUsadas.join(',')
      const filas = [
        ...(await rest(`sesiones_didit?id=in.(${ids})&select=*`)),
        ...(await rest(`validaciones_renaper?sesion_didit_id=in.(${ids})&select=*`)),
        ...(await rest(`audit_log?tabla=in.(sesiones_didit,validaciones_renaper)&order=created_at.desc&limit=200&select=*`)),
      ]
      const texto = JSON.stringify(filas)
      assert.ok(!texto.includes(NOMBRE_SECRETO), 'el nombre no debe estar en la base')
      assert.ok(!texto.includes(SELFIE_SECRETA), 'la selfie no debe estar en la base')

      await new Promise((resolve) => setTimeout(resolve, 500))
      const out = server.output()
      assert.ok(!out.includes(NOMBRE_SECRETO), 'el nombre no debe estar en el log')
      assert.ok(!out.includes(SELFIE_SECRETA), 'la selfie no debe estar en el log')
      assert.ok(!out.includes(tutor.dni), 'el DNI no debe estar en el log')
      assert.ok(!/decision/i.test(out), 'el log no debe incluir el objeto decision')
    })
  } finally {
    await server.stop()
  }
})
