// Datos de ejemplo de la pantalla Inicio (prompts/051, 052 y 054, solo diseño). Todo es ficticio:
// ningún nombre ni cifra sale de la base. Conectar datos reales es un plan aparte.

// Cambio contra el período anterior (prompts/054). `sentido` dice si subir es bueno, malo o
// ninguna de las dos cosas: decide el color (verde, rojo o gris).
export interface Variacion {
  valor: number
  vs: string
  sentido: 'subir-bueno' | 'subir-malo' | 'neutral'
}

export interface Cifra {
  id: string
  label: string
  valor: number
  unidad?: string
  insignia?: string
  variacion?: Variacion
  href: string
}

export interface PuntoPoblacion {
  mes: string
  activos: number
  ingresos: number
  egresos: number
}

export type EstadoEvento = 'pendiente' | 'cumplido' | 'cancelado'

export interface EventoProximo {
  id: string
  // Fecha ISO (AAAA-MM-DD). Los datos de ejemplo arrancan el jueves 22/10/2026.
  fecha: string
  esHoy: boolean
  desde: string
  hasta: string
  que: string
  nnya: string
  tipo: string
  estado: EstadoEvento
  href: string
}

export const cifras: Cifra[] = [
  { id: 'nnya', label: 'NNyA activos', valor: 18, unidad: 'NNyA', href: '/nnya', variacion: { valor: 1, vs: 'septiembre', sentido: 'neutral' } },
  { id: 'legajos', label: 'Legajos activos', valor: 18, unidad: 'legajos', href: '/legajos', variacion: { valor: 1, vs: 'septiembre', sentido: 'neutral' } },
  { id: 'alertas', label: 'Alertas pendientes', valor: 5, insignia: '1 crítica', href: '/alertas', variacion: { valor: -2, vs: 'septiembre', sentido: 'subir-malo' } },
  { id: 'retiros', label: 'Retiros en curso', valor: 1, insignia: '1 en revisión', href: '/retiros', variacion: { valor: 0, vs: 'septiembre', sentido: 'subir-malo' } },
  { id: 'audiencias', label: 'Audiencias', valor: 2, unidad: 'esta semana', href: '/legajos', variacion: { valor: 1, vs: 'sem. pasada', sentido: 'neutral' } },
  { id: 'postegreso', label: 'Post-egreso por vencer', valor: 3, unidad: 'contactos', href: '/seguimiento-post-egreso', variacion: { valor: 1, vs: 'septiembre', sentido: 'subir-malo' } },
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

export const eventosProximos: EventoProximo[] = [
  { id: 'e1', fecha: '2026-10-22', esHoy: true, desde: '09:00', hasta: '10:00', que: 'Turno de pediatría', nnya: 'Lucía P. (DEMO)', tipo: 'Salud', estado: 'cumplido', href: '/turnos' },
  { id: 'e2', fecha: '2026-10-22', esHoy: true, desde: '11:30', hasta: '12:30', que: 'Audiencia judicial · Juzgado de Niñez 2', nnya: 'Tomás R. (DEMO)', tipo: 'Tutela', estado: 'pendiente', href: '/legajos' },
  { id: 'e3', fecha: '2026-10-22', esHoy: true, desde: '14:00', hasta: '14:30', que: 'Retiro autorizado de fin de semana', nnya: 'Lucía P. (DEMO)', tipo: 'Retiro', estado: 'pendiente', href: '/retiros' },
  { id: 'e4', fecha: '2026-10-23', esHoy: false, desde: '10:00', hasta: '10:45', que: 'Contacto de 30 días post-egreso', nnya: 'Camila S. (DEMO)', tipo: 'Post-egreso', estado: 'pendiente', href: '/seguimiento-post-egreso' },
  { id: 'e5', fecha: '2026-10-23', esHoy: false, desde: '16:00', hasta: '17:00', que: 'Turno de odontología', nnya: 'Tomás R. (DEMO)', tipo: 'Salud', estado: 'cancelado', href: '/turnos' },
  { id: 'e6', fecha: '2026-10-26', esHoy: false, desde: '09:30', hasta: '10:30', que: 'Reunión de evaluación institucional', nnya: '—', tipo: 'Institucional', estado: 'pendiente', href: '/evaluacion-institucional' },
  { id: 'e7', fecha: '2026-10-27', esHoy: false, desde: '11:00', hasta: '12:00', que: 'Audiencia de control de medida', nnya: 'Camila S. (DEMO)', tipo: 'Tutela', estado: 'pendiente', href: '/legajos' },
  { id: 'e8', fecha: '2026-10-20', esHoy: false, desde: '15:00', hasta: '15:30', que: 'Retiro con referente', nnya: 'Tomás R. (DEMO)', tipo: 'Retiro', estado: 'cumplido', href: '/retiros' },
]
