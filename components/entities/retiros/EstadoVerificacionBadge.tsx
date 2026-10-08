import { Badge } from '@/components/ui/badge'
import {
  ESTADO_VERIFICACION_PRESENTACION,
  type EstadoVerificacionDemo,
} from './demo-data'

export function EstadoVerificacionBadge({ estado }: { estado: EstadoVerificacionDemo }) {
  const { variant } = ESTADO_VERIFICACION_PRESENTACION[estado]

  return (
    <Badge variant={variant} role="status" aria-label={`Estado de verificación: ${estado}`}>
      {estado}
    </Badge>
  )
}
