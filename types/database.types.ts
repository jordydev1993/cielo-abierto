export interface Rol {
  id: string
  nombre: string
  descripcion: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Usuario {
  id: string
  email: string
  nombre: string
  apellido: string
  rol_id: string
  activo: boolean
  created_at: string
  updated_at: string
  auth_user_id: string | null
  telefono: string | null
  roles?: { nombre: string }
}

export interface Nnya {
  id: string
  nombre: string
  apellido: string
  dni: string
  fecha_nacimiento: string
  lugar_nacimiento: string | null
  nacionalidad: string | null
  genero: string | null
  domicilio: string | null
  telefono: string | null
  email: string | null
  escolaridad: string | null
  obra_social: string | null
  numero_expediente: string | null
  activo: boolean
  estado_actual: 'En residencia' | 'En proceso de egreso' | 'Egresado' | 'Fallecido'
  fecha_egreso: string | null
  foto_url: string | null
  alertas_importantes: string | null
  turno_escolar: 'Mañana' | 'Tarde' | 'Noche' | 'Doble Jornada' | null
  created_at: string
  updated_at: string
}

export interface Tutor {
  id: string
  nombre: string
  apellido: string
  dni: string
  telefono: string | null
  email: string | null
  domicilio: string | null
  parentesco: string
  ocupacion: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export interface NnyaTutor {
  id: string
  nnya_id: string
  tutor_id: string
  es_principal: boolean
  created_at: string
  tutores?: Tutor
}

export interface Legajo {
  id: string
  nnya_id: string
  numero_legajo: string
  fecha_apertura: string
  fecha_cierre: string | null
  estado: 'activo' | 'cerrado' | 'archivado'
  motivo_cierre: string | null
  observaciones: string | null
  created_at: string
  updated_at: string
  nnya?: Pick<Nnya, 'id' | 'nombre' | 'apellido' | 'dni'>
}

export interface Intervencion {
  id: string
  nnya_id: string
  tipo: string
  descripcion: string
  fecha: string
  profesional_id: string | null
  estado: 'pendiente' | 'en_curso' | 'cerrada'
  resultado: string | null
  observaciones: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  usuarios?: Pick<Usuario, 'id' | 'nombre' | 'apellido'>
}

export interface Novedad {
  id: string
  nnya_id: string
  usuario_id: string | null
  tipo: 'Salud' | 'Educación' | 'Comportamiento' | 'Alimentación' | 'Visita Familiar' | 'Otro'
  descripcion: string
  fecha_hora: string
  created_at: string
  updated_at: string
  usuarios?: Pick<Usuario, 'id' | 'nombre' | 'apellido'>
}

export interface Actividad {
  id: string
  titulo: string
  descripcion: string | null
  tipo: string
  fecha: string
  hora_inicio: string | null
  hora_fin: string | null
  lugar: string | null
  responsable_id: string | null
  nnya_ids: string[]
  estado: 'programada' | 'en_curso' | 'realizada' | 'cancelada'
  observaciones: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  usuarios?: Pick<Usuario, 'id' | 'nombre' | 'apellido'>
}

export interface Turno {
  id: string
  nnya_id: string
  legajo_id: string
  tipo: string
  fecha_hora: string
  lugar: string | null
  profesional: string | null
  motivo: string | null
  estado: 'programado' | 'confirmado' | 'realizado' | 'cancelado' | 'ausente'
  observaciones: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Alerta {
  id: string
  nnya_id: string
  titulo: string
  descripcion: string | null
  tipo: string
  prioridad: 'baja' | 'media' | 'alta' | 'critica'
  estado: 'pendiente' | 'en_proceso' | 'completada' | 'vencida'
  fecha_vencimiento: string | null
  completada_por: string | null
  fecha_completada: string | null
  observacion_cierre: string | null
  created_at: string
  updated_at: string
}

export interface Actividad {
  id: string
  titulo: string
  descripcion: string | null
  tipo: string
  fecha: string
  hora_inicio: string | null
  hora_fin: string | null
  lugar: string | null
  responsable_id: string | null
  nnya_ids: string[]
  estado: 'programada' | 'en_curso' | 'realizada' | 'cancelada'
  observaciones: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Incidente {
  id: string
  nnya_id: string
  legajo_id: string
  tipo: string
  descripcion: string
  fecha_hora: string
  gravedad: 'leve' | 'media' | 'grave' | 'critico'
  reportado_por: string | null
  acciones_tomadas: string | null
  estado: 'abierto' | 'en_seguimiento' | 'cerrado'
  gravedad_sugerida: string | null
  sugerencia_aceptada: boolean
  created_at: string
  updated_at: string
}

export interface Diagnostico {
  id: string
  nnya_id: string
  legajo_id: string
  tipo: string
  descripcion: string
  fecha_diagnostico: string
  profesional: string | null
  institucion: string | null
  estado: 'activo' | 'en_seguimiento' | 'resuelto'
  created_at: string
  updated_at: string
}

export interface Medicamento {
  id: string
  nnya_id: string
  legajo_id: string
  diagnostico_id: string | null
  nombre: string
  dosis: string
  frecuencia: string
  via_administracion: string | null
  prescriptor: string | null
  fecha_inicio: string
  fecha_fin: string | null
  estado: 'en_curso' | 'finalizado'
  observaciones: string | null
  created_at: string
  updated_at: string
}

export interface Informe {
  id: string
  nnya_id: string
  legajo_id: string
  tipo: string
  titulo: string
  contenido: string
  elaborado_por: string | null
  fecha_informe: string
  estado: 'borrador' | 'revisado' | 'finalizado'
  created_at: string
  updated_at: string
}

export interface Documento {
  id: string
  nnya_id: string
  legajo_id: string
  nombre: string
  tipo: string
  url: string
  storage_path: string
  tamaño_bytes: number | null
  mime_type: string | null
  subido_por: string | null
  created_at: string
  updated_at: string
}

export interface AudienciaJudicial {
  id: string
  nnya_id: string
  legajo_id: string
  fecha_hora: string
  tribunal: string
  juzgado: string | null
  caratula: string | null
  numero_expediente: string | null
  tipo: string
  resultado: string | null
  observaciones: string | null
  estado: 'programada' | 'realizada' | 'suspendida' | 'cancelada'
  created_by: string | null
  created_at: string
  updated_at: string
}

// ── FASE A1 (AGENTS.md sección 11) — ver prompts/012-tutela-evaluacion-turnos-seguimiento.md ──

export interface Referente {
  id: string
  nombre: string
  apellido: string
  dni: string
  fecha_nacimiento: string | null
  tipo: 'familiar' | 'educador' | 'vecino' | 'otro'
  vinculo_descripcion: string | null
  telefono: string | null
  email: string | null
  domicilio: string | null
  activo: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface VinculoTutela {
  id: string
  nnya_id: string
  tipo: 'tutela_residencia' | 'revinculacion_familiar' | 'referente_afectivo'
  usuario_id: string | null
  referente_id: string | null
  vigente_desde: string
  vigente_hasta: string | null
  estado: 'propuesto' | 'vigente' | 'finalizado' | 'revocado'
  resolucion_respaldo: string | null
  motivo_finalizacion: string | null
  observaciones: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface ValidacionRenaper {
  id: string
  referente_id: string
  momento: 'alta_referente' | 'egreso' | 'reintento'
  dni_consultado: string
  estado_dni: 'vigente' | 'vencido' | 'inexistente' | 'error_servicio'
  tiene_antecedentes: boolean | null
  resultado: 'aprobado' | 'rechazado' | 'no_concluyente'
  respuesta_cruda: Record<string, unknown> | null
  consultado_por: string
  consultado_at: string
}

export interface TransferenciaAuh {
  id: string
  nnya_id: string
  vinculo_id: string
  fecha_gestion: string | null
  fecha_efectiva: string | null
  estado: 'pendiente' | 'en_gestion' | 'transferida' | 'rechazada' | 'no_corresponde'
  organismo: string | null
  observaciones: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface EvaluacionInstitucional {
  id: string
  periodo_mes: number
  periodo_anio: number
  fecha_reunion: string
  observaciones: string | null
  estado: 'convocada' | 'realizada' | 'cancelada'
  created_by: string
  created_at: string
  updated_at: string
}

export interface EvaluacionInstitucionalAsistente {
  id: string
  evaluacion_id: string
  usuario_id: string
  asistio: boolean
  created_at: string
}

export interface EvaluacionInstitucionalCaso {
  id: string
  evaluacion_id: string
  nnya_id: string
  resumen_situacion: string
  indicador_avance: number | null
  recomendaciones: string | null
  seguimiento_requerido: boolean
  created_at: string
  updated_at: string
}

export interface PropuestaMejora {
  id: string
  evaluacion_id: string
  descripcion: string
  tipo: 'mejora' | 'capacitacion'
  area: 'educativa' | 'sanitaria' | 'social' | 'institucional' | 'protocolos' | null
  responsable_id: string | null
  fecha_vencimiento: string | null
  estado: 'abierto' | 'en_progreso' | 'completado' | 'cancelado'
  observaciones: string | null
  created_at: string
  updated_at: string
}

export interface TurnoPersonal {
  id: string
  usuario_id: string
  fecha: string
  turno: 'mañana' | 'tarde' | 'noche'
  hora_inicio: string | null
  hora_cierre: string | null
  estado: 'planificado' | 'en_curso' | 'entregado' | 'cerrado' | 'no_cubierto'
  novedades_traspaso: string | null
  entregado_por: string | null
  entregado_at: string | null
  recibido_por: string | null
  recibido_at: string | null
  created_at: string
  updated_at: string
}

export interface SeguimientoPostEgreso {
  id: string
  nnya_id: string
  vinculo_id: string | null
  dias_post_egreso: 30 | 60
  fecha_programada: string
  fecha_contacto: string | null
  contacto_realizado: boolean
  contacto_efectivo: boolean | null
  escolaridad: 'cumple' | 'parcial' | 'no_cumple' | 'no_corresponde' | null
  salud: 'cumple' | 'parcial' | 'no_cumple' | 'no_corresponde' | null
  terapias: 'cumple' | 'parcial' | 'no_cumple' | 'no_corresponde' | null
  percibe_auh: boolean | null
  detalle_incumplimiento: string | null
  observaciones: string | null
  indicador_reinsercion: number | null
  requiere_intervencion: boolean
  contactado_por: string | null
  created_at: string
  updated_at: string
}
