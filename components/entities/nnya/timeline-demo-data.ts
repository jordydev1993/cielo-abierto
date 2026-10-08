export interface EventoTimelineDemo {
  id: string
  fecha: string
  categoria: string
  descripcion: string
}

export const EVENTOS_TIMELINE_DEMO: readonly EventoTimelineDemo[] = [
  {
    id: 'evento-demo-1',
    fecha: '2026-08-12',
    categoria: 'Apertura de legajo',
    descripcion: 'Ejemplo ficticio de un hito administrativo.',
  },
  {
    id: 'evento-demo-2',
    fecha: '2026-08-19',
    categoria: 'Intervención',
    descripcion: 'Ejemplo ficticio de una acción de seguimiento.',
  },
  {
    id: 'evento-demo-3',
    fecha: '2026-09-02',
    categoria: 'Turno',
    descripcion: 'Ejemplo ficticio de una actividad programada.',
  },
  {
    id: 'evento-demo-4',
    fecha: '2026-09-16',
    categoria: 'Revisión documental',
    descripcion: 'Ejemplo ficticio de una revisión de documentación.',
  },
]
