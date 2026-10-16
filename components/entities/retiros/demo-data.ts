export const TUTORES_AUTORIZADOS_DEMO = [
  {
    id: 'tutor-demo-a',
    nombre: 'Nombre ficticio A',
    nnyaIds: ['nnya-demo-a'],
    vinculo: 'Vínculo de ejemplo A',
    estadoAutorizacion: 'Vigente (dato ficticio)',
    vigencia: '01/10/2026 al 31/12/2026 (rango de ejemplo; no se calcula)',
    restricciones: 'Restricción ficticia para mostrar esta sección; no representa un criterio institucional.',
  },
  {
    id: 'tutor-demo-b',
    nombre: 'Nombre ficticio B',
    nnyaIds: ['nnya-demo-b'],
    vinculo: 'Vínculo de ejemplo B',
    estadoAutorizacion: 'Vigente (dato ficticio)',
    vigencia: '15/09/2026 al 15/12/2026 (rango de ejemplo; no se calcula)',
    restricciones: '',
  },
] as const

export const NNYA_RETIRO_DEMO = [
  { id: 'nnya-demo-a', nombre: 'NNyA ficticio A' },
  { id: 'nnya-demo-b', nombre: 'NNyA ficticio B' },
] as const

export const RETIRO_DEMO = {
  fecha: '08/10/2026',
  horaInicio: '09:15',
  horaFinalizacion: '',
  estado: 'En curso',
  nnya: 'NNyA ficticio A',
  tutor: 'Nombre ficticio A',
  descripcion: 'Salida de ejemplo para una actividad recreativa.',
  observaciones: 'Registro enteramente ficticio; no corresponde a un caso real.',
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
    descripcion: 'Ejemplo visual de un resultado fallido que consume un intento.',
  },
  'Requiere revisión': {
    variant: 'warning',
    descripcion: 'Estado del trámite al agotar los tres intentos; queda a la espera de la decisión de un Admin.',
  },
  'Error del proveedor': {
    variant: 'secondary',
    descripcion: 'Falla del proveedor: no consume un intento. Ejemplo visual, sin llamada real.',
  },
}
