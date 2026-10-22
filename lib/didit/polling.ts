// Cuándo la pantalla consulta el estado de una sesión (N-6, prompts/049): cada 4 s
// mientras el resultado está pendiente, y hasta 90 s. Después muestra "Seguimos
// esperando" y un botón "Actualizar". Lógica pura, probada en tests/unit/didit-polling.test.ts.

export const POLLING_INTERVALO_MS = 4_000
export const POLLING_TOPE_MS = 90_000

/** Intervalo de la próxima consulta, o false si hay que dejar de consultar. */
export function proximaConsulta(code: string | undefined, transcurridoMs: number): number | false {
  if (code !== undefined && code !== 'IDENTITY_PENDING') return false
  if (transcurridoMs >= POLLING_TOPE_MS) return false
  return POLLING_INTERVALO_MS
}

/** true cuando se llegó al tope sin resultado: la pantalla ofrece "Actualizar". */
export function esperaExtendida(code: string | undefined, transcurridoMs: number): boolean {
  return (code === undefined || code === 'IDENTITY_PENDING') && transcurridoMs >= POLLING_TOPE_MS
}
