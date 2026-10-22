import { Info } from 'lucide-react'

// Aviso de que una pantalla de diseño muestra datos ficticios (prompts/051 y 052).
export function AvisoDatosEjemplo() {
  return (
    <p className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-small text-on-surface-variant">
      <Info className="h-4 w-4 shrink-0 text-outline" aria-hidden="true" />
      <span>
        <span className="font-medium text-on-surface">Vista de diseño con datos de ejemplo.</span> Las cifras y los nombres
        de esta pantalla son ficticios; no salen de la base.
      </span>
    </p>
  )
}
