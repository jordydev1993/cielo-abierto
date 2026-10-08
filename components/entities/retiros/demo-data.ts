export const TUTORES_AUTORIZADOS_DEMO = [
  {
    id: 'tutor-demo-a',
    nombre: 'Nombre ficticio A',
    vinculo: 'Vínculo de ejemplo A',
    estadoAutorizacion: 'Vigente (dato ficticio)',
    vigencia: '01/10/2026 al 31/12/2026 (rango de ejemplo; no se calcula)',
    restricciones: 'Restricción ficticia para mostrar esta sección; no representa un criterio institucional.',
  },
  {
    id: 'tutor-demo-b',
    nombre: 'Nombre ficticio B',
    vinculo: 'Vínculo de ejemplo B',
    estadoAutorizacion: 'Vigente (dato ficticio)',
    vigencia: '15/09/2026 al 15/12/2026 (rango de ejemplo; no se calcula)',
    restricciones: '',
  },
] as const

export const RETIRO_DEMO = {
  fecha: '08/10/2026',
  horaInicio: '09:15',
  horaFinalizacion: '10:05',
  estado: 'Realizada',
} as const

export const ESTADOS_VERIFICACION_DEMO = [
  'Pendiente de verificación',
  'Identidad verificada',
  'Identidad no verificada',
  'Requiere revisión',
  'Error del proveedor',
] as const

export type EstadoVerificacionDemo = (typeof ESTADOS_VERIFICACION_DEMO)[number]

export const ESTADO_VERIFICACION_PRESENTACION: Record<
  EstadoVerificacionDemo,
  { variant: 'outline' | 'success' | 'destructive' | 'warning' | 'secondary'; descripcion: string }
> = {
  'Pendiente de verificación': {
    variant: 'outline',
    descripcion: 'La verificación aún no tiene un resultado en esta representación de ejemplo.',
  },
  'Identidad verificada': {
    variant: 'success',
    descripcion: 'Ejemplo visual de un resultado de identidad verificada.',
  },
  'Identidad no verificada': {
    variant: 'destructive',
    descripcion: 'Ejemplo visual de un resultado de validación de identidad fallida.',
  },
  'Requiere revisión': {
    variant: 'warning',
    descripcion: 'Ejemplo visual de un resultado que requiere revisión.',
  },
  'Error del proveedor': {
    variant: 'secondary',
    descripcion: 'Falla del proveedor: no consume un intento. Ejemplo visual, sin llamada real.',
  },
}
