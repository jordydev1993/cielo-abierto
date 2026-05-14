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
}

export interface Turno {
  id: string
  nnya_id: string
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
  estado: 'pendiente' | 'en_seguimiento' | 'resuelta' | 'vencida'
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
  tipo: string
  descripcion: string
  fecha_hora: string
  gravedad: 'leve' | 'media' | 'grave' | 'critica'
  reportado_por: string | null
  acciones_tomadas: string | null
  estado: 'abierto' | 'en_seguimiento' | 'cerrado'
  created_at: string
  updated_at: string
}

export interface Diagnostico {
  id: string
  nnya_id: string
  tipo: string
  descripcion: string
  fecha_diagnostico: string
  profesional: string | null
  institucion: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Medicamento {
  id: string
  nnya_id: string
  nombre: string
  dosis: string
  frecuencia: string
  via_administracion: string | null
  prescriptor: string | null
  fecha_inicio: string
  fecha_fin: string | null
  activo: boolean
  observaciones: string | null
  created_at: string
  updated_at: string
}

export interface Informe {
  id: string
  nnya_id: string
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
  fecha_hora: string
  tribunal: string
  juzgado: string | null
  caratula: string | null
  numero_expediente: string | null
  tipo: string
  resultado: string | null
  observaciones: string | null
  estado: 'programada' | 'realizada' | 'postergada' | 'cancelada'
  created_by: string | null
  created_at: string
  updated_at: string
}
