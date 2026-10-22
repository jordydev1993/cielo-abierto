// Los errores de Supabase llegan como objetos con `message`; los triggers de retiros
// devuelven mensajes en español pensados para mostrarse (RAISE EXCEPTION).
export function mensajeError(error: unknown, porDefecto = 'Ocurrió un error inesperado.'): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const { message } = error as { message: unknown }
    if (typeof message === 'string') return message
  }
  return porDefecto
}
