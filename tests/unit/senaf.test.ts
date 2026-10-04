// Tests de prompts/027: lista blanca de datos hacia la IA (R3) y control de cifras (R4).
// Correr con: npm run test:unit
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  SECCIONES,
  agregadosSenafSchema,
  redactarConPlantilla,
  verificarCifras,
  type AgregadosSenaf,
} from '../../lib/reportes/senaf.ts'

// Forma real devuelta por fn_agregados_senaf(9, 2026) el 2026-10-04.
const datos: AgregadosSenaf = {
  periodo: { mes: 9, anio: 2026, desde: '2026-09-01', hasta: '2026-09-30' },
  poblacion: { alojados_al_cierre: 3, por_genero: { Femenino: 2, Masculino: 1 }, por_franja_edad: { '6 a 11': 3 } },
  movimientos: { ingresos: 0, egresos: 1 },
  audiencias: { total: 0, por_estado: {} },
  incidentes: { total: 0, por_gravedad: {} },
  intervenciones: { total: 0, por_estado: {} },
  evaluacion_institucional: {
    realizada: false,
    estado: 'convocada',
    propuestas_del_mes_por_estado: { en_progreso: 1 },
    propuestas_pendientes_totales: 1,
  },
  seguimiento_post_egreso: {
    programados: 0,
    realizados: 0,
    efectivos: 0,
    requieren_intervencion: 0,
    indicador_reinsercion_promedio: null,
  },
}

test('R3: acepta los agregados reales', () => {
  assert.equal(agregadosSenafSchema.safeParse(datos).success, true)
})

test('R3: rechaza cualquier campo fuera de la lista blanca', () => {
  const conNombre = { ...datos, poblacion: { ...datos.poblacion, nombres: ['Ana'] } }
  assert.equal(agregadosSenafSchema.safeParse(conNombre).success, false)

  const conDni = { ...datos, dni: '12345678' }
  assert.equal(agregadosSenafSchema.safeParse(conDni).success, false)
})

test('R3: rechaza claves de conteo que no son categorías conocidas', () => {
  const conTextoLibre = { ...datos, incidentes: { total: 1, por_gravedad: { 'pelea de Juan en el patio': 1 } } }
  assert.equal(agregadosSenafSchema.safeParse(conTextoLibre).success, false)
})

test('plantilla: genera las 7 secciones en orden y sin cifras ajenas a los datos', () => {
  const secciones = redactarConPlantilla(datos)
  assert.deepEqual(secciones.map((s) => s.clave), SECCIONES.map((s) => s.clave))
  for (const s of secciones) assert.ok(s.texto.length > 0, `sección vacía: ${s.clave}`)
  assert.deepEqual(verificarCifras(secciones, datos), [])
})

test('R4: marca una cifra que no está en los datos', () => {
  const advertencias = verificarCifras([{ clave: 'movimientos', texto: 'Se registraron 4 ingresos y 1 egreso.' }], datos)
  assert.equal(advertencias.length, 1)
  assert.equal(advertencias[0].clave, 'movimientos')
  assert.match(advertencias[0].mensaje, /4/)
})

test('R4: marca porcentajes calculados por el modelo', () => {
  const advertencias = verificarCifras([{ clave: 'poblacion', texto: 'El 66,7% de la población es femenina.' }], datos)
  assert.equal(advertencias.length, 1)
})

test('R4: acepta cifras de los datos, incluido el año y las franjas de edad', () => {
  const advertencias = verificarCifras(
    [{ clave: 'poblacion', texto: 'Al cierre de septiembre de 2026 había 3 NNyA, todos de 6 a 11 años.' }],
    datos,
  )
  assert.deepEqual(advertencias, [])
})
