// Datos de ejemplo de la pantalla Inicio (prompts/051 y 052, solo diseño). Todo es ficticio:
// ningún nombre ni cifra sale de la base. Conectar datos reales es un plan aparte.

export interface Cifra {
  id: string
  label: string
  valor: number
  unidad?: string
  insignia?: string
  href: string
}

export interface PuntoPoblacion {
  mes: string
  activos: number
  ingresos: number
  egresos: number
}

export interface EventoAgenda {
  hora: string
  que: string
  nnya: string
  tipo: string
  cumplido: boolean
  href: string
}

export const cifras: Cifra[] = [
  { id: 'nnya', label: 'NNyA activos', valor: 18, unidad: 'NNyA', insignia: '+1 este mes', href: '/nnya' },
  { id: 'legajos', label: 'Legajos activos', valor: 18, unidad: 'legajos', href: '/legajos' },
  { id: 'alertas', label: 'Alertas pendientes', valor: 5, insignia: '1 crítica', href: '/alertas' },
  { id: 'retiros', label: 'Retiros en curso', valor: 1, insignia: '1 en revisión', href: '/retiros' },
  { id: 'audiencias', label: 'Audiencias', valor: 2, unidad: 'esta semana', href: '/legajos' },
  { id: 'postegreso', label: 'Post-egreso por vencer', valor: 3, unidad: 'contactos', href: '/seguimiento-post-egreso' },
]

// 24 meses, de noviembre de 2024 a octubre de 2026. Activos = activos del mes anterior
// + ingresos − egresos, para que las tres series sean coherentes entre sí.
const meses = ['nov', 'dic', 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct']
const ingresos = [2, 1, 0, 2, 1, 1, 2, 0, 1, 2, 1, 1, 2, 0, 1, 1, 2, 1, 1, 0, 2, 1, 1, 1]
const egresos = [1, 1, 1, 0, 1, 2, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0]

export const poblacionPorMes: PuntoPoblacion[] = (() => {
  let activos = 11 // así octubre de 2026 cierra en 18, la cifra de NNyA activos
  return ingresos.map((ing, i) => {
    activos = activos + ing - egresos[i]
    const anio = i < 2 ? '24' : i < 14 ? '25' : '26'
    return { mes: `${meses[i % 12]} ${anio}`, activos, ingresos: ing, egresos: egresos[i] }
  })
})()

export const alertasPorTipo: { tipo: string; cantidad: number }[] = [
  { tipo: 'Medicación', cantidad: 14 },
  { tipo: 'Turno médico', cantidad: 11 },
  { tipo: 'Audiencia', cantidad: 7 },
  { tipo: 'Documentación', cantidad: 5 },
  { tipo: 'Incidente grave', cantidad: 3 },
  { tipo: 'Seguimiento', cantidad: 2 },
]

export const postEgresoPorMes: { mes: string; programados: number; realizados: number }[] = [
  { mes: 'may', programados: 4, realizados: 3 },
  { mes: 'jun', programados: 3, realizados: 3 },
  { mes: 'jul', programados: 5, realizados: 3 },
  { mes: 'ago', programados: 4, realizados: 4 },
  { mes: 'sep', programados: 6, realizados: 5 },
  { mes: 'oct', programados: 5, realizados: 4 },
]

export const intervencionesPorArea: { area: string; cantidad: number }[] = [
  { area: 'Psicología', cantidad: 42 },
  { area: 'Trabajo social', cantidad: 31 },
  { area: 'Educación', cantidad: 24 },
  { area: 'Salud', cantidad: 18 },
  { area: 'Legal', cantidad: 9 },
]

export const agendaDeHoy: EventoAgenda[] = [
  { hora: '09:00', que: 'Turno de pediatría', nnya: 'Lucía P. (DEMO)', tipo: 'Salud', cumplido: true, href: '/turnos' },
  { hora: '11:30', que: 'Audiencia judicial · Juzgado de Niñez 2', nnya: 'Tomás R. (DEMO)', tipo: 'Tutela', cumplido: false, href: '/legajos' },
  { hora: '14:00', que: 'Retiro autorizado de fin de semana', nnya: 'Lucía P. (DEMO)', tipo: 'Retiro', cumplido: false, href: '/retiros' },
  { hora: '16:30', que: 'Contacto de 30 días post-egreso', nnya: 'Camila S. (DEMO)', tipo: 'Post-egreso', cumplido: false, href: '/seguimiento-post-egreso' },
  { hora: '18:00', que: 'Traspaso de guardia', nnya: '—', tipo: 'Turno', cumplido: false, href: '/turnos-personal' },
]
