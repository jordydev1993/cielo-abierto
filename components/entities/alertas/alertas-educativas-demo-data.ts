export interface AlertaEducativaDemo {
  id: string
  tipo: string
  fecha: string
  estado: string
  descripcion: string
}

export const ALERTAS_EDUCATIVAS_DEMO: readonly AlertaEducativaDemo[] = [
  {
    id: 'alerta-educativa-demo-1',
    tipo: 'Ejemplo de ausencia escolar',
    fecha: '2026-10-05',
    estado: 'Estado de demostración: pendiente',
    descripcion: 'Ejemplo ficticio de una alerta educativa.',
  },
  {
    id: 'alerta-educativa-demo-2',
    tipo: 'Ejemplo de seguimiento educativo',
    fecha: '2026-10-07',
    estado: 'Estado de demostración: en seguimiento',
    descripcion: 'Texto ilustrativo; no describe un caso real.',
  },
]
