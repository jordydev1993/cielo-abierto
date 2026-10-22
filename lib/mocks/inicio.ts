import type { AreaId } from '@/lib/navegacion'

// Datos de ejemplo de la pantalla Inicio (prompts/051, solo diseño). Todo es ficticio:
// ningún nombre ni cifra sale de la base. Conectar datos reales es un plan aparte.

export type Prioridad = 'critica' | 'alta' | 'media' | 'baja'

export interface PuntoTendencia {
  mes: string
  valor: number
}

export interface EventoAgenda {
  hora: string
  que: string
  nnya: string
  area: AreaId
  cumplido: boolean
  href: string
}

export interface AlertaEjemplo {
  titulo: string
  detalle: string
  prioridad: Prioridad
  cuando: string
  nueva: boolean
}

export const nnyaActivosPorMes: PuntoTendencia[] = [
  { mes: 'may', valor: 15 },
  { mes: 'jun', valor: 16 },
  { mes: 'jul', valor: 16 },
  { mes: 'ago', valor: 17 },
  { mes: 'sep', valor: 17 },
  { mes: 'oct', valor: 18 },
]

export const alertasPorPrioridad: Record<Prioridad, number> = {
  critica: 1,
  alta: 1,
  media: 2,
  baja: 1,
}

export const retirosEnCurso = 1
export const seguimientosPorVencer = 3

export const agendaDeHoy: EventoAgenda[] = [
  { hora: '09:00', que: 'Turno de pediatría', nnya: 'Lucía P. (DEMO)', area: 'salud', cumplido: true, href: '/turnos' },
  { hora: '11:30', que: 'Audiencia judicial · Juzgado de Niñez 2', nnya: 'Tomás R. (DEMO)', area: 'tutela', cumplido: false, href: '/legajos' },
  { hora: '14:00', que: 'Retiro autorizado de fin de semana', nnya: 'Lucía P. (DEMO)', area: 'tutela', cumplido: false, href: '/retiros' },
  { hora: '16:30', que: 'Contacto de 30 días post-egreso', nnya: 'Camila S. (DEMO)', area: 'institucional', cumplido: false, href: '/seguimiento-post-egreso' },
  { hora: '18:00', que: 'Traspaso de guardia', nnya: '—', area: 'seguimiento', cumplido: false, href: '/turnos-personal' },
]

export const alertasRecientes: AlertaEjemplo[] = [
  { titulo: 'Incidente grave registrado', detalle: 'Tomás R. (DEMO) · lo registró Educador QA', prioridad: 'critica', cuando: 'hace 12 min', nueva: true },
  { titulo: 'Medicación sin registrar', detalle: 'Lucía P. (DEMO) · turno mañana', prioridad: 'alta', cuando: '08:40', nueva: false },
  { titulo: 'Retiro en revisión: el DNI no coincide', detalle: 'Requiere verificación manual de Dirección', prioridad: 'media', cuando: 'ayer', nueva: false },
  { titulo: 'Informe SENAF de septiembre', detalle: 'Borrador listo para aprobar', prioridad: 'baja', cuando: 'lunes', nueva: false },
]
