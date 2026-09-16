// Tipos de dominio derivados de `database.generated.ts` (generado con
// `supabase gen types` / `mcp__supabase__generate_typescript_types`).
//
// `supabase gen types` no infiere los valores literales de los `CHECK
// (columna IN (...))` — esas columnas salen como `string` plano en el
// archivo generado. Acá se angostan a sus uniones literales reales
// (verificadas contra `supabase/migrations/20260620000031_clean_schema.sql`
// y las migraciones de FASE A1), y se agregan las propiedades opcionales de
// relación (`?`) que devuelven los `select('*, tabla(...)')` con join,
// ausentes del tipo `Row` base.
//
// Para regenerar `database.generated.ts`: correr
// `mcp__supabase__generate_typescript_types` (o `supabase gen types
// typescript`) y pegar el resultado ahí. Si el schema real cambió los
// nombres o tipos de columna, TypeScript va a marcar acá mismo qué `Omit`
// quedó desalineado.
import type { Database } from './database.generated'

type Row<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']

export type Rol = Row<'roles'>

export interface Usuario extends Row<'usuarios'> {
  roles?: { nombre: string }
}

export interface Nnya extends Omit<Row<'nnya'>, 'estado_actual' | 'turno_escolar'> {
  estado_actual: 'En residencia' | 'En proceso de egreso' | 'Egresado' | 'Fallecido'
  turno_escolar: 'Mañana' | 'Tarde' | 'Noche' | 'Doble Jornada' | null
}

export type Tutor = Row<'tutores'>

export interface NnyaTutor extends Row<'nnya_tutores'> {
  tutores?: Tutor
}

export interface Legajo extends Omit<Row<'legajos'>, 'estado'> {
  estado: 'activo' | 'cerrado' | 'archivado'
  nnya?: Pick<Nnya, 'id' | 'nombre' | 'apellido' | 'dni'>
}

export interface Intervencion extends Omit<Row<'intervenciones'>, 'estado'> {
  estado: 'pendiente' | 'en_curso' | 'cerrada'
  usuarios?: Pick<Usuario, 'id' | 'nombre' | 'apellido'>
}

export interface Novedad extends Omit<Row<'novedades'>, 'tipo'> {
  tipo: 'Salud' | 'Educación' | 'Comportamiento' | 'Alimentación' | 'Visita Familiar' | 'Otro'
  usuarios?: Pick<Usuario, 'id' | 'nombre' | 'apellido'>
}

export interface Actividad extends Omit<Row<'actividades'>, 'estado'> {
  estado: 'programada' | 'en_curso' | 'realizada' | 'cancelada'
  usuarios?: Pick<Usuario, 'id' | 'nombre' | 'apellido'>
}

export interface Turno extends Omit<Row<'turnos'>, 'estado'> {
  estado: 'programado' | 'confirmado' | 'realizado' | 'cancelado' | 'ausente'
}

export interface Alerta extends Omit<Row<'alertas'>, 'prioridad' | 'estado'> {
  prioridad: 'baja' | 'media' | 'alta' | 'critica'
  estado: 'pendiente' | 'en_proceso' | 'completada' | 'vencida'
}

export interface Incidente extends Omit<Row<'incidentes'>, 'gravedad' | 'estado'> {
  gravedad: 'leve' | 'media' | 'grave' | 'critico'
  estado: 'abierto' | 'en_seguimiento' | 'cerrado'
}

export interface Diagnostico extends Omit<Row<'diagnosticos'>, 'estado'> {
  estado: 'activo' | 'en_seguimiento' | 'resuelto'
}

export interface Medicamento extends Omit<Row<'medicamentos'>, 'estado'> {
  estado: 'en_curso' | 'finalizado'
}

export interface Informe extends Omit<Row<'informes'>, 'estado'> {
  estado: 'borrador' | 'revisado' | 'finalizado'
}

export type Documento = Row<'documentos'>

export interface AudienciaJudicial extends Omit<Row<'audiencias_judiciales'>, 'estado'> {
  estado: 'programada' | 'realizada' | 'suspendida' | 'cancelada'
}

export type AuditLog = Row<'audit_log'>

// ── FASE A1 (AGENTS-WEB.md § Roadmap) — ver prompts/012, prompts/019 ──

export interface Referente extends Omit<Row<'referentes'>, 'tipo'> {
  tipo: 'familiar' | 'educador' | 'vecino' | 'otro'
}

export interface VinculoTutela extends Omit<Row<'vinculos_tutela'>, 'tipo' | 'estado'> {
  tipo: 'tutela_residencia' | 'revinculacion_familiar' | 'referente_afectivo'
  estado: 'propuesto' | 'vigente' | 'finalizado' | 'revocado'
}

export interface ValidacionRenaper
  extends Omit<Row<'validaciones_renaper'>, 'momento' | 'estado_dni' | 'resultado' | 'respuesta_cruda'> {
  momento: 'alta_referente' | 'egreso' | 'reintento'
  estado_dni: 'vigente' | 'vencido' | 'inexistente' | 'error_servicio'
  resultado: 'aprobado' | 'rechazado' | 'no_concluyente'
  respuesta_cruda: Record<string, unknown> | null
}

export interface TransferenciaAuh extends Omit<Row<'transferencia_auh'>, 'estado'> {
  estado: 'pendiente' | 'en_gestion' | 'transferida' | 'rechazada' | 'no_corresponde'
}

export interface EvaluacionInstitucional extends Omit<Row<'evaluacion_institucional'>, 'estado'> {
  estado: 'convocada' | 'realizada' | 'cancelada'
}

export type EvaluacionInstitucionalAsistente = Row<'evaluacion_institucional_asistentes'>

export type EvaluacionInstitucionalCaso = Row<'evaluacion_institucional_casos'>

export interface PropuestaMejora extends Omit<Row<'propuestas_mejora'>, 'tipo' | 'area' | 'estado'> {
  tipo: 'mejora' | 'capacitacion'
  area: 'educativa' | 'sanitaria' | 'social' | 'institucional' | 'protocolos' | null
  estado: 'abierto' | 'en_progreso' | 'completado' | 'cancelado'
}

export interface TurnoPersonal extends Omit<Row<'turnos_personal'>, 'turno' | 'estado'> {
  turno: 'mañana' | 'tarde' | 'noche'
  estado: 'planificado' | 'en_curso' | 'entregado' | 'cerrado' | 'no_cubierto'
}

export interface SeguimientoPostEgreso
  extends Omit<Row<'seguimiento_post_egreso'>, 'dias_post_egreso' | 'escolaridad' | 'salud' | 'terapias'> {
  dias_post_egreso: 30 | 60
  escolaridad: 'cumple' | 'parcial' | 'no_cumple' | 'no_corresponde' | null
  salud: 'cumple' | 'parcial' | 'no_cumple' | 'no_corresponde' | null
  terapias: 'cumple' | 'parcial' | 'no_cumple' | 'no_corresponde' | null
}
