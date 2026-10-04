// Informe mensual institucional para SENAF (prompts/027).
// Lógica pura, sin dependencias de Next ni de Supabase: se usa en el route
// handler, en la UI y en los tests unitarios (tests/unit/senaf.test.ts).
import { z } from 'zod'

const entero = z.number().int().nonnegative()

// Lista blanca de lo que puede salir hacia el proveedor de IA (R3). Cada clave de
// conteo es un valor de dominio cerrado (CHECK en la base o agrupado en la función
// fn_agregados_senaf). Cualquier clave fuera de esta lista hace fallar el parse.
export const agregadosSenafSchema = z.strictObject({
  periodo: z.strictObject({
    mes: z.number().int().min(1).max(12),
    anio: z.number().int(),
    desde: z.iso.date(),
    hasta: z.iso.date(),
  }),
  poblacion: z.strictObject({
    alojados_al_cierre: entero,
    por_genero: z.partialRecord(z.enum(['Femenino', 'Masculino', 'Otro / no informado']), entero),
    por_franja_edad: z.partialRecord(z.enum(['0 a 5', '6 a 11', '12 a 17', '18 o más', 'sin dato']), entero),
  }),
  movimientos: z.strictObject({ ingresos: entero, egresos: entero }),
  audiencias: z.strictObject({
    total: entero,
    por_estado: z.partialRecord(z.enum(['programada', 'realizada', 'suspendida', 'cancelada']), entero),
  }),
  incidentes: z.strictObject({
    total: entero,
    por_gravedad: z.partialRecord(z.enum(['leve', 'media', 'grave', 'critico']), entero),
  }),
  intervenciones: z.strictObject({
    total: entero,
    por_estado: z.partialRecord(z.enum(['pendiente', 'en_curso', 'cerrada']), entero),
  }),
  evaluacion_institucional: z.strictObject({
    realizada: z.boolean(),
    estado: z.enum(['convocada', 'realizada', 'cancelada']).nullable(),
    propuestas_del_mes_por_estado: z.partialRecord(
      z.enum(['abierto', 'en_progreso', 'completado', 'cancelado']),
      entero,
    ),
    propuestas_pendientes_totales: entero,
  }),
  seguimiento_post_egreso: z.strictObject({
    programados: entero,
    realizados: entero,
    efectivos: entero,
    requieren_intervencion: entero,
    indicador_reinsercion_promedio: z.number().min(1).max(5).nullable(),
  }),
})

export type AgregadosSenaf = z.infer<typeof agregadosSenafSchema>

export interface Seccion {
  clave: ClaveSeccion
  titulo: string
  texto: string
}

export interface Advertencia {
  clave: string | null
  mensaje: string
}

// Formato propio del informe (no hay un modelo oficial de SENAF, decisión D4).
// Las observaciones de Dirección van aparte: las escribe una persona y no pasan por la IA.
export const SECCIONES = [
  { clave: 'poblacion', titulo: 'Población alojada' },
  { clave: 'movimientos', titulo: 'Ingresos y egresos' },
  { clave: 'judicial', titulo: 'Situación judicial' },
  { clave: 'incidentes', titulo: 'Incidentes' },
  { clave: 'intervenciones', titulo: 'Intervenciones profesionales' },
  { clave: 'evaluacion', titulo: 'Evaluación institucional y propuestas de mejora' },
  { clave: 'seguimiento', titulo: 'Seguimiento post-egreso' },
] as const

export type ClaveSeccion = (typeof SECCIONES)[number]['clave']
export const CLAVES_SECCION = SECCIONES.map((s) => s.clave) as [ClaveSeccion, ...ClaveSeccion[]]

export const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

export function nombrePeriodo(mes: number, anio: number) {
  return `${MESES[mes - 1]} de ${anio}`
}

// "Enero de 2024" (la clase CSS capitalize pondría "Enero De 2024").
export function tituloPeriodo(mes: number, anio: number) {
  const p = nombrePeriodo(mes, anio)
  return p.charAt(0).toUpperCase() + p.slice(1)
}

// "1 audiencia" / "3 audiencias" / "ninguna audiencia"
function contar(n: number, singular: string, plural: string, ninguno: string) {
  if (n === 0) return ninguno
  return `${n} ${n === 1 ? singular : plural}`
}

// Etiqueta fija ("de 6 a 11 años") o par singular/plural (["realizada", "realizadas"]).
type Etiqueta = string | [string, string]

function detalle(conteos: Partial<Record<string, number>>, etiquetas: Record<string, Etiqueta>) {
  const partes = Object.entries(conteos)
    .filter(([, n]) => (n ?? 0) > 0)
    .map(([k, n]) => {
      const e = etiquetas[k] ?? k
      return `${n} ${typeof e === 'string' ? e : e[n === 1 ? 0 : 1]}`
    })
  return partes.join(', ')
}

const seRegistro = (n: number) => (n === 1 ? 'Se registró' : 'Se registraron')

// Redacción sin IA (decisión D6: funciona sin ANTHROPIC_API_KEY y es el
// respaldo si la API falla). Determinista: solo usa los valores de `datos`.
export function redactarConPlantilla(d: AgregadosSenaf): Seccion[] {
  const periodo = nombrePeriodo(d.periodo.mes, d.periodo.anio)
  const p = d.poblacion

  const genero = detalle(p.por_genero, {
    Femenino: 'de género femenino',
    Masculino: 'de género masculino',
    'Otro / no informado': 'con género otro o no informado',
  })
  const edades = detalle(p.por_franja_edad, {
    '0 a 5': 'de 0 a 5 años',
    '6 a 11': 'de 6 a 11 años',
    '12 a 17': 'de 12 a 17 años',
    '18 o más': 'de 18 años o más',
    'sin dato': 'sin fecha de nacimiento registrada',
  })

  const textos: Record<ClaveSeccion, string> = {
    poblacion:
      p.alojados_al_cierre === 0
        ? `Al cierre de ${periodo} la residencia no registraba niñas, niños ni adolescentes alojados.`
        : `Al cierre de ${periodo} la residencia alojaba ${contar(p.alojados_al_cierre, 'niña, niño o adolescente', 'niñas, niños y adolescentes', '')}` +
          (genero ? `: ${genero}` : '') +
          '.' +
          (edades ? ` Por franja de edad: ${edades}.` : ''),

    movimientos: (() => {
      const { ingresos, egresos } = d.movimientos
      if (ingresos === 0 && egresos === 0) return 'Durante el período no se registraron ingresos ni egresos.'
      const partes = [
        ingresos > 0 ? contar(ingresos, 'ingreso', 'ingresos', '') : null,
        egresos > 0 ? contar(egresos, 'egreso', 'egresos', '') : null,
      ].filter(Boolean)
      const sinMovimiento = ingresos === 0 ? ' No hubo ingresos.' : egresos === 0 ? ' No hubo egresos.' : ''
      const verbo = (ingresos > 0 ? ingresos : egresos) === 1 && partes.length === 1 ? 'se registró' : 'se registraron'
      return `Durante el período ${verbo} ${partes.join(' y ')}.${sinMovimiento}`
    })(),

    judicial:
      d.audiencias.total === 0
        ? 'No hubo audiencias judiciales en el período.'
        : `${seRegistro(d.audiencias.total)} ${contar(d.audiencias.total, 'audiencia judicial', 'audiencias judiciales', '')} ` +
          `(${detalle(d.audiencias.por_estado, { programada: ['programada', 'programadas'], realizada: ['realizada', 'realizadas'], suspendida: ['suspendida', 'suspendidas'], cancelada: ['cancelada', 'canceladas'] })}).`,

    incidentes:
      d.incidentes.total === 0
        ? 'No se registraron incidentes en el período.'
        : `${seRegistro(d.incidentes.total)} ${contar(d.incidentes.total, 'incidente', 'incidentes', '')} ` +
          `(${detalle(d.incidentes.por_gravedad, { leve: 'de gravedad leve', media: 'de gravedad media', grave: ['grave', 'graves'], critico: ['crítico', 'críticos'] })}).`,

    intervenciones:
      d.intervenciones.total === 0
        ? 'No se registraron intervenciones profesionales en el período.'
        : `El equipo técnico registró ${contar(d.intervenciones.total, 'intervención', 'intervenciones', '')} ` +
          `(${detalle(d.intervenciones.por_estado, { pendiente: ['pendiente', 'pendientes'], en_curso: 'en curso', cerrada: ['cerrada', 'cerradas'] })}).`,

    evaluacion: (() => {
      const e = d.evaluacion_institucional
      const reunion =
        e.estado === null
          ? 'No se registró una evaluación institucional para el período.'
          : e.realizada
            ? 'La evaluación institucional del período se realizó.'
            : `La evaluación institucional del período figura como ${e.estado}.`
      const propuestas = detalle(e.propuestas_del_mes_por_estado, {
        abierto: ['abierta', 'abiertas'],
        en_progreso: 'en progreso',
        completado: ['completada', 'completadas'],
        cancelado: ['cancelada', 'canceladas'],
      })
      return (
        reunion +
        (propuestas ? ` Propuestas de mejora surgidas de esa evaluación: ${propuestas}.` : '') +
        (e.propuestas_pendientes_totales === 0
          ? ' No quedan propuestas de mejora pendientes.'
          : ` En total ${e.propuestas_pendientes_totales === 1 ? 'queda' : 'quedan'} ${contar(e.propuestas_pendientes_totales, 'propuesta de mejora pendiente', 'propuestas de mejora pendientes', '')} de resolución.`)
      )
    })(),

    seguimiento: (() => {
      const s = d.seguimiento_post_egreso
      if (s.programados === 0) return 'No había contactos de seguimiento post-egreso programados para el período.'
      return (
        `Había ${contar(s.programados, 'contacto de seguimiento post-egreso programado', 'contactos de seguimiento post-egreso programados', '')}; ` +
        `se ${s.realizados === 1 ? 'realizó' : 'realizaron'} ${s.realizados} y ${s.efectivos} ${s.efectivos === 1 ? 'resultó efectivo' : 'resultaron efectivos'}.` +
        (s.indicador_reinsercion_promedio !== null
          ? ` El indicador de reinserción promedio fue de ${s.indicador_reinsercion_promedio} sobre 5.`
          : '') +
        (s.requieren_intervencion > 0
          ? ` ${contar(s.requieren_intervencion, 'caso requiere', 'casos requieren', '')} intervención.`
          : '')
      )
    })(),
  }

  return SECCIONES.map(({ clave, titulo }) => ({ clave, titulo, texto: textos[clave] }))
}

// Todos los números presentes en los datos, incluidos los de claves ("6 a 11")
// y fechas ("2026-09-30" → 2026, 9, 30).
function numerosDe(valor: unknown, acc = new Set<number>()): Set<number> {
  if (typeof valor === 'number') acc.add(valor)
  else if (typeof valor === 'string') for (const m of valor.match(/\d+(?:[.,]\d+)?/g) ?? []) acc.add(Number(m.replace(',', '.')))
  else if (valor && typeof valor === 'object')
    for (const [k, v] of Object.entries(valor)) {
      numerosDe(k, acc)
      numerosDe(v, acc)
    }
  return acc
}

// R4: cada cifra escrita en el texto tiene que existir en los datos agregados.
// No detecta números escritos en letras; sí cualquier cálculo propio del modelo
// (porcentajes, sumas) que no esté en los datos.
export function verificarCifras(secciones: Pick<Seccion, 'clave' | 'texto'>[], datos: AgregadosSenaf): Advertencia[] {
  const permitidos = numerosDe(datos)
  const advertencias: Advertencia[] = []
  for (const { clave, texto } of secciones) {
    const extrañas = new Set<string>()
    for (const m of texto.match(/\d+(?:[.,]\d+)?/g) ?? []) {
      if (!permitidos.has(Number(m.replace(',', '.')))) extrañas.add(m)
    }
    if (extrañas.size > 0) {
      advertencias.push({
        clave,
        mensaje: `Revisar: el texto menciona ${[...extrañas].join(', ')}, que no aparece en los datos del período.`,
      })
    }
  }
  return advertencias
}
