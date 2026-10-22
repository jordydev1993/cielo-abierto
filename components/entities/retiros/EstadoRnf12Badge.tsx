import { Badge } from '@/components/ui/badge'
import type { EstadoRnf12 } from '@/types/database.types'

// Los 5 estados de RNF-12 como los guarda la base, con la presentación del diseño de
// Cami (EstadoVerificacionBadge): "Pendiente" se muestra "Pendiente de verificación".
const PRESENTACION: Record<EstadoRnf12, { etiqueta: string; variant: 'outline' | 'success' | 'destructive' | 'warning' | 'secondary' }> = {
  Pendiente: { etiqueta: 'Pendiente de verificación', variant: 'outline' },
  'Identidad verificada': { etiqueta: 'Identidad verificada', variant: 'success' },
  'Identidad no verificada': { etiqueta: 'Identidad no verificada', variant: 'destructive' },
  'Requiere revisión': { etiqueta: 'Requiere revisión', variant: 'warning' },
  'Error del proveedor': { etiqueta: 'Error del proveedor', variant: 'secondary' },
}

export function EstadoRnf12Badge({ estado }: { estado: EstadoRnf12 }) {
  const { etiqueta, variant } = PRESENTACION[estado]
  return (
    <Badge variant={variant} role="status" aria-label={`Estado de verificación: ${etiqueta}`}>
      {etiqueta}
    </Badge>
  )
}
