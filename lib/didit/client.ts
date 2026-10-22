// Cliente HTTP de Didit, solo del lado del servidor (prompts/047).
// API: https://docs.didit.me/sessions-api/create-session. La API key nunca sale del servidor.
// No lanza excepciones: devuelve un resultado tipado, y cualquier falla del proveedor
// termina en "Error del proveedor" (RNF-13). No loguea el DNI ni la respuesta de Didit.
import { z } from 'zod'

export const DIDIT_API_BASE = 'https://verification.didit.me'

/** Escenarios de sandbox permitidos (prompts/045, Supuesto 5). */
export const SANDBOX_SCENARIOS = [
  'approve',
  'lookup_no_match',
  'lookup_partial_match',
  'lookup_provider_error',
] as const
export type SandboxScenario = (typeof SANDBOX_SCENARIOS)[number]

/** RNF-13: 15 s por llamada y un reintento en errores de red o 5xx. */
export const DIDIT_TIMEOUT_MS = 15_000

export type FallaDidit = 'timeout' | 'red' | 'http_5xx' | 'http_4xx' | 'respuesta_invalida'

export type ResultadoDidit<T> = ({ ok: true } & T) | { ok: false; falla: FallaDidit; status?: number }

export interface DiditDeps {
  fetch?: typeof fetch
  timeoutMs?: number
}

const sesionCreadaSchema = z.object({
  session_id: z.string().min(1),
  url: z.string().url(),
})

const decisionSchema = z.object({
  status: z.string(),
  session_url: z.string().url().nullable().optional(),
})

async function llamar(
  url: string,
  init: RequestInit,
  deps: DiditDeps
): Promise<ResultadoDidit<{ body: unknown }>> {
  const fetchFn = deps.fetch ?? fetch
  const timeoutMs = deps.timeoutMs ?? DIDIT_TIMEOUT_MS

  for (let intento = 1; intento <= 2; intento++) {
    let res: Response
    try {
      res = await fetchFn(url, { ...init, signal: AbortSignal.timeout(timeoutMs) })
    } catch (error) {
      const esTimeout = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')
      // Un timeout no se reintenta: duplicaría la espera del adulto.
      if (esTimeout) return { ok: false, falla: 'timeout' }
      if (intento === 2) return { ok: false, falla: 'red' }
      continue
    }

    if (res.status >= 500) {
      if (intento === 2) return { ok: false, falla: 'http_5xx', status: res.status }
      continue
    }
    if (!res.ok) return { ok: false, falla: 'http_4xx', status: res.status }

    try {
      return { ok: true, body: await res.json() }
    } catch {
      return { ok: false, falla: 'respuesta_invalida', status: res.status }
    }
  }
  return { ok: false, falla: 'red' }
}

export async function crearSesionDidit(
  params: {
    apiKey: string
    workflowId: string
    vendorData: string
    dniEsperado: string
    sandboxScenario?: SandboxScenario | null
  },
  deps: DiditDeps = {}
): Promise<ResultadoDidit<{ sessionId: string; url: string }>> {
  const body: Record<string, unknown> = {
    workflow_id: params.workflowId,
    vendor_data: params.vendorData,
    expected_details: { identification_number: params.dniEsperado },
    language: 'es',
  }
  if (params.sandboxScenario) body.sandbox_scenario = params.sandboxScenario

  const res = await llamar(
    `${DIDIT_API_BASE}/v3/session/`,
    {
      method: 'POST',
      headers: { 'x-api-key': params.apiKey, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    },
    deps
  )
  if (!res.ok) return res

  const parsed = sesionCreadaSchema.safeParse(res.body)
  if (!parsed.success) return { ok: false, falla: 'respuesta_invalida' }
  return { ok: true, sessionId: parsed.data.session_id, url: parsed.data.url }
}

/** URL y estado de una sesión existente, para retomarla sin crear otra (decisión 3). */
export async function obtenerSesionDidit(
  params: { apiKey: string; sessionId: string },
  deps: DiditDeps = {}
): Promise<ResultadoDidit<{ status: string; url: string | null }>> {
  const res = await llamar(
    `${DIDIT_API_BASE}/v3/session/${encodeURIComponent(params.sessionId)}/decision/`,
    { method: 'GET', headers: { 'x-api-key': params.apiKey } },
    deps
  )
  if (!res.ok) return res

  const parsed = decisionSchema.safeParse(res.body)
  if (!parsed.success) return { ok: false, falla: 'respuesta_invalida' }
  return { ok: true, status: parsed.data.status, url: parsed.data.session_url ?? null }
}
