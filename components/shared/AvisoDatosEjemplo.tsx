import { Info } from 'lucide-react'

// Franja que aclara que una pantalla de diseño muestra datos ficticios (prompts/051).
export function AvisoDatosEjemplo() {
  return (
    <p className="flex items-center gap-2 border-b border-outline-variant bg-tertiary-fixed px-8 py-2 text-small text-on-tertiary-fixed">
      <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>
        <strong className="font-semibold">Vista de diseño con datos de ejemplo.</strong> Las cifras y los nombres de esta
        pantalla son ficticios; no salen de la base.
      </span>
    </p>
  )
}
